import express from 'express';
import axios from 'axios';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { LeveldbPersistence } from 'y-leveldb';
import { YSocketIO, Document } from 'y-socket.io/dist/server';
import * as Y from 'yjs';
import JSZip from 'jszip';
import { promises as fs } from 'fs';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

const yio = new YSocketIO(io, {
    levelPersistenceDir: './projects',
    authenticate(handshake) {
        // Extracts the project_id and the session_id from the cookies
        let cookies = handshake.headers.cookie;
        if (!cookies) {
            return false;
        }
        let project_id = (cookies.split(';').find((cookie: string) => cookie.includes('project_id'))?.split('=')[1]) as string;
        let session_id = (cookies.split(';').find((cookie: string) => cookie.includes('session_id'))?.split('=')[1]) as string;
        if (!project_id || !session_id) {
            return false;
        }
        // Checks if the user has access to the project by sending a request to the backend server requesting the project details
        // The backend server should respond with a 200 status code if the user has access to the project and a 403 status code if the user does not have access to the project
        return axios.get(`http://localhost:5000/api/projects/${project_id}`, {
            headers: {
                'Cookie': `session_id=${session_id}`
            }
        }).then((response) => {
            return response.status === 200;
        }).catch((err) => {
            console.error(err);
            return false;
        });
    },
});

yio.on('document-update', (doc: Document, update: Uint8Array) => {
    let content = Y.decodeUpdate(update).structs.map((struct) => {
        if (struct instanceof Y.Item) {
            return struct.content.getContent().join('');
        }
        return '';
    }).join('');
    if (content.length > 100) {
        content = content.substring(0, 100) + '...' + `(${content.length} characters)`
    }
    console.log(`[document-update] Doc: ${doc.name}, Update:\n`, content);
});

yio.on('document-destroy', (doc: Document) => {
    console.log(`[document-destroy] Doc: ${doc.name}`);
});

yio.on('document-loaded', (doc: Document) => {
    console.log(`[document-loaded] Doc: ${doc.name}`);
});

yio.on('all-document-connections-closed', (doc: Document) => {
    console.log(`[all-document-connections-closed] Doc: ${doc.name}`);
});

yio.initialize();

const persistence = (yio as any).persistence.provider as LeveldbPersistence; // This is a hacky way to get the persistence object

async function getFileNames(project_id: string): Promise<string[]> {
    return persistence.getAllDocNames().then((docNames: string[]) => {
        let files = docNames.filter((docName: string) => docName.startsWith(project_id + '/')).map((docName: string) => docName.split('/')[1]);
        return files;
    }).catch((err: Error) => {
        console.error(err);
        return [];
    });
}

async function deleteFile(project_id: string, file_name: string): Promise<boolean> {
    return persistence.clearDocument(project_id + '/' + file_name).then(() => {
        console.log(`[deleteFile] Deleted file: ${project_id}/${file_name}`);
        return true;
    }).catch((err: Error) => {
        console.error(err);
        return false;
    });
}

async function exportProject(project_id: string): Promise<boolean> {
    try {
        const docNames = await persistence.getAllDocNames();
        let files = docNames.filter((docName: string) => docName.startsWith(project_id + '/')).map((docName: string) => docName.split('/')[1]);
        let zip = new JSZip();
        for (const file of files) {
            const ydoc = await persistence.getYDoc(project_id + '/' + file);
            zip.file(file, ydoc.getText('monaco').toJSON());
        }
        const content = await zip.generateAsync({ type: 'nodebuffer' });
        await fs.writeFile('project.zip', content);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

io.use((socket, next) => {
    let handshake = socket.handshake;
    // Extracts the the session_id from the cookies and the project_id from the query parameters
    let cookies = handshake.headers.cookie;
    if (!cookies) {
        return false;
    }
    let project_id = handshake.query.project_id as string;
    let session_id = (cookies.split(';').find((cookie: string) => cookie.includes('session_id'))?.split('=')[1]) as string;
    if (!session_id || !project_id) {
        return false;
    }

    console.log(`[use] Project ID: ${project_id}, Session ID: ${session_id}`);

    // Checks if the user has access to the project by sending a request to the backend server requesting the project details
    // The backend server should respond with a 200 status code if the user has access to the project and a 403 status code if the user does not have access to the project
    axios.get(`http://localhost:5000/api/projects/${project_id}`, {
        headers: {
            'Cookie': `session_id=${session_id}`
        },
    }).then((response) => {
        if (response.status === 200) {
            next();
        } else {
            next(new Error('Unauthorized'));
        }
    }).catch((err) => {
        console.error(err);
        next(new Error('Unauthorized'));
    });
})
    .on('connection', (socket: Socket) => {
        console.log(`[connection] Connected with user: ${socket.id}`);

        let project_id = socket.handshake.query.project_id as string;
        socket.join(project_id);


        socket.on('disconnect', () => {
            console.log(`[disconnect] Disconnected user: ${socket.id}`);
        });

        socket.on('get_file_structure', () => {
            console.log(`[get_file_structure] Project ID: ${project_id}`);
            getFileNames(project_id).then((fileNames: string[]) => {
                console.log(`[get_file_structure] Emitting file_structure_update: ${fileNames}`)
                io.to(project_id).emit('file_structure_update', { files: fileNames });
            });
        });

        socket.on('create_new_file', (filename: string[]) => {
            let filename_string = filename[0];
            console.log(`[create_new_file] Project ID: ${project_id}, File Name: ${filename_string}`);
            getFileNames(project_id).then((fileNames) => {
                if (!fileNames.includes(filename_string)) {
                    const ydoc = new Y.Doc();
                    ydoc.getText('monaco').insert(0, '');
                    persistence.storeUpdate(project_id + '/' + filename_string, Y.encodeStateAsUpdate(ydoc)).then(() => {
                        console.log(`[create_new_file] Created new file: ${project_id}/${filename_string}`);
                        getFileNames(project_id).then((fileNames) => {
                            console.log(`[create_new_file] Emitting file_structure_update: ${fileNames}`);
                            io.to(project_id).emit('file_structure_update', { files: fileNames });
                        });
                    });
                }
            });
        });

        socket.on('delete_file', (filename: string[]) => {
            let fileNameString = filename[0];
            console.log(`[delete_file] Project ID: ${project_id}, File Name: ${fileNameString}`);
            getFileNames(project_id).then((fileNames) => {
                if (fileNames.includes(fileNameString)) {
                    console.log(`[delete_file] Deleting file: ${project_id}/${fileNameString}`);
                    deleteFile(project_id, fileNameString).then((success) => {
                        if (success) {
                            getFileNames(project_id).then((files) => {
                                console.log(`[delete_file] Emitting file_structure_update: ${files}`);
                                io.to(project_id).emit('file_structure_update', { files: files });
                                console.log(`[delete_file] Deleted file: ${fileNameString}`);
                            });
                        }
                    });
                }
            });
        });

        socket.on('export_project', () => {
            console.log(`[export_project] Project ID: ${project_id}`);
            exportProject(project_id).then((success) => {
                if (success) {
                    console.log(`[export_project] Exported project: ${project_id}`);
                    io.to(project_id).emit('export_projected', { success: true });
                } else {
                    console.error(`[export_project] Failed to export project: ${project_id}`);
                    io.to(project_id).emit('export_projected', { success: false });
                }
            });
        });
    });

const HOST = 'localhost';
const PORT = 7000;

server.listen(PORT, HOST, () => {
    console.log(`   - Server running on http://${HOST}:${PORT}`);
});
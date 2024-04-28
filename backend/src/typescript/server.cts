import express from 'express';
import expressws from 'express-ws';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { LeveldbPersistence } from 'y-leveldb';
import { YSocketIO, Document } from 'y-socket.io/dist/server';
import * as Y from 'yjs';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

const yio = new YSocketIO(io, {
    levelPersistenceDir: './projects'
});

yio.on('document-update', (doc: Document, update: Uint8Array) => {
    let content = Y.decodeUpdate(update).structs.map((struct) => {
        if (struct instanceof Y.Item) {
            return struct.content;
        }
        return '';
    }).join('');
    console.log(`[document-update] Doc: ${doc.name}, Update:`, content);
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
        return docNames.filter((docName: string) => docName.startsWith(project_id + '/')).map((docName: string) => docName.split('/')[1]);
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
io.on('connection', (socket: Socket) => {
    console.log(`[connection] Connected with user: ${socket.id}`);

    let cookies = socket.handshake.headers.cookie;
    if (!cookies) {
        console.error('No cookies found');
        return;
    }
    if (!cookies.includes('project_id')) {
        console.error('No project_id cookie found');
        return;
    }

    let project_id = (cookies.split(';').find((cookie: string) => cookie.includes('project_id'))?.split('=')[1]) as string;
    socket.join(project_id);


    socket.on('disconnect', () => {
        console.log(`[disconnect] Disconnected user: ${socket.id}`);
    });

    socket.on('get_file_structure', () => {
        console.log(`[get_file_structure] Project ID: ${project_id}`);
        getFileNames(project_id).then((fileNames: string[]) => {
            console.log(`[get_file_structure] Emitting file_structure_update: ${fileNames}`)
            socket.emit('file_structure_update', { files: fileNames });
        });
    });

    socket.on('create_new_file', (file_name: string) => {
        console.log(`[create_new_file] Project ID: ${project_id}, File Name: ${file_name}`);
        getFileNames(project_id).then((fileNames) => {
            if (!fileNames.includes(file_name)) {
                const ydoc = new Y.Doc();
                ydoc.getText('monaco').insert(0, '');
                persistence.storeUpdate(project_id + '/' + file_name, Y.encodeStateAsUpdate(ydoc));
                let files = [...fileNames, file_name];
                console.log(`[create_new_file] Emitting file_structure_update: ${files}`);
                socket.emit('file_structure_update', { files: [...fileNames, file_name] });
                console.log(`[create_new_file] Created new file: ${file_name}`);
            }
        });
    });

    socket.on('delete_file', (fileName: string[] /* For some reason */) => {
        let fileNameString = fileName[0];
        console.log(`[delete_file] Project ID: ${project_id}, File Name: ${fileNameString}`);
        getFileNames(project_id).then((fileNames) => {
            if (fileNames.includes(fileNameString)) {
                console.log(`[delete_file] Deleting file: ${project_id}/${fileNameString}`);
                deleteFile(project_id, fileNameString).then((success) => {
                    if (success) {
                        let files = fileNames.filter((fileName) => fileName !== fileNameString);
                        console.log(`[delete_file] Emitting file_structure_update: ${files}`);
                        socket.emit('file_structure_update', { files: files });
                        console.log(`[delete_file] Deleted file: ${fileNameString}`);
                    }
                });
            }
        });
    });
});

const HOST = 'localhost';
const PORT = 7000;

server.listen(PORT, HOST, () => {
    console.log(`   - Server running on http://${HOST}:${PORT}`);
});
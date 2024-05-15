import express from 'express';
import axios from 'axios';
import http from 'http';
import { Server, Socket } from 'socket.io';
import yjsIO from './yjs-controller.cjs';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

const yjs = new yjsIO(io);

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
            yjs.getProjectStructure(project_id).then((fileNames) => {
                console.log(`[get_file_structure] Emitting file_structure_update: ${fileNames}`)
                io.to(project_id).emit('file_structure_update', { files: fileNames });
            });
        });

        socket.on('create_new_file', (filename: string[]) => {
            let filename_string = filename[0];
            console.log(`[create_new_file] Project ID: ${project_id}, File Name: ${filename_string}`);
            yjs.createNewFile(project_id, filename_string).then((success) => {
                if (success) {
                    console.log(`[create_new_file] Created new file: ${filename_string}`);
                    yjs.getProjectStructure(project_id).then((files) => {
                        console.log(`[create_new_file] Emitting file_structure_update: ${files}`);
                        io.to(project_id).emit('file_structure_update', { files: files });
                    });
                }
            });
        });

        socket.on('delete_file', (filename: string[]) => {
            let fileNameString = filename[0];
            console.log(`[delete_file] Project ID: ${project_id}, File Name: ${fileNameString}`);
            console.log(`[delete_file] Deleting file: ${project_id}/${fileNameString}`);
            yjs.deleteFile(project_id, fileNameString).then((success) => {
                if (success) {
                    yjs.getProjectStructure(project_id).then((files) => {
                        console.log(`[delete_file] Emitting file_structure_update: ${files}`);
                        io.to(project_id).emit('file_structure_update', { files: files });
                        console.log(`[delete_file] Deleted file: ${fileNameString}`);
                    });
                }
            });
        });

        socket.on('export_project', () => {
            console.log(`[export_project] Project ID: ${project_id}`);
            yjs.exportProject(project_id).then((success) => {
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
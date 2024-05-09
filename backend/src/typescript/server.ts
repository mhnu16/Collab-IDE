import * as WebSocket from 'ws';
import * as http from 'http';
import express from 'express';
import axios from 'axios';
import WebSocketJSONStream from '@teamwork/websocket-json-stream';
import Database from './database';


class Server {
    private app: express.Application;
    private server: http.Server;
    private wss: WebSocket.Server;
    private backend: Database;
    private host: string;
    private port: number;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;

        this.app = express();
        this.server = http.createServer(app);

        this.wss = new WebSocket.Server({ server });
        this.backend = new Database();

        this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
            const [status, project_id, session_id] = this.parseCookie(req.headers.cookie);
            if (status === 401) {
                console.error('Unauthorized access to the project');
                ws.close(401, 'Unauthorized');
                return;
            }

            // Checks if the user has access to the project by sending a request to the backend server requesting the project details
            // The backend server should respond with a 200 status code if the user has access to the project and a 403 status code if the user does not have access to the project
            axios.get(`http://127.0.0.1:5000/api/projects/${project_id}`, {
                headers: {
                    'Cookie': `session_id=${session_id}`
                },
            }).then((response) => {
                if (response.status === 200) {
                    console.log(`[connection] Connected with user: ${ws}`);
                    this.onConnect(ws, project_id);
                } else {
                    console.error('User does not have access to the project');
                    ws.close(403, 'Forbidden');
                }
            }).catch((err) => {
                console.error(err);
                ws.close(500, 'Internal Server Error');
            });
        });
    }

    private onConnect(socket: WebSocket, project_id: string) {
        console.log(`[setupEventListeners] Project ID: ${project_id}`);
        var stream = new WebSocketJSONStream(socket);
        this.backend.listen(stream);

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

        socket.on('create_new_file', (file_name: string) => {
            console.log(`[create_new_file] Project ID: ${project_id}, File Name: ${file_name}`);
            getFileNames(project_id).then((fileNames) => {
                if (!fileNames.includes(file_name)) {
                    createNewFile(project_id, file_name);
                    let files = [...fileNames, file_name];
                    console.log(`[create_new_file] Emitting file_structure_update: ${files}`);
                    io.to(project_id).emit('file_structure_update', { files: [...fileNames, file_name] });
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
                            io.to(project_id).emit('file_structure_update', { files: files });
                            console.log(`[delete_file] Deleted file: ${fileNameString}`);
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
    }

    private parseCookie(cookie: string | undefined): [number, string, string] {
        if (!cookie) return [401, 'Unauthorized', 'Unauthorized'];
        let project_id = cookie.split(';').find((cookie) => cookie.includes('project_id'))?.split('=')[1];
        let session_id = cookie.split(';').find((cookie) => cookie.includes('session_id'))?.split('=')[1];
        if (!project_id || !session_id) return [401, 'Unauthorized', 'Unauthorized'];
        return [200, project_id, session_id];
    }

    public listen() {
        this.server.listen(this.port, this.host, () => {
            console.log(`Server listening on http://${this.host}:${this.port}`);
        });
    }
}

export default Server;
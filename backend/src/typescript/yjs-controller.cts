import { Server } from 'socket.io';
import Y from 'yjs';
import { YSocketIO, Document } from 'y-socket.io/dist/server';
import axios from 'axios';
import { LeveldbPersistence } from 'y-leveldb';
import JSZip from 'jszip';
import { promises as fs } from 'fs';

export default class yjsIO {
    yio: YSocketIO;
    persistence: LeveldbPersistence;

    constructor(io: Server) {
        this.yio = new YSocketIO(io, {
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

        this.yio.on('document-update', (doc: Document, update: Uint8Array) => {
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

        this.yio.on('document-destroy', (doc: Document) => {
            console.log(`[document-destroy] Doc: ${doc.name}`);
        });

        this.yio.on('document-loaded', (doc: Document) => {
            console.log(`[document-loaded] Doc: ${doc.name}`);
        });

        this.yio.on('all-document-connections-closed', (doc: Document) => {
            console.log(`[all-document-connections-closed] Doc: ${doc.name}`);
        });

        this.yio.initialize();

        this.persistence = (this.yio as any).persistence.provider as LeveldbPersistence; // This is a hacky way to get the persistence object
    }

    async getProjectStructure(project_id: string): Promise<string[]> {
        return this.persistence.getAllDocNames().then((docNames: string[]) => {
            let files = docNames.filter((docName: string) => docName.startsWith(project_id + '/')).map((docName: string) => docName.split('/')[1]);
            return files;
        }).catch((err: Error) => {
            console.error(err);
            return [];
        });
    }

    async deleteFile(project_id: string, file_name: string): Promise<boolean> {
        return this.getProjectStructure(project_id).then((files: string[]) => {
            if (files.includes(file_name)) {
                return this.persistence.clearDocument(project_id + '/' + file_name).then(() => {
                    console.log(`[deleteFile] Deleted file: ${project_id}/${file_name}`);
                    return true;
                }).catch((err: Error) => {
                    console.error(err);
                    return false;
                });
            }
            return false;
        }).catch((err: Error) => {
            console.error(err);
            return false;
        });
    }

    async createNewFile(project_id: string, file_name: string): Promise<boolean> {
        return this.getProjectStructure(project_id).then((files: string[]) => {
            if (!files.includes(file_name)) {
                const ydoc = new Y.Doc();
                ydoc.getText('monaco').insert(0, '');
                return this.persistence.storeUpdate(project_id + '/' + file_name, Y.encodeStateAsUpdate(ydoc)).then(() => {
                    console.log(`[createNewFile] Created new file: ${project_id}/${file_name}`);
                    return true;
                }).catch((err: Error) => {
                    console.error(err);
                    return false;
                });
            }
            return false;
        }).catch((err: Error) => {
            console.error(err);
            return false;
        });
    }

    async getFileContent(project_id: string, file_name: string): Promise<string> {
        return this.persistence.getYDoc(project_id + '/' + file_name).then((ydoc: Y.Doc) => {
            return ydoc.getText('monaco').toJSON();
        }).catch((err: Error) => {
            console.error(err);
            return '';
        });
    }

    async exportProject(project_id: string): Promise<boolean> {
        try {
            const files = await this.getProjectStructure(project_id);
            let zip = new JSZip();
            for (const file of files) {
                const content = await this.getFileContent(project_id, file);
                zip.file(file, content);
            }
            const content = await zip.generateAsync({ type: 'nodebuffer' });
            await fs.writeFile('project.zip', content);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
}
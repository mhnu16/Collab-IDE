import jquery from "jquery";
import { io, Socket } from 'socket.io-client';
import { SocketIOProvider } from "y-socket.io";
import * as Y from "yjs";

interface SuccessResponse<T> {
    success: true;
    data: T;
}

interface FailedResponse {
    success: false;
    data: {
        error: string;
    };
}

export interface User {
    id: number;
    email: string;
    username: string;
}

interface FileSystemObject {
    // A map of the filesystem. The key is the name of the file or directory, 
    // and the value is null if it is a file, or another FileSystemObject if it is a directory (recursively defined)
    [key: string]: null | FileSystemObject;
}

export interface Project {
    id: string;
    project_id: string;
    name: string;
    description: string;
    language: string;
    created_at: Date;
    last_updated_at: Date;
    allowed_users: User[];
    structure: FileSystemObject;
}

export interface Projects {
    projects: Project[];
}

type Resp<T> = SuccessResponse<T> | FailedResponse;
export type ApiResponse = Resp<any>;
export type UserResponse = Resp<User>;
export type ProjectResponse = Resp<Project>;
export type ProjectsResponse = Resp<Projects>;

export function sendRequest<T extends ApiResponse>(url: string, method: string, data?: any): Promise<T> {
    if (method === "POST") {
        return new Promise<T>((resolve, reject) => {
            jquery.ajax({
                url: url,
                method: method,
                contentType: "application/json",
                data: JSON.stringify(data),
                success: (res: T) => {
                    resolve(res);
                },
                error: (err) => {
                    reject(err);
                }
            });
        });
    }
    return new Promise<T>((resolve, reject) => {
        jquery.ajax({
            url: url,
            method: method,
            success: (res: T) => {
                resolve(res);
            },
            error: (err) => {
                reject(err);
            }
        });
    });
}

// ----------------------------

export interface File {
    filename: string;
    content: string;
    language: string;
}


export class SocketManager {
    private static instance: SocketManager;
    private socket: Socket;
    // private provider?: SocketIOProvider;
    // private ydoc?: Y.Doc;
    // private ytext?: Y.Text;

    private constructor() {
        this.socket = io('https://localhost');

        // // If the room_name is only the project_id, then don't make a yjs connection
        // if (room_name.includes('/')) {
        //     console.log('Creating Yjs connection');

        //     this.ydoc = new Y.Doc();
        //     this.provider = new SocketIOProvider('https://localhost', room_name, this.ydoc, {});
        //     this.provider.on('status', (status: string) => {
        //         console.log('Status: ', status);
        //     });
        //     this.provider.on('sync', (isSynced: boolean) => {
        //         console.log('Synced: ', isSynced);
        //     });
        //     this.provider.on('connection-close', (event: Socket.DisconnectReason, provider: SocketIOProvider) => {
        //         console.log('Connection closed: ', event);
        //     });
        //     this.provider.on('connection-error', (event: Socket.DisconnectReason, provider: SocketIOProvider) => {
        //         console.log('Connection error: ', event);
        //     });

        //     this.ytext = this.ydoc.getText('monaco');
        // }

        this.socket.on('connect', () => {
            console.log(`Connected to server with id: ${this.socket.id}`);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }

    public static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    public on(event: string, callback: (data: any) => void): void {
        this.socket.on(event, callback);
    }

    public emit(event: string, ...data: any[]): void {
        this.socket.emit(event, data);
    }

    // public getProvider(): SocketIOProvider {
    //     return this.provider;
    // }

    // public getYDoc(): Y.Doc {
    //     return this.ydoc;
    // }

    // public getYText(): Y.Text {
    //     return this.ytext;
    // }
}
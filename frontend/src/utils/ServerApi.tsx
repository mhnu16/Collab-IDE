import jquery from "jquery";

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
    name: string;
    value: string;
    language: string;
}

export class SocketManager {
    private socket: WebSocket;
    private static instance: SocketManager;
    private static eventHandlers: Map<string, ((response: ApiResponse) => any)> = new Map();

    private constructor() {
        try {
            this.socket = new WebSocket("ws://localhost:8000");
            console.log("Attempting to connect to server via websocket");
            this.socket.onopen = () => {
                console.log("Connected to server via websocket");
            };

            this.socket.onmessage = (msg) => {
                const event = JSON.parse(msg.data);
                const handler = SocketManager.eventHandlers.get(event.eventName);
                if (handler) {
                    handler(event.data);
                } else {
                    console.error(`No handler for event: ${event.eventName}`);
                }
            };
        } catch (error) {
            console.error(`Failed to create socket, the following error occurred: ${error}`);
            throw error;
        }

    }

    public static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    public sendEvent(eventName: string, msg: any, callback?: (response: ApiResponse) => void) {
        try {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                console.error("Socket is not open!");
                return;
            }
            msg = JSON.stringify(msg);

            this.socket.send(JSON.stringify({
                eventName: eventName,
                data: msg
            }));
            if (callback) {
                this.onEvent(eventName, callback);
            }
        } catch (error) {
            console.error(`Failed to send event: ${eventName}, the following error occurred: ${error}`);
        }
    };

    public onEvent(eventName: string, callback: (response: ApiResponse) => any) {
        // Sets the callback for the event, so that when the server responds, the callback is called
        SocketManager.eventHandlers.set(eventName, callback);
    }
}
import jquery from "jquery";
import { io, Socket } from 'socket.io-client';

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
    private socket: Socket;
    private eventQueue: Array<{ eventName: string, msg: any, callback?: (response: ApiResponse) => void }> = [];

    public constructor() {
        this.socket = io(`https://localhost`, {
        });
        console.log("Attempting to connect to socket.io server")
        this.socket.on("connect", () => {
            console.log("Connected to socket.io server");
            this.sendQueuedEvents();
        });
        this.socket.on("disconnect", () => {
            console.log("Disconnected from socket.io server");
        });
        this.socket.on("connect_error", (error) => {
            console.error("Failed to connect to socket.io server, the following error occurred: ", error);
        });
    }

    public disconnect() {
        this.socket.disconnect();
    }

    public sendEvent(eventName: string, msg: any, callback?: (response: ApiResponse) => void) {
        try {
            if (!this.socket.connected) {
                console.error("Socket is not open! putting event in queue.");
                this.eventQueue.push({ eventName, msg, callback });
                return;
            }
            msg = JSON.stringify(msg);

            // console.log(`Sending event: ${eventName}, with message: ${msg}`);

            this.socket.emit(eventName, msg);
            if (callback) {
                this.onceEvent(eventName, callback);
            }
        } catch (error) {
            console.error(`Failed to send event: ${eventName}, the following error occurred: ${error}`);
        }
    };

    public onceEvent(eventName: string, callback: (response: ApiResponse) => any) {
        // Sets a one-time callback for the event, so that when the server responds, the callback is called
        this.socket.once(eventName, callback);
    }

    public onEvent(eventName: string, callback: (response: ApiResponse) => any) {
        // Sets the callback for the event, so that when the server responds, the callback is called
        this.socket.on(eventName, callback);
    }

    private sendQueuedEvents() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            if (event) {
                this.sendEvent(event.eventName, event.msg, event.callback);
            }
        }
    }

    public getSID() {
        return this.socket.id;
    }
}
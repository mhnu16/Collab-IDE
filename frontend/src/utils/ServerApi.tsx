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

export interface Project {
    id: string;
    project_id: string;
    name: string;
    description: string;
    language: string;
    created_at: Date;
    last_updated_at: Date;
    allowed_users: User[];
}

export interface Projects {
    projects: Project[];
}

type Resp<T> = SuccessResponse<T> | FailedResponse;
export type ApiResponse = Resp<any>;
export type UserResponse = Resp<User>;
export type ProjectResponse = Resp<Project>;
export type ProjectsResponse = Resp<Projects>;

export function sendRequest<T extends ApiResponse>(
    url: string, method: string, data?: any
): Promise<T> {
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
    private static instances: Map<string, SocketManager> = new Map<string, SocketManager>();
    private socket: Socket;

    private constructor(project_id: string) {
        this.socket = io({
            path: '/socket.io',
            query: {
                project_id: project_id
            }
        });
    }

    public static getInstance(project_id: string): SocketManager {
        if (!SocketManager.instances.has(project_id)) {
            console.log("Creating new instance for project_id: ", project_id);
            SocketManager.instances.set(project_id, new SocketManager(project_id));
        }
        return SocketManager.instances.get(project_id)!;
    }

    public on(event: string, callback: (data: any) => void): void {
        this.socket.on(event, callback);
    }

    public emit(event: string, ...data: any[]): void {
        this.socket.emit(event, data);
    }
}
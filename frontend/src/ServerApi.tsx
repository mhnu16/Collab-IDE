import jquery from "jquery";

interface SuccessApiResponse {
    success: true;
    data: any;
}

interface FailedApiResponse {
    success: false;
    data: {
        error: string;
    }
}

export type ApiResponse = SuccessApiResponse | FailedApiResponse;

export interface User {
    id: number;
    email: string;
    username: string;
}

interface SuccessUserResponse extends SuccessApiResponse {
    data: {
        user: User;
    }
}

export type UserResponse = SuccessUserResponse | FailedApiResponse;

export interface Project {
    id: string;
    project_id: string,
    name: string,
    description: string,
    language: string,
    created_at: Date,
    last_updated_at: Date,
    allowed_users: string[]
}

interface SuccessProjectResponse extends SuccessApiResponse {
    data: {
        project: Project;
    }
}

export type ProjectResponse = SuccessProjectResponse | FailedApiResponse;

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
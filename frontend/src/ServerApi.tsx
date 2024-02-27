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

export function sendRequest<T extends ApiResponse>(url: string, method: string, data?: any): Promise<T> {
    if (method === "GET") {
        return new Promise<T>((resolve, reject) => {
            jquery.ajax({
                url: url,
                method: method,
                success: (res: T) => {
                    resolve(res);
                },
                error: (err) => {
                    reject(err);
                },
            });
        });
    }
    else {
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
}
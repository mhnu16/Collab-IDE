import jquery from "jquery";

export interface ApiResponse {
    success: boolean;
    data: any;
}

interface Error extends ApiResponse {
    data: {
        error: string;
    };
}

export interface errorResponse extends JQuery.jqXHR {
    responseJSON?: Error;
}

export function sendRequest<T extends ApiResponse>(url: string, method: string, data: any): Promise<T> {
    if (method === "GET") {
        return new Promise<T>((resolve, reject) => {
            jquery.ajax({
                url: url,
                method: method,
                success: (res: T) => {
                    resolve(res);
                },
                error: (err: errorResponse) => {
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
                error: (err: errorResponse) => {
                    reject(err);
                }
            });
        });
    }
}
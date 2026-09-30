import { getSessionServer } from "../auth/session-server";
import { IApiRequest } from "./intefaces/interfaces";

const API_VERSION = "v1"

export const BACKEND_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/${API_VERSION}`;


class ApiRequest implements IApiRequest {
    private readonly baseUrl: string;
    private headers: Record<string, string>;

    constructor() {
        this.baseUrl = BACKEND_API_BASE_URL;
        this.headers = {
            "Content-Type": "application/json",
        };
    }


    public async request<T>(path: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}/${path}`;
        const params = await this.buildOptions(options)
        const response = await fetch(url, params);
        return this.handleResponse(response);

    }

    public async get<T>(path: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}/${path}`;
        const params = await this.buildOptions({ method: "GET", ...options })
        const response = await fetch(url, params);
        return this.handleResponse(response);

    }



    public async post<T>(path: string, body: Record<string, unknown>, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}/${path}`;
        const params = await this.buildOptions({ method: "POST", ...options, body: JSON.stringify(body) })
        const response = await fetch(url, params);
        return this.handleResponse(response);

    }

    public async put<T>(path: string, body: Record<string, unknown>, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}/${path}`;
        const params = await this.buildOptions({ method: "PUT", ...options, body: JSON.stringify(body) })
        const response = await fetch(url, params);
        return this.handleResponse(response);

    }

    public async delete<T>(path: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}/${path}`;
        const params = await this.buildOptions({ method: "DELETE", ...options })
        const response = await fetch(url, params);
        return this.handleResponse(response);

    }

    public async patch<T>(path: string, body: Record<string, unknown>, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}/${path}`;
        const params = await this.buildOptions({ method: "PATCH", ...options, body: JSON.stringify(body) })
        const response = await fetch(url, params);
        return this.handleResponse(response);
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const json = await response.json();
        if (!response.ok) {
            throw json;
        }
        return json;
    }

    private async buildOptions(options?: RequestInit) {

        const currentSession = await getSessionServer()
        if (!currentSession) {
            throw new Error("Unauthorized")
        }
        this.headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentSession.session.token}`
        };
        if (!options) {
            return {
                method: "GET",
                headers: this.headers,
            }
        }

        return {
            method: options.method,
            headers: {
                ...this.headers,
                ...options.headers
            },
            ...options
        }
    }
}

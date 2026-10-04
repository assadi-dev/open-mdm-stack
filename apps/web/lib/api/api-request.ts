import { signBackendToken } from "../auth/backend-token";
import { getSessionServer } from "../auth/session-server";
import { BACKEND_API_BASE_URL, buildUrl, handleResponse, handleTextResponse } from "./api-handlers";
import { HTTP_ERROR } from "./intefaces/http-status";
import { Unauthorized } from "./intefaces/http-errors";
import { IApiRequest } from "./intefaces/interfaces";



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
        const url = buildUrl(path);
        const httpOptions = await this.buildOptions(options)
        const response = await fetch(url, httpOptions);
        return this.handleResponse(response);

    }

    public async get<T>(path: string, options?: RequestInit): Promise<T> {
        const url = buildUrl(path);
        const httpOptions = await this.buildOptions({ method: "GET", ...options })
        const response = await fetch(url, httpOptions);
        return this.handleResponse(response);

    }



    public async post<T>(path: string, body: Record<string, unknown>, options?: RequestInit): Promise<T> {
        const url = buildUrl(path); const httpOptions = await this.buildOptions({ method: "POST", ...options, body: JSON.stringify(body) })
        const response = await fetch(url, httpOptions);
        return this.handleResponse(response);

    }

    // Comme `post`, pour une réponse qui n'est pas du JSON : renvoie le texte de la réponse.
    public async postText(path: string, body: Record<string, unknown>, options?: RequestInit): Promise<string> {
        const url = buildUrl(path);
        const httpOptions = await this.buildOptions({ method: "POST", ...options, body: JSON.stringify(body) })
        const response = await fetch(url, httpOptions);
        return handleTextResponse(response);
    }

    public async put<T>(path: string, body: Record<string, unknown>, options?: RequestInit): Promise<T> {
        const url = buildUrl(path);
        const httpOptions = await this.buildOptions({ method: "PUT", ...options, body: JSON.stringify(body) })
        const response = await fetch(url, httpOptions);
        return this.handleResponse(response);

    }

    public async delete<T>(path: string, options?: RequestInit): Promise<T> {
        const url = buildUrl(path);
        const httpOptions = await this.buildOptions({ method: "DELETE", ...options })
        const response = await fetch(url, httpOptions);
        return this.handleResponse(response);

    }

    public async patch<T>(path: string, body: Record<string, unknown>, options?: RequestInit): Promise<T> {
        const url = buildUrl(path);
        const httpOptions = await this.buildOptions({ method: "PATCH", ...options, body: JSON.stringify(body) })
        const response = await fetch(url, httpOptions);
        return this.handleResponse(response);
    }

    private handleResponse<T>(response: Response): Promise<T> {
        return handleResponse<T>(response);
    }

    private async buildOptions(options?: RequestInit) {

        const currentSession = await getSessionServer()
        if (!currentSession) {
            throw new Unauthorized(HTTP_ERROR.UNAUTHORIZED.message)
        }
        const backendToken = await signBackendToken(currentSession.session.token)
        this.headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${backendToken}`
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


export const httpRequest = new ApiRequest();
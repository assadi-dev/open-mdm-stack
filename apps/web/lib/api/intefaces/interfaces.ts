
export interface IApiRequest {
    request<T>(path: string, options?: RequestInit): Promise<T>;
    get<T>(path: string, options?: RequestInit): Promise<T>;
    post<T>(path: string, body: Record<string, unknown>, options?: RequestInit): Promise<T>;
    put<T>(path: string, body: Record<string, unknown>, options?: RequestInit): Promise<T>;
    delete<T>(path: string, options?: RequestInit): Promise<T>;
    patch<T>(path: string, body: Record<string, unknown>, options?: RequestInit): Promise<T>;
}
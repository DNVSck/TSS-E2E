import { APIRequestContext, request } from '@playwright/test';

class APIClient {
    baseURL: string;
    context?: APIRequestContext; 
    headers: { [key: string]: string; }

    constructor(baseURL: string) {
        this.baseURL = baseURL;
        this.headers = {};
    }

    async init() {
        this.context = await request.newContext({
            baseURL: this.baseURL,
        });
        return this;
    }

    setHeaders(headers: { [key: string]: string }): APIClient {
        this.headers = headers;
        return this;
    }

    setDefaultHeaders(): APIClient {
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };
        return this;
    }

    getAPIContext(): APIRequestContext {
        if (!this.context) throw new Error('API context not initialized. Call init() first.');
        return this.context;
    }

    addHeader(name: string, value: string): APIClient {
        this.headers[name] = value;
        return this;
    }

    clearHeader(): APIClient {
        this.headers = {};
        return this;
    }

    addAuthorizationHeader(value: string): APIClient {
        this.headers["Authorization"] = value;
        return this;
    }

    async get(endPoint: string, params: { [key: string]: string | number | boolean } = {}, body: object = {}) {
        if (!this.context) throw new Error('API context not initialized. Call init() first.');
        
        const res = await this.context.get(endPoint, {
            headers: this.headers,
            params: params,
            data: body
          });

        return res;
    }

    async post(endPoint: string, body: object) {
        if (!this.context) throw new Error('API context not initialized. Call init() first.');
        
        return await this.context.post(endPoint, {
            headers: this.headers,
            data: body
          });
    }

    async put(endPoint: string, body: object) {
        if (!this.context) throw new Error('API context not initialized. Call init() first.');
        
        return await this.context.put(endPoint, {
            headers: this.headers,
            data: body
          });
    }

    async delete(endPoint: string, params: { [key: string]: string | number | boolean } = {}, body: object = {}) {
        if (!this.context) throw new Error('API context not initialized. Call init() first.');
        
        return await this.context.delete(endPoint, {
            headers: this.headers,
            params: params,
            data: body
          });
    }

    async dispose(){
        if (this.context) {
            await this.context.dispose();
        }
    }
}

export { APIClient };
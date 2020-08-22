import { serve, ServerRequest } from "https://deno.land/std/http/server.ts";
import { serveFile } from "https://deno.land/std@0.66.0/http/file_server.ts";
// import * as path from "https://deno.land/std/path/mod.ts";
// import * as fs from "https://deno.land/std/fs/mod.ts";


import Route from './Route.ts';

export default class WebServer {

    private staticFolder: string;
    private getRoutes: Array<Route>;
    private postRoutes: Array<Route>;


    constructor() {
        this.staticFolder = "public";
        this.getRoutes = new Array<Route>();
        this.postRoutes = new Array<Route>();
    }

    setStaticFolder(path: string): WebServer {
        this.staticFolder = path;
        return this;
    }

    addGetRoute(route: Route): WebServer {
        this.getRoutes.push(route);
        return this;
    }

    addPostRoutes(route: Route): WebServer {
        this.postRoutes.push(route);
        return this;
    }

    async start(port: number) {
        const server = serve({ port });
        console.log("Connected :", port);
        for await (const req of server) {
            this.handleRoute(req);
        }
    }

    public async send(req: ServerRequest, path: string) {
        // const fullPath = `${Deno.cwd()}/${this.staticFolder}/${path}`;
        // const present = await fs.exists(fullPath);

        // if (!present) {
        //     req.respond({ status: 400 });
        //     return;
        // }

        // const content = await Deno.readFile(fullPath);
        // req.respond({ body: content });
    }

    private async handleRoute(req: ServerRequest): Promise<void> {
        let lookupRoutes = new Array<Route>();
        if (req.method === "GET") lookupRoutes = this.getRoutes;
        else if (req.method === "POST") lookupRoutes = this.postRoutes;

        const routeIndex = Route.findRouteIndex(lookupRoutes, req.url);

        if (routeIndex === -1) {
            req.respond({ status: 400 });
            return;
        }

        const selectedRoute = lookupRoutes[routeIndex];
        if (req.method === "POST") {
            const data = await Deno.readAll(req.body);
            const dataEncoder = new TextDecoder();
            selectedRoute.data = JSON.parse(dataEncoder.decode(data));
        }
       
        if (selectedRoute.handler) {
            const response = await selectedRoute.handler(selectedRoute);
            console.log(response)
            const encoder = new TextEncoder();
            if (typeof response === 'object') {
                const result = encoder.encode(JSON.stringify(response));
                req.respond({ body: result, headers: new Headers({ 'Content-Type': 'application/json' }) });
            } else if (typeof response === 'string') {
                const result = encoder.encode(String(response));
                req.respond({ body: result, headers: new Headers({ 'Content-Type': 'text/plain' }) });
            }

            return;
        }
        const filePath = `${Deno.cwd()}/${this.staticFolder}/${selectedRoute.path}`;
        const content = await serveFile(req, filePath);
        req.respond(content);
    }
}

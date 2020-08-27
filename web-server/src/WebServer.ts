import { serve, ServerRequest } from "https://deno.land/std/http/server.ts";
import { serveFile } from "https://deno.land/std@0.66.0/http/file_server.ts";
import { MultipartReader, FormFile } from "https://deno.land/std@0.66.0/mime/multipart.ts";
import Route from './Route.ts';

export default class WebServer {

    private staticFolder: string;
    private getRoutes: Array<Route>;
    private postRoutes: Array<Route>;
    public static Instance: WebServer = new WebServer();

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

    public send(url: string, path: string): WebServer {
        const route = new Route(url, path, undefined);
        this.addGetRoute(route);
        return this;
    }

    private async setRouteValuesIfMultiPart(boundary: string, req: ServerRequest, selectedRoute: Route) {

        const mr = new MultipartReader(req.body, boundary);

        try {
            const form = await mr.readForm(20);
            const data: Record<string, string> = {};
            let formFiles = new Array<FormFile>();
            for (let [key, value] of form.entries()) {
                if (typeof value === "string") {
                    data[key] = value;
                } else {
                    if (value !== undefined) {
                        if (value as FormFile[]) {
                            const fileList = value as FormFile[];
                            formFiles = formFiles.concat(fileList);
                        } else {
                            const singleFile = value as FormFile;
                            formFiles.push(singleFile);
                        }
                    }

                }
            }
            selectedRoute.files = formFiles;
            selectedRoute.data = data;
        } catch (error) {
            console.log(error.stack);
        }
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
            const boundaryRegex = /^multipart\/form-data;\sboundary=(?<boundary>.*)$/;
            const match = req.headers.get("content-type")!.match(boundaryRegex);
            if (match) {
                await this.setRouteValuesIfMultiPart(match[1], req, selectedRoute);
            } else {
                const data = await Deno.readAll(req.body);
                const dataEncoder = new TextDecoder();
                selectedRoute.data = JSON.parse(dataEncoder.decode(data));
            }
        }

        if (selectedRoute.handler) {
            const response = await this.createResponse(req, selectedRoute);
            return response;
        }


        const filePath = `${Deno.cwd()}/${this.staticFolder}/${selectedRoute.path}`;
        const content = await serveFile(req, filePath);
        req.respond(content);
    }

    private async createResponse(req: ServerRequest, selectedRoute: Route) {
        if (!selectedRoute.handler) return;

        const response = await selectedRoute.handler(selectedRoute);
        const encoder = new TextEncoder();

        let body: string | Uint8Array | Deno.Reader | undefined = undefined;
        let headers: Headers = new Headers();

        if (typeof response === 'object') {
            body = encoder.encode(JSON.stringify(response));
            headers = new Headers({ 'Content-Type': 'application/json' });
        } else if (typeof response === 'string') {
            body = encoder.encode(String(response));
            headers = new Headers({ 'Content-Type': 'text/plain' });
        }

        req.respond({ body, headers });
    }
}

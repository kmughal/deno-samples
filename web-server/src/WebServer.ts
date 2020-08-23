import { serve, ServerRequest } from "https://deno.land/std/http/server.ts";
import { serveFile } from "https://deno.land/std@0.66.0/http/file_server.ts";
import { MultipartReader } from "https://deno.land/std@0.66.0/mime/multipart.ts";
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


            const boundaryRegex = /^multipart\/form-data;\sboundary=(?<boundary>.*)$/;
            const match = req.headers.get("content-type")!.match(boundaryRegex);
            if (match) {
                const boundary = match[1];
                const mr = new MultipartReader(req.body, boundary);

                try {
                    const form = await mr.readForm(20);
                    const data: Record<string, string> = {};

                    for (let [key, value] of form.entries()) {
                        console.log({ key, value })
                        if (typeof value === "string") {
                            data[key] = value;
                        }
                    }
                    selectedRoute.data = data;
                } catch (error) {
                    console.log(error.stack);
                }
            } else {
                const data = await Deno.readAll(req.body);
                const dataEncoder = new TextDecoder();
                selectedRoute.data = JSON.parse(dataEncoder.decode(data));
            }







            //     const decoder = new TextDecoder();
            //     let reqBody = decoder.decode(await Deno.readAll(req.body));

            //     console.log(reqBody, " :reqbody");
            //     let boundary =reqBody.split("\r\n").shift();
            //     const e = new TextEncoder();
            //    boundary = boundary;
            //     console.log("boundary :" , boundary);
            //     try {
            //         const mr = new MultipartReader(
            //             req.body ,
            //             boundary ?? ""
            //         );
            //         const form = await mr.readForm(20);
            //         console.log(form);

            //     } catch(e) {
            //         console.log(e)
            //     }
            //  const decoder = new TextDecoder();
            // const reqBody = decoder.decode(await Deno.readAll(req.body));

            // var match = reqBody.match(/boundary=([^\s]+)/);
            // console.log({ match, reqBody })
            // if (match) {
            //     const boundary = match[1];
            //     const reader = new MultipartReader(req.body, "");
            //     const form = await reader.readForm(1024 * 1024); // 1MB
            //     console.log(form);
            // }
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

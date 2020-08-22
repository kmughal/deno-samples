import { ServerRequest } from "https://deno.land/std/http/server.ts";


export type handlerType = (route: Route) => string | object;

export type RouteValue = {
    name: string;
    value: string;
}

export default class Route {

    public routeValues: Array<string>;
    public query: Record<string, string>;

    constructor(public url: string, public path: string | null, public handler?: handlerType) {
        this.routeValues = new Array<string>();
        this.query = {};

        const parts = url.split(":/");
        if (parts.length >= 1) {
            const [ignorePart, ...restParts] = parts;
            this.routeValues = restParts;
        }
    }

    public static findRouteIndex(routes: Route[], url: string): number {
        const toLowerUrl = url.toLowerCase();
        const result = routes.findIndex(r => r.url.toLowerCase() === toLowerUrl);
        if (result > -1) return result;

        // name value lookup..
        const parts = url.split("?");
        if (parts.length < 2) return -1;

        const queries = parts[1].split("&");

        if (queries.length == 0) return -1;

        const queryNameValuePairs = new Array<RouteValue>();


        queries.forEach(query => {
            const [name, value] = query.split("=");
            queryNameValuePairs.push({ name, value });
        });


        let findRoute: Route;

        for (let k = 0; k < routes.length; k++) {
            const route = routes[k];
            const split1 = route.url.split("/:");

            if (split1.length >= 1) {
                const [_, ...rest] = split1;
                const lookup = rest.join(",") === queryNameValuePairs.map(q => q.name).join(",");
                if (lookup) {
                    findRoute = route;
                    const query: Record<string, string> = {};
                    queryNameValuePairs.map(q => query[q.name] = q.value);
                    findRoute.query = query;
                    return k;
                }
            }
        }

        return -1;
    }
}

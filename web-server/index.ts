import WebServer from './src/WebServer.ts';
import Route from './src/Route.ts';

await new WebServer()
    .addRoute(new Route("/", "/index.html"))
    .addRoute(new Route("/Products", "/Products/index.html"))
    .addRoute(new Route("/Products/json", "/Products/mock/list.json"))
    .addRoute(new Route("/Products/:id", null, (route) => {
        return [{ name: "khurram", address: "home" }]
    }))
    .addRoute(new Route("/Products/:name", null, (route) => {
        return `Echoing back ${route.query.name}`
    }))
    .start(8000);
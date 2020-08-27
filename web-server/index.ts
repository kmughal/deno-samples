import WebServer from './src/WebServer.ts';
import Route from './src/Route.ts';

await WebServer.Instance
    .addGetRoute(new Route("/", "/index.html"))
    .addGetRoute(new Route("/Products", "/Products/index.html"))
    .addGetRoute(new Route("/Products/json", "/Products/mock/list.json"))
    .addGetRoute(new Route("/Products/:id", null, (route) => {
        return [{ name: "khurram", address: "home" }]
    }))
    .addGetRoute(new Route("/Products/:name", null, (route) => {
        return `Echoing back ${route.query.name}`
    }))
    .addPostRoutes(new Route("/Products/newProduct", null, (route) => {
        const str = JSON.stringify(route.data);
        return "New Product created :" + str;
    }))
    .send("/Products/json", "/Products/mock/list.json")
    .start(8000);
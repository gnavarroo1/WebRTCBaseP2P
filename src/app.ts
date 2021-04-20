import { App } from './server/server';
import { Routes } from './routes/routes';
let server = new App()
let app = server.getApp();
const route = new Routes(app);
route.getRoutes();

export { app };
import express = require('express');
import { createServer, Server } from 'http';
import * as socketIo from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet = require("helmet");
import * as path from 'path';
import { Socket } from 'socket.io';

export class App{
    public static readonly PORT:number = 5000;
    private app: express.Application;
    private port: string | number;
    private server: Server;
    private io: socketIo.Server;
    constructor(){
        this.createApp();
        this.config();
        this.createServer();
        this.setCSSLibrariesFiles();
        this.setJSLibrariesFiles();
        this.sockets();
        this.listen();

    }


    private createApp(): void {
        
        this.app = express();
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended:true}))
        
        this.app.use(express.static(path.join(__dirname,'../public')));
        this.app.set('views', path.join(__dirname, '../views'));
        this.app.set('view engine','ejs');     
        this.app.use(cors());
        this.app.use(helmet({
            contentSecurityPolicy: false,
          }));
        this.app.use(express.json());
    }


    private setCSSLibrariesFiles():void{
        this.app.use('/libraries/bootstrap/css',express.static(path.join(__dirname, '../../node_modules/bootstrap/dist/css')));    
    }

    private setJSLibrariesFiles():void{
        this.app.use('/libraries/bootstrap/js',express.static(path.join(__dirname, '../../node_modules/bootstrap/dist/js')));
        this.app.use('/libraries/jquery/js',express.static(path.join(__dirname, '../../node_modules/jquery/dist')));
    }

    private config(): void {
        this.port = process.env.PORT || App.PORT;
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    public getApp(): express.Application {
        return this.app;
    }

    
    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        this.io.on("connection",(socket: Socket) =>{
            socket.broadcast.emit('add-users', {
                users: [socket.id]
               });
        })
    }


    private sockets():void{
        this.io = new socketIo.Server(this.server);
    }

    
}
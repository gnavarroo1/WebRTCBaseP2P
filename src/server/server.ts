import express from 'express';
import { createServer, Server } from 'http';
import * as socketIo from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet = require("helmet");
import * as path from 'path';
import cookieParser from 'cookie-parser';
import * as cookie from 'cookie';
import { Socket } from 'socket.io';
import {disconnect} from "cluster";
export class App{
    public static readonly PORT = process.env.PORT || 5000;
    private app: express.Application;
    private port: string | number;
    private server: Server;
    private io: socketIo.Server;
    private rooms = {};
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
        this.app.use(cookieParser()) ;
        this.app.use(cors());
        this.app.use(helmet({
            contentSecurityPolicy: false,
          }));
        this.app.use(express.json());
    }


    private setCSSLibrariesFiles():void{
        this.app.use('/libraries/bootstrap/css',express.static(path.join(__dirname, '../../node_modules/bootstrap/dist/css')));
        this.app.use('/libraries/toastr/css',express.static(path.join(__dirname, '../../node_modules/toastr/build/')));
        this.app.use('/libraries/sweetalert2/css',express.static(path.join(__dirname, '../../node_modules/sweetalert2/dist/')));
    }

    private setJSLibrariesFiles():void{
        this.app.use('/libraries/bootstrap/js',express.static(path.join(__dirname, '../../node_modules/bootstrap/dist/js')));
        this.app.use('/libraries/sweetalert2/js',express.static(path.join(__dirname, '../../node_modules/sweetalert2/dist/')));
        this.app.use('/libraries/toastr/js',express.static(path.join(__dirname, '../../node_modules/toastr/build/')));
        this.app.use('/libraries/jquery/js',express.static(path.join(__dirname, '../../node_modules/jquery/dist')));
        this.app.use('/libraries/socket.io-client',express.static(path.join(__dirname, '../../node_modules/socket.io-client/dist')));

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

    public getServer(): Server{
        return this.server;
    }   
    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        
    }

    private sockets():void{
        this.io = new socketIo.Server(this.server); 
        this.io.on("connection",socket =>{
            this.socketNotificationEvents(socket);
            this.signalingHandshakeEvents(socket);

        })  
    }

    private socketNotificationEvents(socket:any){
        
        socket.on("join-room", (roomId) =>{

            const parsedCookie = cookie.parse(socket.handshake.headers.cookie)
            // console.log(parsedCookie);
            let userId = parsedCookie.userId;
            //Si la sala existe se añade el id del socket a la sala
            if(this.rooms[roomId]){
                // console.log(socket.id);
                this.rooms[roomId].push({
                    userId : userId,
                    socketId: socket.id
                });
            }else{ // sino se agrega el id de la sala a la lista como key y el valor un array con el id del socket
                this.rooms[roomId] = [
                    {
                        userId : userId,
                        socketId: socket.id
                    }
                ];
            }
            socket.join(roomId);
            const user = this.rooms[roomId].filter( room => room.userId !== userId)
            socket.emit(roomId,user);

            //TODO update user list

            //socket.to(roomId).emit('join-room',socket.id)
            // if(user){
            //     socket.emit('other user', user);
            //     socket.to(roomId).broadcast.emit('user joined',socket.id);
            // }
            //socket.join(roomId);
            //socket.to(roomId).broadcast.emit("user-connected",userId);
        });
        socket.on("video-pause", () =>{

        });
        socket.on("audio-mute", () =>{

        });
        socket.on("peer_disconnect", (roomId) =>{
            // console.log("ROOM ID => " + roomId)
            // console.log(this.rooms)
            // console.log("DISCONNECTED => " +socket.id)
            if(this.rooms[roomId]) {
                this.rooms[roomId] = this.rooms[roomId].filter((user) => {
                    return user.socketId !== socket.id;
                })
                this.rooms[roomId].forEach((user) => {
                    this.io.to(user.socketId).emit("disconnect_peer", socket.id)
                })
                // socket.disconnect();
            }
        });

    }


    private signalingHandshakeEvents(socket: Socket){
        socket.on("offer", (socketId,sdp) =>{
            this.io.to(socketId).emit('offer',socket.id,sdp);
        });

        socket.on("answer", (socketId,sdp) =>{
            this.io.to(socketId).emit('answer',sdp);
        });
        // 
        socket.on('candidate', (socketId,candidate) => {
            this.io.to(socketId).emit('candidate',candidate);
          });
    }
    
}
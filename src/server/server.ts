import express from 'express';
import { createServer, Server } from 'http';
import * as socketIo from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet = require("helmet");
import * as path from 'path';
import cookieParser from 'cookie-parser';
import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import passport from "passport";
import {RoomController} from "../controllers/room";
import {IRoomDocument} from "../models/room.model";
import {UserController} from "../controllers/user";


export class App{
    public static readonly PORT = process.env.PORT || 5000;
    private app: express.Application;
    private port: string | number;
    private server: Server;
    private io: socketIo.Server;
    private rooms = {};
    private mongoUrl;
    private userController = new UserController()
    private roomController = new RoomController();
    constructor(){
        this.createApp();
        this.config();
        this.createServer();
        this.setCSSLibrariesFiles();
        this.setJSLibrariesFiles();
        this.configDbConnection();
        this.sockets();
        this.listen();
    }
    private configDbConnection(){
        this.mongoUrl = process.env.MONGO_DB_URI;
        mongoose.connect(this.mongoUrl,{useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true}).then(
            () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
            console.log('CONECTADO A DB')},
        ).catch(err => {
            console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
        });
    }
    private createApp(): void {
        this.app = express();
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended:true}))

        this.app.use(passport.initialize());
        this.app.use(passport.session());

        this.app.use(express.static(path.join(__dirname,'../public')));
        this.app.set('views', path.join(__dirname, '../../views'));
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
            if(!socket.handshake.headers.cookie){
                return;
            }
            let c = cookie.parse(socket.handshake.headers.cookie);
            const token = JSON.parse(c.token);
            let user = jwt.verify(token.access_token, process.env.SECRET);

            if(user){
                socket.join(roomId);
                this.roomController.updateRoomUserList({uuid: roomId},{
                    id: user["id"],
                    type: 0, //participant
                    action: 0, // add or update user info
                    socket_id: socket.id
                }).then((room: IRoomDocument) => {
                    // @ts-ignore
                    for( let [key,value] of room.participant_users_list.entries()){
                        if(key !== user['id']) {
                            socket.to(value.socket_id).emit(roomId,{
                                alias:'',
                                socket_id: socket.id
                            });
                        }
                    }
                    //
                }).catch((err) => {
                    console.log(err);
                })
            }
        });
        socket.on("silence", (message) =>{
            console.log(message);
            let options = {
                type: 0, //participant
                action: 0, // add or update user info
                socket_id: message.id,
            }
            switch (message.type) {
                case 'video':
                    options["video"] = message.validator;
                    break;
                case 'audio':
                    options["audio"] = message.validator;
                    break;
            }

            this.roomController.updateRoomUserList({uuid: message.room},options).then((room: IRoomDocument) => {
                // console.log(room.users_list);
                // @ts-ignore
                for( let [key,value] of room.participant_users_list.entries()){
                    // console.log(value)
                    if(value.socket_id !== message.id){
                        console.log('ENVIANDO....')
                        this.io.to(value.socket_id).emit('silence-media',{
                           socket_id: message.id,
                           type: message.type,
                           value: message.validator
                       });
                    }
                }
                //
            }).catch((err) => {
                console.log(err);
            })
        });
        socket.on("peer_disconnect", (roomId) =>{
            if(!socket.handshake.headers.cookie){
                return;
            }
            let c = cookie.parse(socket.handshake.headers.cookie);
            const token = JSON.parse(c.token);
            let user = jwt.verify(token.access_token, process.env.SECRET);
            this.roomController.updateRoomUserList({uuid: roomId},{
                id: user["id"],
                type: 0, //participant
                action: 1, // remove participant | user from lists
                socket_id: socket.id
            }).then((room: IRoomDocument) => {
                // @ts-ignore
                for( let [key,value] of room.participant_users_list.entries()){
                    this.io.to(value.socket_id).emit("disconnect_peer", socket.id)
                }

            }).catch((err) => {
                console.log(err);
            })
        });
        socket.on("end_session",(roomId) => {

            if(!socket.handshake.headers.cookie){
                return;
            }
            let c = cookie.parse(socket.handshake.headers.cookie);
            const token = JSON.parse(c.token);
            let user = jwt.verify(token.access_token, process.env.SECRET);
            this.roomController.getRoomUsersList(roomId,user['id']).then((res: any )=> {
                res.forEach((id) =>{
                    this.io.to(id).emit('end_session',id);
                })
            }).catch(err => {

                console.log(err);
            })

        })
    }
    private signalingHandshakeEvents(socket: socketIo.Socket){
        socket.on("offer", (message) =>{
            this.io.to(message.id).emit('offer',socket.id,message.sdp);
        });
        socket.on("answer", (socketId,sdp) =>{
            this.io.to(socketId).emit('answer',socket.id,sdp);
        });
        // 
        socket.on('candidate', (socketId,candidate) => {
            this.io.to(socketId).emit('candidate',socket.id,candidate);
        });
    }
    
}
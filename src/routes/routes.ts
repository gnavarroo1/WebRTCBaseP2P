import * as express from 'express';

import * as helpers from '../helpers/helpers';
import '../auth/passportHandler';
import passport from "passport";
import { UserRouter } from './user.router';
import * as jwt from 'jsonwebtoken';
import {User,IUserDocument} from "../models/user.model";
import {RoomRouter} from "./room.router";
import {RoomController} from "../controllers/room";
import {IRoomDocument} from "../models/room.model";
import {UserController} from "../controllers/user";


export class Routes {
    private app: express.Application;
    private rooms : any;
    private key;
    private iv;

    constructor(app: express.Application) {
        this.app = app;
        this.rooms = [];
        this.key = process.env.CRYPTOKEY || 'ABCDEFGHIJKLM123';
        this.iv = process.env.CRYPTOIV || '1234567ABCEFG';
    }

    private home(): void {
        this.app.get('/', (request, response) => {
            let userController = new UserController();
            if (!request.cookies.token) {
               userController.addTemporalUser().then((user:IUserDocument) => {
                    let token = JSON.stringify(user.generateJWT());
                    response.cookie("token", token , {maxAge: 86400000, httpOnly: true})
                    return response.render('pages/index', {logged: false})
                }).catch((err)=>{
                    return response.status(400).json({
                        err: err
                    })
                })
            }else{
                let token = JSON.parse(request.cookies.token);
                    let decoded = jwt.verify(token.access_token,process.env.SECRET);
                    User.findById(decoded["id"]).then((user) => {
                        // console.log(user.generateJWT());
                        if(token.expires_in * 1000 <= Date.now()) {
                            token = JSON.stringify(user.generateJWT());
                            response.cookie("token", token, {maxAge: 86400000, httpOnly: true})
                        }
                        return response.render('pages/index', {logged: !user.is_temporary})
                    }).catch((e)=>{
                        userController.addTemporalUser().then((user:IUserDocument) => {
                            let token = JSON.stringify(user.generateJWT());
                            response.cookie("token", token , {maxAge: 86400000, httpOnly: true})
                            return response.render('pages/index', {logged: false})
                        }).catch((err)=>{
                            return response.status(400).json({
                                err: err
                            })
                        })
                    })


            }

        });
    }
    private getRoomAdmin(): void{
        this.app.get('/rooms-admin/:uuid', (request, response) => {
            // console.log(request);
            try {
                const uuid = request.params.uuid;
                const token = JSON.parse(request.cookies.token);
                let errorMsg = '';
                if(!token){
                    errorMsg = 'No se pudo obtener información de usuario';
                    return response.render('pages/error', {errorMsg: errorMsg})
                }
                // Validar parametro uuid
                if (!helpers.validateUUID(uuid)) {
                    errorMsg = 'El enlace ingresado no es válido.';
                    return response.render('pages/error', {errorMsg: errorMsg})
                }
                // Obtener informacion de la sala segun uuid
                let roomController = new RoomController();
                roomController.getRoomByRoomUUID(uuid).then((room:IRoomDocument) =>{
                    let decoded = jwt.verify(token.access_token,process.env.SECRET);
                    //Verificar que se ha devuelto un valor correspondiente al uuid proporcionado
                    if(!room){
                        errorMsg = 'El código de la sala no coincide con el enlace ingresado.';
                        return response.render('pages/error', {errorMsg: errorMsg})
                    }
                    //Verificar que el usuario que ingresa es el creador de la sala
                    if(room.user_creator_id != decoded['id']){
                        errorMsg = 'El usuario no esta registrado como creador de la sala.';
                        return response.render('pages/error', {errorMsg: errorMsg})
                    }
                    //Redireccionar a vista de sala con parametros uuid, nombre de sala, flag de creador de sala.
                    return response.render('pages/room', {uuid: uuid, name: room.name, isRoomCreator: true})
                }).catch(err => {
                    return response.render('pages/error', {errorMsg: err})
                })

            } catch (e) {
                console.log(e)
                return response.render('pages/error', {errorMsg: e.message})
            }
        });
    }
    // private createRoom(): void{
    //     this.app.post('/api/rooms', (request, response) => {
    //         const id = v4();
    //         let name = request.body.txt_room;
    //         let userID = request.cookies.token;
    //         // Validar que exista el userId
    //         if(!request.cookies.userId){
    //             response.status(400).send({
    //                     message: 'La solicitud no ha enviado informacion requerida'
    //             })
    //         }
    //         // Crear nombre generico usando el numero de salas ya registradas como parametro
    //         if(name || name.trim() === ''){
    //             name = 'SALA #' + (this.rooms.length + 1)
    //         }
    //         // Asignar informacion a objeto room para agregar a array de salas
    //         let room = {
    //             'roomId' : id,
    //             'userCreatorId' : userID,
    //             'users' : [
    //                 userID
    //             ],
    //             'roomName' : name
    //         };
    //         this.rooms.push(room);
    //         response.redirect('/rooms-admin/'+id);
    //     });
    //
    // }
    // private createRoomCode(): void{
    //     this.app.post('/api/rooms-code', (request, response) => {
    //         let roomID = request.body.roomId;
    //         let userID = request.cookies.userId;
    //         let result = null;
    //         // Validar que exista el userId
    //         try {
    //             //Validar que roomID recibida cumpla con el regex de un uuid v4
    //             if (!helpers.validateUUID(roomID)) {
    //                 return response.status(400).send({
    //                     message: 'UUID no válido'
    //                 })
    //             }
    //             //Validar que userID en cookies exista
    //             if (!userID) {
    //                 return response.status(400).send({
    //                     message: 'La solicitud no ha enviado informacion requerida'
    //                 })
    //             }
    //             //Iterar lista de salas
    //             let _room = this.rooms.find((room, index) => {
    //                 //Obtener sala segun el roomID recibido y validar que es el creador de la sala el que esta realizando la operación
    //                 if (room.roomId === roomID && room.userCreatorId === userID) {
    //                     //Retornar codigo si es que este ha sido generado anteriormente
    //                     if(this.rooms[index].roomCode){
    //                         return response.status(200).send({
    //                             success:true, data : {
    //                                 roomCode: this.rooms[index].roomCode
    //                             }
    //                         })
    //                     }
    //                     // Funcion para encriptar usando algoritmo AES-128-ccm
    //                     result = helpers.encrypt(roomID, this.key, this.iv);
    //                     // Validar que la operacion ha sido exitosa
    //                     if (result.success) {
    //                         //Guardar codigo generado y tag para desencriptarlo en la información de la sala y devolver el código generado
    //                         this.rooms[index].roomCode = result.data.code;
    //                         this.rooms[index].encryptTag = result.data.tag;
    //                         return response.status(200).send({
    //                             success:true,data: {
    //                                 roomCode: result.data.code
    //                             }
    //                         })
    //                     } else {
    //                         return response.status(200).send({
    //                             success:false,data: {
    //                                 message: result.errorMsg
    //                             }
    //
    //                         })
    //                     }
    //
    //                 }
    //             });
    //             // Retornar error si es que no se encontro una sala
    //             if(!_room){
    //                 return response.status(500).send({
    //                         message: 'NO SE ENCONTRO UNA SALA CON LA INFORMACION PROPORCIONADA'
    //                     })
    //             }
    //
    //         } catch (e) {
    //             return response.status(500).send({error: e.message})
    //         }
    //     });
    // }

    private getRoom(): void{
        this.app.get('/rooms/:codigo', (request, response) => {
            const codigo = request.params.codigo
            let userController = new UserController();
            let roomController = new RoomController();
            // console.log(request.cookies);
            if (!request.cookies.token) {
                userController.addTemporalUser().then((user: IUserDocument) => {
                    let token = JSON.stringify(user.generateJWT());
                    response.cookie("token", token, {maxAge: 86400000, httpOnly: true})
                    roomController.getRoomByRoomCode(codigo).then((room: IRoomDocument) => {
                        if(room){
                            // console.log(room.encrypt_tag);
                            let decrypt = helpers.decrypt(codigo,this.key,this.iv,room.encrypt_tag);
                            if(decrypt.success){
                                if(decrypt.uuid !== room.uuid){
                                    return response.render('pages/error', {errorMsg: 'EL ENLACE INGRESADO NO ESTA LIGADO A UNA SALA.'})
                                }else{
                                    return response.render('pages/room', {uuid: room.uuid, name: room.name, isRoomCreator: false, users_list: room.users_list, participant_users_list: room.participant_users_list})
                                }
                            }else{
                                // console.log(decrypt.errorMsg)
                                return response.render('pages/error', {errorMsg: decrypt.errorMsg})
                            }

                        }else{
                            return response.render('pages/error', {errorMsg: 'EL ENLACE INGRESADO NO ESTA LIGADO A UNA SALA.'})
                        }
                    }).catch((err)=>{
                        console.log(err);
                        return response.render('pages/error', {errorMsg: 'ERROR AL CARGAR EL ENLACE INGRESADO'})
                    })

                }).catch((err) => {
                    return response.render('pages/error', {errorMsg: err})
                })
            }else{
                const token = JSON.parse(request.cookies.token);
                let decoded = jwt.verify(token.access_token,process.env.SECRET);
                roomController.getRoomByRoomCode(codigo).then((room: IRoomDocument) => {
                    if(room){
                        let decrypt = helpers.decrypt(codigo,this.key,this.iv,room.encrypt_tag);
                        if(decrypt.success){
                            if(decrypt.data.decode !== room.uuid){
                                return response.render('pages/error', {errorMsg: 'EL ENLACE INGRESADO NO ESTA LIGADO A UNA SALA.'})
                            }else{
                                roomController.updateRoomUserList({id: room._id},{
                                    id: decoded["id"],
                                    type: 0,
                                    action: 0,
                                    alias: "",
                                }).then((room: IRoomDocument) => {
                                    if(decoded["id"] == room.user_creator_id){
                                        return response.render('pages/room', {uuid: room.uuid, name: room.name, isRoomCreator: true, users_list: room.users_list, participant_users_list: room.participant_users_list})
                                    }else{
                                        return response.render('pages/room', {uuid: room.uuid, name: room.name, isRoomCreator: false, users_list: room.users_list, participant_users_list: room.participant_users_list})
                                    }
                                }).catch((err) => {
                                    console.log(err);
                                    return response.render('pages/error', {errorMsg: 'ERROR AL CARGAR EL ENLACE INGRESADO'})
                                })
                            }
                        }else{
                            // console.log(decrypt.errorMsg)
                            return response.render('pages/error', {errorMsg: decrypt.errorMsg})
                        }

                    }else{
                        return response.render('pages/error', {errorMsg: 'EL ENLACE INGRESADO NO ESTA LIGADO A UNA SALA.'})
                    }
                }).catch((err)=>{
                    console.log(err);
                    return response.render('pages/error', {errorMsg: 'ERROR AL CARGAR EL ENLACE INGRESADO'})
                })
            }
            // let idx = null ;
            // let _room = this.rooms.find((room, index) => {
            //     if(room.roomCode === codigo){
            //         idx = index
            //         return room;
            //     }
            // });
            //
            // if(_room){
            //     //Desencriptar codigo
            //
            //     let decrypt = helpers.decrypt(codigo,this.key,this.iv,_room.encryptTag);
            //     // Comparar codigo desencriptado con id de sala
            //     if(decrypt.success){
            //         const uuid = decrypt.data.decode;
            //         if(decrypt.data.decode !== _room.roomId){
            //
            //             return response.render('pages/error', {errorMsg: 'EL ENLACE INGRESADO NO ESTA LIGADO A UNA SALA.'})
            //         }
            //         if(userId === _room.userCreatorId){
            //             return response.redirect('/room-admin/'+ _room.roomId);
            //         }
            //         let user = this.rooms[idx].users.find((user) => {
            //             return user === userId
            //         })
            //         if(!user){
            //             this.rooms[idx].users.push(userId)
            //         }
            //         // console.log({uuid: uuid, name: _room.name, isRoomCreator: false});
            //         return response.render('pages/room', {uuid: uuid, name: _room.roomName, isRoomCreator: false})
            //     }else{
            //         return response.render('pages/error', {errorMsg: decrypt.errorMsg})
            //     }
            //
            //     //Agregar usuario a sala
            //
            //
            // }else{
            //     return response.render('pages/error', {errorMsg: 'EL ENLACE INGRESADO NO ESTA LIGADO A UNA SALA.'})
            // }
        });
    }

    private signUp(): void{
        this.app.get('/sign-up',(request, response) => {
            let userController = new UserController();
            // console.log(request.cookies.token)
            if (!request.cookies.token) {
                userController.addTemporalUser().then((user:IUserDocument) => {
                    let token = JSON.stringify(user.generateJWT());
                    response.cookie("token", token , {maxAge: 86400000, httpOnly: true})
                    return response.render('pages/sign-up', {logged: false})
                }).catch((err)=>{
                    return response.status(400).json({
                        err: err
                    })
                })
            }else{
                let token = JSON.parse(request.cookies.token);
                // console.log(token)
                let decoded = jwt.verify(token.access_token,process.env.SECRET);
                console.log('--------------');
                // console.log(decoded);
                console.log('--------------');
                if(!decoded['is_temporary']){
                    return response.redirect('/');
                }else{
                    User.findById(decoded["id"]).then((user) => {
                        if(user.is_temporary){
                            if(token.expires_in * 1000 <= Date.now()) {
                                token = JSON.stringify(user.generateJWT());
                                response.cookie("token", token, {maxAge: 86400000, httpOnly: true})
                            }
                            return response.render('pages/sign-up', {logged: false})
                        }else{
                            token = JSON.stringify(user.generateJWT());
                            response.cookie("token", token , {maxAge: 86400000, httpOnly: true})
                            return response.render('pages/index', {logged: true})
                        }

                    }).catch((err)=>{
                        return response.status(400).json({
                            err: err
                        })
                    })
                }

            }

        });
    }

    private login(): void{
        this.app.get('/login',(request, response) => {
            let userController = new UserController();
            // console.log(request.cookies.token)
            if (!request.cookies.token) {
                userController.addTemporalUser().then((user:IUserDocument) => {
                    let token = JSON.stringify(user.generateJWT());
                    response.cookie("token", token , {maxAge: 86400000, httpOnly: true})
                    return response.render('pages/login', {logged: false})
                }).catch((err)=>{
                    return response.status(400).json({
                        err: err
                    })
                })
            }else{
                let token = JSON.parse(request.cookies.token);
                // console.log(token)
                let decoded = jwt.verify(token.access_token,process.env.SECRET);
                console.log('--------------');
                // console.log(decoded);
                console.log('--------------');
                if(!decoded['is_temporary']){
                    if(token.expires_in * 1000 <= Date.now()) {
                        return response.render('pages/login', {logged: false})
                    }else{
                        return response.redirect('/');
                    }
                }else{
                    User.findById(decoded["id"]).then((user) => {
                        if(user.is_temporary){
                            if(token.expires_in * 1000 <= Date.now()) {
                                token = JSON.stringify(user.generateJWT());
                                response.cookie("token", token, {maxAge: 86400000, httpOnly: true})
                            }
                            return response.render('pages/login', {logged: false})
                        }else{
                            token = JSON.stringify(user.generateJWT());
                            response.cookie("token", token , {maxAge: 86400000, httpOnly: true})
                            return response.render('pages/index', {logged: true})
                        }

                    }).catch((err)=>{
                        return response.status(400).json({
                            err: err
                        })
                    })
                }
            }

        });
    }




    private updateRoomUserList() :void {
        this.app.post('/api/rooms/users', (request, response) => {
            let userID = request.cookies.userId;
            let roomID = request.body.roomId;
            try {
                if (!userID) {
                    return response.status(200).send({
                        success:false, data : {
                            errorMsg: "NO SE ENCONTRO INFORMACION DEL USUARIO"
                        }
                    })
                }
                const _room = this.rooms.find((room, index) => {
                    if (roomID === room.roomId) {
                        this.rooms[index].users = room.users.filter((user) => {
                            return user !== userID
                        })
                        return room;
                    }
                });
                if (!_room) {
                    return response.status(200).send({
                        success:false, data : {
                            errorMsg: "NO SE ENCONTRO UNA SALA ASOCIADA"
                        }
                    })
                }else{
                    return response.status(200).send({
                        success:true
                    })
                }
            } catch (e) {
               return response.status(400).send({
                    message: e.message
                })
            }

        });
    }

    public getRoutes(): void {
        this.home();
        // this.createRoom();
        this.getRoomAdmin();
        this.getRoom();
        this.signUp();
        this.login();
        // this.createRoomCode();
        // this.updateRoomUserList();
        this.app.use("/api/",new UserRouter().userRouter);
        this.app.use("/api/",new RoomRouter().roomRouter);
    }
    

}
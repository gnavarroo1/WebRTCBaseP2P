import * as express from 'express';
import {
    v4
} from 'uuid';

import * as helpers from '../app/helpers/helpers';

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
            const id = v4();
            if(!request.cookies.userId)
                response.cookie("userId",id,{ maxAge: 3600000 })
            response.render('pages/index')
        });
    }

    private createRoom(): void{
        this.app.post('/createRoom', (request, response) => {
            const id = v4();
            let name = request.body.txt_room;
            let userID = request.cookies.userId;
            // Validar que exista el userId
            if(!request.cookies.userId){
                response.status(400).send({
                        message: 'La solicitud no ha enviado informacion requerida'
                })
            }

            // Crear nombre generico usando el numero de salas ya registradas como parametro
            if(name || name.trim() === ''){
                name = 'SALA #' + (this.rooms.length + 1)
            }

            // Asignar informacion a objeto room para agregar a array de salas
            let room = {
                'roomId' : id,
                'userCreatorId' : userID,
                'users' : [
                    userID
                ],
                'roomName' : name
            };
            this.rooms.push(room);
            response.redirect('/room-admin/'+id);
        });

    }
    private createRoomCode(): void{
        this.app.post('/api/createRoomCode', (request, response) => {
            let roomID = request.body.roomId;
            let userID = request.cookies.userId;
            let result = null;
            // Validar que exista el userId
            try {
                if (!helpers.validateUUID(roomID)) {
                    return response.status(400).send({
                        message: 'UUID no válido'
                    })
                }
                if (!userID) {
                    return response.status(400).send({
                        message: 'La solicitud no ha enviado informacion requerida'
                    })
                }
                let _room = this.rooms.find((room, index) => {
                    if (room.roomId === roomID && room.userCreatorId === userID) {
                        if(this.rooms[index].roomCode){
                            return response.status(200).send({
                                success:true, data : {
                                    roomCode: this.rooms[index].roomCode
                                }
                            })
                        }
                        result = helpers.encrypt(roomID, this.key, this.iv);
                        if (result.success) {
                            this.rooms[index].roomCode = result.data.code;

                            this.rooms[index].encryptTag = result.data.tag;
                            return response.status(200).send({
                                success:true,data: {
                                    roomCode: result.data.code
                                }
                            })
                        } else {
                            return response.status(200).send({
                                success:false,data: {
                                    message: result.errorMsg
                                }

                            })
                        }
                    }
                });
                if(!_room){
                    return response.status(500).send({
                            message: 'NO SE ENCONTRO UNA SALA CON LA INFORMACION PROPORCIONADA'
                        })
                }

            } catch (e) {
                return response.status(500).send({error: e.message})
            }



        });
    }
    private getRoomAdmin(): void{
        this.app.get('/room-admin/:uuid', (request, response) => {
            try {
            const uuid = request.params.uuid;
            const userId = request.cookies.userId;
            let name;
            let errorMsg = '';

                if(!userId){
                    errorMsg = 'No se pudo obtener información de usuario';

                    return response.render('pages/error', {errorMsg: errorMsg})
                }
                // Validar parametro uuid
                if (!helpers.validateUUID(uuid)) {
                    errorMsg = 'El enlace ingresado no es válido.';

                    return response.render('pages/error', {errorMsg: errorMsg})
                }

                // Obtener informacion de la sala segun uuid
                let _room = this.rooms.find((room, index) => {
                    return room.roomId === uuid
                });
                // Validar que la sala existe
                if (_room) {
                    // Validar parametro userCreatorId con valor de cookie userID.
                    if (_room.userCreatorId !== userId) {
                        errorMsg = 'El usuario no esta registrado como creador de la sala.';
                        return response.render('pages/error', {errorMsg: errorMsg})
                    }
                    name = _room.roomName;
                } else {

                    errorMsg = 'El código de la sala no coincide con el enlace ingresado.';
                    return response.render('pages/error', {errorMsg: errorMsg})
                }
                //Redireccionar a vista de sala con parametros uuid, nombre de sala, flag de creador de sala.
                return response.render('pages/room', {uuid: uuid, name: name, isRoomCreator: true})
            } catch (e) {
                console.log(e)
                return response.render('pages/error', {errorMsg: e.message})
            }
        });
    }
    private getRoom(): void{
        this.app.get('/room/:codigo', (request, response) => {
            let userId = request.cookies.userId;
            const codigo = request.params.codigo

            if(!userId){
                userId = v4();
                response.cookie("userId",userId,{ maxAge: 3600000 })
            }
            let idx = null ;
            let _room = this.rooms.find((room, index) => {
                if(room.roomCode === codigo){
                    idx = index
                    return room;
                }
            });

            if(_room){
                //Desencriptar codigo

                let decrypt = helpers.decrypt(codigo,this.key,this.iv,_room.encryptTag);
                // Comparar codigo desencriptado con id de sala
                if(decrypt.success){
                    const uuid = decrypt.data.decode;
                    if(decrypt.data.decode !== _room.roomId){

                        return response.render('pages/error', {errorMsg: 'EL ENLACE INGRESADO NO ESTA LIGADO A UNA SALA.'})
                    }
                    if(userId === _room.userCreatorId){
                        return response.redirect('/room-admin/'+ _room.roomId);
                    }
                    let user = this.rooms[idx].users.find((user) => {
                        return user === userId
                    })
                    if(!user){
                        this.rooms[idx].users.push(userId)
                    }
                    // console.log({uuid: uuid, name: _room.name, isRoomCreator: false});
                    return response.render('pages/room', {uuid: uuid, name: _room.roomName, isRoomCreator: false})
                }else{
                    return response.render('pages/error', {errorMsg: decrypt.errorMsg})
                }

                //Agregar usuario a sala


            }else{
                return response.render('pages/error', {errorMsg: 'EL ENLACE INGRESADO NO ESTA LIGADO A UNA SALA.'})
            }





        });
    }

    private updateRoomUserList() :void {
        this.app.post('/api/updateRoomUserList', (request, response) => {
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
        this.createRoom();
        this.getRoomAdmin();
        this.getRoom();

        this.createRoomCode();
        this.updateRoomUserList();

    }
    

}
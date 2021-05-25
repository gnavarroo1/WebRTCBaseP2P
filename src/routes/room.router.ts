import {
    Router
} from 'express'
import {
    RoomController
} from '../controllers/room';

import {IRoomDocument} from "../models/room.model";
import * as jwt from "jsonwebtoken";
import {v4} from "uuid";
import * as helpers from "../helpers/helpers";
import {IRoom} from "../interfaces/room";


let roomController = new RoomController();


export class RoomRouter{
    public roomRouter:Router;
    public roomController: RoomController = new RoomController();
    constructor(){
        this.roomRouter = Router();
        this.routes();
    }
    routes(){
        this.roomRouter.post('/rooms',this.createRoom)
        this.roomRouter.post('/rooms-code',this.createRoomCode)
        this.roomRouter.post('/rooms/users',this.updateRoomUserList)
        this.roomRouter.delete('/rooms/:uuid',this.deleteRoom)
    }
    private createRoom = function(req,res,next){
        let r = {};
        let userId = null
        const id = v4();
        // console.log(req.cookies)
        if(req.cookies.token){
            const token = JSON.parse(req.cookies.token);
            let decoded = jwt.verify(token.access_token,process.env.SECRET);
            userId = decoded['id'];
            if(token.expires_in * 1000 < Date.now()){
                return res.status(400).json({
                    err: 'Error en operación'
                })
            }
        }
        r["name"] = req.body.txt_room;
        r["user_creator_id"]= userId;
        r["uuid"] = id;

        roomController.addRoom(r).then((room: IRoomDocument) => {
            if(room){

                return res.status(200).json({
                    roomUUID: room.uuid,
                    room_name: room.name,
                    user_list: room.users_list
                })
            }else{
                return res.status(400).json({
                    err: 'Error en creación de la sala.'
                })
            }
        }).catch( err => {
            return res.status(400).json({
                err: err
            })
        })
    }

    private createRoomCode = function(req,res,next){
        try {
            let roomID = req.body.roomId;
            const token = JSON.parse(req.cookies.token);

            if (!token.access_token) {
                return res.status(400).send({
                    message: 'Error al crear codigo de sala. El usuario no tiene las credenciales necesarias.'
                });
            }
            // Validar parametro uuid
            if (!helpers.validateUUID(roomID)) {
                return res.status(400).send({
                    message: 'ID de sala no válido'
                });
            }

            let decoded = jwt.verify(token.access_token,process.env.SECRET);
            if(!decoded['id']){
                return res.status(400).send({
                    message: 'Error al crear codigo de sala. El usuario no tiene las credenciales necesarias.'
                });
            }
            roomController.createRoomCode(roomID).then((room: IRoom) => {
                // console.log(room);
                return res.status(200).send({
                    data: {
                        room_code: room.room_code
                    }
                })
            }).catch( err => {
                return res.status(400).send({error: err})
            });

        } catch (e) {
            return res.status(500).send({error: e.message});
        }

    }

    private updateRoomUserList = function(req,res,next){
        let roomID = req.body.roomId;
        const token = JSON.parse(req.cookies.token);
        if (!token.access_token) {
            return res.status(400).send({
                message: 'Error al crear codigo de sala. El usuario no tiene las credenciales necesarias.'
            });
        }
        // Validar parametro uuid
        if (!helpers.validateUUID(roomID)) {
            return res.status(400).send({
                message: 'ID de sala no válido'
            });
        }

        let decoded = jwt.verify(token.access_token,process.env.SECRET);
        if(!decoded['id']){
            return res.status(400).send({
                message: 'Error al crear codigo de sala. El usuario no tiene las credenciales necesarias.'
            });
        }
        roomController.updateRoomUserList({'uuid' : roomID},decoded["id"]).then((room) => {
            if(!room){
                return res.status(400).send({
                        message: "NO SE ENCONTRO UNA SALA ASOCIADA"
                    })
            }
            return res.status(200).send({
                success:true
            })
        }).catch((err) =>{
            return res.status(400).send({
                message: err.message
            })
        });
    }

    private deleteRoom = function(req,res,next){
        // console.log(req.cookies.token);
        const token = JSON.parse(req.cookies.token);
        if (!token.access_token) {
            return res.status(400).send({
                message: 'Error al crear codigo de sala. El usuario no tiene las credenciales necesarias.'
            });
        }
        let decoded = jwt.verify(token.access_token,process.env.SECRET);
        const uuid = req.params.uuid;
        roomController.deleteRoom(uuid,decoded['id']).then((room) => {
            // console.log(room)
            return res.status(200).send(room)
        }).catch(err => {
            // console.log(err)
            return res.status(400).send({
                message: err
            });
        })
    }
}
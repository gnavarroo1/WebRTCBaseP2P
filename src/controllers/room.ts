import {IRoomDocument, Room} from "../models/room.model";
// import { Request, Response, NextFunction } from "express";
import * as helpers from '../helpers/helpers';
import {v4} from "uuid";


export class RoomController{
    private key = process.env.CRYPTOKEY;
    private iv = process.env.CRYPTOIV;

    public addRoom(roomData){

        return new Promise((resolve, reject) => {
            //TODO VALIDATION
            Room.saveRoom(roomData).then(room => {
                resolve(room);
            }).catch(err => {
                reject(err);
            })
        });
    }

    public createRoomCode(roomUUID) {
        let uuid = roomUUID;

        return new Promise( (resolve, reject) => {
            if(!helpers.validateUUID(uuid)){
                reject('FORMATO DE UUID INGRESADO NO VALIDO');
            }
             Room.createRoomCode(roomUUID).then(room => {
                 resolve(room)
             }).catch(err => {
                 reject(err)
             });
        });

        // Room.findOne({
        //         uuid: uuid
        //     },(err,room) =>{
        //         if(err){
        //             res.status(400).json({
        //                 error: 'Error en consulta'
        //             })
        //         }else{
        //             if(room){
        //                 if(room.room_code){
        //                     return res.status(200).json({
        //                         room_code: room.room_code
        //                     })
        //                 }else{
        //                     let result = helpers.encrypt(room.uuid, this.key, this.iv);
        //                     if(!result.success){
        //                         return res.status(200).send({
        //                             success:false,data: {
        //                                 message: result.errorMsg
        //                             }
        //
        //                         })
        //                     }
        //
        //                     const room_code = result.data.code;
        //                     const encrypt_tag = result.data.tag;
        //                     let update = {
        //                         room_code : room_code,
        //                         encrypt_tag : encrypt_tag
        //                     };
        //
        //                     Room.findOneAndUpdate({
        //                         _id: room._id
        //                     },update,{
        //                         new: true
        //                     },(err,r)=>{
        //                         if(err){
        //                             res.status(400).json({
        //                                 error: 'Error al obtener codigo de sala'
        //                             })
        //                         }else{
        //                             if(r){
        //                                 return res.status(200).json({
        //                                     room_code: room_code
        //                                 })
        //                             }else{
        //                                 res.status(404).json({
        //                                     error:'Error al actualizar la información de la sala. El id de la sala no existe.'
        //                                 })
        //                             }
        //                         }
        //                     });
        //
        //                 }
        //             }else{
        //                 res.status(404).json({
        //                     error: 'Error en consulta con el id proporcionado'
        //                 })
        //             }
        //         }
        //     });
    }

    public getRoomByRoomUUID(roomUUID){
        let uuid = roomUUID;
        return new Promise( (resolve, reject) => {
            if(!helpers.validateUUID(uuid)){
                reject('FORMATO DE UUID INGRESADO NO VALIDO');
            }
            Room.getRoomByRoomUUID(roomUUID).then( (room:IRoomDocument) => {
                resolve(room)
            }).catch(err => {
                reject(err)
            });

        });
    }
    public getRoomByRoomCode(room_code){
        return new Promise( (resolve, reject) => {
            Room.getRoomByRoomCode(room_code).then( (room:IRoomDocument) => {
                resolve(room)
            }).catch(err => {
                reject(err)
            });

        });
    }

    public updateRoomUserList(room,user){
        return new Promise((resolve,reject) => {
            Room.updateRoomUserList(room,user).then( (room:IRoomDocument) =>{
                resolve(room)
            }).catch(err => {
                reject(err)
            });
        })
    }

    public deleteRoom(uuid,user){

        return new Promise((resolve, reject) => {
            Room.deleteRoom(uuid,user).then((res) => {
                resolve(res)
            }).catch( err =>{
                reject(err)
            })
        })
    }

    public getRoomUsersList(uuid,user){
        return new Promise((resolve,reject) => {
            Room.getRoomUsersList(uuid,user).then((res) => {
                resolve(res);
            }).catch(err => {
                reject(err)
            })
        })
    }

}
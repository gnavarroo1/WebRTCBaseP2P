import * as mongoose from 'mongoose';
import mongooseUniqueValidator from "mongoose-unique-validator";
import * as helpers from '../helpers/helpers';
import {IRoom} from "../interfaces/room";
import {Schema} from "mongoose";

export interface IRoomDocument extends IRoom,mongoose.Document{
    name? : string,
    uuid? : string,
    creation_date: Date,
    user_creator_id: mongoose.Schema.Types.ObjectId,
    users_list: mongoose.Schema.Types.Map,
    observer_users_list:mongoose.Schema.Types.Map,
    participant_users_list:mongoose.Schema.Types.Map,
    max_number_participants: number,
    active: boolean,
    room_code: string,
    encrypt_tag: Buffer,
}

export interface IRoomModel extends mongoose.Model<IRoomDocument>{
    createRoomCode(roomUUID: string): Promise<IRoomDocument>,
    saveRoom(roomUUID: string): Promise<IRoomDocument>,
    getRoomByRoomCode(room_code: string): Promise<IRoomDocument>,
    getRoomByRoomUUID(roomUUID: string): Promise<IRoomDocument>,
    updateRoomUserList(room:any, user:any): Promise<IRoomDocument>,
    getRoomUsersList(room:string,user:string),
    deleteRoom(roomUUID:string,user:any),
    deleteAllRooms()
}

export const roomSchema = new mongoose.Schema<IRoomDocument>({
    name:{
        type: String,
    },
    uuid: {
        type: String,
        unique:true,
        required: [true, 'cannot be empty'],
        index:true,
    },
    creation_date:{
        type: Date,
        default: new Date()
    },
    user_creator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    users_list: {
        type: mongoose.Schema.Types.Map,
        of: new mongoose.Schema({
            alias: {type: String},
            socket_id: {type: String},
            audio:{
                type: Boolean,
                default: true
            },
            video:{
                type: Boolean,
                default: true
            }
        }),
    },
    observer_users_list: {
        type: mongoose.Schema.Types.Map,
        of: new mongoose.Schema({
            alias: {type: String},
            socket_id: {type: String},
            audio:{
                type: Boolean,
                default: true
            },
            video:{
                type: Boolean,
                default: true
            }
        }),
    },
    participant_users_list: {
        type: mongoose.Schema.Types.Map,
        of: new mongoose.Schema({
            alias: {type: String},
            socket_id:{type: String},
            audio:{
                type: Boolean,
                default: true
            },
            video:{
                type: Boolean,
                default: true
            }
        }),
    },
    max_number_participants:{
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    },
    room_code:{
        type: String,
    },
    encrypt_tag:{
        type: Buffer,
    }
}, {
    timestamps: true
})
roomSchema.plugin(mongooseUniqueValidator, {
    message: "product is already created"
});

roomSchema.statics.saveRoom = function( this: mongoose.Model<IRoomDocument>,roomData){
    return new Promise((resolve, reject) => {
        let room = new Room();
        room.uuid = roomData.uuid;
        room.user_creator_id = roomData.user_creator_id;
        if(roomData.user_creator_id) {
            room.set('users_list.' + roomData.user_creator_id, {
                alias: ""
            });
            room.set('participant_users_list.' + roomData.user_creator_id, {
                alias: ""
            });
        }else{
            reject({message: 'ERROR AL OBTERNER ID DE CREADOR DE SALA'});
        }
        if(roomData.name){
            room.name = roomData.name;
            room.save().then( r => {
                // console.log(r)
                resolve(r)
            }).catch( err => {
                console.log(err)
                reject(err)
            })
        }else{
            this.find().countDocuments((err,count) => {
                if(err){
                    reject(err);
                }else{
                    room.name = "SALA #"+ (count+1);
                    room.save().then( r => {
                        resolve(r)
                    }).catch( err => {
                        reject(err)
                    })
                }
            })
        }

    });


}

roomSchema.statics.createRoomCode = function(this: mongoose.Model<IRoomDocument>, roomUUID:string){
    return new Promise((resolve, reject) => {
        this.findOne({
            uuid:roomUUID
        }).then((room) => {
            if (room.room_code){
                resolve(room)
            }else{
                let result = helpers.encrypt(room.uuid, process.env.CRYPTOKEY, process.env.CRYPTOIV);
                if(!result.success){
                    reject(result.errorMsg);
                }else{
                    room.room_code = result.data.code;
                    room.encrypt_tag = result.data.tag;
                    room.save().then((r)=>{
                        resolve(r);
                    }).catch(err => {
                        reject(err);
                    });
                }
            }
        }).catch( err => {
            reject(err);
        })
    });
}

roomSchema.statics.getRoomByRoomUUID = function(this: mongoose.Model<IRoomDocument>, roomUUID:string){
    return new Promise((resolve, reject) => {
        this.findOne({uuid: roomUUID}).then((room) =>{
            resolve(room);
        }).catch( err => {
            reject(err)
        })
    });
}

roomSchema.statics.updateRoomUserList = function(this: mongoose.Model<IRoomDocument>, room: any,user: any){
    return new Promise((resolve, reject) => {
        let options = {};
        if(room.id){
            options["_id"] = room.id;
        }else if(room.uuid){
            options["uuid"] = room.uuid;
        }
        // console.log(options)
        this.findOne(options).then((room: IRoomDocument) =>{
            if(!room){
                reject({message : 'Error no se encontro la sala con la información brindada.'});
            }
            if( user.id || user.socket_id) {
                if (user.id) {
                    if (user.action == 0) { // insert or update
                        const users_list = room.users_list.get(user.id);
                        let socket_id = null;
                        let alias = "";
                        if (users_list && user.socket_id && users_list["socket_id"] && users_list["socket_id"] == user.socket_id) {
                            socket_id = users_list["socket_id"];
                        } else {
                            socket_id = user.socket_id;
                        }
                        if (users_list && user.alias && users_list["alias"] && users_list["alias"] == user.alias) {
                            alias = users_list["alias"];
                        } else {
                            alias = user.alias;
                        }
                        let opts = {
                            alias: alias, socket_id: socket_id
                        }
                        if (user.audio) {
                            opts["audio"] = user.audio;
                        }
                        if (user.video) {
                            opts["video"] = user.video;
                        }

                        // @ts-ignore
                        room.users_list.set(user.id, opts);

                        if (user.type == 0) {
                            // @ts-ignore
                            room.participant_users_list.set(user.id, opts);
                        } else {
                            // @ts-ignore
                            room.observer_users_list.set(user.id, opts);
                        }
                    } else { // delete
                        // @ts-ignore
                        room.users_list.delete(user.id);
                        if (user.type == 0) {
                            // @ts-ignore
                            room.participant_users_list.delete(user.id);
                        } else {
                            // @ts-ignore
                            room.observer_users_list.delete(user.id);
                        }
                    }
                }else if (user.socket_id) {
                    let users_list = null
                    if (user.type == 0) {
                        users_list = room.participant_users_list;
                    } else {
                        users_list = room.observer_users_list;
                    }
                    for (let [key, value] of users_list.entries()) {
                        if (value.socket_id == user.socket_id) {
                            let obj = room.users_list.get(key);
                            obj["audio"] = (user.hasOwnProperty("audio")?user.audio: obj["audio"]);
                            obj["video"] = (user.hasOwnProperty("video")?user.video: obj["video"]);
                            if (user.type == 0) {
                                // @ts-ignore
                                room.participant_users_list.set(key, obj);
                            } else {
                                // @ts-ignore
                                room.observer_users_list.set(key, obj);
                            }
                            // @ts-ignore
                            room.users_list.set(key, obj);
                            break;
                        }
                    }
                }

                room.save().then((r)=>{
                    resolve(r);
                }).catch(err => {
                    reject(err);
                });
            }else{
                reject({message : 'Error en informacion de usuario'})
            }

        }).catch( err => {
            reject(err)
        })
    })

}

roomSchema.statics.getRoomByRoomCode = function(this: mongoose.Model<IRoomDocument>, room_code:string){
    return new Promise((resolve, reject) => {
        this.findOne({room_code: room_code}).then((room) =>{

            resolve(room);
        }).catch( err => {
            reject(err)
        })
    });
}

roomSchema.statics.deleteRoom = function(this: mongoose.Model<IRoomDocument>, roomUUID:string,user:any){
    return new Promise((resolve, reject) => {
        this.findOne({uuid: roomUUID, user_creator_id:user}).then((room) =>{
            if(room){
                room.remove().then((r) => {
                    let result = [];
                    // @ts-ignore
                    for (let [key,value] of room.users_list) {
                        if(key !== user) {
                            result.push(value.socket_id);
                        }
                    }
                    resolve(result);
                    this.findById(r._id, (err,room) =>{
                        if(err){
                            reject(err);
                        }else{
                            if(!room){
                                resolve({
                                    success: true,
                                    list: result
                                })
                            }else{
                                reject({
                                    message: 'Error al eliminar la sala.'
                                })
                            }
                        }
                    })
                }).catch( err => {

                    reject(err);
                })
            }else{
                reject({
                    message: 'SALA NO ENCONTRADA CON LOS DATOS ENVIADOS.'
                })
            }

        }).catch( err => {
            reject(err)
        })
    })
}

roomSchema.statics.getRoomUsersList = function(this: mongoose.Model<IRoomDocument>, roomUUID:string,user:any) {
    return new Promise((resolve, reject) => {
        // console.log({ uuid: roomUUID, user_creator_id:user});
        this.findOne({ uuid: roomUUID, user_creator_id:user}).then((room) =>{
            if(room) {
                let result = [];
                // @ts-ignore
                for (let [key,value] of room.users_list) {
                    if( key !== user)
                        result.push(value.socket_id);
                }

                resolve(result);
            }else{
                reject({message: 'ERROR AL BUSCAR SALA CON LAS CREDENCIALES INGRESADAS.'})
            }
        }).catch( err => {
            reject(err)
        })
    });
}

roomSchema.statics.deleteAllRooms = function(this: mongoose.Model<IRoomDocument>){
    return new Promise((resolve, reject) => {
        // console.log({ uuid: roomUUID, user_creator_id:user});
        this.deleteMany({}).then(function(res){
            resolve(res)
        }).catch(function(err){
            reject(err)
        });
    });



}



export const Room = mongoose.model<IRoomDocument, IRoomModel>('Room',roomSchema,'rooms');
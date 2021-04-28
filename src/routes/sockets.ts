import * as express from 'express';
import { resolve } from 'node:path';
import * as path from 'path';
import {
    v4 as uuidV4, v4
} from 'uuid';

export class Routes {
    private app: express.Application;
    private rooms : any;
    constructor(app: express.Application) {
        this.app = app;
        this.rooms = [];
    }

    private home(): void {

        this.app.get('/', (request, response) => {
            const id = v4();
            if(!request.cookies.userId)
                response.cookie("userId",id,{ maxAge: 3600000 })

            response.render('pages/index')
        });

        this.app.post('/createRoom', (request, response) => {
            const id = v4();
            this.rooms.push({
                'count' : this.rooms.length + 1,
                'roomId' : id,
                'userCreatorId' : id,
                'users' : [
                    id
                ],
                'roomName' : request.body.txt_room
            })
            response.redirect('/room/'+id);
        });

        this.app.get('/room/:uuid', (request, response) => {
            const uuid = request.params.uuid;
            const userId = request.cookies.userId;
            if(!userId){
                console.log("error")
            }
            let name  = uuid;
            if(this.rooms){
                // console.log(uuid)
                let __room = this.rooms.find((room,index) => {
                    // console.log(room);
                    return room.roomId === uuid
                })
                if(__room){
                    name = __room.roomName || 'SALA #' + __room.count
                    __room.roomName = name;
                }else{
                    //TODO Manejo de error para el ingreso directo una sala x url sin que esta haya sido creada / registrada
                    console.log('ERROR')
                }
            }
            // console.log(this.rooms);

            response.render('pages/room', {uuid: uuid , name: name})
        });

    }

    public getRoutes(): void {
        this.home();
    }


}
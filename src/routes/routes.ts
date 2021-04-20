import * as express from 'express';
import * as path from 'path';
import {
    v4 as uuidV4, v4
} from 'uuid';

export class Routes {
    private app: express.Application;
    private rooms : any[];
    constructor(app: express.Application) {
        this.app = app;
        this.rooms = [];
    }

    private home(): void {
    
        this.app.get('/', (request, response) => {
            const id = v4();
            console.log(id)
            response.render('pages/index', {uuid: id})
        });
        
        this.app.post('/room', (request, response) => {            
            console.log(request.body)
            response.render('pages/room')
            
        });

        this.app.get('/room/:uuid', (request, response) => {            
            const uuid = request.params.uuid
            var room = 
            response.render('pages/room', {uuid: uuid})
        });

    
    }


    public getRoutes(): void {
        this.home();
        
    }

}
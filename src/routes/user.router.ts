
import {
    Router
} from 'express'
import {
    UserController
} from '../controllers/user';

import {
    auth
} from '../middleware/auth';
import passport from 'passport';
import {IUserDocument} from "../models/user.model";
import * as jwt from "jsonwebtoken";


let userController = new UserController();

export class UserRouter{
    public userRouter: Router;
    public userController: UserController = new UserController();
    constructor() {
        this.userRouter = Router();
        this.routes();
    }

    routes(){
        this.userRouter.post('/sign-up',this.createUser);
        this.userRouter.post('/login',this.userController.login)
        this.userRouter.route('/user').get( passport.authenticate('jwt',{session: false}),this.getUser)
    }
    private createUser = function (req,res,next){
        //TODO VALIDATION
        let u = req.body;
        u.is_temporary = false;
        if(req.cookies.token){
            let token = JSON.parse(req.cookies.token);
            let decoded = jwt.verify(token.access_token,process.env.SECRET);
            u.id = decoded['id'];
        }
        userController.addUser(u).then((user:IUserDocument) => {
            let token = JSON.stringify(user.generateJWT());
            res.cookie("token", token , {maxAge: 3600000, httpOnly: true})
            return res.status(200).json({
                token: user.generateJWT(),
                user: user.toAuthJSON()
            })
        }).catch( err => {
            if(err.hasOwnProperty('errors')){
                let errors =  err.errors;

                if( err.errors.hasOwnProperty('email')){
                    if( err.errors.email.message.search('user is already created') !== -1){
                        errors.email = {
                            message : 'your email is already registered'
                        }
                    }
                }
                if( err.errors.hasOwnProperty('username')){
                    if( err.errors.username.message.search('user is already created') !== -1){
                        errors.username = {
                            message : 'your username is already registered'
                        }
                    }
                }
                return res.status(400).json(errors)
            }
            return res.status(400).json({
                err: err
            })
        })
    }
    private getUser = function(req,res,next){
        // console.log(req.payload);
        userController.getUser(req.payload.id).then((user:IUserDocument) => {
            return res.status(200).json({
                user: user.toAuthJSON()
            }).catch( err => {
                return res.status(400).json({
                    err: err
                })
            })
        })
    }




}
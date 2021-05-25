
import { Request, Response, NextFunction } from "express";
// import * as passport from "passport";

import {User} from "../models/user.model";
import {v4} from "uuid";
const passport = require('passport');
import "../auth/passportHandler";
export class UserController{
    public login(req: Request, res: Response, next: NextFunction){

        if (!req.body.username) {
            return res.status(400).json({
                errors: {
                    username: "can't be blank."
                }
            })
        }
        if (!req.body.password) {
            return res.status(400).json({
                errors: {
                    password: "can't be blank."
                }
            });
        }

        passport.authenticate('local', {
            session: false
        }, function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (user) {
                var token = user.generateJWT();
                var user =  user.toAuthJSON();
                user["access_token"] = token.access_token;
                user["expires_in"] = token.exp;
                token = JSON.stringify(token);
                res.cookie("token", token, {maxAge: 86400000, httpOnly: true})
                return res.status(200).json({
                    user: user
                });
            } else {
                return res.status(400).json(info);
            }
        })(req, res, next)
    }

    public addUser(body){
        return new Promise((resolve, reject) => {
            User.addUser(body).then(user => {
                resolve(user);
            }).catch( err=>{
                reject(err);
            })
        })
    }

    public getUser(userID){
        return new Promise((resolve, reject) => {
            User.getUser(userID).then(user=>{
                resolve(user);
            }).catch( err =>{
                reject(err);
            })
        });
    }

    public addTemporalUser(){
        const id = v4();
        return new Promise((resolve, reject) => {
            User.addUser({
                username: id,
                firstname: 'temporal',
                lastname: 'user',
                email: id,
                password: id,
                is_temporary: true
            }).then((user) => {
                resolve(user);
            }).catch( err=>{
                reject(err);
            })
        })
    }



}
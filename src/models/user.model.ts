import * as mongoose from 'mongoose';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import mongooseUniqueValidator from "mongoose-unique-validator";
import {IUser} from "../interfaces/user";
import passportLocalMongoose from 'passport-local-mongoose';
import {validateAlphaNumeric, validateEmail, validateText} from "../helpers/helpers";
import {IRoomDocument, roomSchema} from "./room.model";


const iterations = 10000;
const keylen = 512;
const digest = 'sha512';
const secret = process.env.SECRET;

// mongoose.set('useCreateIndex',true);


export interface IUserDocument extends IUser,mongoose.Document{
    setPassword(password: any): void,
    validPassword(password: any): boolean,
    generateJWT(): JSON,
    toAuthJSON(): JSON
}
export interface IUserModel extends mongoose.Model<IUserDocument>{
    addUser(user): Promise<IUserDocument>,
    getUser(id): Promise<IUserDocument>,
    deleteAllUsers(): any
}


export const userSchema = new mongoose.Schema<IUserDocument>({
    firstname:{
        type: String,
        required: [true, "cannot be empty"],
    },lastname:{
        type: String,
        required: [true, "cannot be empty"],
    },
    username: {
        type: String,
        unique: [true,'Username is already created'],
        required: [true, "cannot be empty"],
        index: true
    },
    email: {
        type: String,
        unique: [true,'Email is already linked'],
        required: [true, "cannot be empty"],
        index: true,
    },
    is_temporary: {
      type: Boolean,
      default: true
    },
    salt: String,
    hash: String
}, {
    timestamps: true
});

// userSchema.plugin(passportLocalMongoose);
userSchema.plugin(mongooseUniqueValidator,{
    message: "user is already created"
});
// Usa la biblioteca Crypto para generar un hash y salt aleatorio segun la contraseña dada por el usuario
userSchema.methods.setPassword = function(password: any){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, iterations, keylen, digest)
        .toString('hex');
}
// Compara que el string provisto para compararlo con la contraseña actual
userSchema.methods.validPassword = function(password: any){
    var hash = crypto.pbkdf2Sync(password, this.salt,iterations,keylen,digest).toString('hex');
    return this.hash === hash
}
// Crea un JSON Web Token que expira en 1 dia de su creacion en el Frontend
userSchema.methods.generateJWT = function(){
    let today = new Date();
    let exp = new Date(today);
    exp.setDate(today.getDate()+1);
    return {
        expires_in: (exp.getTime()/1000),
        access_token:jwt.sign({
            id: this._id,
            username: this.username,
            is_temporary: this.is_temporary,
            expires_in: (exp.getTime()/1000)
        },secret)
    }

}
//
userSchema.methods.toAuthJSON = function(){
    return {
        username: this.username,
        email: this.email
    }
}
//
userSchema.statics.addUser = function (this: mongoose.Model<IUserDocument>,userData){
    return new Promise((resolve, reject) => {
        let errors = {};
        if(!userData.is_temporary) {
            let error_firstname = validateText(userData.firstname);
            let error_lastname = validateText(userData.lastname);
            let error_username = validateAlphaNumeric(userData.username, 8, 50);
            let error_password = validateAlphaNumeric(userData.password, 8, 250);
            if(!error_firstname || (userData.firstname && userData.firstname.length > 250 )){
                errors['firstname'] = {
                    message: 'Error. Invalid firstname.'
                };
            }
            if(!error_lastname || (userData.lastname && userData.lastname.length > 250)){
                errors['lastname'] = {
                    message: 'Error. Invalid lastname.'
                };
            }
            if(!error_username){
                errors['username'] = {
                    message: 'Error. Invalid username.'
                };
            }
            if(!error_password){
                errors['password'] = {
                    message: 'Error. Invalid password.'
                };
            }
            let error_email = validateEmail(userData.email);
            if(!error_email){
                errors['email'] = {
                    message: 'Error. Invalid email.'
                };
            }
        }
        if(Object.keys(errors).length){
            reject({
                errors: errors
            });
        }else {
            this.findById(userData.id).then((user) => {
                if (!user) {
                    user = new User();
                }
                user.firstname = userData.firstname;
                user.lastname = userData.lastname;
                user.username = userData.username;
                user.email = userData.email;
                user.is_temporary = userData.is_temporary;
                user.setPassword(userData.password);
                user.save().then(u => {
                    resolve(u);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        }
    });
}

userSchema.statics.getUser = function(this: mongoose.Model<IUserDocument>,userID){
    return new Promise((resolve, reject) => {
       (this.findById(userID,'username email').exec()).then((user)=>{
           resolve(user);
       }).catch(err=>{
           reject(err);
       })
    });
}


userSchema.statics.deleteAllUsers = function(this: mongoose.Model<IUserDocument>){
    return new Promise((resolve, reject) => {
        this.deleteMany({}).then(function(res){
            resolve(res)
        }).catch(function(err){
            reject(err)
        });
    });
}


export const User = mongoose.model<IUserDocument,IUserModel>('User',userSchema,'users');
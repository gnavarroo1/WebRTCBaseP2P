import passport from 'passport';
import {IUserDocument, User} from "../models/user.model";
import * as passportLocal from 'passport-local';
import * as passportJWT from 'passport-jwt';
import * as passportAnonymous from 'passport-anonymous';

const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJWT.Strategy;
const AnonymousStrategy = passportAnonymous.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

const secret = process.env.SECRET || 'secret';

passport.serializeUser(function(user:IUserDocument, done) {
    done(null, user._id);
});
passport.deserializeUser(function(id, done) {
    User.findById( id, function (err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, function (username, password, done) {

    User.findOne({
        username: username.toLowerCase()
    }).then(function (user: IUserDocument) {
        // console.log(user);
        if (!user || !user.validPassword(password)) {
            return done(undefined, false, {
                message: "usuario o contraseña invalida."
            })
        }
        return done(undefined, user);
    }).catch(done);

}));


passport.use( new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: secret
    }, (jwtToken,done)=>{
        // console.log(jwtToken);
        User.findOne({
            username: jwtToken.username
        },(user,err)=>{
            if(err){
                return done(err,false);
            }
            if(user){
                return done(undefined,user,jwtToken);
            }else{
                return done(undefined,false);
            }
        })
    }

))
passport.use(new AnonymousStrategy());


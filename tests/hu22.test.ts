import * as webdriver from 'selenium-webdriver';
import * as fs from 'fs';
import * as chrome from 'selenium-webdriver/chrome'

import {should} from "chai";
import {describe,before, after,afterEach, it } from 'mocha';
import {Room} from "../src/models/room.model";
import {User} from "../src/models/user.model";
import 'utility';
import * as edge from "selenium-webdriver/edge";
import mongoose from "mongoose";
should();

describe('HU22 - Como visitante de la plataforma web deseo poder registrarme usando mi nombre, correo electrónico, alias y una contraseña para poder hacer uso de las herramientas de la plataforma.', function(){
    let driver;
    this.timeout(60000);
    let By = webdriver.By,
        until = webdriver.until;
    let options;
    let url = 'http://localhost:5000';

    function setOptionsChrome(incognito = false){
        let options = new chrome.Options();
        options.addArguments("--disable-popup-blocking");
        options.addArguments("disable-extensions");
        options.addArguments("no-default-browser-check");
        options.addArguments("use-fake-ui-for-media-stream");
        options["prefs"] = {
            "hardware.audio_capture_enabled": true,
            "hardware.video_capture_enabled": true,
            "hardware.audio_capture_allowed_urls": ["localhost:5000"],
            "hardware.video_capture_allowed_urls": ["localhost:5000"]
        }
        options.excludeSwitches('enable-logging');
        if(incognito){
            options.addArguments("--incognito");
        }
        return options;
    }

    function setOptionsEdge(incognito = false){
        let edge_options = new edge.Options();
        edge_options.addArguments("--disable-popup-blocking");
        edge_options.addArguments("disable-extensions");
        edge_options.addArguments("no-default-browser-check");
        edge_options.addArguments("use-fake-device-for-media-stream");
        edge_options.addArguments("use-fake-ui-for-media-stream");
        edge_options.addArguments("--disable-features=EnableEphemeralFlashPermission")
        edge_options["prefs"] = {
            "hardware.audio_capture_enabled": true,
            "hardware.video_capture_enabled": true,
            "hardware.audio_capture_allowed_urls": ["localhost:5000"],
            "hardware.video_capture_allowed_urls": ["localhost:5000"]
        }
        if(incognito){
            options.addArguments("--incognito");
        }
        return edge_options;
    }

    before( async() =>{
        let mongoUrl = process.env.MONGO_DB_URI;
        // console.log(mongoUrl)
        await mongoose.connect(mongoUrl,{useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true}).then(
            () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
            console.log('CONECTADO A DB')

            },

        ).catch(err => {
            console.log(`MongoDB connection error. Please make sure MongoDB is running. ${err}`);
        });
        try {
            await mongoose.connection.db.dropCollection('rooms');
            await mongoose.connection.db.dropCollection('users');
        } catch (e) {
            console.log(e);
        }

        driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).forBrowser('chrome').setChromeOptions(setOptionsChrome()).build();
        driver.get('http://localhost:5000').then(()=>{
            driver.wait(until.elementLocated(By.name('txt_room')),8000,'Timed out',1000).then(async()=>{

            });
        });
    })
    afterEach(function (){
        let testCaseName: string = this.currentTest.title;
        let testCaseStatus: string = this.currentTest.state;
        if(testCaseStatus === 'failed'){
            console.log(`Test: ${testCaseName}, Status: Failed!`);
            driver.takeScreenshot().then((data) => {
                let screenshotPath = `TestResults/Screenshots/${testCaseName}.png`;
                console.log(`Saving Screenshot as: ${screenshotPath}`);
                fs.writeFileSync(screenshotPath, data, 'base64');
            })
        }else if (testCaseStatus === 'passed'){
            console.log(`Test: ${testCaseName}, Status: Passed!`);
        } else {
            console.log(`Test: ${testCaseName}, Status: Unknown!`);
        }

    })
    after(function(done){
        driver.quit().then(function(){
            done()
        });

    })

    describe("HU22- Escenario 1", () => {
        let error_message = "Error en la Creación de usuario.";
        let error_first_name= "T";
        let error_last_name = "L";
        let error_username = "user";
        let error_password = '12345678'
        let error_email= "a@b.c"
        before(async ()=> {
            driver.get('http://localhost:5000/sign-up').then(()=>{

            });
        })
        it('Deberia mostrar un mensaje de error', async function () {

        })
    });
    describe("HU22- Escenario 2", () => {
        let success_message = "let success_message = \"\";";
        before(()=> {

        })
        it('Deberia mostrar un mensaje de éxito', function () {


        })
    });

})

import * as webdriver from 'selenium-webdriver';
import * as fs from 'fs';
import * as chrome from 'selenium-webdriver/chrome'

import {should} from "chai";
import {describe,before, after,afterEach, it } from 'mocha';
import {Room} from "../src/models/room.model";
import {User} from "../src/models/user.model";
import 'utility';
import * as edge from "selenium-webdriver/edge";
should();

describe.skip('HU23 - Como usuario registrado de la plataforma web deseo una pantalla de inicio de sesión para poder ingresar con mi cuenta.', function(){
    let driver;
    this.timeout(60000);

    let By = webdriver.By,
        until = webdriver.until;
    let link = null;
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

    before( () =>{
        driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).forBrowser('chrome').setChromeOptions(setOptionsChrome()).build();
        driver.get('http://localhost:5000').then(()=>{
            return driver.wait(until.elementLocated(By.name('txt_room')),8000,'Timed out',1000).then(async()=>{
            });
        });
    })
    afterEach(function (){
        let testCaseName: string = this.currentTest.title;
        let testCaseStatus: string = this.currentTest.state;
        if(testCaseStatus === 'failed'){
            console.log(`Test: ${testCaseName}, Status: Failed!`);
            driver.takeScreenshot().then((data) => {
                let screenshotPath = `./TestResults/Screenshots/${testCaseName}.png`;
                console.log(`Saving Screenshot as: ${screenshotPath}`);
                fs.writeFileSync(screenshotPath, data, {encoding: 'base64'});
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

    describe("HU08- Escenario 1", () => {
        before(async ()=> {
        })
        it('Luego del ingreso el nuevo participante deberia poder recibir las transmisiones de los que ya estan en sala', async function () {

        })
    });
    describe("HU08- Escenario 2", () => {
        before(()=> {

        })
        it('Cuando un nuevo participante ingresa se deberia agregar una nueva area para la transmision de este en la pantalla de los que ya estan en sala', function () {


        })
    });

})

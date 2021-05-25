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

describe.skip('HU12 - Como usuario de la plataforma deseo poder elegir cuando activar o desactivar mi transmisión de audio o video para poder gestionar su uso.', function(){
    let driver1;
    this.timeout(60000);
    let driver2;
    let driver3;
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
        driver1 = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).forBrowser('chrome').setChromeOptions(setOptionsChrome()).build();
        driver2 =  new webdriver.Builder().forBrowser('MicrosoftEdge').withCapabilities(webdriver.Capabilities.edge()).setEdgeOptions(setOptionsEdge()).build();
        driver2.get(url);

        return driver1.get('http://localhost:5000').then(()=>{
            return driver1.wait(until.elementLocated(By.name('txt_room')),8000,'Timed out',1000).then(async()=>{
                await new Promise(resolve => setTimeout(resolve, 2000));
                let submit = await driver1.findElement(By.xpath("//button[@type='submit']"))
                submit.click();
                await new Promise(resolve => setTimeout(resolve, 5000));
                await driver1.wait(until.elementIsVisible(driver1.findElement(By.id('idSala'))), 10000).then(function(){
                    return driver1.getCurrentUrl().then(async (url1) => {
                        let button = await driver1.findElement(By.id("btnCompartir"));
                        button.click();
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        let element = await driver1.findElement(By.id('input_clipboard'));
                        let value = await element.getAttribute('value');
                        value.should.contains('/rooms/');
                        link = value;
                        console.log(link)
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        return driver1.findElements(By.xpath('//div/video')).then((elements) => {
                            let countVideoContainer = elements.length;
                            countVideoContainer.should.equal(1);
                        });
                    })
                })
            });
        });
    })
    afterEach(function (){
        let testCaseName: string = this.currentTest.title;
        let testCaseStatus: string = this.currentTest.state;
        if(testCaseStatus === 'failed'){
            console.log(`Test: ${testCaseName}, Status: Failed!`);
            driver1.takeScreenshot().then((data) => {
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
        driver1.quit().then(function(){
            driver2.quit();

            done();

        });

    })

    describe("HU08- Escenario 1", () => {
        before(async ()=> {
            link.should.contains('/rooms');
            driver2.get(link).then( async()=>{
                await new Promise(resolve => setTimeout(resolve, 8000));
            })

        })
        it('Luego del ingreso el nuevo participante deberia poder recibir las transmisiones de los que ya estan en sala', async function () {
            await new Promise(resolve => setTimeout(resolve, 8000));
            return driver2.getCurrentUrl().then( async (url1) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                let elements = await driver1.findElements(By.xpath('//div/video'));
                let countVideoContainer = elements.length;
                countVideoContainer.should.equal(2);
            });
        })
    });
    // describe("HU08- Escenario 2", () => {
    //     before(()=> {
    //
    //     })
    //     it('Cuando un nuevo participante ingresa se deberia agregar una nueva area para la transmision de este en la pantalla de los que ya estan en sala', function () {
    //
    //     })
    // });

})

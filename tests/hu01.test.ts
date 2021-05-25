import * as webdriver from 'selenium-webdriver';
import * as fs from 'fs';

import * as chrome from 'selenium-webdriver/chrome'
import {should} from "chai";
import {describe,before, after,afterEach, it,options } from 'mocha';
import 'utility';
should();
describe.skip('HU01- Como usuario deseo poder crear una sala  para poder sostener una conferencia con otros usuarios.', function(){
    let driver;
    this.timeout(60000);
    let By = webdriver.By,
        Key = webdriver.Key,
        until = webdriver.until;
    before( () =>{
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
        driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).forBrowser('chrome').setChromeOptions(options).build();
        driver.manage().window().maximize();

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
        driver.quit().then(function() {
            done();
        });
    })
    describe("HU1- Escenario 1", () => {
        before(()=> {
            driver.get('http://localhost:5000').then(()=>{
                driver.wait(until.elementLocated(By.name('txt_room')),10000,'Timed out',1000).then(async()=>{

                });
            });
        })
        it('HU01-Como usuario deseo poder crear una sala  para poder sostener una conferencia con otros usuarios', async function () {
            // let url: string = 'https://vast-basin-43067.herokuapp.com/';
            let url: string = 'http://localhost:5000';
            let expected_url: string = 'localhost:5000/rooms-admin/'

            await driver.manage().setTimeouts({implicit: 1000});
            return driver.wait(until.elementLocated(By.name('txt_room')), 2000, 'Timed out', 1000).then(async () => {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await driver.findElement(By.xpath("//button[@type='submit']")).click()
                    return driver.wait(until.elementIsVisible(await driver.findElement(By.id('idSala'))), 2000).then(async () => {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        return driver.getCurrentUrl().then( async (url1) => {
                            url1.should.not.equal(url);
                            url1.should.contains(expected_url);
                            let value = await driver.findElement(By.id('idSala')).getText()
                            value.should.contains("SALA");
                            // return ;
                        })
                    })
                })

        })
    });
    describe("HU1- Escenario 2", () => {
        before(()=> {
            driver.get('http://localhost:5000').then(()=>{
                driver.wait(until.elementLocated(By.name('txt_room')),10000,'Timed out',1000).then(async()=>{

                });
            });
        })
        it('HU01-Como usuario deseo poder crear una sala  para poder sostener una conferencia con otros usuarios', async function () {
            // let url: string = 'https://vast-basin-43067.herokuapp.com/';
            let url: string = 'http://localhost:5000';

            let expected_url: string = 'localhost:5000/rooms-admin/'
            let room_name = 'test 1';
            await driver.manage().setTimeouts({implicit: 10000});
            return driver.wait(until.elementLocated(By.name('txt_room')), 20000, 'Timed out', 1000).then(async () => {
                    let element = await driver.findElement(By.name('txt_room'));
                    await element.sendKeys(room_name);
                    let value = await element.getAttribute('value');
                    value.should.equal(room_name);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await driver.findElement(By.xpath("//button[@type='submit']")).click()
                    return driver.wait(until.elementIsVisible(await driver.findElement(By.id('idSala'))), 20000).then(async () => {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        return driver.getCurrentUrl().then( async (url1) => {
                            url1.should.not.equal(url);
                            url1.should.contains(expected_url);
                            let value = await driver.findElement(By.id('idSala')).getText()
                            value.should.equal(room_name);

                        })
                    })
                })

        })
    });

})

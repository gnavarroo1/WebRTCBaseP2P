import * as webdriver from 'selenium-webdriver';
import * as fs from 'fs';
import * as chrome from 'selenium-webdriver/chrome'
import * as edge from 'selenium-webdriver/edge'
import '@my-org/WebRTCBaseP2P/tests';
import {should} from "chai";
import {describe,before, after,afterEach, it } from 'mocha';
should();
describe.skip('HU06- Como creador de la sala deseo poder generar un enlace de invitación a la sala para que usuarios puedan conectarse a esta.', function(){
    let driver;
    let driver_edge;
    let url = "http://localhost:5000";
    let wrong_url = 'http://localhost:5000/rooms/fb16c329e5d82965e3bda3ff6486d64e056e4032813e1c6c8cb6cf';
    let right_url:string;
    let By = webdriver.By,
        until = webdriver.until;
    this.timeout(0);
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
        // driver.manage().window().maximize();

        driver.get(url).then(()=>{

            driver.wait(until.elementLocated(By.name('txt_room')),10000,'Timed out',1000).then(async()=>{
                await new Promise(resolve => setTimeout(resolve, 2000));
                await driver.findElement(By.xpath("//button[@type='submit']")).click()
                driver.wait(until.elementIsVisible(await driver.findElement(By.id('idSala'))), 5000).then(async () => {
                    driver.getCurrentUrl().then( async (url1) => {
                        // url1.should.not.equal(url);
                        // url1.should.contains('/rooms-admin/');
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    })
                })
                await new Promise(resolve => setTimeout(resolve, 8000));
            });
        });

    })
    afterEach(function (){
        let testCaseName: string = this.currentTest.title;
        let testCaseStatus: string = this.currentTest.state;
        if(testCaseStatus === 'failed'){
            console.log(`Test: ${testCaseName}, Status: Failed!`);
            driver.takeScreenshot().then((data) => {
                let screenshotPath = `../TestResults/Screenshots/${testCaseName}.png`;
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

    describe("HU6- Escenario 1", () => {

        before(()=> {

        })
        it('Deberia copiarse el codigo generado al clipboard/input_clipboard', async function () {
            await new Promise(resolve => setTimeout(resolve, 5000));
            let button = await driver.findElement(By.id("btnCompartir"));
            button.click();
            await new Promise(resolve => setTimeout(resolve, 5000));
            let element = await driver.findElement(By.id('input_clipboard'));
            let value =  await element.getAttribute('value');
            console.log("VALOR => "+ value);
            await new Promise(resolve => setTimeout(resolve, 5000));
            right_url = value;
            console.log("VALOR => "+ value);
            value.should.contains('/rooms/');
        })
    });
    describe("HU6- Escenario 3", () => {
        before(()=> {
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
            let edge_service = new edge.ServiceBuilder();
            driver_edge =  new webdriver.Builder().forBrowser('MicrosoftEdge').withCapabilities(webdriver.Capabilities.edge()).setEdgeOptions(edge_options).setEdgeService(edge_service).build();
            // console.log(url)
            driver_edge.get('http://localhost:5000').then( async() => {
                await new Promise(resolve => setTimeout(resolve, 5000));
            });
        })

        it('Deberia mostrarse la vista de error', function () {
            return driver_edge.get(wrong_url).then(() => {
                return driver_edge.wait(until.elementLocated(By.xpath('//*[@id="main"]/div/h3')),10000,'Timed out',1000).then(async () => {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    let element = await driver_edge.findElement(By.xpath('//*[@id="main"]/div/h3'));
                    let value = await element.getText();
                    value.should.contains("EL ENLACE INGRESADO NO ESTA LIGADO A UNA SALA.");
                    // done()
                }).catch((err)=>{
                    console.log(err);
                })
            })
        })
        after((done)=>{
            driver_edge.quit().then(function() {
                done();
            });
        })
    });

    describe("HU6- Escenario 4", () => {
        before(()=> {
            let edge_options = new edge.Options();
            edge_options.addArguments("--disable-popup-blocking");
            edge_options.addArguments("disable-extensions");
            edge_options.addArguments("no-default-browser-check");
            edge_options.addArguments("use-fake-ui-for-media-stream");
            edge_options["prefs"] = {
                "hardware.audio_capture_enabled": true,
                "hardware.video_capture_enabled": true,
                "hardware.audio_capture_allowed_urls": ["localhost:5000"],
                "hardware.video_capture_allowed_urls": ["localhost:5000"]
            }
            driver_edge = new webdriver.Builder().forBrowser('MicrosoftEdge').withCapabilities(webdriver.Capabilities.edge()).setEdgeOptions(edge_options).build();
            driver_edge.get('http://localhost:5000').then( async() => {
                await new Promise(resolve => setTimeout(resolve, 5000));
            });

        })
        it('Deberia mostrarse la vista de sala', function () {
            return driver_edge.get(right_url).then(() => {
                driver_edge.wait(until.elementLocated(By.xpath('//*[@id="main"]/div/h3')),10000,'Timed out',1000).then(async () => {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    let element = await driver_edge.findElement(By.xpath('//*[@id="main"]/div/h3'));
                    let value = await element.getText();
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    value.should.not.contains("EL ENLACE INGRESADO NO ESTA LIGADO A UNA SALA.");
                    driver.wait(until.elementIsVisible(await driver.findElement(By.id('idSala'))), 2000).then(async () => {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        return driver.getCurrentUrl().then( async (url1) => {
                            console.log(url1)
                            // url1.should.not.equal(url);
                        })
                    })
                }).catch((e)=>{
                    console.log(e);
                })
            })



        })
        after((done)=>{
            driver_edge.quit().then(function() {
                done();
            });
        })
    });


})
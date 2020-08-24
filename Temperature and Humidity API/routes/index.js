var express = require("express"),
    dhtSensor  = require('node-dht-sensor'),
    async = require("asyncawait/async"),
    await = require("asyncawait/await"),
    Sensor = require("../models/sensor"),
    Device = require("../models/device"),
    ip = require("ip"),
    localIP = ip.address(),
    http = require('http'),
    router = express.Router();

// router.get("/", (req, res) => {
//   console.log(typeof req.query.sensors);
//   let sensors = JSON.parse(req.query.sensors);
//     (async(() => { // Perform asynchronous calls to ensure we get each temp/humid reading before rendering the HTML page
//         let sensorData = []; // store each
//         sensors.forEach((mySensor) => { // for each sensor in the database, use the sensor type (DHT11 or DHT22) and GPIO pin to get the temp/humid reading
//             sensorData.push(await (readSensor(mySensor.sensor, mySensor.pin))); // push the temp/humid reading into an array that holds sensor data
//         });
//         res.write(JSON.stringify(sensorData));
//         res.status("200").end();
//     }))();
// });
// root route
// router.get("/", (req, res) => {
//     getDeviceConfig((device) => { // Get our sensors from our mongo database
//         console.log(device);
//         (async(() => { // Perform asynchronous calls to ensure we get each temp/humid reading before rendering the HTML page
//              let sensorData = []; // store each
//              device['gpio'].forEach((mySensor) => { // for each sensor in the database, use the sensor type (DHT11 or DHT22) and GPIO pin to get the temp/humid reading
//                 let mySensorData = await(readSensor(11, mySensor));
//                 mySensorData['_id'] = device['_id'];
//                 mySensorData['deviceName'] = device['deviceName'];
//                 sensorData.push(mySensorData); // push the temp/humid reading into an array that holds sensor data
//                 console.log(sensorData);
//              });
//              res.write(JSON.stringify(sensorData));
//              res.status("200").end();
//          }))();
//     });
// });


router.get("/",  async function(req, res) {
    let dhtVersion,
        sensorData,
        mySensorData = [], // store each
        dhtDevices   = await Device.find({
            local_ip: localIP, 
            "$or": [{ deviceType: "DHT11 Sensor"}, { deviceType: "DHT22 Sensor"}]
        });
    
    
    if(dhtDevices === undefined || dhtDevices === null){
        res.write("No Devices Found!");
        res.status(400).end();
    }else{
         try{
            dhtDevices.forEach(function(dhtDevice){
                console.log("dhtDevice: " + dhtDevice);
                dhtDevice['gpio'].map(function(gpio){
                    dhtVersion = dhtDevice['deviceType'] === "DHT11 Sensor" ? 11 : 22;
                    sensorData = dhtSensor.readSync(dhtVersion, gpio); // if you use await here, mySensorData is not sent and the response never $
                    
                    console.log(sensorData)
                    
                    sensorData['deviceName'] = dhtDevice['deviceName'];
                    sensorData['gpio'] = gpio;
                    sensorData['_id'] = dhtDevice['_id'];
                    
                    mySensorData.push(sensorData);
                });
            })
            res.write(JSON.stringify(mySensorData));
            res.status("200").end();
         }catch(err){
            console.error("Failed to read sensor data:", err);
            res.write(err.toString());
            res.status(400).end();
        }  
    }
});
                                                         
router.post("/device", async function(req, res){
    let new_device = req.body,
        final_new_device;
    if(new_device['gpio'] === undefined){
        throw new Error("Gpio is a required field");
    }else{
        // make sure the GPIO isn't already in use
        // ex: this rpi could have a DHT11 sensor set up already with GPIO #2,
        //     we cannot also have a DHT12 sensor that uses GPIO #2
        let dhtDevice = await Device.find({
            local_ip: localIP, 
            "$or": [{ deviceType: "DHT11 Sensor"}, { deviceType: "DHT22 Sensor"}], 
            gpio: new_device['gpio'] 
        });
        if(dhtDevice !== undefined){
            throw new Error("That GPIO is already in use by this raspberry pi");
        }
    }
    // local ip is probably not required, can be set in this function
    if(new_device['local_ip'] === undefined){
        
    }
    // port is probably not required, can be set in this function
    if(new_device['port'] === undefined){
        
    }
    if(new_device['deviceName'] === undefined){
        throw new Error("deviceName is a required field");
    }
    if(new_device['deviceType'] === undefined){
        throw new Error("Device type is a required field");
    }
    else{
        if(new_device['deviceType'] !== "DHT11 Sensor" || new_device['deviceType'] !== "DHT12 Sensor"){
            throw new Error("Device Type must be 'DHT11 Sensor' OR 'DHT12 Sensor'");
        }else{
            let dhtDevice = await Device.find({local_ip: localIP, deviceType: new_device['deviceType']});
            if(dhtDevice !== undefined){
                throw new Error("That device type is already in use by this raspberry pi");
            }
        }
    }
    
    let newDeviceResponse = await Device.create(new_device);
    // {
    //     _id,
    //     gpio,
    //     local_ip,
    //     port,
    //     deviceName,
    //     deviceType
    // }
});

router.patch("/device/:device_id", async function(req, res){
    let device_id = req.params.device_id;
    
    //     // {
    //     _id,
    //     gpio,
    //     local_ip,
    //     port,
    //     deviceName,
    //     deviceType
    // }
});
router.get("/gpio/:gpio", async function(req, res){
    let dhtVersion,
        sensorData,
        gpio        = Number(req.params.gpio),
        dhtDevice   = await Device.find({
            local_ip: localIP, 
            "$or": [{ deviceType: "DHT11 Sensor"}, { deviceType: "DHT22 Sensor"}], 
            gpio: gpio 
        });
    
    
    if(dhtDevice === undefined || dhtDevice === null){
        res.write("No Devices Found!");
        res.status(400).end();
    }else{
        console.log("dht1=Devices: " + dhtDevice);
         try{
            dhtVersion = dhtDevice['deviceType'] === "DHT11 Sensor" ? 11 : 22,
            // for some reason, this wont get a valid reading without using await
            // while using await in the / root route can cause the request to 
            // timeout during the sensor reading that's within the for loop
            sensorData = await dhtSensor.readSync(dhtVersion, gpio);
            
            console.log(dhtVersion);
            console.log(sensorData);
                    
            sensorData['deviceName'] = dhtDevice['deviceName'];
            sensorData['gpio'] = gpio;
            sensorData['_id'] = dhtDevice['_id'];
            
            res.write(JSON.stringify(sensorData));
            res.status("200").end();
         }catch(err){
            console.error("Failed to read sensor data:", err);
            res.write(err.toString());
            res.status(400).end();
        }  
    }
});
router.get("/schedule", async function(req, res){
    
});
router.post("/schedule", async function(req, res){
    
});
router.put("/schedule", async function(req, res){
    
});
router.get("/schedule/:schedule_id", async function(req, res){
    
});
router.patch("/schedule/:schedule_id", async function(req, res){
    
});
router.put("/schedule/:schedule_id", async function(req, res){
    
});
function readSensor(sensor, pin) {
    return new Promise(resolve => {
        dhtSensor.read(sensor, pin, (err, temperature, humidity) => {
            if (!err) {
                var context = {};
                console.log("pin ", pin, "temp: ", temperature.toFixed(1), " humidity: ", humidity.toFixed(1));
                context.pin = pin;
                context.temperature = temperature.toFixed(1);
                context.humidity = humidity.toFixed(1);
                resolve(context);
            }
        });
    });
}

function getDeviceConfig(_callback) {
    Device.findOne({local_ip: localIP, deviceType: 'DHT11 Sensor'}, (err, device) => {
        if (err) console.log(err);
        else {
            _callback(device);
        }
    });
}
module.exports = router;

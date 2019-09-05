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
router.get("/", (req, res) => {
    getDeviceConfig((device) => { // Get our sensors from our mongo database
        console.log(device);
        (async(() => { // Perform asynchronous calls to ensure we get each temp/humid reading before rendering the HTML page
             let sensorData = []; // store each
             device['gpio'].forEach((mySensor) => { // for each sensor in the database, use the sensor type (DHT11 or DHT22) and GPIO pin to get the temp/humid reading
                let mySensorData = await(readSensor(11, mySensor));
                mySensorData['_id'] = device['_id'];
                mySensorData['deviceName'] = device['deviceName'];
                sensorData.push(sensorData); // push the temp/humid reading into an array that holds sensor data
                console.log(sensorData);
             });
             res.write(JSON.stringify(sensorData));
             res.status("200").end();
         }))();
    });
});
// router.get("/:id", (req, res) => {
//     // idea,
//     getSensors((sensors) => { // Get our sensors from our mongo database
//         (async(() => { // Perform asynchronous calls to ensure we get each temp/humid reading before rendering the HTML page
//             let sensorData = []; // store each
//             sensors.forEach((mySensor) => { // for each sensor in the database, use the sensor type (DHT11 or DHT22) and GPIO pin to get the temp/humid reading
//                 sensorData.push(await (readSensor(mySensor.sensor, mySensor.pin))); // push the temp/humid reading into an array that holds sensor data
//             });
//             res.write(JSON.stringify(sensorData));
//             res.status("200").end();
//         }))();
//     });
// });
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

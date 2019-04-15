var express    = require("express"),
    dhtSensor  = require('node-dht-sensor'),
    async      = require("asyncawait/async"),
    await      = require("asyncawait/await"),
    Sensor     = require("../models/sensor"),
    router     = express.Router();


// root route
router.get("/", (req, res) =>{
    getSensors((sensors) => { // Get our sensors from our mongo database
        (async (() => { // Perform asynchronous calls to ensure we get each temp/humid reading before rendering the HTML page
            let sensorData = []; // store each
            sensors.forEach((mySensor) => { // for each sensor in the database, use the sensor type (DHT11 or DHT22) and GPIO pin to get the temp/humid reading
                sensorData.push(await (readSensor(mySensor.sensor, mySensor.pin))); // push the temp/humid reading into an array that holds sensor data
            });
            console.log("In root route with: ", sensors);
            res.render("index", {sensors: sensorData, scripts: ["/static/js/drawGauges.js"]}); 
        }))();
    });
});

function readSensor(sensor, pin){
    return new Promise(resolve => {
        dhtSensor.read(sensor, pin, (err, temperature, humidity) => {
            if(!err){
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
function getSensors(_callback){
    Sensor.find({}, (err, sensors) => {
        if(err) console.log(err);
        else{
            _callback(sensors);
        }
    });
}
module.exports = router;
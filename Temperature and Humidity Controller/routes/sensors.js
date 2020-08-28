var express    = require("express"),
    // dhtSensor  = require('node-dht-sensor'),
    async      = require("asyncawait/async"),
    await      = require("asyncawait/await"),
    Sensor     = require("../models/sensor"),
    router     = express.Router();

router.get("/", (req, res) =>{
    
    getSensors((sensors) => {
        res.render("sensor/index", {
            sensors: sensors, 
            stylesheets: ["/static/css/sensors.css"]
        });
    });
});
router.post("/", (req, res) => {
    Sensor.create({ sensor: req.body.model, pin: req.body.pin}, (err, sensor) =>{
        if(err) console.log(err);
        else{
            console.log(sensor, " created");
            sensor.save();
            getSensors((sensors) =>{
                res.render("sensor/index", {sensors: sensors});
            });
        }
    });
});
//EDIT
router.get("/:sensor_id/edit", (req, res) => {
    Sensor.findById(req.params.sensor_id, (err, foundSensor) =>{
        if(err) res.redirect("back");
        else{
            console.log(foundSensor);
            res.render("sensor/edit", {sensor: foundSensor});
        }
    });
});
// UPDATE
router.put("/:sensor_id", (req, res) => {
    let newData = { sensor: req.body.model, pin: req.body.pin};
    Sensor.findByIdAndUpdate(req.params.sensor_id, {$set: newData}, (err, sensor) => {
        if(err){
            res.redirect("back");
        } else {
            console.log("Successfully Updated!");
            res.redirect("/sensors");
}
    });
})
router.delete("/:sensor_id", (req, res) => {
    Sensor.findByIdAndRemove(req.params.sensor_id, (err) => {
        if(err) res.redirect("back");
        else{
            getSensors((sensors) => {
                res.render("sensor/index", {sensors: sensors});
            });
        }
    });
});
function getSensors(_callback){
    Sensor.find({}, (err, sensor) => {
        if(err) console.log(err);
        else{
            _callback(sensor);
        }
    });
}
module.exports = router;
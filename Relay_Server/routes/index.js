//const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
//var schedule      = require('node-schedule');
//var Scheduler     = require("../models/scheduler");
// Living room lights use 'out' with an initial state of 0, otherwise, set to 'high' with an initial state of 1
const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO

var express = require("express"),
    schedule = require('node-schedule'),
    Devices = require("../models/device"),
    outletHelper   = require("./outletHelper.js"),
    scheduleHelper = require("./scheduleHelper.js"),
    ip = require("ip"),
    localIP = ip.address(),
    router    = express.Router();
var APPROVED_GPIO = [2, 3];
var schedules = [];
var outlets = [];
process.on('SIGINT', () => {
    outHelper.releaseGpioMem();
})
outletHelper.getOutlets();
scheduleHelper.getSchedules(outletHelper.activateRelay, outletHelper);
// try{
//     outlets = outletHelper();
// }catch(err){
//     console.log(err);
// }

router.get('/device', function(req, res) {
    Devices.find({local_ip: localIP, deviceType: "Relay Server"}, (err, myDevice) => {
        if(err){
            console.log(err);
        }else{
            
        }
    });
});
router.post('/device', function(req, res) {
    Devices.find({local_ip: localIP, deviceType: "Relay Server"}, (err, myDevice) => {
        if(err){
            console.log(err);
        }else{
            
        }
    });
});
router.get('/device/:device_id', function(req, res) {
    Devices.findById(req.param.device_id, (err, myDevice) => {
        if(err){
            console.log(err);
        }else{
            
        }
    });
});
router.patch('/device/:device_id', function(req, res) {
    
    Devices.findByIdAndUpdate(req.param.device_id, {$set: updatedGpios}, (err, myDevice) => {
        if(err){
            console.log(err);
        }else{
            outlets.forEach(function(outlet) {
                
            });
        }
    });
});
router.delete('/device/:device_id', function(req, res) {
    Devices.findByIdAndDelete(req.param.device_id, (err, myDevice) => {
        if(err){
            console.log(err);
        }else{
            
        }
    });
});
// returns all schedules
router.get('/schedule', function(req, res) {
    Scheduler.find({}, (err, schedules) => {
        if(err){
            console.log(err);
            res.status(400).end();
        }
        else{
            console.log(schedules);
            res.write(JSON.stringify(schedules));
            res.status(200).end();
        }
        
    });
});
// add a new chedule
router.post('/schedule', function(req, res){
    console.log(req.body);
    var newSchedule = { 
        local_ip: req.body.local_ip, 
        gpio: req.body.gpio,
        // second: req.body.second,
        minute: req.body.minute,
        hour: req.body.hour,
        // date: req.body.date,
        // month: req.body.month,
        // year: req.body.year,
        // dayOfWeek: req.body.dayOfWeek
    };
    try{
        scheduleHelper.createSchedule(newSchedule, outletHelper.activateRelay, outletHelper);
        console.log("Schedule successfully created!\n");
        res.status(200).end();
    }catch(err){
        console.log(err);
        res.status(400).end();
    }
});
router.get('/schedule/:schedule_id', function(req, res) {
    Scheduler.findById(req.params.schedule_id, (err, foundSchedule) =>{
        if(err) {
            res.redirect("back");
        }
        else{
            console.log(foundSchedule);
            res.write(JSON.stringify(foundSchedule));
            res.status(200).end();
        }
    }); 
});
// edit an existing schedule
router.put('/schedule/:schedule_id', function(req, res){
    console.log("in put route with ", '\n');
    var schedule_id = req.params.schedule_id;
    var newSchedule = { 
        minute: req.body.minute,
        hour: req.body.hour,
    };
    try{
        scheduleHelper.editSchedule(schedule_id, newSchedule);
        console.log("Successfully Updated!");
        res.status(200).end();
    }catch(err){
        res.status(400).end();
    }
});
// delete an existing schedule
router.delete('/schedule/:schedule_id', function(req, res){
    var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    console.log(schedules.length);
    try{
        scheduleHelper.deleteSchedule(schedule_id);
        console.log("Successfully Deleted!");
        res.status(200).end();
    }catch(err){
        console.log("Error caught!\n");
        console.log(err);
        res.status(400).end();
    }
});
router.get('/status/:id', function(req, res){
    console.log("in /status/:id route\n");
    var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
    if(Number.isNaN(gpio_input)){
        res.status(400).end();
    }else{
        console.log("is a valid number!\n");
        let status = outletHelper.getStatus(gpio_input);
        res.write(JSON.stringify(status));
        res.status(200).end();
    }
    // validateInput(gpio_input, res, outletHelper.getStatus, outletHelper);
});
router.get('/activate/:id', function(req, res){
    console.log("in /:id route\n");
    var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
    if(Number.isNaN(gpio_input)){
        res.status(400).end();
    }else{
        console.log("is a valid number!\n");
        outletHelper.activateRelay(gpio_input);
        res.status(200).end();
    }
});
module.exports = router;

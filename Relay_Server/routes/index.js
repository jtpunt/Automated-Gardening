//const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
//var schedule      = require('node-schedule');
//var Scheduler     = require("../models/scheduler");
// Living room lights use 'out' with an initial state of 0, otherwise, set to 'high' with an initial state of 1
const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO

var express = require("express"),
    schedule = require('node-schedule'),
    Devices = require("../models/device"),
    scheduleHelper = require("./scheduleHelper.js"),
    outletHelper   = require("./outletHelper.js"),
    ip = require("ip"),
    localIP = ip.address(),
    router    = express.Router();
const APPROVED_GPIO = [2,3]; // gpios that the system is set up to handle
var schedules = [];
var outlets = [];
process.on('SIGINT', () => {
    outlets.forEach(function(outlet){
       outlet['outlet'].unexport();
    });
})
outletHelper.getOutlets();
scheduleHelper.getSchedules(outletHelper.activateRelay.call(outletHelper));
// Devices.find({local_ip: localIP, deviceType: "Relay Server"}, (err, myDevice) => {
//     if(err)
//         console.log(err);
//     else{
//         if(myDevice.length > 0){
//             console.log("Test: ", myDevice);
//             myDevice[0]['gpio'].forEach(function(myGpio){
//                 var myOutlet = new Gpio(myGpio, 'high');
//                 var initialState = myOutlet.readSync();
//                 console.log("Initial State:", initialState);
//                 outlets.push({gpio: myGpio, initialState: initialState, outlet: myOutlet});
//             });
//             console.log(outlets);
//         }
//     }
// });
// function activateRelay(gpio_input) { //function to start blinkingp
//     console.log(gpio_input);
//     console.log(outlets);
//     outlets.forEach(function(outlet){
//         console.log(outlet);
//         if(outlet["gpio"] === gpio_input){
//             console.log("outlet found!\n");
//             if (outlet['outlet'].readSync() === 0) { //check the pin state, if the state is 0 (or off)
//                 outlet['outlet'].writeSync(1); //set pin state to 1 (turn LED on)
//             } else {
//                 outlet['outlet'].writeSync(0); //set pin state to 0 (turn LED off)
//             }
//         }
//     });
// }
// function getStatus(gpio_input, res){
//     outlets.forEach(function(outlet){
//         if(outlet["gpio"] === gpio_input){
//             var curState = outlet['outlet'].readSync();
//             if(outlet['initialState'] === 1){ // seems like 1 is equal to on, but it is opposite and means 1 is off
//                 curState ^= 1;
//                 res.write(JSON.stringify(curState));
//             }else{ // 1 means on, 0 means off here
//                 res.write(JSON.stringify(curState));
//             }
//         }
//     });
// }
function validateInput(gpio_input, res, fn){
    if(Number.isNaN(gpio_input)){ // make sure a number was passed in
        console.log("Not a number!\n");
        // throw "Not a number"
    }else if(APPROVED_GPIO.includes(gpio_input)){ // was 2 or 3 passed in?
        fn(gpio_input, res);
        res.status(200).end();
    }else{
        console.log("in else\n");
        res.status(400).end();
    }
}
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
        scheduleHelper.createSchedule(newSchedule, outletHelper.activateRelay.call(outletHelper));
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
    validateInput(gpio_input, res, outletHelper.getStatus);
});
router.get('/activate/:id', function(req, res){
    console.log("in /:id route\n");
    var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
    validateInput(gpio_input, res, outletHelper.activateRelay);
});
module.exports = router;

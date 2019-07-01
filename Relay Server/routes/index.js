//const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
//var schedule      = require('node-schedule');
//var Scheduler     = require("../models/scheduler");
// Living room lights use 'out' with an initial state of 0, otherwise, set to 'high' with an initial state of 1
const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO

var express = require("express"),
    schedule = require('node-schedule'),
    Devices = require("../models/device"),
    Scheduler = require("../models/scheduler"),
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
var scheduleObj = {
    scheduleArr: [],
    getSchedules: function(){
        Scheduler.find({local_ip: localIP}, function(err, mySchedules){
            if(err)
                console.log(err);
            else{
                console.log(mySchedules);
                mySchedules.forEach(function(mySchedule){
                    var newSchedule = {
                        // commented out second below because it would cause the relay to be activated every other second
                        // second: mySchedule['second'],
                        minute: mySchedule['minute'],
                        hour: mySchedule['hour'],
                        // date: mySchedule['date'],
                        // month: mySchedule['month'],
                        // year: mySchedule['year'],
                        // dayOfWeek: mySchedule['dayOfWeek']
                    };
                    // var node_schedule      = require('node-schedule');
                    var j = schedule.scheduleJob(newSchedule, function(){
                        console.log('Schedule created!');
                        activateRelay(mySchedule['gpio']);
                    });
                    console.log(j);
                    var obj = {"_id": mySchedule._id, j};
                    this.setSchedule
                    this.schedules.push(obj);
                }.bind(this));
                console.log(schedules);
            }
        });
    },
    setSchedule: function(newScheduleObj){
        this.scheduleArr.push(newScheduleObj);
    }
}
Scheduler.find({local_ip: localIP}, (err, mySchedules) => {
    if(err)
        console.log(err);
    else{
        console.log(mySchedules);
        mySchedules.forEach(function(mySchedule){
            var newSchedule = {
                // commented out second below because it would cause the relay to be activated every other second
                // second: mySchedule['second'],
                minute: mySchedule['minute'],
                hour: mySchedule['hour'],
                // date: mySchedule['date'],
                // month: mySchedule['month'],
                // year: mySchedule['year'],
                // dayOfWeek: mySchedule['dayOfWeek']
            };
            // var node_schedule      = require('node-schedule');
            var j = schedule.scheduleJob(newSchedule, function(){
                console.log('Schedule created!');
                activateRelay(mySchedule['gpio']);
            });
            console.log(j);
            var obj = {"_id": mySchedule._id, j};
            schedules.push(obj);
        });
        console.log(schedules);
    }
});
Devices.find({local_ip: localIP, deviceType: "Relay Server"}, (err, myDevice) => {
    if(err)
        console.log(err);
    else{
        console.log("Test: ", myDevice);
        myDevice[0]['gpio'].forEach(function(myGpio){
            const myOutlet = new Gpio(myGpio);
            outlets.push({gpio: myGpio, outlet: myOutlet});
        });
        console.log(outlets);
    }
});
function activateRelay(gpio_input) { //function to start blinkingp
    outlets.forEach(function(outlet){
        if(outlet["gpio"] === gpio_input){
            console.log("outlet found!\n");
            if (outlet['outlet'].readSync() === 0) { //check the pin state, if the state is 0 (or off)
                outlet['outlet'].writeSync(1); //set pin state to 1 (turn LED on)
            } else {
                outlet['outlet'].writeSync(0); //set pin state to 0 (turn LED off)
            }
        }
    });
}
function getStatus(gpio_input, res){
    outlets.forEach(function(outlet){
        if(outlet["gpio"] === gpio_input){
            res.write(JSON.stringify(outlet['outlet'].readSync()));
        }
    });
}
function validateInput(gpio_input, res, fn){
    if(Number.isNaN(gpio_input)){ // make sure a number was passed in
        console.log("not a number!\n");
    }else if(APPROVED_GPIO.includes(gpio_input)){ // was 2 or 3 passed in?
        fn(gpio_input, res);
        res.status(200).end();
    }else{
        console.log("in else\n");
        res.status(400).end();
    }
}
    // returns all schedules
router.get('/schedule', function(req, res) {
    Scheduler.find({}, (err, schedules) => {
        if(err)
            console.log(err);
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
    Scheduler.create(newSchedule, (err, schedule) =>{
        if(err) console.log(err);
        else{
            console.log(schedule, " created");
            schedule.save();
            var mySchedule = {
                // second: newSchedule['second'],
                minute: newSchedule['minute'],
                hour: newSchedule['hour'],
                // date: newSchedule['date'],
                // month: newSchedule['month'],
                // year: newSchedule['year'],
                // dayOfWeek: newSchedule['dayOfWeek']
            };
            console.log(mySchedule);
            console.log(schedule._id);
            var node_schedule      = require('node-schedule');
            var j = node_schedule.scheduleJob(mySchedule, function(){
                console.log('Schedule created!');
                activateRelay(newSchedule['gpio']);
            });
            var db_id = schedule._id;
            var obj = {"_id": schedule._id, j};
            schedules.push(obj);
            console.log(schedules);
        }
    });
});
router.get('/schedule/:schedule_id', function(req, res) {
    Scheduler.findById(req.params.schedule_id, (err, foundSchedule) =>{
        if(err) res.redirect("back");
        else{
            console.log(foundSchedule);
            res.write(JSON.stringify(foundSchedule));
        }
    }); 
});
// edit an existing schedule
router.put('/schedule/:schedule_id', function(req, res){
    console.log("in put route with ", '\n');
    var schedule_id = req.params.schedule_id;
    let newSchedule = { 
        // local_ip: req.body.local_ip, 
        // gpio: req.body.gpio,
        // second: req.body.second,
        minute: req.body.minute,
        hour: req.body.hour,
        // date: req.body.date,
        // month: req.body.month,
        // year: req.body.year,
        // dayOfWeek: req.body.dayOfWeek
    };
    Scheduler.findByIdAndUpdate(req.params.schedule_id, {$set: newSchedule}, (err, schedule) => {
        if(err){
            console.log(err);
        } else {
            schedules.forEach(function(mySchedule, i){
                console.log(typeof mySchedule._id);
                if(mySchedule._id == schedule_id){
                    console.log("Match found at index, ", i);
                    console.log(mySchedule._id);
                    mySchedule.j.cancel();
                    console.log("Schedule canceled and removed!\n");
                    mySchedule.j.reschedule(newSchedule);
                }
            });
            console.log("Successfully Updated!");
            console.log(schedule);
        }
    });
});
// delete an existing schedule
router.delete('/schedule/:schedule_id', function(req, res){
    var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    console.log(schedules.length);
    Scheduler.findByIdAndRemove(req.params.schedule_id, (err) => {
        if(err)
            console.log(err);
        else{
            schedules.forEach(function(mySchedule, i){
                console.log(typeof mySchedule._id);
                if(mySchedule._id == schedule_id){
                    console.log("Match found at index, ", i);
                    console.log(mySchedule._id);
                    mySchedule.j.cancel();
                    console.log("Schedule canceled and removed!\n");
                    schedules.splice(i, 1);
                }
            });
            console.log(schedules.length);
        }
        console.log("Success!");
    });
});
router.get('/status/:id', function(req, res){
    console.log("in /status/:id route\n");
    var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
    validateInput(gpio_input, res, getStatus);
});
router.get('/activate/:id', function(req, res){
    console.log("in /:id route\n");
    var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
    validateInput(gpio_input, res, activateRelay);
});
module.exports = router;

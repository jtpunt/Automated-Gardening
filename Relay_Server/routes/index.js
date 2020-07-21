//const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
//var schedule      = require('node-schedule');
//var Scheduler     = require("../models/scheduler");
// Living room lights use 'out' with an initial state of 0, otherwise, set to 'high' with an initial state of 1

var express = require("express"),
    schedule = require('node-schedule'),
    Device = require("../models/device"),
    outletController   = require("../controller/outletController.js"),
    scheduleController = require("../controller/scheduleController.js"),
    ip = require("ip"),
    localIP = ip.address(),
    router    = express.Router();
var APPROVED_GPIO = [2, 3];

process.on('SIGINT', () => {
    outletController.releaseGpioMem();
})
try{
    outletController.getOutletSetup();
}catch(err){
    console.log(err);
}
scheduleController.getSchedules(outletController.activateRelay, outletController);

router.get('/device', function(req, res) {
    Device.find({local_ip: localIP, deviceType: "Relay Server"}, (err, myDevice) => {
        if(err){
            console.log(err);
        }else{
            
        }
    });
});
router.post('/device', function(req, res) {
    Device.find({local_ip: localIP, deviceType: "Relay Server"}, (err, myDevice) => {
        if(err){
            console.log(err);
        }else{
            
        }
    });
});
router.get('/device/:device_id', function(req, res) {
    Device.findById(req.param.device_id, (err, myDevice) => {
        if(err){
            console.log(err);
        }else{
            
        }
    });
});
router.patch('/device/:device_id', function(req, res) {
    var newSchedule = { 
        local_ip: req.body.local_ip, 
        gpio: req.body.gpio,
        minute: req.body.minute,
        hour: req.body.hour,
    };
    Device.findByIdAndUpdate(req.param.device_id, {$set: updatedGpios}, (err, myDevice) => {
        if(err){
            console.log(err);
        }else{
            outlets.forEach(function(outlet) {
                
            });
        }
    });
});
router.delete('/device/:device_id', function(req, res) {
    Device.findByIdAndDelete(req.param.device_id, (err, myDevice) => {
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
router.post('/schedule', async function(req, res){
    var newSchedule = req.body;
    try{
        console.log("newSchedule: ", newSchedule);
        // validate newSchedule['device']['gpio'] is a gpio that is currently being used in the system

        if(outletController.findOutlet(Number(newSchedule['device']['gpio'])) === -1){
            throw new Error("Invalid GPIO input");
        }else{
            // you can set a schedule with a start and end time
            if(newSchedule['schedule']['start_time'] !== undefined && newSchedule['schedule']['end_time'] !== undefined){
                
                let device_start = { // we need to rewrite our device values for our start schedule
                    ... newSchedule['device'], // take every key: value stored in the 'device' key
                    desired_state: true // overwrite what we receieved for desired state in the 'device' key to be 'on'
                    
                }
                let device_end = { // // we need to rewrite our device values for our end schedule
                    ... newSchedule['device'],
                    desired_state: false // overwrite what we receieved for desired state in the 'device' key to be 'off'
                }
                let start_time = {
                    ... newSchedule['schedule'],
                    ... newSchedule['schedule']['start_time'] 
                    
                    
                },end_time   = {
                    ... newSchedule['schedule'],
                    ... newSchedule['schedule']['end_time'] },
                    start_schedule = {
                        ... newSchedule,
                        schedule: start_time,
                        device: device_start
                        
                    },
                    end_schedule   = {
                        ... newSchedule, 
                        schedule: end_time,
                        device: device_end
                    };
                let start_time_timestamp = new Date(),
                    end_time_timestamp = new Date();
                
                start_time_timestamp.setHours(start_time['hour'], start_time['minute'], start_time['second']); 
                end_time_timestamp.setHours(end_time['hour'], end_time['minute'], end_time['second']); 
                
                if(start_time_timestamp > end_time_timestamp){
                    let errMsg = "start_time must be less than end_time";
                    console.log(errMsg);
                    throw new Error(errMsg)
                }else if(start_time_timestamp === end_time_timestamp){
                    let errMsg = "start_time must not be equal to the end_time";
                    console.log(errMsg);
                    throw new Error(errMsg)
                }else{
                    // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                    console.log("start_schedule: " + start_schedule['device']['desired_state']);
                    console.log("end_schedule: " + end_schedule['device']['desired_state']);
                    scheduleController.isScheduleConflicting(end_schedule);
                    scheduleController.isScheduleConflicting(start_schedule);
                    scheduleController.isScheduleOverlapping(start_schedule, end_schedule);
                    // create the off schedule and grab the id
                    let nextScheduleId = await scheduleController.createSchedule(end_schedule, outletController.activateRelay, outletController);
                    start_schedule['schedule']['nextScheduleId'] = nextScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'
                
                    // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                    let prevScheduleId = await scheduleController.createSchedule(start_schedule, outletController.activateRelay, outletController);
                    
                    
                    end_schedule['schedule']['prevScheduleId'] = prevScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'

                    scheduleController.editSchedule(nextScheduleId, end_schedule, outletController.activateRelay, outletController);    
                    console.log("Done adding schedule set");
                }

            }else if(newSchedule['schedule']['end_time'] !== undefined){ // you can set a schedule with only an end time
            // example usage: we want to make sure the lights are off by 2am
                console.log("in else with start_time");
                let start_time = newSchedule['schedule']['start_time'],
                    start_schedule = newSchedule;
                
                start_schedule['schedule'] = start_time;
                scheduleController.isScheduleConflicting(start_schedule);
                let value = await scheduleController.createSchedule(start_schedule, outletController.activateRelay, outletController);
                console.log(`value returned: ${value}`);
                //value.then((value) => console.log(value));
                console.log("Schedule successfully created!\n");
            }else {
                console.log("in else... no start_time or end_times in object");
            }
            res.status(200).end();
        }
    }catch(err){
        console.log(`err: ${err}`);
        //res.write(err.toString());
        res.status(404).send(err.toString());
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
    console.log("in put route with ", req.body);
    var schedule_id = req.params.schedule_id;
    var newSchedule = req.body;
    try{
        // validate newSchedule['device']['gpio'] is a gpio that is currently being used in the system
        if(outletController.findOutlet(Number(newSchedule['device']['gpio'])) === -1){
            throw new Error("Invalid GPIO input");
        }else{
            let prevScheduleId = newSchedule['schedule']['prevScheduleId'],
                nextScheduleId = newSchedule['schedule']['nextScheduleId'],
                my_time = newSchedule['schedule']['start_time'] || newSchedule['schedule']['end_time'],
                my_schedule = {... newSchedule };
            
      
            my_schedule['schedule'] = my_time;
                
            if(prevScheduleId !== undefined){
                my_schedule['schedule']['prevScheduleId'] = prevScheduleId;
                console.log("My schedule if: " + my_schedule);
            }else if(nextScheduleId !== undefined){
                my_schedule['schedule']['nextScheduleId'] = nextScheduleId;
                console.log("My schedule else if: " + my_schedule);
            }else {

                
                console.log("My schedule else:" + my_schedule);
            } 
            scheduleController.editSchedule(schedule_id, my_schedule, outletController.activateRelay, outletController);
            console.log("Successfully Updated!");
            res.status(200).end();
        }
    }catch(err){
        res.status(404).end();
    }
});
// delete an existing schedule
router.delete('/schedule/:schedule_id', function(req, res){
    var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    try{
        scheduleController.deleteSchedule(schedule_id);
        console.log("Successfully Deleted!");
        res.status(200).end();
    }catch(err){
        console.log("Error caught!\n");
        console.log(err);
        res.write("404: ", JSON.stringify(err));
        res.status(404).end();
    }
});



router.get('/schedule/:schedule_id/date', function(req, res) {
    
});
router.get('/schedule/:schedule_id/cancel', function(req, res) {
    var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    try{
        scheduleController.cancelSchedule(schedule_id, outletController.activateRelay, outletController);
        console.log("Successfully Pausex!");
        res.status(200).end();
    }catch(err){
        console.log("Error caught!\n");
        console.log(err);
        res.write("404: ", JSON.stringify(err));
        res.status(404).end();
    }
});
router.get('/schedule/:schedule_id/cancel/next', function(req, res) {
    var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    try{
        scheduleController.cancelNextSchedule(schedule_id);
        console.log("Successfully Pausex!");
        res.status(200).end();
    }catch(err){
        console.log("Error caught!\n");
        console.log(err);
        res.write("404: ", JSON.stringify(err));
        res.status(404).end();
    }
});
router.get('/schedule/:schedule_id/resume', function(req, res) {
        var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    try{
        scheduleController.resumeSchedule(schedule_id, outletController.activateRelay, outletController);
        console.log("Successfully Pausex!");
        res.status(200).end();
    }catch(err){
        console.log("Error caught!\n");
        console.log(err);
        res.write("404: ", JSON.stringify(err));
        res.status(404).end();
    }
});
router.get('/status/:id', function(req, res){
    console.log("in /status/:id route\n");
    var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
    if(Number.isNaN(gpio_input)){
        res.write("400: ", "GPIO input given is not a number!");
        res.status(400).end();
    }else{
        let status = outletController.getStatus(gpio_input);
        console.log("Status: ", status);
        res.write(status.toString());
        res.status(200).end();
    }
    // validateInput(gpio_input, res, outletHelper.getStatus, outletHelper);
});
// really only toggles the relay - if it's on, this will turn it off. if it's off, this will turn it on. etc.
router.get('/activate/:id', function(req, res){
    console.log("in /:id route\n");
    var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
    if(Number.isNaN(gpio_input)){
        res.write("400: ", "GPIO input given is not a number!");
        res.status(400).end();
    }else{
        console.log("is a valid number!\n");
        outletController.toggleRelay(gpio_input);
        res.status(200).end();
    }
});
router.get('/activate/:id/:desired_state', function(req, res){
    console.log("in /:id route\n");
    var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
    var desired_state = Boolean(req.params.desired_state);
    if(Number.isNaN(gpio_input)){
        res.write("400: ", "GPIO input given is not a number!");
        res.status(400).end();
    }else if(typeof desired_state === "boolean"){
        res.write("400: ", "Input given must be 'on' or 'off'");
        res.status(400).end();
    }
    else{
        console.log("is a valid number!\n");
        outletController.activateRelay(gpio_input, desired_state);
        res.status(200).end();
    }
});
module.exports = router;

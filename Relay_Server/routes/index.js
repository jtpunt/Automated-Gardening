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
            if(newSchedule['schedule']['start_time'] !== undefined && newSchedule['schedule']['end_time'] !== undefined){
                let device_start = { 
                    ... newSchedule['device'],
                    desired_state: true
                    
                }
                let device_end = {
                    ... newSchedule['device'],
                    desired_state: false
                }
                let start_time = {... newSchedule['schedule']['start_time'] },
                    end_time   = {... newSchedule['schedule']['end_time'] },
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
                
                // start_schedule['schedule'] = start_time;
                // end_schedule['schedule']   = end_time;
                // start_schedule['device']['desired_state'] = true;
                // end_schedule['device']['desired_state'] = false;
                
                console.log("start_schedule: " + start_schedule['device']['desired_state']);
                console.log("end_schedule: " + end_schedule['device']['desired_state']);
                
                let prevScheduleId = await scheduleController.createSchedule(start_schedule, outletController.activateRelay, outletController),
                    nextScheduleId = await scheduleController.createSchedule(end_schedule, outletController.activateRelay, outletController);
                    
                start_schedule['schedule']['nextScheduleId'] = nextScheduleId;
                end_schedule['schedule']['prevScheduleId']   = prevScheduleId;
                scheduleController.editSchedule(prevScheduleId, start_schedule, outletController.activateRelay, outletController);    
                scheduleController.editSchedule(nextScheduleId, end_schedule, outletController.activateRelay, outletController);    
                console.log("Done adding schedule set");
            }else if(newSchedule['schedule']['start_time'] !== undefined){
                console.log("in else with start_time");
                let start_time = newSchedule['schedule']['start_time'],
                    start_schedule = newSchedule;
                
                start_schedule['schedule'] = start_time;
                
                let value = await scheduleController.createSchedule(start_schedule, outletController.activateRelay, outletController);
                console.log(`value returned: ${value}`);
                //value.then((value) => console.log(value));
                console.log("Schedule successfully created!\n");
            }else {
                console.log("in else... no start_time or end_times in object");
            }
            // create start schedule with schedule['start_time']
                // retrieve schedule id - our prevSheduleId
            // create end schedule with schedule['end_time']
               // retrieve schedule id = our nextScheduleId
            // adjust start shedule's nextScheduleId
            // adjust end schedule's prevScheduleId
            
            
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
            scheduleController.editSchedule(schedule_id, newSchedule, outletController.activateRelay, outletController);
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

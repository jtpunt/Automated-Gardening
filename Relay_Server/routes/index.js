//const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
//var schedule      = require('node-schedule');
//var Scheduler     = require("../models/scheduler");
// Living room lights use 'out' with an initial state of 0, otherwise, set to 'high' with an initial state of 1

var express = require("express"),
    schedule = require('node-schedule'),
    Device = require("../models/device"),
    outletController   = require("../controller/outletController.js"),
    scheduleController = require("../controller/scheduleController.js"),
    middleware = require("../middleware"),
    ip = require("ip"),
    localIP = ip.address(),
    async         = require("asyncawait/async"),
    await         = require("asyncawait/await"),
    router    = express.Router();
var APPROVED_GPIO = [2, 3];

process.on('SIGINT', () => {
    outletController.releaseGpioMem();
})
try{
    outletController.adjustForIPChange();
    outletController.getOutletSetup();
    scheduleController.getSchedules(outletController.activateRelay, outletController);
}catch(err){
    console.log(err);
    // could probably throw an error here, catch it in the server.js file for further error handling
}

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
router.post('/schedule', middleware.checkScheduleInputs, middleware.verifyAdminAccount, middleware.isGpioConfigured(outletController), middleware.createSchedules(scheduleController, outletController), async function(req, res){
    var newSchedule = req.body;
    try{
        console.log("newSchedule: ", newSchedule);
        // Make sure that the gpio is configured by the relay device
        // if(outletController.findOutletByGpio(Number(newSchedule['device']['gpio'])) === -1){
        //     throw new Error("Invalid GPIO input");
        // }
        // you can set a schedule with a start_time, end_time, start_date and end_date
        
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
router.put('/schedule/:schedule_id', middleware.verifyAdminAccount, function(req, res){
    console.log("in put route with ", req.body);
    var schedule_id = req.params.schedule_id;
    var updatedSchedule = req.body;
    try{
        // validate newSchedule['device']['gpio'] is a gpio that is currently being used in the system
        if(outletController.findOutletByGpio(Number(updatedSchedule['device']['gpio'])) === -1){
            throw new Error("Invalid GPIO input");
        }else{
            let prevScheduleId = updatedSchedule['schedule']['prevScheduleId'],
                nextScheduleId = updatedSchedule['schedule']['nextScheduleId'],
                my_time = updatedSchedule['schedule']['start_time'] || updatedSchedule['schedule']['end_time'],
                my_schedule = {... updatedSchedule };
            
      
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
router.delete('/schedule/:schedule_id', middleware.verifyAdminAccount, function(req, res){
    var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    try{
        //scheduleController.cancelSchedule(schedule_id);
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


// Returns the date of the next planned invocation of our schedule
router.get('/schedule/:schedule_id/date', function(req, res) {
    var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    try{
        let nextInvocation = scheduleController.getDateOfNextInvocation(schedule_id);
        if(nextInvocation === null){
            res.write("Next Invocation Date Not Found For This Schedule.");
        }else{
            res.write(nextInvocation.toString());
        }
        
        res.status(200).end();
    }catch(err){
        console.log("Error caught!\n");
        console.log(err);
        res.write("404: ", JSON.stringify(err));
        res.status(404).end();
    }
});


router.post('/schedule/:schedule_id/cancel', middleware.verifyAdminAccount ,function(req, res) {
    var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    try{
        scheduleController.cancelSchedule(schedule_id);
        console.log("Successfully Canceled!");
        res.status(200).end();
    }catch(err){
        console.log("Error caught!\n");
        console.log(err);
        res.write("404: ", JSON.stringify(err));
        res.status(404).end();
    }
});

router.post('/schedule/:schedule_id/cancel/next', middleware.verifyAdminAccount ,function(req, res) {
    var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    try{
        scheduleController.cancelNextSchedule(schedule_id);
        console.log("Successfully Canceled!");
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
        console.log("Resume was successful");
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

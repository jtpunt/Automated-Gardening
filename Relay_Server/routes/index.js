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
router.post('/schedule', middleware.checkScheduleInputs, middleware.verifyAdminAccount, async function(req, res){
    var newSchedule = req.body;
    try{
        console.log("newSchedule: ", newSchedule);
        // Make sure that the gpio is configured by the relay device
        if(outletController.findOutletByGpio(Number(newSchedule['device']['gpio'])) === -1){
            throw new Error("Invalid GPIO input");
        }
          // you can set a schedule with a start_time, end_time, start_date and end_date
        if(
            newSchedule['schedule']['start_time'] !== undefined && 
            newSchedule['schedule']['end_time']   !== undefined &&  
            newSchedule['schedule']['start_date'] !== undefined &&
            newSchedule['schedule']['end_date']   !== undefined
            ){
            console.log("New schedule with start_time, end_time, start_date, and end_date");
            let device_start = { // we need to rewrite our device values for our start schedule
                ... newSchedule['device'], // take every key: value stored in the 'device' key
                desired_state: true // overwrite what we receieved for desired state in the 'device' key to be 'on'
                
            },
            device_end = { // // we need to rewrite our device values for our end schedule
                ... newSchedule['device'],
                desired_state: false // overwrite what we receieved for desired state in the 'device' key to be 'off'
            }
            let on_start_time = {
                ... newSchedule['schedule'], // grabs dayOfWeek or date, month year
                ... newSchedule['schedule']['start_date'], 
                ... newSchedule['schedule']['start_time'] // grabs second, minute, hour
            },
            off_end_time   = {
                ... newSchedule['schedule'], // grabs dayOfWeek or date, month year
                ... newSchedule['schedule']['start_date'],
                ... newSchedule['schedule']['end_time'] 
                
            },
            on_end_schedule_time = {
                ... newSchedule['schedule']['end_date'],
                ... newSchedule['schedule']['start_time'] 
            },
            off_end_schedule_time = {
                ... newSchedule['schedule']['end_date'],
                ... newSchedule['schedule']['end_time'] 
            }
            let on_schedule = { // on schedule
                ... newSchedule,
                schedule: on_start_time,
                device: device_start 
            },
            off_schedule   = { // off schedule
                ... newSchedule, 
                schedule: off_end_time,
                device: device_end
            },
            on_end_schedule = {
                ... newSchedule,
                schedule: on_end_schedule_time,
                device: device_start
            },
            off_end_schedule = {
                ... newSchedule,
                schedule: off_end_schedule_time,
                device: device_end
            }
            let start_date = newSchedule['schedule']['start_date'],
                end_date   = newSchedule['schedule']['end_date'];
            // let new_on_schedule = scheduleController.buildSchedule(start_time),
            //     new_off_schedule = scheduleController.buildSchedule(end_time);
                
            let on_time_timestamp = new Date(),
                off_time_timestamp = new Date(),
                start_date_timestamp = new Date(start_date['year'], start_date['month'], start_date['date']),
                end_date_timestamp = new Date(end_date['year'], end_date['month'], end_date['date']);

            console.log(`end_schedule: ${JSON.stringify(on_end_schedule)}`);
            
            on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
            off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
            
            // if(on_time_timestamp > off_time_timestamp)
            if(start_date_timestamp > end_date_timestamp)
                throw new Error("start_date must be less than end_date")
            else if(on_time_timestamp === off_time_timestamp)
                throw new Error("start_time must not be equal to the end_time")
            else{
                // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                scheduleController.isScheduleOverlapping(on_schedule, off_schedule);
                scheduleController.isScheduleConflicting(off_schedule);
                scheduleController.isScheduleConflicting(on_schedule);

                let off_schedule_args = [
                    off_schedule, 
                    outletController.activateRelay, 
                    outletController,
                    Number(off_schedule['device']['gpio']), 
                    Boolean(off_schedule['device']['desired_state'])
                ]
           
                // create the off schedule and grab the id
                let offScheduleId = await scheduleController.createSchedule(...off_schedule_args);
                on_schedule['schedule']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'
                off_end_schedule['schedule']['startScheduleId'] = offScheduleId;

                let off_end_schedule_args = [
                    off_end_schedule, 
                    scheduleController.deleteSchedule, 
                    scheduleController, 
                    offScheduleId
                ]

                let offEndScheduleId = await scheduleController.createSchedule(...off_end_schedule_args);
                off_schedule['schedule']['endScheduleId'] = offEndScheduleId;

                let on_schedule_args = [
                    on_schedule, 
                    outletController.activateRelay, 
                    outletController,
                    Number(on_schedule['device']['gpio']), 
                    Boolean(on_schedule['device']['desired_state'])
                ]
                // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                let onScheduleId = await scheduleController.createSchedule(...on_schedule_args);
                off_schedule['schedule']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'
                on_end_schedule['schedule']['startScheduleId'] = onScheduleId;

                let on_end_schedule_args = [
                    on_end_schedule, 
                    scheduleController.deleteSchedule, 
                    scheduleController, 
                    onScheduleId
                ]
                let onEndScheduleId = await scheduleController.createSchedule(...on_end_schedule_args);
                on_schedule['schedule']['endScheduleId'] = onEndScheduleId;

                scheduleController.editSchedule(offScheduleId, off_schedule, outletController.activateRelay, outletController);  
                scheduleController.editSchedule(onScheduleId, on_schedule, outletController.activateRelay, outletController);
            
                console.log(`endScheduleId: ${onEndScheduleId}`);
                console.log(`offScheduleId: ${offEndScheduleId}`);
            }

        }
        // you can set a schedule with a start time, end time, and start date
        else if(
            newSchedule['schedule']['start_time'] !== undefined && 
            newSchedule['schedule']['end_time']   !== undefined &&
            newSchedule['schedule']['start_date'] !== undefined
            ){
            console.log("New schedule with start_time, end_time and start_date");
            let device_start = { // we need to rewrite our device values for our start schedule
                ... newSchedule['device'], // take every key: value stored in the 'device' key
                desired_state: true // overwrite what we receieved for desired state in the 'device' key to be 'on'
            },
            device_end = { // // we need to rewrite our device values for our end schedule
                ... newSchedule['device'],
                desired_state: false // overwrite what we receieved for desired state in the 'device' key to be 'off'
            }
            let on_start_time = {
                ... newSchedule['schedule'],
                ... newSchedule['schedule']['start_date'], // grabs dayOfWeek or date, month year
                ... newSchedule['schedule']['start_time'] // grabs second, minute, hour
            },
            off_end_time   = {
                ... newSchedule['schedule'],
                ... newSchedule['schedule']['start_date'],
                ... newSchedule['schedule']['end_time'] 
                
            };

            let on_schedule = { // on schedule
                ... newSchedule,
                schedule: on_start_time,
                device: device_start
            },
            off_schedule   = { // off schedule
                ... newSchedule, 
                schedule: off_end_time,
                device: device_end
            };

            // let new_on_schedule = scheduleController.buildSchedule(start_time),
            //     new_off_schedule = scheduleController.buildSchedule(end_time);
                
            let on_time_timestamp = new Date(),
                off_time_timestamp = new Date();
            
            on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
            off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
            
            if(on_time_timestamp > off_time_timestamp)
                throw new Error("start_time must be less than end_time")
            else if(on_time_timestamp === off_time_timestamp)
                throw new Error("start_time must not be equal to the end_time")
            else{
                // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                scheduleController.isScheduleOverlapping(on_schedule, off_schedule);
                scheduleController.isScheduleConflicting(off_schedule);
                scheduleController.isScheduleConflicting(on_schedule);
                
                // create the off schedule and grab the id
                let offScheduleId = await scheduleController.createSchedule(off_schedule, outletController.activateRelay, outletController);
                on_schedule['schedule']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'

                // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                let onScheduleId = await scheduleController.createSchedule(on_schedule, outletController.activateRelay, outletController);
                off_schedule['schedule']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'

                scheduleController.editSchedule(offScheduleId, off_schedule, outletController.activateRelay, outletController);  

            }
        }
        // you can set a schedule with a start time and end time
        else if(
            newSchedule['schedule']['start_time'] !== undefined && 
            newSchedule['schedule']['end_time']   !== undefined
            ){
            console.log("New schedule with start_time, and end_time");
            let device_start = { // we need to rewrite our device values for our start schedule
                ... newSchedule['device'], // take every key: value stored in the 'device' key
                desired_state: true // overwrite what we receieved for desired state in the 'device' key to be 'on'
            },
            device_end = { // // we need to rewrite our device values for our end schedule
                ... newSchedule['device'],
                desired_state: false // overwrite what we receieved for desired state in the 'device' key to be 'off'
            }
            let on_start_time = {
                ... newSchedule['schedule'],
                ... newSchedule['schedule']['start_time'] // grabs second, minute, hour
            },
            off_end_time   = {
                ... newSchedule['schedule'],
                ... newSchedule['schedule']['end_time'] 
            };

            let on_schedule = { // on schedule
                ... newSchedule,
                schedule: on_start_time,
                device: device_start
            },
            off_schedule   = { // off schedule
                ... newSchedule, 
                schedule: off_end_time,
                device: device_end
            };

            // let new_on_schedule = scheduleController.buildSchedule(start_time),
            //     new_off_schedule = scheduleController.buildSchedule(end_time);
                
            let on_time_timestamp = new Date(),
                off_time_timestamp = new Date();
            
            on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
            off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
            
            if(on_time_timestamp > off_time_timestamp)
                throw new Error("start_time must be less than end_time")
            else if(on_time_timestamp === off_time_timestamp)
                throw new Error("start_time must not be equal to the end_time")
            else{
                // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                scheduleController.isScheduleOverlapping(on_schedule, off_schedule);
                scheduleController.isScheduleConflicting(off_schedule);
                scheduleController.isScheduleConflicting(on_schedule);
                
                // create the off schedule and grab the id
                let offScheduleId = await scheduleController.createSchedule(off_schedule, outletController.activateRelay, outletController);
                on_schedule['schedule']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'

                // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                let onScheduleId = await scheduleController.createSchedule(on_schedule, outletController.activateRelay, outletController);
                off_schedule['schedule']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'

                scheduleController.editSchedule(offScheduleId, off_schedule, outletController.activateRelay, outletController);  

            }
        }
        // you can set a schedule with just an end_time
        else if(newSchedule['schedule']['end_time'] !== undefined){ // you can set a schedule with only an end time
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

var http               = require('http'),
    express            = require("express"),
    schedule           = require('node-schedule'),
    Device             = require("../models/device"),
    User               = require("../models/user"),
    deviceController   = require("../controller/deviceController.js"),
    scheduleController = require("../controller/scheduleController.js"),
    middleware         = require("../middleware"),
    ip                 = require("ip"),
    localIP            = ip.address(),
    async              = require("asyncawait/async"),
    await              = require("asyncawait/await"),
    router             = express.Router();

var APPROVED_GPIO      = [2, 3];

    
async function getAdminCredentials (){
    let adminCredentials = await User.findOne({"username": "admin"});
    return adminCredentials;
}

try{
    deviceController.adjustForIPChange();
    let obj = {
        buildOptions: function(hostname, port, path, method, json){
            let options = {
                    hostname: hostname,
                    port: port,
                    path: path,
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(json)
                    }
                }
            return options;
        },
        test: function(gpio_pin, desired_state){
            console.log(`hello world ${gpio_pin}, ${desired_state}`);

        },
        test1: function(targetIp, port, schedule_id){
            console.log(`hello world ${localIP}, ${port}, ${schedule_id}`);
        },
        test2: function(adminCredentials, targetIp, port, scheduleId){
            let self             = this,
                waterDetected    = true;

            if(waterDetected === true){
                self.cancelRelay(adminCredentials, targetIp, port, scheduleId);
            }

        },
        detectWater: function(){
            return true;
        },
        cancelRelay: function(adminCredentials, targetIp, port, scheduleId){
            // http code
            let self    = this,
                payload = { };
            if(!adminCredentials || adminCredentials === 0){
                throw new Error("admin credentials not valid!")
            }
            payload['admin_id'] = adminCredentials['_id'];
            
            const payloadStr = JSON.stringify(payload);
            const options = self.buildOptions(targetIp, port, "/schedule/" + scheduleId + "/cancel/next", 'POST', payloadStr);
            
            const myReq = http.request(options, (resp) => {
                let myChunk = '';
                resp.setEncoding('utf8');
                resp.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                    myChunk += chunk;
                });
                resp.on('end', () => {
                    console.log('No more data in response.');
                    console.log(`STATUS: ${resp.statusCode}`);
                    console.log(`HEADERS: ${JSON.stringify(resp.headers)}`);
                    if(resp.statusCode !== 200){
                        // error
                        console.log("Error on cancel");
                        
                    }else{
                        // success 
                        console.log("Cancel request was successful");
                    }
                });
            });
            
            myReq.on('error', (e) => {
                let errorMessage = e.message;
                console.error(`problem with request: ${errorMessage}`);
            });
            myReq.write(payloadStr);
            myReq.end();
        }
    }
    scheduleController.getSchedulesTest(obj.test2, obj);
}catch(err){
    console.log(err);
    // could probably throw an error here, catch it in the server.js file for further error handling
}

router.get('/device', function(req, res) {
    Device.find({local_ip: localIP, deviceType: "Camera"}, (err, myDevice) => {
        if(err){
            console.log(err);
        }else{
            
        }
    });
});
router.post('/device', function(req, res) {
    Device.find({local_ip: localIP, deviceType: "Camera"}, (err, myDevice) => {
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
router.post('/schedule', middleware.checkScheduleInputs, async function(req, res){
    var newSchedule = req.body;
    try{
        console.log("newSchedule: ", newSchedule);
        // Make sure that the gpio is configured by the relay device
        if(outletController.findOutletByGpio(Number(newSchedule['device']['gpio'])) === -1){
            throw new Error("Invalid GPIO input");
        }
        // you can set a schedule with a start and end time
        if(newSchedule['schedule']['start_time'] !== undefined && newSchedule['schedule']['end_time'] !== undefined){
            let device_start = { // we need to rewrite our device values for our start schedule
                ... newSchedule['device'], // take every key: value stored in the 'device' key
                desired_state: true // overwrite what we receieved for desired state in the 'device' key to be 'on'
                
            },
            device_end = { // // we need to rewrite our device values for our end schedule
                ... newSchedule['device'],
                desired_state: false // overwrite what we receieved for desired state in the 'device' key to be 'off'
            }
            let start_time = {
                ... newSchedule['schedule'], // grabs dayOfWeek or date, month year
                ... newSchedule['schedule']['start_time'] // grabs second, minute, hour
            },
            end_time   = {
                ... newSchedule['schedule'],
                ... newSchedule['schedule']['end_time'] 
                
            }
            let start_schedule = {
                ... newSchedule,
                schedule: start_time,
                device: device_start
                
            },
            end_schedule   = {
                ... newSchedule, 
                schedule: end_time,
                device: device_end
            }
            // let new_on_schedule = scheduleController.buildSchedule(start_time),
            //     new_off_schedule = scheduleController.buildSchedule(end_time);
                
            let start_time_timestamp = new Date(),
                end_time_timestamp = new Date();
            
            start_time_timestamp.setHours(start_time['hour'], start_time['minute'], start_time['second']); 
            end_time_timestamp.setHours(end_time['hour'], end_time['minute'], end_time['second']); 
            
            if(start_time_timestamp > end_time_timestamp)
                throw new Error("start_time must be less than end_time")
            else if(start_time_timestamp === end_time_timestamp)
                throw new Error("start_time must not be equal to the end_time")
            else{
                // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                scheduleController.isScheduleOverlapping(start_schedule, end_schedule);
                scheduleController.isScheduleConflicting(end_schedule);
                scheduleController.isScheduleConflicting(start_schedule);
                
                // create the off schedule and grab the id
                let nextScheduleId = await scheduleController.createSchedule(end_schedule, outletController.activateRelay, outletController);
                start_schedule['schedule']['nextScheduleId'] = nextScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'
            
                // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                let prevScheduleId = await scheduleController.createSchedule(start_schedule, outletController.activateRelay, outletController);
                end_schedule['schedule']['prevScheduleId'] = prevScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'

                scheduleController.editSchedule(nextScheduleId, end_schedule, outletController.activateRelay, outletController);    
            }

        }else if(newSchedule['schedule']['end_time'] !== undefined){ // you can set a schedule with only an end time
        // example usage: we want to make sure the lights are off by 2am
            console.log("in else with start_time");
            let start_time = newSchedule['schedule']['start_time'],
                start_schedule = newSchedule;
            
            start_schedule['schedule'] = start_time;
            //scheduleController.isScheduleConflicting(start_schedule);
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
router.put('/schedule/:schedule_id', function(req, res){
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
            //scheduleController.editSchedule(schedule_id, my_schedule, outletController.activateRelay, outletController);
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

router.get('/schedule/:schedule_id/cancel', function(req, res) {
    var schedule_id = req.params.schedule_id;
    console.log(typeof schedule_id);
    try{
        scheduleController.cancelSchedule(schedule_id);
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
        //scheduleController.resumeSchedule(schedule_id, outletController.activateRelay, outletController);
        console.log("Resume was successful");
        res.status(200).end();
    }catch(err){
        console.log("Error caught!\n");
        console.log(err);
        res.write("404: ", JSON.stringify(err));
        res.status(404).end();
    }
});
module.exports = router;

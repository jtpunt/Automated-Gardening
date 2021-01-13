//const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
//var schedule      = require('node-schedule');
//var Scheduler     = require("../models/scheduler");
// Living room lights use 'out' with an initial state of 0, otherwise, set to 'high' with an initial state of 1

var express            = require("express"),
    schedule           = require('node-schedule'),
    Device             = require("../models/device"),
    outletController   = require("../controller/outletController.js"),
    scheduleController = require("../controller/scheduleController.js"),
    middleware         = require("../middleware/index"),
    scheduleMiddleware = require("../middleware/scheduleMiddleware"),
    outletMiddleware   = require("../middleware/outletMiddleware"),
    ip                 = require("ip"),
    localIP            = ip.address(),
    async              = require("asyncawait/async"),
    await              = require("asyncawait/await"),
    router             = express.Router();
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
router.post('/schedule', 
    middleware.verifyAdminAccount, 
    scheduleMiddleware.checkScheduleInputs, 
    outletMiddleware.isGpioConfigured(outletController), 
    scheduleMiddleware.createSchedules(scheduleController, outletController)
);
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
router.put('/schedule/:schedule_id', 
    middleware.verifyAdminAccount,  
    outletMiddleware.isGpioConfigured(outletController), 
    scheduleMiddleware.updateSchedule(scheduleController, outletController)
);
// delete an existing schedule
router.delete('/schedule/:schedule_id', 
    middleware.verifyAdminAccount,
    scheduleController.deleteSchedule()
    //scheduleMiddleware.deleteSchedule(scheduleController)
);


// Returns the date of the next planned invocation of our schedule
router.get('/schedule/:schedule_id/date', 
    // middleware.verifyAdminAccount,
    scheduleMiddleware.getDateOfNextInvocation(scheduleController)
);


router.post('/schedule/:schedule_id/cancel', middleware.verifyAdminAccount, function(req, res) {
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
router.get('/schedule/:schedule_id/resume', middleware.verifyAdminAccount, function(req, res) {
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
router.get('/activate/:id/:desired_state', middleware.verifyAdminAccount, function(req, res){
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

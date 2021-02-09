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
    scheduleHelper     = require("../helpers/scheduleHelpers"),
    outletHelper       = require("../helpers/outletHelpers"),
    ip                 = require("ip"),
    localIP            = ip.address(),
    router             = express.Router();

// process.on('SIGINT', () => {
//     outletController.releaseGpioMem();
// })
try{
    // outletController.adjustForIPChange();
    // outletController.getOutletSetup();
    outletHelper.getOutletSetup();
    scheduleHelper.getSchedules(outletHelper.activateRelayByGpio, outletHelper);
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
router.get('/schedule', 
    scheduleController.getSchedulesReq(scheduleHelper)
);
// add a new chedule
router.post('/schedule', 
    middleware.verifyAdminAccount, 
    scheduleMiddleware.checkScheduleInputs,
    scheduleMiddleware.validateScheduleInputs,
    outletMiddleware.isGpioConfigured(outletHelper),
    scheduleController.createSchedulesReq(scheduleHelper, outletHelper)
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
    outletMiddleware.isGpioConfigured(outletHelper),
    scheduleController.updateScheduleReq(scheduleHelper, outletHelper)
);
// delete an existing schedule
router.delete('/schedule/:schedule_id', 
    middleware.verifyAdminAccount,
    scheduleController.deleteScheduleReq(scheduleHelper)
);


// Returns the date of the next planned invocation of our schedule
router.get('/schedule/:schedule_id/date', 
    scheduleController.getDateOfNextInvocationReq(scheduleHelper)
);


router.post('/schedule/:schedule_id/cancel', 
    middleware.verifyAdminAccount, 
    scheduleController.cancelScheduleReq(scheduleHelper)
);

router.post('/schedule/:schedule_id/cancel/next', 
    middleware.verifyAdminAccount,
    scheduleController.cancelNextScheduleReq(scheduleHelper)
);
router.get('/schedule/:schedule_id/resume', 
    middleware.verifyAdminAccount, 
    scheduleController.resumeScheduleReq(scheduleHelper)
);


/* Outlet routes */
router.get('/status/gpio/:gpio', 
    outletMiddleware.isGpioConfigured(outletHelper), 
    outletController.getStatusByGpioReq(outletHelper)
);
router.get(`/status/outlet/:outletId`,
    outletMiddleware.isOutletConfigured(outletHelper),
    outletController.getStatusByIdReq(outletHelper)
);
// really only toggles the relay - if it's on, this will turn it off. if it's off, this will turn it on. etc.
router.get('/toggle/gpio/:gpio', 
    outletMiddleware.isGpioConfigured(outletHelper), 
    outletController.toggleByGpioReq(outletHelper)
);
router.get('/toggle/outlet/:outletId', 
    outletMiddleware.isOutletConfigured(outletHelper),
    outletController.toggleByIdReq(outletHelper)
);
router.get('/activate/gpio/:gpio/:desired_state', 
    middleware.verifyAdminAccount, 
    outletMiddleware.isGpioConfigured(outletHelper), 
    outletController.activateOutletByGpioReq(outletHelper)
);
router.get('/activate/outlet/:outletId/:desired_state', 
    middleware.verifyAdminAccount, 
    outletMiddleware.isOutletConfigured(outletHelper),
    outletController.activateOutletByIdReq(outletHelper)
);
module.exports = router;

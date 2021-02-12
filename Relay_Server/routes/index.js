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
    outletHelper.getOutletSetup();
    scheduleHelper.getSchedules(outletHelper.activateRelayByGpio, outletHelper);
}catch(err){
    console.log(err);
    // could probably throw an error here, catch it in the server.js file for further error handling
}
router.route(`/schedule`)
    // returns all schedules
    .get(scheduleController.getSchedulesReq(scheduleHelper))
    // add a new chedule
    .post(
        middleware.verifyAdminAccount, 
        scheduleMiddleware.checkScheduleInputs,
        scheduleMiddleware.validateScheduleInputs,
        outletMiddleware.isGpioConfigured(outletHelper),
        scheduleController.createSchedulesReq(scheduleHelper, outletHelper)
    );

router.route(`/schedule/:schedule_id`)
    .get(
        // middleware.verifyAdminAccount,
        scheduleMiddleware.doesScheduleExist(scheduleHelper),
        scheduleController.getScheduleConfigReq(scheduleHelper)
    )
    .put(
        middleware.verifyAdminAccount,  
        outletMiddleware.isGpioConfigured(outletHelper),
        scheduleMiddleware.doesScheduleExist(scheduleHelper),
        scheduleController.updateScheduleReq(scheduleHelper, outletHelper)
    )
    .delete(
        middleware.verifyAdminAccount,
        scheduleMiddleware.doesScheduleExist(scheduleHelper),
        scheduleController.deleteScheduleReq(scheduleHelper)
    );

router.post('/schedule/:schedule_id/cancel', 
    middleware.verifyAdminAccount, 
    scheduleMiddleware.doesScheduleExist(scheduleHelper),
    scheduleController.cancelScheduleReq(scheduleHelper)
);
// Returns the date of the next planned invocation of our schedule
router.get('/schedule/:schedule_id/date', 
    scheduleMiddleware.doesScheduleExist(scheduleHelper),
    scheduleController.getDateOfNextInvocationReq(scheduleHelper)
);
router.post('/schedule/:schedule_id/cancel/next', 
    middleware.verifyAdminAccount,
    scheduleMiddleware.doesScheduleExist(scheduleHelper),
    scheduleController.cancelNextScheduleReq(scheduleHelper)
);
router.get('/schedule/:schedule_id/resume', 
    middleware.verifyAdminAccount, 
    scheduleMiddleware.doesScheduleExist(scheduleHelper),
    scheduleController.resumeScheduleReq(scheduleHelper)
);


/* Outlet routes */
router.get(`/outlet/status/:outletId`,
    outletMiddleware.isOutletConfigured(outletHelper),
    outletController.getStatusByIdReq(outletHelper)
);
router.get('outlet/status/gpio/:gpio', 
    outletMiddleware.isGpioConfigured(outletHelper), 
    outletController.getStatusByGpioReq(outletHelper)
);
router.get('/outlet/toggle/:outletId', 
    outletMiddleware.isOutletConfigured(outletHelper),
    outletController.toggleByIdReq(outletHelper)
);
router.get('/outlet/toggle/gpio/:gpio', 
    outletMiddleware.isGpioConfigured(outletHelper), 
    outletController.toggleByGpioReq(outletHelper)
);
router.get('/outlet/activate/:outletId/:desired_state', 
    middleware.verifyAdminAccount, 
    outletMiddleware.isOutletConfigured(outletHelper),
    outletController.activateOutletByIdReq(outletHelper)
);
router.get('/outlet/activate/gpio/:gpio/:desired_state', 
    middleware.verifyAdminAccount, 
    outletMiddleware.isGpioConfigured(outletHelper), 
    outletController.activateOutletByGpioReq(outletHelper)
);
module.exports = router;

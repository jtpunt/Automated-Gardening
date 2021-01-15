var Scheduler       = require("../models/scheduler"),
    Device          = require("../models/device"),
    ip              = require("ip"),
    async           = require("asyncawait/async"),
    await           = require("asyncawait/await"),
    localIP         = ip.address();



var scheduleMethods = {
    getDateOfNextInvocationReq: (scheduleHelper) => {
        let self = scheduleHelper;
        return function(req, res, next){
            let schedule_id = req.params.schedule_id;
            if(!self.doesScheduleExist(schedule_id))
                res.status(404).send(`Schedule id - ${schedule_id} does not exist!`);
            else{
                let nextInvocation = self.getDateOfNextInvocation(schedule_id);
                if(nextInvocation === undefined)
                    res.status(404).send(`Next Invocation Date Not Found For Schedule id - ${schedule_id}`);
                else
                    res.status(200).send(nextInvocation.toString());
            }
            
        }
    }
}
module.exports = scheduleMethods;

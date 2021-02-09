var outletMiddleware = {
    isGpioConfigured: (outletHelper) => {
        return function(req, res, next){
            let requestedGpio = -1;
            if("device" in req.body){
                let device = req.body['device']
                if("gpio" in device)
                    requestedGpio = Number(req.body.device.gpio);
            }
            if("gpio" in req.params)
                requestedGpio = Number(req.params.gpio);
            if(outletHelper.getOutletIdByGpio(requestedGpio) === undefined){
                res.status(404).send("Invalid GPIO input");
            }else{
	            next();
            }
        }
    },
    isOutletConfigured: (outletHelper) => {
        return function(req, res, next){
            let requestedOutletId = -1;
            if("device" in req.body){
                let device = req.body['device']
                if("outletId" in device)
                    requestedOutletId = req.params.outletId;
            }
            if("outletId" in req.params)
                requestedOutletId = req.params.outletId;
            if(!outletHelper.doesOutletExist(requestedOutletId)){
                 res.status(404).send(`Outlet id - ${outletId} does not exist`);
            }
        }
    }
}
module.exports = outletMiddleware;
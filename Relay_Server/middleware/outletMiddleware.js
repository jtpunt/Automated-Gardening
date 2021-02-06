var outletMiddleware = {
    isGpioConfigured: (outletHelper) => {
        return function(req, res, next){
            let newSchedule = req.body,
            	requestedGpio = req.body.device.gpio || req.params.gpio;
            console.log(`in outletMiddleware with: ${req.params}`);
            if(outletHelper.getOutletIdByGpio(requestedGpio) === undefined){
                res.status(404).send("Invalid GPIO input");
            }else{
	            next();
            }
        }
    }
}
module.exports = outletMiddleware;
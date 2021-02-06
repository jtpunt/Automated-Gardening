var outletMiddleware = {
    isGpioConfigured: (outletHelper) => {
        return function(req, res, next){
            let newSchedule = req.body,
            	requestedGpio = req.params.gpio;

            console.log(`req.body: ${JSON.stringify(req.body)}`);
            console.log(`in outletMiddleware with: ${JSON.stringify(req.params)}`);
            if(outletHelper.getOutletIdByGpio(requestedGpio) === undefined){
                res.status(404).send("Invalid GPIO input");
            }else{
	            next();
            }
        }
    }
}
module.exports = outletMiddleware;
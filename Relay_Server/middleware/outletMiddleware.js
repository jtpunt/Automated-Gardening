var outletMiddleware = {
    isGpioConfigured: (outletHelper) => {
        return function(req, res, next){
            let newSchedule = req.body,
            	requestedGpio = req.params.gpio;
            if(req.body){
                console.log(`req.body found: ${JSON.stringify(req.body)}`);
            }else{
                console.log(`req.body not found: ${JSON.stringify(req.body)}`);
            }
            if(req.params){
                console.log(`req.params: ${JSON.stringify(req.params)}`);
            }else{
                console.log(`req.params: ${JSON.stringify(req.params)}`);
            }
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
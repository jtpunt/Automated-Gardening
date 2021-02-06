var outletMiddleware = {
    isGpioConfigured: (outletHelper) => {
        return function(req, res, next){
            let requestedGpio = -1;
            if("gpio" in req.body){
                console.log(`req.body found: ${JSON.stringify(req.body)}`);
                requestedGpio = req.body.gpio;
            }else if("gpio" in req.params){
                requestedGpio = req.params.gpio;
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
var outletMiddleware = {
    isGpioConfigured: (outletHelper) => {
        return function(req, res, next){
            let requestedGpio = -1;
            if("device['gpio']" in req.body){
                console.log(`req.body found: ${JSON.stringify(req.body)}`);
                requestedGpio = Number(req.body.device.gpio);
            }else if("gpio" in req.params){
                requestedGpio = Number(req.params.gpio);
            }else{
                console.log(`req.params: ${JSON.stringify(req.params)}`);
            }
            console.log(`in outletMiddleware with: ${JSON.stringify(req.body)}`);
            if(outletHelper.getOutletIdByGpio(requestedGpio) === undefined){
                res.status(404).send("Invalid GPIO input");
            }else{
	            next();
            }
        }
    }
}
module.exports = outletMiddleware;
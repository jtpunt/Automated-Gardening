var outletMiddleware = {
    isGpioConfigured: (outletController) => {
        return function(req, res, next){
            let newSchedule = req.body,
            	requestedGpio = Number(newSchedule['device']['gpio'])
            if(outletController.findOutletByGpio(requestedGpio) === -1){
                res.status(404).send("Invalid GPIO input");
            }else{
	            next();
            }
        }
    }
}
module.exports = outletMiddleware;
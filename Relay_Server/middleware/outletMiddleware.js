var outletMiddleware = {
    isGpioConfigured: (outletController) => {
        return function(req, res, next){
            var newSchedule = req.body;
            if(outletController.findOutletByGpio(Number(newSchedule['device']['gpio'])) === -1){
                res.status(404).send("Invalid GPIO input");
            }else{
	            next();
            }
        }
    }
}
module.exports = outletMiddleware;
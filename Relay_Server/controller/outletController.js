var outletController = {
    activateOutletByGpioReq: function(outletHelper){
        return function(req, res, next){
            var gpio_input    = Number(req.params.gpio),
                desired_state = Boolean(req.params.desired_state);
            if(!outletHelper.doesGpioExist(gpio_input)){
                res.status(404).send(`Gpio - ${gpio_input} is not set up with the system. `);
            }else{
                outletHelper.activateRelayByGpio(gpio_input, desired_state);
                res.status(200).end();
            }
        }
    },
    activateOutletByIdReq: function(outletHelper){
        return function(req, res, next){
            var outletId = req.params.outletId,
                desired_state = Boolean(req.params.desired_state);
            if(!outletHelper.doesOutletExist(ouletId)){
                 res.status(404).send(`Outlet id - ${outletId} does not exist`);
            }else{
                outletHelper.activateRelayById(outletId, desired_state);
                res.status(200).end();
            }
        }
    },
    getStatusByGpioReq: function(outletHelper){
        return function(req, res, next){
            var gpio_input = Number(req.params.gpio);
            if(!outletHelper.doesGpioExist(gpio_input)){
                res.status(404).send(`Gpio - ${gpio_input} is not set up with the system. `);
            }else{
                let status = outletHelper.getStatusByGpio(gpio_input);
                res.status(200).send(status.toString());
            }
        }
    },
    getStatusByIdReq: function(outletHelper){
        return function(req, res, next){
            var outletId = req.params.outletId;
            if(!outletHelper.doesOutletExist(ouletId)){
                 res.status(404).send(`Outlet id - ${outletId} does not exist`);
            }else{
                let status = outletHelper.getStatusById(outletId);
                res.status(200).send(status.toString());
            }
        }
    },
    toggleByGpioReq: function(outletHelper){
        return function(req, res, next){
            var gpio_input = Number(req.params.gpio);
            outletHelper.toggleRelayByGpio(gpio_input);
            res.status(200).end();
        }
    },
    toggleByIdReq: function(outletHelper){
        return function(req, res, next){
            var outletId = req.params.outletId;
            if(!outletHelper.doesOutletExist(ouletId)){
                 res.status(404).send(`Outlet id - ${outletId} does not exist`);
            }else{
                outletHelper.toggleRelayById(outletId);
            }
        }
    }
}
module.exports = outletController;

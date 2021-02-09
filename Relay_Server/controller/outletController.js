var outletController = {
    activateOutletByGpioReq: function(outletHelper){
        return function(req, res, next){
            var gpio_input    = Number(req.params.gpio),
                desired_state = Boolean(req.params.desired_state);
            outletHelper.activateRelayByGpio(gpio_input, desired_state);
            res.status(200).end();
        }
    },
    activateOutletByIdReq: function(outletHelper){
        return function(req, res, next){
            var outletId = req.params.outletId,
                desired_state = Boolean(req.params.desired_state);
            outletHelper.activateRelayById(outletId, desired_state);
            res.status(200).end();
        }
    },
    getStatusByGpioReq: function(outletHelper){
        return function(req, res, next){
            var gpio_input = Number(req.params.gpio);
            let status = outletHelper.getStatusByGpio(gpio_input);
            res.status(200).send(status.toString());
        }
    },
    getStatusByIdReq: function(outletHelper){
        return function(req, res, next){
            var outletId = req.params.outletId;
            let status = outletHelper.getStatusById(outletId);
            res.status(200).send(status.toString());
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
            outletHelper.toggleRelayById(outletId);
        }
    }
}
module.exports = outletController;

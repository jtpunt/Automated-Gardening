//const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
//var schedule      = require('node-schedule');
//var Scheduler     = require("../models/scheduler");
// Living room lights use 'out', otherwise, set to 'high'
const APPROVED_GPIO = [2,3]; // gpios that the system is set up to handle

process.on('SIGINT', () => {
  outlet1.unexport();
  outlet2.unexport();
});
var express = require("express"),
    Gpio = require('onoff').Gpio, //include onoff to interact with the GPIO
    schedule = require('node-schedule'),
    Scheduler = require("../models/scheduler"),
    ip = require("ip"),
    localIP = ip.address()
    router    = express.Router();

const outlet1 = new Gpio(2, 'high'); //use GPIO pin 4, and specify that it is output
const outlet2 = new Gpio(3, 'high');

var arr = router.get("scheduleArr");
console.log(arr);


function activateRelay(gpio_input) { //function to start blinkingp
    if(gpio_input === 2){
        if (outlet1.readSync() === 0) { //check the pin state, if the state is 0 (or off)
            outlet1.writeSync(1); //set pin state to 1 (turn LED on)
        } else {
            outlet1.writeSync(0); //set pin state to 0 (turn LED off)
        }
    }else{
        if (outlet2.readSync() === 0) { //check the pin state, if the state is 0 (or off)
            outlet2.writeSync(1); //set pin state to 1 (turn LED on)
        } else {
            outlet2.writeSync(0); //set pin state to 0 (turn LED off)
        }
    }
}
function getStatus(gpio_input, res){
    if(gpio_input === 2){
        res.write(JSON.stringify(outlet1.readSync()));
    }else{
        res.write(JSON.stringify(outlet2.readSync()));
    }
}
function validateInput(gpio_input, res, fn){
    if(Number.isNaN(gpio_input)){ // make sure a number was passed in
        console.log("not a number!\n");
    }else if(APPROVED_GPIO.includes(gpio_input)){ // was 2 or 3 passed in?
        fn(gpio_input, res);
        res.status(200).end();
    }else{
        console.log("in else\n");
        res.status(400).end();
    }
}
router.get('/status/:id', function(req, res){
    console.log("in /status/:id route\n");
    var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
    validateInput(gpio_input, res, getStatus);
});
router.get('/activate/:id', function(req, res){
    console.log("in /:id route\n");
    var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
    validateInput(gpio_input, res, activateRelay);
});
module.exports = router;

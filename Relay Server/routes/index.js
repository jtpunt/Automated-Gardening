const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
const outlet1 = new Gpio(2, 'out'); //use GPIO pin 4, and specify that it is output
const outlet2 = new Gpio(3, 'out');
const APPROVED_GPIO = [2,3]; // gpios that the system is set uo to handle

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
    if(isNaN(gpio_input)){ // make sure a number was passed in
        console.log("not a number!\n");
        return false;
    }else if(APPROVED_GPIO.includes(gpio_input)){ // was 2 or 3 passed in?
        fn(gpio_input, res);
        res.status(200).end();
    }else{
        console.log("in else\n");
        res.status(400).end();
    }
}
module.exports = function(app) {
    app.get('/:id', function(req, res){
        var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
        validateInput(gpio_input, res, activateRelay);
    });
    app.get('/status/:id', function(req, res){
        var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
        validateInput(gpio_input, res, getStatus);
    });
};

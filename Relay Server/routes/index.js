var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var outlet1 = new Gpio(2, 'high'); //use GPIO pin 4, and specify that it is output
var outlet2 = new Gpio(3, 'high');


function blinkLED(gpio) { //function to start blinkingp
    if(gpio === 2){
        outlet = outlet1;
    }else{
        outlet = outlet2;
    }
    if (outlet.readSync() === 0) { //check the pin state, if the state is 0 (or off)
        outlet.writeSync(1); //set pin state to 1 (turn LED on)
    } else {
        outlet.writeSync(0); //set pin state to 0 (turn LED off)
    }
}
module.exports = function(app) {
 //  	app.get('/',function(req,res){
 //  		blinkLED(2);
	// });
    app.get('/:id', function(req, res){
        var APPROVED_GPIO = [2,3]; // gpios that the system is set uo to handle
        var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
        if(isNaN(gpio_input)){ // make sure a number was passed in
            console.log("not a number!\n");
        }else if(APPROVED_GPIO.includes(gpio_input)){ // was 2 or 3 passed in?
            blinkLED(gpio_input); 
            res.status(200).end();
        }else{
            console.log("in else\n");
        }
        res.status(400).end();
    });
};

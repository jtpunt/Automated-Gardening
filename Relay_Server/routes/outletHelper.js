const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var Devices = require("../models/device"),
    ip      = require("ip"),
    localIP = ip.address();
    
var outletObj = {
        outletArr: [],
        createOutlet: function(newDevice){
            
        },
        getOutlets: function(){
            var self = this;
            Devices.find({local_ip: localIP, deviceType: "Relay Server"}, (err, myDevice) => {
                if(err){
                    console.log(err);
                }
                else{
                    if(myDevice.length > 0){
                        console.log("Test: ", myDevice);
                        myDevice[0]['gpio'].forEach(function(myGpio){
                            var myOutlet = new Gpio(myGpio, 'high');
                            var initialState = myOutlet.readSync();
                            console.log("Initial State:", initialState);
                            self.setOutlet({gpio: myGpio, initialState: initialState, outlet: myOutlet});
                        });
                        console.log(self.outletArr);
                    }
                }
            });
        },
        setOutlet: function(newOutletObj){
            this.outletArr.push(newOutletObj);   
        },
        editOutlet: function(gpio_input){
            
        },
        deleteOutlet: function(gpio_input){
            let self = this;
            let index = this.findOutlet(gpio_input);
        },
        findOutlet: function(gpio_input){
            return this.outletArr.findIndex((outlet) => outlet['gpio'] === gpio_input);
        },
        activateRelay: function(gpio_input) { //function to start blinkingp
            console.log(gpio_input);
            let index = this.findOutlet(gpio_input);
            if(index !== -1){
                console.log("outlet found!\n");
                if(this.outletArr[index]['outlet'].readSync() === 0){ //check the pin state, if the state is 0 (or off)
                    this.outletArr[index]['outlet'].writeSync(1); //set pin state to 1 (turn LED on)
                }else{
                    this.outletArr[index]['outlet'].writeSync(0); //set pin state to 0 (turn LED off)
                }
            }
        },
        getStatus: function(gpio_input){
            let index = this.findOutlet(gpio_input);
            if(index !== -1){
                let curState = this.outletArr[index]['outlet'].readSync();
                if(this.outletArr[index]['initialState'] === 1){ // seems like 1 is equal to on, but it is opposite and means 1 is off
                    curState ^= 1;
                }
                return curState;
            }
        }
}
module.exports = outletObj;
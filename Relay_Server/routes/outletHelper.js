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
            console.log("in getOutlets\n");
            Devices.find({local_ip: localIP, deviceType: "Relay Server"}, (err, myDevice) => {
                if(err){
                    console.log(err);
                    throw err;
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
                    }else{
                        throw "No configuration found for this device!"
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
            let index = self.findOutlet(gpio_input);
        },
        activateRelay: function(gpio_input) { //function to start blinkingp
            let self = this;
            let index = self.findOutlet(gpio_input);
            if(index !== -1){
                console.log("outlet found!\n");
                if(self.outletArr[index]['outlet'].readSync() === 0){ //check the pin state, if the state is 0 (or off)
                    self.outletArr[index]['outlet'].writeSync(1); //set pin state to 1 (turn LED on)
                }else{
                    self.outletArr[index]['outlet'].writeSync(0); //set pin state to 0 (turn LED off)
                }
            }
        },
        getStatus: function(gpio_input){
            let self = this;
            let index = self.findOutlet(gpio_input);
            if(index !== -1){
                let curState = self.outletArr[index]['outlet'].readSync();
                if(self.outletArr[index]['initialState'] === 1){ // seems like 1 is equal to on, but it is opposite and means 1 is off
                    curState ^= 1;
                }
                return curState;
            }
        },
        findOutlet: function(gpio_input){
            return this.outletArr.findIndex((outlet) => outlet['gpio'] === gpio_input);
        }
}
module.exports = outletObj;
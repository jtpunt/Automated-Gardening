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
                            self.setDevice({gpio: myGpio, initialState: initialState, outlet: myOutlet});
                        });
                        console.log(outletArr);
                    }
                }
            });
        },
        setOutlet: function(newDeviceObj){
            this.outletArr.push(newDeviceObj);   
        },
        editOutlet: function(device_id){
            
        },
        deleteOutlet: function(device_id){
            
        },
        findOutlet: function(gpio_input){
            return this.outletArr.findIndex((outlet) => outlet['gpio'] === gpio_input);
        }
}
module.exports = outletObj;
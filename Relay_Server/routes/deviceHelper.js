const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var Devices = require("../models/device");
var deviceObj = {
        outletArr: [],
        createDevice: function(newDevice){
            
        },
        getDevices: function(){
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
                            self.outletArr.push({gpio: myGpio, initialState: initialState, outlet: myOutlet});
                        });
                        console.log(outletArr);
                    }
                }
            });
        },
        setDevice: function(newDeviceObj){
            this.outletArr.push(newDeviceObj);   
        },
        editDevice: function(device_id){
            
        },
        deleteDevice: function(device_id){
            
        },
        findDevice: function(device_id){
            
        }
}
module.exports = deviceObj;
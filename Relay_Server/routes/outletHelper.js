const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var Devices = require("../models/device"),
    ip      = require("ip"),
    fs          = require("fs"),
    path        = require("path"),
    isIp        = require('is-ip'),
    filePath    = path.join(__dirname, 'lastIPAddr.txt');
    localIP = ip.address();
    
var outletObj = {
        outletArr: [],
        createOutlet: function(newDevice){
            
        },
        releaseGpioMem: function(){
            this.outletArr.forEach((outlet) => {
                outlet['outlet'].unexport();
            });
        },
        detectIPChange: function(){
            console.log("in detectIPChange");
            try{
                if(fs.existsSync(path)){ // file exists
                    console.log("File exists");
                    fs.readFile(filePath, function(err, data){
                        if(err){
                            console.log(err);
                        }else{ // file read successful
                            console.log(data);
                            if(data !== localIP){ // has our devices IP address changed?
                                 
                            }
                        }
                    });
                }
            }catch(err){ // file does not exist
                console.log(err);
                fs.writeFile(path, localIP, function(err){
                    if(err){
                        console.log(err);
                    }else{ // file write successful
                        console.log("No errors occured");
                        var newDeviceObj = {
                            local_ip: localIP,
                            deviceName: 'New Relay Server',
                            deviceType: 'Relay Server',
                        }
                        Devices.create(newDeviceObj, (err, newDevice) =>{
                            if(err) console.log(err);
                            else{
                                newDevice.save();
                                console.log("Device saved!");
                            }
                        });
                    }
                });
            }
        },
        getOutletSetup: function(){
            var self = this;
            console.log("in getOutlets\n");
            self.detectIPChange();
            Devices.find({local_ip: localIP, deviceType: "Relay Server"}, (err, myDevice) => {
                if(err){
                    console.log(err);
                    throw err;
                }
                else{
                    try{
                        if(myDevice.length > 0){
                            console.log("Test: ", myDevice);
                            myDevice[0]['gpio'].forEach(function(myGpio){
                                var myOutlet = new Gpio(myGpio, 'high');
                                var initialState = myOutlet.readSync();
                                console.log("Initial State:", initialState);
                                self.setOutlet({gpio: myGpio, initialState: initialState, outlet: myOutlet});
                                console.log("Status: ", self.getStatus(myGpio));
                            });
                            console.log(self.outletArr);
                        }else{
                            throw "No configuration found for this device!"
                        }
                    }catch(err){
                        console.log(err);
                    }
                }
            });
        },
        setOutlet: function(newOutletObj){
            this.outletArr.push(newOutletObj);   
        },
        // updatedOutlet = {
        //      local_ip: local_ip, 
        //      device_name: device_name,
        //      device_type: device_type,
        //      gpio: gpio
        // }
        // updatedGpio: [ { prevGpio: prevGpio, newGpio: newGpio }]
        editOutlet: function(device_id, updatedOutlet, updatedGpio){
            let self = this;
            // make sure all prevGpios in updatedOutlet array exist in the current setup
            updatedGpio.forEach(function(gpip){
                let index = self.findOutlet(gpio['prevGpio']);
                if(index !== -1){ 
                    gpio['outletArrIdx'] = index; // save the idx that the gpio was found in
                }else{
                    throw "Gpio not found in setup!";
                }
            });
            Devices.findByIdAndUpdate(device_id, {$set: updatedOutlet}, (err, myDevice) => {
                if(err){
                    console.log(err);
                }else{
                    updatedGpio.forEach(function(gpip){
                       let index = gpio['outletArrIdx'];
                       if(gpio['prevGpio'] !== gpio['updatedGpio']){
                           self.outletArr[index]['outlet'].unexport();
                           if(updatedGpio['newGpio'] !== undefined && updatedGpio['newGpio'] !== null){
                               self.outletArr[index]['outlet'] = new Gpio(gpio['newGpio'], 'high');
                           }else{ // case 2: gpio['newGpio'] is undefined or null
                                self.outletArr.splice(index, 1); // delete 
                           }
                       }else{ // gpio did not change
                           // do nothing
                       }
                    });
                    self.outletArr.forEach(function(outlet){
                        
                    });
                    // case 1: gpio is updated
                    //  - clear resources for each outlet
                    // self.outletArr[index]['outlet'].unexport();
                    // case 2: gpio['newGpio'] is undefined or null
                    //  - clear resources for each outlet
                    // self.releaseGpioMem();
                }
            });
        },
        deleteOutlet: function(outletObj){
            let self = this;
            let index = self.findOutlet(gpio_input);
            Devices.findByIdAndDelete(req.param.device_id, (err, myDevice) => {
                if(err){
                    console.log(err);
                    throw err;
                }else{
                    
                }
            });
        },
        activateRelay: function(gpio_input) { //function to start blinkingp
            let self = this;
            let index = self.findOutlet(gpio_input);
            console.log("in activateRelay\n");
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
            console.log("In getStatus\n");
            if(index !== -1){
                console.log("Outlet Found!\n");
                let curState = self.outletArr[index]['outlet'].readSync();
                if(self.outletArr[index]['initialState'] === 1){ // seems like 1 is equal to on, but it is opposite and means 1 is off
                    curState ^= 1;
                }
                return curState;
            }
        },
        findOutlet: function(gpio_input){
            return this.outletArr.findIndex((outlet) => outlet['gpio'] === gpio_input);
        },
        findOutletId: function(outlet_id){
            return this.outletArr.findIndex((outlet) => outlet['_id'] === outlet_id);
        }
}
module.exports = outletObj;
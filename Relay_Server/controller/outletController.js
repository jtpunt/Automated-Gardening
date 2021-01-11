const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var Device = require("../models/device"),
    RelaySettings = require("../models/relaySettings"),
    ip      = require("ip"),
    fs          = require("fs"),
    path        = require("path"),
    fileName    = path.join("/home/pi/Smart-Gardening/Relay_Server/device_id.json"),
    async         = require("asyncawait/async"),
    await         = require("asyncawait/await"),
    localIP = ip.address();

console.log("Local IP: " + localIP + "\n");
const GPIO_EXPORT = (localIP === "192.168.254.202") ? 'out' : 'high';
var outletObj = {
        outletArr: [],
        // NOT COMPLETE - myGpio is not set
        createOutlet: function(newOutlet){
            let self = this;
            Device.create(newOutlet, (err, myDevice) => {
                if(err){
                    console.log(err);
                    throw err;
                }else{
                    var myOutlet = new Gpio(myGpio, GPIO_EXPORT);
                    var initialState = myOutlet.readSync();
                    console.log("Initial State:", initialState);
                    self.setOutlet({id: myDevice['_id'], gpio: myGpio, initialState: initialState, outlet: myOutlet});
                    console.log("Status: ", self.getStatus(myGpio));
                }
            });
        },
        adjustForIPChange: function(){
            try{
                let deviceDataObj,
                    deviceDataJSON,
                    device_id, 
                    newDeviceObj = {
                        local_ip: localIP,
                        deviceName: 'New Relay Server',
                        deviceType: 'Relay Server',
                    },
                    fileExists = fs.existsSync(fileName);
                
                // if JSON file 'device_id.json' exists
                if(fileExists){
                    console.log("File does exist");
                    let data = fs.readFileSync(fileName);
                    console.log(data);
                    deviceDataObj = JSON.parse(data);
                    console.log("Parsed JSON object: " + deviceDataObj);
                    if(deviceDataObj["_id"] !== undefined){
                        console.log("deviceDataObj[_id] is not null");
                        device_id = deviceDataObj['_id'].toString();
                        // look up device in database, make sure it exists, overwrite local ip value
                        
                        Device.findByIdAndUpdate(device_id, {$set: {local_ip: localIP }}, function(err, device){
                            if(err){
                                console.log(err);
                            }else{
                                console.log(`device: ${device} has been updated`);
                            }
                        })    
                    }else{
                        console.log("deviceDataObj[_id] is null");
                    }
                    
                }
                // else if our local ip exist in device database
                else if(Device.find({local_ip: localIP, deviceType: "Relay Server"}).limit(1)){
                    // grab the device's mongo _id and write it to the 'device_id.json' file
                        // _id: _id
                    console.log("local ip does exist in the device db");
                    Device.findOne({local_ip: localIP, deviceType: "Relay Server"}, function(err, myDevice) {
                        if(err){
                            console.log(err);
                        }
                        else{
                            deviceDataObj = { _id: myDevice["_id"] };       // create our object
                            deviceDataJSON = JSON.stringify(deviceDataObj); // stringify it
                            
                            fs.writeFileSync(fileName, deviceDataJSON);     // write it to our file
                        }
                    });
                }
                // else, we have a new device
                else{
                    // create a basic device in mongo
                    // grab the id, and write it to our 'device_id.json' file
                    console.log("Device does not exist, creating device");
                    Device.create(newDeviceObj, (err, newDevice) =>{
                        if(err) console.log(err);
                        else{
                            newDevice.save();
                            console.log("Device saved!");
                            deviceDataObj = { _id: newDevice["_id"] };       // create our object
                            deviceDataJSON = JSON.stringify(deviceDataObj);  // stringify it
                            
                            fs.writeFileSync(fileName, deviceDataJSON);      // write it to our file
    
                        }
                    });
                }
                
                
            }catch(exc){
                console.log(exc.toString());
            }
        },
        releaseGpioMem: function(){
            this.outletArr.forEach((outlet) => {
                outlet['outlet'].unexport();
            });
        },
        getOutletSetup: function(){
            var self = this;
            console.log("in getOutlets\n");

            Device.findOne({
                local_ip: localIP, 
                deviceType: "Relay Server"
            }, (err, myDevice) => {
                if(err){
                    console.log(err);
                    throw err;
                }
                else{
                    console.log("My Device: ", myDevice);
                    if(myDevice){
                        console.log("Test: ", myDevice);
                        myDevice['gpio'].forEach(function(myGpio){
                            RelaySettings.findOne({
                                relayId: myDevice["_id"], 
                                gpio: myGpio
                            }, function(err, relay_config){
                                if(err){
                                    console.log(err.toString());
                                    throw err;
                                }else{
                                    var myOutlet = new Gpio(myGpio, relay_config["direction"]);
                                    var initialState = myOutlet.readSync();
                                    console.log("Initial State:", initialState);
                                    self.setOutlet({
                                        id: myDevice['_id'], 
                                        gpio: myGpio, 
                                        initialState: initialState, 
                                        outlet: myOutlet
                                    });
                                    console.log("Status: ", self.getStatus(myGpio));
                                }
                            });
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
                let index = self.findOutletByGpio(gpio['prevGpio']);
                if(index !== -1){ 
                    gpio['outletArrIdx'] = index; // save the idx that the gpio was found in
                }else{
                    throw "Gpio not found in setup!";
                }
            });
            Device.findByIdAndUpdate(device_id, {$set: updatedOutlet}, (err, myDevice) => {
                if(err){
                    console.log(err);
                }else{
                    updatedGpio.forEach(function(gpip){
                       let index = gpio['outletArrIdx'];
                       if(gpio['prevGpio'] !== gpio['updatedGpio']){
                           self.outletArr[index]['outlet'].unexport();
                           if(updatedGpio['newGpio'] !== undefined && updatedGpio['newGpio'] !== null){
                               self.outletArr[index]['outlet'] = new Gpio(gpio['newGpio'], GPIO_EXPORT);
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
        deleteOutlet: function(outlet_id, gpio_input){
            let self = this;
            let index = self.findOutletByGpio(gpio_input);
            console.log("in activateRelay\n");
            if(index !== -1){
                Device.findByIdAndDelete(outlet_id, (err, myDevice) => {
                    if(err){
                        console.log(err);
                        throw err;
                    }else{
                        self.outletArr[index]['outlet'].unexport();
                        self.outletArr.splice(index, 1);
                    }
                });
            }
        },
        toggleRelay: function(gpio_input) {
            let self = this;
            let index = self.findOutletByGpio(gpio_input);
            console.log("in activateRelay\n");
            if(index !== -1){
                console.log("Outlet " + gpio_input + " activated on " + new Date().toISOString() + "\n");
                //if(self.getStatus(gpio_input))
                
                //self.outletArr[index]['outlet'].writeSync(self.outletArr[index]['outlet'].readSync());
                if(self.outletArr[index]['outlet'].readSync() === 0){ //check the pin state, if the state is 0 (or off)
                    self.outletArr[index]['outlet'].writeSync(1); //set pin state to 1 (turn LED on)
                }else{
                    self.outletArr[index]['outlet'].writeSync(0); //set pin state to 0 (turn LED off)
                }
            }
        },
        activateRelay: function(gpio_input, desired_state) {
            let self = this;
            let index = self.findOutletByGpio(gpio_input);
            console.log("in activateRelay\n");
            if(index !== -1){
                let status = self.getStatus(gpio_input);
                console.log(`Status: ${status}, desired_state: ${desired_state}`);
                // typeof status === "Number"
                // typeof desired_state === "Boolean"
                if(status === Number(desired_state)){
                    console.log("Device is already in the desired state!");
                    return;
                }else{
                    console.log("Desired State: " + desired_state);
                    if(self.outletArr[index]['initialState'] === 1){ // seems like 1 is equal to on, but it is opposite and means 1 is off
                        console.log("desired state is opposite due to initialState");
                        desired_state ^= 1;
                    }
                    self.outletArr[index]['outlet'].writeSync(Number(desired_state));  
                    console.log("Outlet " + gpio_input + " activated on " + new Date().toISOString() + " to " + desired_state + "\n");      
                }

                
            }else{
                console.log(`index: ${index}`)
            }
        },
        getStatus: function(gpio_input){
            let self = this;
            let index = self.findOutletByGpio(gpio_input);
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
        findOutletByGpio: function(gpio_input){
            return this.outletArr.findIndex((outlet) => outlet['gpio'] === gpio_input);
        },
        findOutletById: function(outlet_id){
            return this.outletArr.findIndex((outlet) => outlet['_id'] === outlet_id);
        }
}
module.exports = outletObj;

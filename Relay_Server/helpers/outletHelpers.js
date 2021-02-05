var Device        = require("../models/device"),
    RelaySettings = require("../models/relaySettings"),
    OutletBuilder = require("../classes/outlet"),
    ip            = require("ip"),
    fs            = require("fs"),
    path          = require("path"),
    localIP       = ip.address();

console.log("Local IP: " + localIP + "\n");
const GPIO_EXPORT = (localIP === "192.168.254.202") ? 'out' : 'high';
var outletHelpers = {
        outletObj: {},
        doesOutletExist(outlet_id){
            return outlet_id in this.outletObj;
        },
        getOutletIdByGpio(gpio){
            let self = this;
            for(const [outlet_id, outlet] of Object.entries(self.outletObj)){
                if(gpio === outlet.gpio) return outlet_id;
            }
            return undefined;
        },
        getOutletById(outletId){
            if(!this.doesOutletExist(outletId))
                return null;
            return this.outletObj[outletId];
        },
        // NOT COMPLETE - myGpio is not set
        // createOutlet: function(newOutlet){
        //     let self = this;
        //     Device.create(newOutlet, (err, myDevice) => {
        //         if(err){
        //             console.log(err);
        //             throw err;
        //         }else{
        //             var myOutlet = new Gpio(myGpio, GPIO_EXPORT);
        //             var initialState = myOutlet.readSync();
        //             console.log("Initial State:", initialState);
        //             self.setOutlet({id: myDevice['_id'], gpio: myGpio, initialState: initialState, outlet: myOutlet});
        //             console.log("Status: ", self.getStatus(myGpio));
        //         }
        //     });
        // },
        releaseGpioMem: function(){
            // this.outletArr.forEach((outlet) => {
            //     outlet['outlet'].unexport();
            // });
        },
        getOutletSetup: function(){
            var self = this;
            console.log("in getOutlets\n");
            let relay_config = {
                id: "test",
                relayId: "12344",
                direction: "high",
                gpio: 3,
                relayType: "light"
            }
            let outlet = new OutletBuilder()
                .withRelaySettings(relay_config)
                .build();
            self.outletObj[relay_config['relayId']] = outlet;
            // console.log(`outlet: ${JSON.stringify(outlet)}`);
            // console.log(`status: ${outlet.status}`);
            // outlet.activate = 1;
            // console.log(`status: ${outlet.status}`);
        //     Device.findOne({
        //         local_ip: localIP, 
        //         deviceType: "Relay Server"
        //     }, (err, myDevice) => {
        //         if(err){
        //             console.log(err);
        //             throw err;
        //         }
        //         else{
        //             console.log("My Device: ", myDevice);
        //             if(myDevice){
        //                 console.log("Test: ", myDevice);
        //                 myDevice['gpio'].forEach(function(myGpio){
        //                     RelaySettings.findOne({
        //                         relayId: myDevice["_id"], 
        //                         gpio: myGpio
        //                     }, function(err, relay_config){
        //                         if(err){
        //                             console.log(err.toString());
        //                             throw err;
        //                         }else{
        //                             let outlet = new Outlet(relay_config);
        //                             // var myOutlet = new Gpio(myGpio, relay_config["direction"]);
        //                             // var initialState = myOutlet.readSync();
        //                             // console.log("Initial State:", initialState);
        //                             // self.setOutlet({
        //                             //     id: myDevice['_id'], 
        //                             //     gpio: myGpio, 
        //                             //     initialState: initialState, 
        //                             //     outlet: myOutlet
        //                             // });
        //                             // console.log("Status: ", self.getStatus(myGpio));
        //                         }
        //                     });
        //                 });
        //                 console.log(self.outletArr);
        //             }else{
        //                 throw "No configuration found for this device!"
        //             }
        //         }
        //     });
        },
        // setOutlet: function(newOutletObj){
        //     this.outletArr.push(newOutletObj);   
        // },
        // updatedOutlet = {
        //      local_ip: local_ip, 
        //      device_name: device_name,
        //      device_type: device_type,
        //      gpio: gpio
        // }
        // updatedGpio: [ { prevGpio: prevGpio, newGpio: newGpio }]
        // editOutlet: function(device_id, updatedOutlet, updatedGpio){
        //     let self = this;
        //     // make sure all prevGpios in updatedOutlet array exist in the current setup
        //     updatedGpio.forEach(function(gpip){
        //         let index = self.findOutletByGpio(gpio['prevGpio']);
        //         if(index !== -1){ 
        //             gpio['outletArrIdx'] = index; // save the idx that the gpio was found in
        //         }else{
        //             throw "Gpio not found in setup!";
        //         }
        //     });
        //     Device.findByIdAndUpdate(device_id, {$set: updatedOutlet}, (err, myDevice) => {
        //         if(err){
        //             console.log(err);
        //         }else{
        //             updatedGpio.forEach(function(gpip){
        //                let index = gpio['outletArrIdx'];
        //                if(gpio['prevGpio'] !== gpio['updatedGpio']){
        //                    self.outletArr[index]['outlet'].unexport();
        //                    if(updatedGpio['newGpio'] !== undefined && updatedGpio['newGpio'] !== null){
        //                        self.outletArr[index]['outlet'] = new Gpio(gpio['newGpio'], GPIO_EXPORT);
        //                    }else{ // case 2: gpio['newGpio'] is undefined or null
        //                         self.outletArr.splice(index, 1); // delete 
        //                    }
        //                }else{ // gpio did not change
        //                    // do nothing
        //                }
        //             });
        //             self.outletArr.forEach(function(outlet){
                        
        //             });
        //             // case 1: gpio is updated
        //             //  - clear resources for each outlet
        //             // self.outletArr[index]['outlet'].unexport();
        //             // case 2: gpio['newGpio'] is undefined or null
        //             //  - clear resources for each outlet
        //             // self.releaseGpioMem();
        //         }
        //     });
        // },
        // deleteOutlet: function(outlet_id, gpio_input){
        //     let self = this;
        //     let index = self.findOutletByGpio(gpio_input);
        //     console.log("in activateRelay\n");
        //     if(index !== -1){
        //         Device.findByIdAndDelete(outlet_id, (err, myDevice) => {
        //             if(err){
        //                 console.log(err);
        //                 throw err;
        //             }else{
        //                 self.outletArr[index]['outlet'].unexport();
        //                 self.outletArr.splice(index, 1);
        //             }
        //         });
        //     }
        // },
        // toggleRelay: function(gpio_input) {
        //     let self = this;
        //     let index = self.findOutletByGpio(gpio_input);
        //     console.log("in activateRelay\n");
        //     if(index !== -1){
        //         console.log("Outlet " + gpio_input + " activated on " + new Date().toISOString() + "\n");
        //         //if(self.getStatus(gpio_input))
                
        //         //self.outletArr[index]['outlet'].writeSync(self.outletArr[index]['outlet'].readSync());
        //         if(self.outletArr[index]['outlet'].readSync() === 0){ //check the pin state, if the state is 0 (or off)
        //             self.outletArr[index]['outlet'].writeSync(1); //set pin state to 1 (turn LED on)
        //         }else{
        //             self.outletArr[index]['outlet'].writeSync(0); //set pin state to 0 (turn LED off)
        //         }
        //     }
        // },
        activateRelay: function(outletId, desired_state){
            let outlet = this.getOutletById(outletId);
            if(outlet){
                outlet.activate = desired_state;
            }

        },
        activateRelayByGpio: function(gpio_input, desired_state) {
            let outletId = this.getOutletIdByGpio(gpio_input);
            this.activateRelay(outletId, desired_state);
        },
        getStatus: function(outletId){
            let outlet = this.getOutletById(outletId);
            if(!outlet){
                return outlet;
            }
            return outlet.status;
        },
        getStatusByGpio: function(gpio_input){
            let outletId = this.getOutletIdByGpio(gpio_input);
            return this.getStatus(outletId);
        },
        // findOutletByGpio: function(gpio_input){
        //     return this.outletArr.findIndex((outlet) => outlet['gpio'] === gpio_input);
        // },
        // findOutletById: function(outlet_id){
        //     return this.outletArr.findIndex((outlet) => outlet['_id'] === outlet_id);
        // }
}
module.exports = outletHelpers;

outletHelpers.getOutletSetup();
let status = outletHelpers.getStatusByGpio(3);
console.log(`status: ${status}`);
outletHelpers.activateRelayByGpio(3, 1);
status = outletHelpers.getStatusByGpio(3);
console.log(`status: ${status}`);
let outletId = outletHelpers.getOutletIdByGpio(3);
console.log(`outletId found? - ${outletId}`);


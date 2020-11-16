var express    = require("express"),
    middleware = require("../middleware"),
    Device     = require("../models/device"),
    Camera     = require("../models/cameraSettings"),
    Room       = require("../models/room"),
    WaterSettings = require("../models/waterSettings"),
    RelaySettings = require("../models/relaySettings"),
    router     = express.Router();

    // Shows all devices
router.get("/", middleware.isLoggedIn, (req, res) =>{
    let page_name = "room",
        allDevicesObj = { 
            'DHT11 Sensor': [],
            'DHT22 Sensor': [],
            'Relay Server': [] ,
            'Soil Moisture Sensor': [],
            'Water Sensor' : [],
            'Camera': []
        },
        // create a new object that copies allDeviceObj, but is not a reference
        // to allDevicesObj
        availableDevicesObj = JSON.parse(JSON.stringify(allDevicesObj));

    // find all devices in the database
    Device.find({}, (err, devices)=>{
        if(err) console.log(err);
        else{
            let devicesProcessed = 0;
            let availableWaterPumps = [];
            
            // Find Relay Servers, grab their additional relay settings so we can find which relay servers
            // are set up as a water pump and add those devices into the availableWaterPumps array.
            // Once we have processed all devices, call the callback function where we will figure out
            // which devices are unavailable before rendering the device page
            devices.forEach(function(device, i){
                devicesProcessed++;
                // find additional relay settings
                if(device['deviceType'] === 'Relay Server'){
                    console.log(`Relay Server Found: ${JSON.stringify(device)}`);
                    RelaySettings.find( {relayId: device['_id']}, function(err, relaySettings){
                        if(err){
                            console.log(`Error: did not find Relay Settings: ${err.toString()}`); 
                        } 
                        else{
                            relaySettings.forEach(function(relaySetting){
                                if(relaySetting['relayType'] === 'water pump'){
                                    console.log(`Water pump found!!!`);
                                    availableWaterPumps.push(relaySetting);
                                }
                            });
                        }
                        // Have we processed all devices?
                        if(devicesProcessed === devices.length){
                            callback();
                        }
                    });
                }

            });
            // This callback is the last function to be called to help breakup nested callbacks
            let callback = function(){
                console.log(`in callback with waterpumps: ${JSON.stringify(availableWaterPumps)}`);
                // find all rooms in the database
                Room.find({}, (err, rooms) => {
                    if(err) console.log(err.toString());
                    else{
                        let unavailableDevices = [];
                        // Find out which devices are already set up in a room
                        /* 11/11/2020 - Futher code improvement: each room has the key 'roomDeviceIds',
                         * an array of device id's that the room is using. We could merge each room's 'roomDeviceIds'
                         * array into 1 array, before processing which devices are available to be added to a new room
                         */
                        devices.forEach(function(device, i){
                            rooms.forEach(function(room){
                                 // if a device is already set up in one of our rooms, this means that this 
                                 // device is unavailable to be added to a new room
                                const foundDeviceId = room['roomDeviceIds'].includes(device['_id']);
                                
                                if(foundDeviceId){ // device belongs to another room
                                    // keep track of what device is unavailable
                                    unavailableDevices.push(device['_id']); 
                                    // See if the device is a Relay Server that's set up as a water pump
                                    if(device['deviceType'] === "Relay Server"){
                                        // availableWaterPumps includes all Relay Server water pumps that are set up in the database
                                        // if availableWaterPumps contains the id of the device that's unavailable, we then need
                                        // to remove the water pump from the availableWaterPumps array since that water pump is 
                                        // also unavailable
                                        let index = availableWaterPumps.findIndex((waterPump) => waterPump['relayId'].toString() === device['_id'].toString());
                                        if(index !== -1){
                                            availableWaterPumps.splice(index, 1);
                                        }
                                    }
                                }

                            });
                            // if our unavailableDevices array does not include our device id,
                            // then this means that the device is available to be used in a new room
                            if(!unavailableDevices.includes(device['_id'])){
                                availableDevicesObj[device['deviceType']].push(device);
                            }
                            allDevicesObj[device['deviceType']].push(device);
                        })

                        console.log(`All Devices Found: ${JSON.stringify(allDevicesObj)}`)
                        console.log(`All Devices available: ${JSON.stringify(availableDevicesObj)}`);
                        
                        res.status(200).render("room/index", 
                            {
                                page_name: page_name,
                                availableWaterPumps: availableWaterPumps,
                                rooms: rooms,
                                allDevicesObj: allDevicesObj,
                                availableDevicesObj: availableDevicesObj,
                                stylesheets: ["/static/css/table.css"]
                            }, (err, html) => {
                                // fix: https://stackoverflow.com/questions/52122272/err-http-headers-sent-cannot-set-headers-after-they-are-sent-to-the-client
                                if(err) return;
                                res.send(html);
                                res.end();
                            }

                        );
                    }
                })
            }
        }
    });
});
router.post("/", middleware.isLoggedIn, (req, res) => {
    console.log(`in POST -> /room with body: ${JSON.stringify(req.body)}`);
    let body = req.body,
        roomName = body.roomName,
        roomType = body.roomType,
        roomDeviceIds = body.roomDeviceIds,
        roomWaterDetails = req.body.roomWaterDetails;

    let roomWaterDetailsArr = [];

    let validInput = true,
        inputType = typeof roomWaterDetails['relayId'],
        validInputArr = [
            roomWaterDetails['relayId'], 
            roomWaterDetails['waterFlowRate'],
            roomWaterDetails['containerSize'], 
            roomWaterDetails['numOfWaterLines']
        ]

    let count = validInputArr.length - 1;
    validInputArr.forEach(function(input, i, array){
        inputType = typeof input;
        if(inputType === 'object'){   
            if(input.length !== array[count--].length){
                validInput = false;
            }
        }
    })

    if(inputType === 'object'){
        roomWaterDetails['relayId'].forEach(function(relayId, i){
            let roomWaterDetail = {
                "relayId": relayId,
                "waterFlowRate": roomWaterDetails['waterFlowRate'][i],
                "containerSize": roomWaterDetails['containerSize'][i],
                "numOfWaterLines": roomWaterDetails['numOfWaterLines'][i]
            }
            roomWaterDetailsArr.push(roomWaterDetail);
        })
    }else if(inputType === 'string'){
        let roomWaterDetail = {
            "relayId": roomWaterDetails['relayId'],
            "waterFlowRate": roomWaterDetails['waterFlowRate'],
            "containerSize": roomWaterDetails['containerSize'],
            "numOfWaterLines": roomWaterDetails['numOfWaterLines']
        }
        roomWaterDetailsArr.push(roomWaterDetail);
    }else{
        console.log("Invalid input given for required water details");
    }

    console.log(`room name: ${roomName}`);
    console.log(`roomDeviceIds: ${roomDeviceIds}`);
    console.log(`roomWaterDetails: ${roomWaterDetails}`);
    // we need to make sure that the device ids that we are adding to the current room don't
    // already belong to another room that already exists
    Room.find( (err, rooms) => {
        if(err) console.log(err.toString());
        else{
            console.log(`Rooms found: ${JSON.stringify(rooms)}`);
            let foundDeviceIds = [];
            rooms.forEach(function(room){
                room['roomDeviceIds'].forEach(function(roomDeviceId){
                    console.log(`current roomDeviceId: ${roomDeviceId}`);
                    const foundDeviceId = roomDeviceIds.includes(roomDeviceId.toString());
                    console.log(`foundDeviceId: ${foundDeviceId}`);
                    if(foundDeviceId){
                        foundDeviceIds.push(roomDeviceId);
                    }
                });
            });
            console.log("Room Create Statement");
            if(foundDeviceIds.length > 0){
                req.flash("error", "The devices that you are trying to add belongs to another room");
                res.redirect("/room");
                res.status(400).end();
            }else{
                Room.create({
                    roomName: roomName, 
                    roomType: roomType,
                    roomDeviceIds: roomDeviceIds,
                    roomWaterDetails: roomWaterDetailsArr,
                }, (err, newRoom) => {
                    if(err) console.log(err.toString());
                    else{
                        console.log("New Room created: " + newRoom);
                        req.flash("success", "Room was successfully created");
                        res.redirect("/room");
                        res.status(200).end();
                    }
                })
            }

        }
    });
});

router.get("/:room_id", middleware.isLoggedIn, (req, res) => {

});
router.put("/:room_id", middleware.isLoggedIn, (req, res) =>{
    console.log(`in PUT -> /room with body: ${JSON.stringify(req.body)}`);
    let room_id = req.params.room_id,
        body = req.body,
        roomName = body.roomName,
        roomType = body.roomType,
        roomDeviceIds = body.roomDeviceIds,
        roomWaterDetails = req.body.roomWaterDetails;

    let roomWaterDetailsArr = [];

    let validInput = true,
        inputType = typeof roomWaterDetails['relayId'],
        validInputArr = [
            roomWaterDetails['relayId'], 
            roomWaterDetails['waterFlowRate'],
            roomWaterDetails['containerSize'], 
            roomWaterDetails['numOfWaterLines']
        ]

    let count = validInputArr.length - 1;
    validInputArr.forEach(function(input, i, array){
        inputType = typeof input;
        if(inputType === 'object'){   
            if(input.length !== array[count--].length){
                validInput = false;
            }
        }
    })

    if(inputType === 'object'){
        roomWaterDetails['relayId'].forEach(function(relayId, i){
            let roomWaterDetail = {
                "relayId": relayId,
                "waterFlowRate": roomWaterDetails['waterFlowRate'][i],
                "containerSize": roomWaterDetails['containerSize'][i],
                "numOfWaterLines": roomWaterDetails['numOfWaterLines'][i]
            }
            roomWaterDetailsArr.push(roomWaterDetail);
        })
    }else if(inputType === 'string'){
        let roomWaterDetail = {
            "relayId": roomWaterDetails['relayId'],
            "waterFlowRate": roomWaterDetails['waterFlowRate'],
            "containerSize": roomWaterDetails['containerSize'],
            "numOfWaterLines": roomWaterDetails['numOfWaterLines']
        }
        roomWaterDetailsArr.push(roomWaterDetail);
    }else{
        console.log("Invalid input given for required water details");
    }
    Room.find( (err, rooms) => {
        if(err) console.log(err.toString());
        else{
            console.log(`Rooms found: ${JSON.stringify(rooms)}`);
            let foundDeviceIds = [];
            rooms.forEach(function(room){
                if(room["_id"].toString() !== room_id){ 
                    room['roomDeviceIds'].forEach(function(roomDeviceId){
                        console.log(`current roomDeviceId: ${roomDeviceId}`);
                        const foundDeviceId = roomDeviceIds.includes(roomDeviceId.toString());
                        console.log(`foundDeviceId: ${foundDeviceId}`);
                        if(foundDeviceId){
                            foundDeviceIds.push(roomDeviceId);
                        }
                    });
                }
            });
            console.log("Room Create Statement");
            if(foundDeviceIds.length > 0){
                req.flash("error", "The devices that you are trying to add belongs to another room");
                res.redirect("/room");
                res.status(400).end();
            }else{
                Room.findByIdAndUpdate(room_id, {
                    roomName: roomName, 
                    roomType: roomType,
                    roomDeviceIds: roomDeviceIds,
                    roomWaterDetails: roomWaterDetailsArr,
                }, (err, room) => {
                    if(err){
                        console.log(err.toString());
                        res.write("404: ", JSON.stringify(err));
                        res.status(404).end();
                    }else{
                        console.log("Room successfully updated");
                        req.flash("success", "The room was successfully updated!");
                        res.redirect("/room");
                        res.status(200).end();
                    }
                });
            }
        }
    });
});
router.delete("/:room_id", middleware.isLoggedIn, (req, res) =>{
    console.log("In room delete");
    let room_id = req.params.room_id;

    Room.findByIdAndRemove(room_id, (err) => {
        if(err){
            console.log(err.toString());
            res.write("404: ", JSON.stringify(err));
            res.status(404).end();
        } 
        else{
            console.log("Room successfully removed");
            console.log("Successfully Deleted!");
            res.redirect("/room");
            res.status(200).end();
        }
    });
});
// edit page will show the devices that are currently set up in the room we
// are trying to update along with additional devices that are available to be
// added to the room
router.get("/:room_id/edit", middleware.isLoggedIn, (req, res) =>{
    console.log("in room edit");
    let page_name = "Room Edit",
        room_id = req.params.room_id,
        deviceObj = { 
            'DHT11 Sensor': [],
            'DHT22 Sensor': [],
            'Relay Server': [] ,
            'Soil Moisture Sensor': [],
            'Water Sensor' : [],
            'Camera': []
        };
    Device.find({}, (err, devices)=>{
        if(err) console.log(err);
        else{
            Room.findById(room_id, function(err, room){
                if(err) console.log(err.toString());
                else{
                    let devicesProcessed = 0;
                    let availableWaterPumps = [];
                    console.log(`Room Found: ${JSON.stringify(room)}`);
                    // Find Relay Servers, grab their additional relay settings so we can find which relay servers
                    // are set up as a water pump and add those devices into the availableWaterPumps array.
                    // Once we have processed all devices, call the callback function where we will figure out
                    // which devices are unavailable before rendering the device page
                    devices.forEach(function(device, i){
                        devicesProcessed++;
                        // find additional relay settings
                        if(device['deviceType'] === 'Relay Server'){
                            console.log(`Relay Server Found: ${JSON.stringify(device)}`);
                            RelaySettings.find( {relayId: device['_id']}, function(err, relaySettings){
                                if(err){
                                    console.log(`Error: did not find Relay Settings: ${err.toString()}`); 
                                } 
                                else{
                                    relaySettings.forEach(function(relaySetting){
                                        if(relaySetting['relayType'] === 'water pump'){
                                            console.log(`Water pump found!!!`);
                                            availableWaterPumps.push(relaySetting);
                                        }
                                    });
                                }
                                // Have we processed all devices?
                                if(devicesProcessed === devices.length){
                                    callback();
                                }
                            });
                        }

                    });
                    let callback = function(){
                        Room.find({}, (err, rooms) => {
                            if(err) console.log(err.toString());
                            else{
                                console.log(`Rooms found: ${JSON.stringify(rooms)}`);
                                let unavailableDevices = [];
                                devices.forEach(function(device){
                                    rooms.forEach(function(room){
                                        // look at the devices being used in other rooms to see what is 
                                        // available to be added to our room that we are trying to update
                                        if(room["_id"].toString() !== room_id){ 
                                            console.log("diff room found: " + room["_id"] + " " + room_id);
                                            const foundDeviceId = room['roomDeviceIds'].includes(device['_id']);
                                            if(foundDeviceId){
                                                // keep track of what device is unavailable
                                                unavailableDevices.push(device['_id']); 
                                                // See if the device is a Relay Server that's set up as a water pump
                                                if(device['deviceType'] === "Relay Server"){
                                                    // availableWaterPumps includes all Relay Server water pumps that are set up in the database
                                                    // if availableWaterPumps contains the id of the device that's unavailable, we then need
                                                    // to remove the water pump from the availableWaterPumps array since that water pump is 
                                                    // also unavailable
                                                    let index = availableWaterPumps.findIndex((waterPump) => waterPump['relayId'].toString() === device['_id'].toString());
                                                    if(index !== -1){
                                                        availableWaterPumps.splice(index, 1);
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    if(!unavailableDevices.includes(device['_id'])){
                                        deviceObj[device['deviceType']].push(device);
                                    }
                                });
                            }
                            res.status(200).render("room/edit",{
                                    availableWaterPumps: availableWaterPumps,
                                    page_name: page_name,
                                    deviceObj: deviceObj,
                                    room: room,
                                    rooms: rooms,
                                    stylesheets: ["/static/css/table.css"]
                                }, (err, html) => {
                                    // fix: https://stackoverflow.com/questions/52122272/err-http-headers-sent-cannot-set-headers-after-they-are-sent-to-the-client
                                    if(err) return;
                                    res.send(html);
                                    res.end();
                                }
                            );
                        });
                    }    
                }
            });
        }
    });
});
module.exports = router;
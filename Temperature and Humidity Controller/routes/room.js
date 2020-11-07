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

    Device.find( (err, devices)=>{
        if(err) console.log(err);
        else{
            let devicesProcessed = 0;
            let availableWaterPumps = [];
            let callback = function(){
                console.log(`in callback with waterpumps: ${JSON.stringify(availableWaterPumps)}`);
                Room.find({}, (err, rooms) => {
                    if(err) console.log(err.toString());
                    else{
                        let unavailableDevices = [];
                        devices.forEach(function(device, i){
                            rooms.forEach(function(room){
                                const foundDeviceId = room['roomDeviceIds'].includes(device['_id']);
                                
                                if(foundDeviceId){
                                    unavailableDevices.push(device['_id']);
                                    if(device['deviceType'] === "Relay Server"){
                                        let index = availableWaterPumps.findIndex((waterPump) => waterPump['relayId'].toString() === device['_id'].toString());
                                        if(index !== -1){
                                            availableWaterPumps.splice(index, 1);
                                        }
                                        console.log("Water Pump already in use? - " + index);
                                    }
                                }

                            });
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
                                waterPumps: availableWaterPumps,
                                rooms: rooms,
                                allDevicesObj: allDevicesObj,
                                availableDevicesObj: availableDevicesObj,
                                stylesheets: ["/static/css/table.css"]
                            }, (err, html) => {
                                // fix: https://stackoverflow.com/questions/52122272/err-http-headers-sent-cannot-set-headers-after-they-are-sent-to-the-client
                                if(err) return;
                                res.send(html);
                            }

                        );
                    }
                })
            }
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
                            console.log(`relayType: ${relaySettings}`);
                            // devices[i]['relayType'] = relaySettings['relayType'];
                            console.log(`Relay Server Found: ${JSON.stringify(devices[i])} `);
                        }

                        console.log(`devicesProcessed: ${devicesProcessed}, devices.length: ${devices.length}`);
                        if(devicesProcessed === devices.length){
                            console.log("done Processing extra device settings..");
                            callback();
                        }
                    });
                }

            });

        }
    });
});
router.post("/", middleware.isLoggedIn, (req, res) => {
    console.log(`in POST -> /room with body: ${JSON.stringify(req.body)}`);
    let body = req.body,
        roomName = body.roomName,
        roomType = body.roomType,
        roomDeviceIds = body.roomDeviceIds;

    console.log(`room name: ${roomName}`);
    console.log(`roomDeviceIds: ${roomDeviceIds}`);
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
                    roomDeviceIds: roomDeviceIds
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
        updated_room_config = req.body,
        roomDeviceIds = req.body.roomDeviceIds;

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
                Room.findByIdAndUpdate(room_id, {$set: updated_room_config}, (err, room) => {
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
    Device.find( (err, devices)=>{
        if(err) console.log(err);
        else{
            Room.findById(room_id, function(err, room){
                if(err) console.log(err.toString());
                else{
                    console.log(`Room Found: ${JSON.stringify(room)}`);
                    Room.find( (err, rooms) => {
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
                                            unavailableDevices.push(device['_id']);
                                        }
                                    }
                                });
                                if(!unavailableDevices.includes(device['_id'])){
                                    deviceObj[device['deviceType']].push(device);
                                }
                            });
                        }
                        res.render("room/edit", {
                            page_name: page_name,
                            deviceObj: deviceObj,
                            room: room,
                            rooms: rooms,
                            stylesheets: ["/static/css/table.css"]
                        });
                        res.status(200).end();
                    });
                }
            });
        }
    });
});
module.exports = router;
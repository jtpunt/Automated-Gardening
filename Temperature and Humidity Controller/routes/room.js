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
            Room.find( (err, rooms) => {
                if(err) console.log(err.toString());
                else{
                    console.log(`Rooms found: ${JSON.stringify(rooms)}`);
                    devices.forEach(function(device){
                        if(!device['deviceType'] in deviceObj)
                            deviceObj[device['deviceType']] = [];
                        else
                            console.log("device is already in the deviceObj");
                        deviceObj[device['deviceType']].push(device);
                    })
                    console.log(`DeviceObj: ${JSON.stringify(deviceObj)}`);
                    console.log(`Rooms: ${JSON.stringify(rooms)}`);
                    res.render("room/index", {
                        page_name: page_name,
                        rooms: rooms,
                        deviceObj: deviceObj,
                        stylesheets: ["/static/css/table.css"]
                    });
                    res.status(200).end();
                }
            })
        }
    });
});
router.post("/", middleware.isLoggedIn, (req, res) => {
    console.log(`in POST -> /room with body: ${JSON.stringify(req.body)}`);
    let body = req.body,
        roomName = body.roomName,
        roomDeviceIds = Array.from(body.roomDeviceIds);

    console.log(`room name: ${roomName}`);
    console.log(`roomDeviceIds: ${roomDeviceIds}`);
    Room.create({roomName: roomName, roomDeviceIds: roomDeviceIds}, (err, newRoom) => {
        if(err) console.log(err.toString());
        else{
            console.log("New Room created: " + newRoom);
            res.redirect("/room");
            res.status(200).end();
        }
    })
});

router.get("/:room_id", middleware.isLoggedIn, (req, res) => {

});
router.put("/:room_id", middleware.isLoggedIn, (req, res) =>{
    console.log(`in PUT -> /room with body: ${JSON.stringify(req.body)}`);
    let room_id = req.params.room_id,
        updated_room_config = req.body;

    Room.findByIdAndUpdate(room_id, {$set: updated_room_config}, (err, room) => {
        if(err){
            console.log(err.toString());
            res.write("404: ", JSON.stringify(err));
            res.status(404).end();
        }else{
            console.log("Room successfully updated");
            res.redirect("/room");
            res.status(200).end();
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
                            devices.forEach(function(device){
                                if(!device['deviceType'] in deviceObj)
                                    deviceObj[device['deviceType']] = [];
                                else
                                    console.log("device is already in the deviceObj");
                                deviceObj[device['deviceType']].push(device);
                            })
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
            })

            
        }
    });
});
module.exports = router;
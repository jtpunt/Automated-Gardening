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
router.get("/:room_id", middleware.isLoggedIn, (req, res) => {

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
            res.status(200).end();
        }
    })
});
router.put("/:room_id", middleware.isLoggedIn, (req, res) =>{
    console.log("in ")
});
router.get("/:room_id/edit", middleware.isLoggedIn, (req, res) =>{
    console.log("in room edit");
    res.status(200).end();
});

module.exports = router;
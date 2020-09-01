var express    = require("express"),
    Device         = require("../models/device"),
    router     = express.Router();

// Shows all devices
router.get("/", (req, res) =>{
    let page_name = "device";
    var deviceObj = { 
        'DHT11 Sensor': [],
        'DHT22 Sensor': [],
        'Relay Server': [] ,
        'Soil Moisture Sensor': [],
        'Water Level Sensor' : [] 
    } 
    
    Device.find( (err, devices)=>{
        if(err) console.log(err);
        else{
            console.log(devices);
            devices.forEach(function(device){
                if(!device['deviceType'] in deviceObj)
                    deviceObj[device['deviceType']] = [];
                else
                    console.log("device is already in the deviceObj");
                deviceObj[device['deviceType']].push(device);
            })

            res.render("device/index", {
                page_name: page_name,
                deviceObj: deviceObj,
                stylesheets: ["/static/css/table.css"]
            });
            res.status(200).end();
        }
    })
});
router.get("/:device_id", (req, res) => {

});
router.post("/", (req, res) => {

});
//EDIT
router.get("/:device_id/edit", (req, res) => {
    console.log("in edit route..\n");
    Device.findById(req.params.device_id, (err, device) =>{
        if(err) res.redirect("back");
        else{
            console.log(device);
            res.render("device/edit", {device: device});
        }
    });
});
// UPDATE
router.put("/:device_id", (req, res) => {
    console.log("in put request!");
    console.log(req.body);
     
    let newData = {
        local_ip: req.body.local_ip, 
        deviceName: req.body.deviceName, 
        gpio: req.body.gpio
    };
    Device.findByIdAndUpdate(req.params.device_id, {$set: newData}, (err, device) => {
        if(err){
            res.redirect("back");
        } else {
            console.log("Successfully Updated!");
            res.redirect("/devices");
            res.status(200).end();
        }
    });
})
// router.get("/:device_id/avg");
// router.get("/:device_id/start_date/:start_date/avg");
// router.get("/:device_id/start_date/:start_date/end_date/:end_date");
// router.get("/:device_id/start_date/:start_date/end_date/:end_date/average");

router.delete("/:device_id", (req, res) => {

});

module.exports = router;
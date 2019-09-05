var express    = require("express"),
    Device         = require("../models/device"),
    router     = express.Router();

// Shows all devices
router.get("/", (req, res) =>{
    var dht11Arr = [];
    var dht22Arr = [];
    var relayArr = [];
    var soilArr  = [];
    var waterArr = [];
    Device.find( (err, devices)=>{
        if(err) console.log(err);
        else{
            console.log(devices);
            devices.forEach(function(device){
                if(device['deviceType'] === 'DHT11 Sensor'){
                    dht11Arr.push(device);
                }else if(device['deviceType'] === 'DHT22 Sensor'){
                    dht22Arr.push(device);
                }else if(device['deviceType'] === 'Relay Server'){
                    relayArr.push(device);
                }else if(device['deviceType'] === 'Soil Moisture Sensor'){
                    soilArr.push(device);
                }else if(device['deviceType'] === 'Water Level Sensor'){
                    waterArr.push(device);
                }else{
                    console.log("Unknown device type found!\n");
                    res.status(500).end();
                }
            })
            console.log(dht11Arr, dht22Arr, relayArr, soilArr, waterArr);
            res.render("device/index", {dht11Arr: dht11Arr, dht22Arr: dht22Arr, relayArr: relayArr, soilArr: soilArr, waterArr: waterArr,  stylesheets: ["/static/css/table.css"]});
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
    let newData = { deviceName: req.body.deviceName, gpio: req.body.gpio};
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
router.delete("/:device_id", (req, res) => {

});

module.exports = router;
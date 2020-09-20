var express    = require("express"),
    middleware = require("../middleware"),
    Device     = require("../models/device"),
    Camera     = require("../models/cameraSettings"),
    WaterSettings = require("../models/waterSettings"),
    router     = express.Router();

// Shows all devices
router.get("/", middleware.isLoggedIn, (req, res) =>{
    let page_name = "device";
    var deviceObj = { 
        'DHT11 Sensor': [],
        'DHT22 Sensor': [],
        'Relay Server': [] ,
        'Soil Moisture Sensor': [],
        'Water Sensor' : [],
        'Camera': []
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
router.get("/:device_id/edit", middleware.isLoggedIn, (req, res) => {
    let page_name = "edit";
    console.log("in edit route..\n");
    Device.findById(req.params.device_id, (err, device) =>{
        if(err) res.redirect("back");
        else{
            if(device['deviceType'] === 'Camera'){
                Camera.findOne({ camera_id: device['id'] }, (err, camera) => {
                    if(err) console.log(err.toString());
                    else{
                        console.log(`Found camera settings: ${JSON.stringify(camera)}`)
                        res.render("device/edit", {
                            cameraSettings: camera,
                            page_name: page_name,
                            device: device
                        }); 
                    }
                });
            }else if(device['deviceType'] === 'Water Sensor'){
                Device.find({ deviceType: "Relay Server" } ,(err, relay_devices) =>{
                    if(err) console.log(err.toString());
                    else{
                        console.log(`Relay Devices ${relay_devices}`)
                        res.render("device/edit", {
                            relay_devices: relay_devices,
                            page_name: page_name,
                            device: device
                        }); 
                    }
                })
            }else{
                console.log(device);
                res.render("device/edit", {
                    page_name: page_name,
                    device: device
                });
            }
        }
    });
});
// UPDATE
router.put("/:device_id", middleware.isLoggedIn, (req, res) => {
    console.log(`In put request with: ${JSON.stringify(req.body)}`);
     
    let newData = {
        local_ip: req.body.local_ip, 
        deviceName: req.body.deviceName, 
        gpio: req.body.gpio
    };
    Device.findByIdAndUpdate(req.params.device_id, {$set: newData}, (err, device) => {
        if(err){
            req.flash("error", err.toString());
            res.redirect("back");
        } else {
            if(device['deviceType'] === 'Camera'){
                let cameraData = {
                    camera_id: device['id'],
                    height: req.body.cameraHeight,
                    width: req.body.cameraWidth,
                    rotation: req.body.rotation
                }
                Camera.findOneAndUpdate({ camera_id: device['id'] }, {$set: cameraData}, (err, camera) => {
                    if(err){
                        console.log(err.toString());
                        req.flash("error", err.toString());
                        res.redirect("back");
                    }else{
                        if(camera === null){
                            console.log("Camera is null");
                            Camera.create(cameraData, (err, newCamera) => {
                                if(err) console.log('Error creating device');
                                else{
                                    console.log(`Created new camera settings ${JSON.stringify(newCamera)}`);
                                    console.log(`Successfully updated ${JSON.stringify(device)}`)
                                    console.log("Successfully Updated!");
                                    res.redirect("/device");
                                    res.status(200).end();
                                }
                            });
                        }else{
                            console.log("no error on camera update");
                            console.log(`Successfully updated ${JSON.stringify(device)}`)
                            console.log("Successfully Updated!");
                            res.redirect("/device");
                            res.status(200).end();
                        }
                    }
                });
            }else if(device['deviceType'] === "Water Sensor"){
                let water_config = {
                      checkMinsBefore: req.body.checkMinsBefore,
                      checkMinsAfter: req.body.checkMinsAfter,
                      relayId: req.body.targetDevice
                }
                // WaterSettings.findOneAndUpdate({ camera_id: device['id'] }, {$set: cameraData}, (err, camera) => {
                //     if(err){
                //         console.log(err.toString());
                //         req.flash("error", err.toString());
                //         res.redirect("back");
                //     }else{
                //         if(camera === null){
                //             console.log("Camera is null");
                //             WaterSettings.create(water_config, (err, new_water_config) => {
                //                 if(err) console.log('Error creating device');
                //                 else{
                //                     console.log(`Created new camera settings ${JSON.stringify(newCamera)}`);
                //                     console.log(`Successfully updated ${JSON.stringify(device)}`)
                //                     console.log("Successfully Updated!");
                //                     res.redirect("/device");
                //                     res.status(200).end();
                //                 }
                //             });
                //         }else{
                //             console.log("no error on camera update");
                //             console.log(`Successfully updated ${JSON.stringify(device)}`)
                //             console.log("Successfully Updated!");
                //             res.redirect("/device");
                //             res.status(200).end();
                //         }
                //     }
                // });
            }else{
                console.log(`Successfully updated ${JSON.stringify(device)}`)
                console.log("Successfully Updated!");
                res.redirect("/device");
                res.status(200).end();
            }
 
        }
    });
})
// router.get("/:device_id/avg");
// router.get("/:device_id/start_date/:start_date/avg");
// router.get("/:device_id/start_date/:start_date/end_date/:end_date");
// router.get("/:device_id/start_date/:start_date/end_date/:end_date/average");

router.delete("/:device_id", middleware.isLoggedIn, (req, res) => {
    // deleting a relay device should remove all associated schedules
    // deleting a camera device should remove all associated camera settings
    // deleting a water sensor device should remove all associated water settings
});

module.exports = router;
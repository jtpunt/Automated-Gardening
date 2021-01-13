var express    = require("express"),
    middleware = require("../middleware"),
    Device     = require("../models/device"),
    Camera     = require("../models/cameraSettings"),
    WaterSettings = require("../models/waterSettings"),
    RelaySettings = require("../models/relaySettings"),
    Room       = require("../models/room"),
    router     = express.Router();

// Shows all devices
router.get("/", middleware.isLoggedIn, (req, res) =>{
    let page_name = "device";
    // ** maybe there's a way to retrieve these device types from our mongo device model?
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
                stylesheets: ["/static/css/common/table.css"]
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
                Camera.findOne({ camera_id: device['_id'] }, (err, camera) => {
                    if(err) console.log(err.toString());
                    else{
                        console.log(`Found camera settings: ${JSON.stringify(camera)}`)
                        res.render("device/edit", {
                            cameraSettings: camera,
                            page_name: page_name,
                            device: device,
                            scripts: ["/static/js/device/edit.js"]
                        }); 
                    }
                });
            }else if(device['deviceType'] === 'Water Sensor'){
                Device.find({ deviceType: "Relay Server" } ,(err, relay_devices) =>{
                    if(err) console.log(err.toString());
                    else{
                        let waterId = device['_id'];
                        // We need to see which room this device is in to retrieve the room's grow system
                        // if the grow system is soil - the water sensor will check before a watering session
                        // and cancel the next watering session if water is detected
                        // if the grow system is ebb and flow - the water sensor will be placed in a control bucket,
                        // where if water is detected, this means it's time to drain the water from the control bucket
                        // back into the main water feeding bucket 
                        WaterSettings.findOne({waterId: waterId}, function(err, water_config){
                            if(err) {console.log(err.toString());
                                console.log(`Relay Devices ${relay_devices}`)
                                res.render("device/edit", {
                                    relay_devices: relay_devices,
                                    page_name: page_name,
                                    device: device,
                                    scripts: ["/static/js/device/edit.js"],
                                    stylesheets: ["/static/css/common/form.css"]
                                }); 
                            }
                            else{
                                console.log(`Water Config found: ${JSON.stringify(water_config)}`);
                                res.render("device/edit", {
                                    water_config: water_config,
                                    relay_devices: relay_devices,
                                    page_name: page_name,
                                    device: device,
                                    scripts: ["/static/js/device/edit.js"],
                                    stylesheets: ["/static/css/common/form.css"]
                                }); 
                            }
                        });
 
                    }
                })
            }else if(device['deviceType'] === 'Relay Server') {
                console.log(`Relay Device: ${JSON.stringify(device)}`);


                RelaySettings.find( {relayId: device['_id']}, function(err, relaySettings){
                    if(err) console.log(err.toString());
                    else{
                        let directionArr = [],
                            relayTypeArr = [];
                        console.log(`relaySettings: ${JSON.stringify(relaySettings)}`);
  
                       let query = {
                            roomDeviceIds: {
                                $in: [device['_id']]
                            }
                        }
                        Room.findOne(query, function(err, room){
                            if(err){
                                console.log(err.toString());
                            }else{
                                console.log(`Room found with relay device: ${JSON.stringify(room)}`);
                            }
                        })
                        console.log(`directArr: ${directionArr}`);
                        console.log(`relayTypeArr: ${relayTypeArr}`);

                        console.log(`Relay Settings found for device: ${JSON.stringify(relaySettings)}`);
                        res.render("device/edit", {
                            page_name: page_name,
                            device: device,
                            relaySettings: relaySettings,
                            scripts: ["/static/js/device/edit.js"],
                            stylesheets: ["/static/css/common/form.css"]
                        });
                    }
                });
            }else{
                console.log(device);
                res.render("device/edit", {
                    page_name: page_name,
                    device: device,
                    relaySettings: [],
                    scripts: ["/static/js/device/edit.js"],
                    stylesheets: ["/static/css/common/form.css"]
                });
            }
        }
    });
});
// UPDATE
router.put("/:device_id", middleware.isLoggedIn, (req, res) => {
    console.log(`In put request with: ${JSON.stringify(req.body)}`);
    let gpio = req.body.gpio;
    if(typeof gpio === 'string')
        gpio = [gpio];

    console.log(gpio)
    let newData = {
        local_ip: req.body.local_ip, 
        deviceName: req.body.deviceName, 
        gpio: gpio
    };
    Device.findByIdAndUpdate(req.params.device_id, {$set: newData}, (err, device) => {
        if(err){
            req.flash("error", err.toString());
            res.redirect("back");
        } else {
            console.log(`device updated: ${JSON.stringify(device)}`);
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
                let checkMinsBefore = req.body.checkMinsBefore,
                    checkMinsAfter  = req.body.checkMinsAfter,
                    relayId         = req.body.relayId,
                    waterId         = req.params.device_id.toString();
                    
                let water_config    = {
                        relayId: relayId,
                        waterId: waterId,   
                        checkMinsBefore: checkMinsBefore,
                        checkMinsAfter: checkMinsAfter,
                    }

                console.log(`water_config: ${JSON.stringify(water_config)}`)
                WaterSettings.findOneAndUpdate({ waterId: waterId }, {$set: water_config}, (err, updated_water_config) => {
                    if(err){
                        console.log(err.toString());
                        req.flash("error", err.toString());
                        res.redirect("back");
                    }else{
                        if(updated_water_config === null){
                            console.log("water_config is null");
                            WaterSettings.create(water_config, (err, new_water_config) => {
                                if(err) console.log('Error creating device');
                                else{
                                    console.log(`Created new water settings ${JSON.stringify(new_water_config)}`);
                                    console.log("Successfully Updated!");
                                    res.redirect("/device");
                                    res.status(200).end();
                                }
                            });
                        }else{
                            console.log("no error on water_config update");
                            console.log(`Successfully updated ${JSON.stringify(device)}`)
                            console.log("Successfully Updated!");
                            res.redirect("/device");
                            res.status(200).end();
                        }
                    }
                });
            }else if(device['deviceType'] === "Relay Server") {
                let relaySettings = req.body.relaySettings;
                console.log("Before if statement with relaySettings var: " + relaySettings);
                if(relaySettings){
                    console.log("relaySettings is valid")
                    let directionArr = relaySettings['direction'],
                        relayTypeArr = relaySettings['relayType'];
                    console.log(typeof directionArr)
                    console.log(typeof relayTypeArr);
                    console.log(typeof device['gpio'], device['gpio'])

                    if(typeof directionArr === 'string')
                        directionArr = [directionArr];
                    if(typeof relayTypeArr === 'string') 
                        relayTypeArr = [relayTypeArr];
                    // if(typeof device['gpio'] === 'object')
                    //     device['gpio'] = [device['gpio']];

                    console.log("Relay Settings: " + relaySettings);
                    console.log("DirectionArr: " + directionArr);
                    console.log("RelayTypeArr: " + relayTypeArr);
                    console.log(`directionArr.length - ${directionArr.length}`);
                    console.log(`relayTypeArr.length - ${relayTypeArr.length}`);
                    console.log(`directionArr.length - ${directionArr.length}`);
                    //console.log(`device['gpio'].length - ${device['gpio'].length}`);
                    if(directionArr.length === relayTypeArr.length && directionArr.length === gpio.length){
                        console.log(`DirectionArr: ${directionArr}`);
                        console.log(`RelayTypeArr: ${relayTypeArr}`);
                        console.log(`GPIO: ${device['gpio']}`);

                        gpio.forEach(function(myGpio, i){
                            let relay_config = {
                                relayId: device["_id"],
                                direction: directionArr[i],
                                gpio: myGpio,
                                relayType: relayTypeArr[i]
                            }
                            console.log(`relay_config: ${JSON.stringify(relay_config)}`);
                            let find = {
                                relayId: device['id'], 
                                gpio: myGpio
                            },
                            update = {
                                $set: relay_config
                            },
                            options = {
                                returnOriginal: false
                            }
                            RelaySettings.findOneAndUpdate(find, update, options, (err, original_relay_settings) => {
                                if(err){
                                    console.log(err.toString());
                                    // req.flash("error", err.toString());
                                    // res.redirect("back");
                                }else{
                                    console.log(`original_relay_settings: ${original_relay_settings}`);
                                    if(original_relay_settings === null){
                                        console.log("updated_relay_settings is null");
                                        RelaySettings.create(relay_config, (err, new_relay_setting) => {
                                            if(err) console.log(`Error Creating Relay Settings ${err}`);
                                            else{
                                                console.log(`Created new relay settings ${JSON.stringify(new_relay_setting)}`);
                                                console.log("Successfully Updated!");
                                            }
                                        });
                                    }else{
                                        if(original_relay_settings['relayType'] === 'water pump' && relay_config['relayType'] !== 'water pump'){
                                            console.log("original relay type is no longer a water pump");
                                            // find the room that is using our relay device by looking for it's id the array of device id's (AKA roomDeviceIds)
                                            let query = {
                                                roomDeviceIds: {
                                                    $in: [original_relay_settings['relayId']]
                                                }
                                            }
                                            // find the matching relaySettingsId located in the roomWaterDetails array
                                            // and then remove it since it is no longer a water pump device
                                            let update = {
                                                $pull: {
                                                    roomWaterDetails: { 
                                                        relaySettingsId: original_relay_settings['_id'].toString()
                                                    }
                                                }
                                            }
                                            Room.updateOne(query, update, function(err, field){
                                                if(err){
                                                    console.log(err.toString());
                                                }else{
                                                    console.log(`success?: ${JSON.stringify(field)}`);
                                                }
                                            });
                                        }else{
                                            console.log("no error on relaySettings update");
                                            console.log(`Successfully updated ${JSON.stringify(device)}`)
                                        }
                                    }
                                }
                            });
                        });
                        console.log("Successfully Updated!");
                        res.redirect("/device");
                        res.status(200).end();
                    }
                }else{
                    console.log("no relay settings found");
                    let find = {
                        relayId: device['id'], 
                    }
                    RelaySettings.deleteMany(find, function(err, relaySettings){
                        if(err){
                            console.log(err.toString());
                        }else{
                            console.log(`success? - ${JSON.stringify(relaySettings)}`);
                            console.log(`Successfully updated ${JSON.stringify(device)}`)
                            console.log("Successfully Updated!");
                            res.redirect("/device");
                            res.status(200).end();
                        }
                    })
                }   
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
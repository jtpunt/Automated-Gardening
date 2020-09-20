var Device   = require("../models/device"),
    ip       = require("ip"),
    fs       = require("fs"),
    path     = require("path"),
    fileName = path.join("../Camera/device_id.json"),
    async    = require("asyncawait/async"),
    await    = require("asyncawait/await"),
    env      = process.env.NODE_ENV || 'development',
    config   = require('../config')[env],
    port     = config.server.port,
    localIP  = ip.address();

console.log("Local IP: " + localIP + "\n");

var outletObj = {
        deviceArr: [],
        adjustForIPChange: function(){
            try{
                let deviceDataObj,
                    deviceDataJSON,
                    device_id, 
                    newDeviceObj = {
                        local_ip: localIP,
                        port: port,
                        deviceName: 'New Water Sensor',
                        deviceType: 'Water Sensor'
                    },
                    fileExists = fs.existsSync(fileName);

                console.log(`port: ${port}`);
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
                        
                        // overwrite local ip value and also overwrite the localport incase there are 
                        // overlapping ports being used on the same server
                        Device.findByIdAndUpdate(device_id, {$set: {local_ip: localIP, port: port }}, 
                            function(err, device){
                                if(err){
                                    console.log(err);
                                }else{
                                    // CASE: device has been deleted from the DB, but the file still exists
                                    if(device === null){
                                        Device.create(newDeviceObj, (err, newDevice) => {
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
                                    console.log(`device: ${device} has been updated`);
                                }
                            }
                        )    
                    }else{
                        console.log("deviceDataObj[_id] is null");
                    }
                    
                }
                // else if our local ip exist in device database
                // else if(Device.find({local_ip: localIP, deviceType: "Camera"}).limit(1)){
                //     // grab the device's mongo _id and write it to the 'device_id.json' file
                //     console.log("local ip does exist in the device db");
                //     Device.findOne({local_ip: localIP, deviceType: "Camera"}, 
                //         function(err, myDevice) {
                //             if(err){
                //                 console.log(err);
                //             }
                //             else{
                //                 deviceDataObj = { _id: myDevice["_id"] };       // create our object
                //                 deviceDataJSON = JSON.stringify(deviceDataObj); // stringify it
                                
                //                 fs.writeFileSync(fileName, deviceDataJSON);     // write it to our file
                //             }
                //         }
                //     );
                // }
                // else, we have a new device
                else{
                    // create a basic device in mongo
                    // grab the id, and write it to our 'device_id.json' file
                    console.log("Device does not exist, creating device");
                    Device.create(newDeviceObj, (err, newDevice) => {
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
        }
}
module.exports = outletObj;

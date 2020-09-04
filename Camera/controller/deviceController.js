var Device   = require("../models/device"),
    ip       = require("ip"),
    fs       = require("fs"),
    path     = require("path"),
    fileName = path.join("../Camera/device_id.json"),
    async    = require("asyncawait/async"),
    await    = require("asyncawait/await"),
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
                        deviceName: 'New Camera Server',
                        deviceType: 'Camera',
                    },
                    fileExists = fs.existsSync(fileName);
                
                //let result = Device.findOne({local_ip: localIP, deviceType: "Camera"}).limit(1);
                //console.log("Result: " + result);
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
                        
                        // look up device in database, make sure it exists, overwrite local ip value
                        Device.findByIdAndUpdate(device_id, {$set: {local_ip: localIP }}, 
                            function(err, device){
                                if(err){
                                    console.log(err);
                                }else{
                                    console.log(`device: ${device} has been updated`);
                                }
                            }
                        )    
                    }else{
                        console.log("deviceDataObj[_id] is null");
                    }
                    
                }
                // else if our local ip exist in device database
                // else if(result){
                //     // grab the device's mongo _id and write it to the 'device_id.json' file
                //         // _id: _id
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

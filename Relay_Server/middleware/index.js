//const jwt = require("jsonwebtoken");
//const config = require("config");
let User = require("../models/user");

var middleware = {
	// authenticate(req, res, next){
	// 	//get the token from the header if present
	// 	const token = req.headers["x-access-token"] || req.headers["authorization"];
	// 	//if no token found, return response (without going to the next middelware)
	// 	if (!token) return res.status(401).send("Access denied. No token provided.");
		
	// 	try {
	// 		//if can verify the token, set req.user and pass to next middleware
	// 		const decoded = jwt.verify(token, config.get("myprivatekey"));
	// 		req.user = decoded;
	// 		next();
	// 	} catch (ex) {
	// 	//if invalid token
	// 		res.status(400).send("Invalid token.");
	// 	}
	// }
	verifyAdminAccount(req, res, next){
	    let scheduleObj = req.body,
	        admin_id    = scheduleObj['admin_id'].toString();
	        
	    console.log("verifyAdminAccount: " + admin_id);
		User.findOne({"_id":admin_id}, function(err, user){
		    if(err)
		        console.log(err.toString);
    		else 
    		    next();
		});
		
		res.status(404).send("you must be logged in as an admin to perform that action");
	},
	checkScheduleInputs(req, res, next){
		var newSchedule = req.body;
		try{
		// {
        //     schedule: {
        //         start_time: {
        //             second: 0,
        //             minute: 30,
        //             hour: 11
        //         },
        //         end_time: {
        //             second: 0,
        //             minute: 30
        //             hour: 12
        //         },
        //         dayOfWeek: [0, 1, 4]
        //     },
        //     device: {
        //         id: mongoId,
        //         gpio: deviceGpio
        //     }
        // }  
        if(newSchedule === undefined)
            throw new Error("New schedule and device configuration details not found.")
        else{
            if(newSchedule['schedule'] === undefined)
                throw new Error("New schedule configuration details not found.")
            else{
                // end_time (off) details are required
                if(newSchedule['schedule']['end_time'] === undefined)
                    throw new Error("End time schedule configuration details not found.")
                else{
                    // Second, minute, and hour details are required for end_time (off)
                    if(newSchedule['schedule']['end_time']['second'] === undefined)
                        throw new Error("End Time Second configuration details not found.")
                    if(newSchedule['schedule']['end_time']['minute'] === undefined)
                        throw new Error("End Time Minute configuration details not found.")
                    if(newSchedule['schedule']['end_time']['hour'] === undefined)
                        throw new Error("End Time hour configuration details not found.")
                }
                // start_time (on) details are not required
                if(newSchedule['schedule']['start_time'] !== undefined){
                    if(newSchedule['schedule']['start_time']['second'] === undefined)
                        throw new Error("End Time Second configuration details not found.")
                    if(newSchedule['schedule']['start_time']['minute'] === undefined)
                        throw new Error("End Time Minute configuration details not found.")
                    if(newSchedule['schedule']['start_time']['hour'] === undefined)
                        throw new Error("End Time hour configuration details not found.")
                }
                // Check For Recurrence Based Scheduling details
                if(newSchedule['schedule']['dayOfWeek'] !== undefined){
                    // Date-Based Scheduling Details can not be included with Recurrence Based Scheduling Details
                    if(newSchedule['schedule']['date'] !== undefined)
                        throw new Error("Recurrence Based Scheduling is not valid with date-based scheduling details");
                    if(newSchedule['schedule']['month'] !== undefined)
                        throw new Error("Recurrence Based Scheduling is not valid with date-based scheduling details");
                    if(newSchedule['schedule']['year'] !== undefined)
                        throw new Error("Recurrence Based Scheduling is not valid with date-based scheduling details");
                }
                // Check For Date Based Scheduling Details
                if(newSchedule['schedule']['date'] !== undefined){
                    // Make sure the rest of the Date Based Scheduling Details were not left out
                    if(newSchedule['schedule']['month'] === undefined)
                        throw new Error("Month input required for date-based scheduling");
                    if(newSchedule['schedule']['year'] === undefined)
                        throw new Error("Year input requried for date-based scheduling")
                }
            }
            // device details are required
            if(newSchedule['device'] === undefined){
                throw new Error("New Device configurations not found");
            }else{
                // id - mongodb id representing our relay device - required
                if(newSchedule['device']['id'] === undefined)
                    throw new Error("Device id not found!");
                else{
                    // Make sure that the id is a valid id that exists in mongodb
                }
                // gpio port that controls our relay switch - required
                if(newSchedule['device']['gpio'] === undefined)
                    throw new Error("Device GPIO not found!");
                else{
                    // Make sure that the gpio is configured by the relay device
                    if(outletController.findOutletByGpio(Number(newSchedule['device']['gpio'])) === -1){
                        throw new Error("Invalid GPIO input");
                    }
                }
                // 0 or 1, on or off? - required
                if(newSchedule['device']['desired_state'] === undefined)
                    throw new Error("Device desired state not found!");
                else{
                    // Make sure that only a boolean value was sent in
                    if(typeof newSchedule['device']['desired_state'] === 'boolean')
                        throw new Error("Desired state must be 'true' or 'false'.")
                }
            }
        }
		}catch(exc){
			        console.log(`err: ${exc}`);
        //res.write(err.toString());
        	res.status(404).send(exc.toString());
		}
	}
}
module.exports = middleware
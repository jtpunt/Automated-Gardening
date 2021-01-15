let scheduleMiddleware = {
    checkScheduleInputs(req, res, next){
        var newSchedule = req.body,
            sanitizedSchedule = {
                schedule: undefined,
                device: undefined
            };
        try{
        // excected req.body 
        // req.body = {
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
        //         start_date: {
        //              date: 15,
        //              month: 9,
        //              year: 2020,
        //         },
        //         end_date: {
        //              date: 15,
        //              month: 9,
        //              year: 2020,
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
                    sanitizedSchedule['schedule'] = { end_time: undefined}
                    // Second, minute, and hour details are required for end_time (off)
                    if(newSchedule['schedule']['end_time']['second'] === undefined)
                        throw new Error("End Time Second configuration details not found.")
                    if(newSchedule['schedule']['end_time']['minute'] === undefined)
                        throw new Error("End Time Minute configuration details not found.")
                    if(newSchedule['schedule']['end_time']['hour'] === undefined)
                        throw new Error("End Time hour configuration details not found.")
                    sanitizedSchedule['schedule']['end_time'] = {
                        second: newSchedule['schedule']['end_time']['second'],
                        minute: newSchedule['schedule']['end_time']['minute'],
                        hour: newSchedule['schedule']['end_time']['hour']
                    }
                }
                // start_time (on) details are not required
                if(newSchedule['schedule']['start_time'] !== undefined){
                    if(newSchedule['schedule']['start_time']['second'] === undefined)
                        throw new Error("End Time Second configuration details not found.")
                    if(newSchedule['schedule']['start_time']['minute'] === undefined)
                        throw new Error("End Time Minute configuration details not found.")
                    if(newSchedule['schedule']['start_time']['hour'] === undefined)
                        throw new Error("End Time hour configuration details not found.")
                    sanitizedSchedule['schedule']['start_time'] = {
                        second: newSchedule['schedule']['start_time']['second'],
                        minute: newSchedule['schedule']['start_time']['minute'],
                        hour: newSchedule['schedule']['start_time']['hour']
                    }
                }
                // Check For Date Based Scheduling Details
                if(newSchedule['schedule']['start_date'] !== undefined){
                    // Make sure the rest of the Date Based Scheduling Details were not left out
                    if(newSchedule['schedule']['start_date']['date'] === undefined)
                        throw new Error("Date input required for date-based scheduling");
                    if(newSchedule['schedule']['start_date']['month'] === undefined)
                        throw new Error("Month input required for date-based scheduling");
                    if(newSchedule['schedule']['start_date']['year'] === undefined)
                        throw new Error("Year input requried for date-based scheduling")
                    sanitizedSchedule['schedule']['start_date'] = {
                        date: newSchedule['schedule']['start_date']['date'],
                        month: newSchedule['schedule']['start_date']['month'],
                        year: newSchedule['schedule']['start_date']['year']
                    }
                }
                // Check For Date Based Scheduling Details
                if(newSchedule['schedule']['end_date'] !== undefined){
                    // Make sure the rest of the Date Based Scheduling Details were not left out
                    if(newSchedule['schedule']['start_date']['date'] === undefined)
                        throw new Error("Month input required for date-based scheduling");
                    if(newSchedule['schedule']['end_date']['month'] === undefined)
                        throw new Error("Month input required for date-based scheduling");
                    if(newSchedule['schedule']['end_date']['year'] === undefined)
                        throw new Error("Year input requried for date-based scheduling")
                    sanitizedSchedule['schedule']['end_date'] = {
                        date: newSchedule['schedule']['end_date']['date'],
                        month: newSchedule['schedule']['end_date']['month'],
                        year: newSchedule['schedule']['end_date']['year']
                    }
                }
                // Check For Recurrence Based Scheduling details
                if(newSchedule['schedule']['dayOfWeek'] !== undefined){
                    // Date-Based Scheduling Details can not be included with Recurrence Based Scheduling Details
                    if(newSchedule['schedule']['start_date']['date'] !== undefined)
                        throw new Error("Recurrence Based Scheduling is not valid with date-based scheduling details");
                    if(newSchedule['schedule']['start_date']['month'] !== undefined)
                        throw new Error("Recurrence Based Scheduling is not valid with date-based scheduling details");
                    if(newSchedule['schedule']['start_date']['year'] !== undefined)
                        throw new Error("Recurrence Based Scheduling is not valid with date-based scheduling details");
                    sanitizedSchedule['schedule']['dayOfWeek'] = newSchedule['schedule']['dayOfWeek'];
                }
            }
            // device details are required
            if(newSchedule['device'] === undefined){
                throw new Error("New Device configurations not found");
            }else{
                // id - mongodb id representing our relay device - required
                if(newSchedule['device']['id'] === undefined)
                    throw new Error("Device id not found!");
                // gpio port that controls our relay switch - required
                if(newSchedule['device']['gpio'] === undefined)
                    throw new Error("Device GPIO not found!");
                // 0 or 1, on or off? - required
                if(newSchedule['device']['desired_state'] === undefined)
                    throw new Error("Device desired state not found!");
                else{
                    // Make sure that only a boolean value was sent in
                    if(typeof newSchedule['device']['desired_state'] === 'boolean')
                        throw new Error("Desired state must be 'true' or 'false'.")
                }
                sanitizedSchedule['device'] = {
                    id: newSchedule['device']['id'],
                    gpio: newSchedule['device']['gpio'],
                    desired_state: newSchedule['device']['desired_state']
                }
            }
        }
            req.body = sanitizedSchedule;
            next();
        }catch(exc){
            console.log(`err: ${exc}`);
            res.status(404).send(exc.toString());
        }
    }
}
module.exports = scheduleMiddleware;

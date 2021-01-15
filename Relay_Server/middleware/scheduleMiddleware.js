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
    },
    validateScheduleInputs(req, res, next){
        // if we use short circuit evaluation on schedule['second'] to assign a value, and if schedule['second'] is 0, then this value will be ignored
            // and the right operand will be returned. This is not the behavior we want as second, minute, hour and month values can be 0
        let sanitize_input  = (input) => {return (Number(input) === 0) ? Number(input) : Number(input) || undefined},
            validSchedule   = {},
            schedule_config = req.body,
            schedule        = schedule_config['schedule'];
        console.log(`in validateScheduleInputs`);
        const 
            second    = sanitize_input(schedule['second']),
            minute    = sanitize_input(schedule['minute']),
            hour      = sanitize_input(schedule['hour']),
            date      = Number(schedule['date'])  || undefined,
            month     = sanitize_input(schedule['month']),
            year      = Number(schedule['year']) || undefined,
            dayOfWeek = (schedule['dayOfWeek']) ? Array.from(schedule['dayOfWeek']) : undefined,
            today     = new Date();

        try{
            // Validate second input
            if(second !== undefined && !second.isNaN && Number.isInteger(second)){
                if(second >= MIN_SECOND && second <= MAX_SECOND)
                    validSchedule['second'] = second;
                else 
                    throw new Error(`second input must be >= ${MIN_SECOND} or <= ${MAX_SECOND}`);
            }else 
                throw new Error(`Invalid second input! - ${second}`);
            // Validate minute input
            if(minute !== undefined && !minute.isNaN && Number.isInteger(minute)){
                if(minute >= MIN_MINUTE && minute <= MAX_MINUTE)
                    validSchedule['minute'] = minute;
                else 
                    throw new Error(`Minute input must be >= ${MIN_MINUTE} or <= ${MAX_MINUTE}`);
            }else 
                throw new Error("Invalid minute input!");
            // Validate hour input
            if(hour !== undefined && !hour.isNaN && Number.isInteger(hour)){
                if(hour >= MIN_HOUR && hour <= MAX_HOUR)
                    validSchedule['hour'] = hour;
                else 
                    throw new Error(`Minute input must be >= ${MIN_HOUR} or <= ${MAX_HOUR}`)
            }else 
                throw new Error("Invalid hour input!");
                
            // Validate Inputs for Day of Week Based Scheduling
            if(dayOfWeek !== undefined && dayOfWeek.length){
                let dayOfWeekArr = dayOfWeek.map(function(day){
                    // dayOfWeek = 0 - 6
                    if(!Number.isNaN(day) && Number(day) >= MIN_DOW && Number(day) <= MAX_DOW)
                        return parseInt(day);
                    else throw new Error("Invalid day of week input.");
                });
                validSchedule['dayOfWeek'] = dayOfWeekArr; 
            }
            // valid date based scheduling details
            else if(date !== undefined && month !== undefined && year !== undefined){
                if(date >= MIN_DATE && date <= MAX_DATE)
                    validSchedule['date'] = date;
                else 
                    throw new Error(`Date input must be >= ${MIN_DATE} or <= ${MAX_DATE}`);
                if(month >= MIN_MONTH && month <= MAX_MONTH)
                    validSchedule['month'] = month;
                else 
                    throw new Error(`Month input must be >= ${MIN_MONTH} or <= ${MAX_MONTH}`);
                if(year >= MIN_YEAR){
                    validSchedule['year'] = year;
                    //let scheduleTestDate = new Date(year, month, date, hour, minute, second, 0);
                    let scheduleTestDate = new Date(Date.UTC(year, month, date, hour, minute, second));  
                    console.log(`hour: ${hour}`);
                    console.log(`minute: ${minute}`);
                    console.log(`second: ${second}`);
                    console.log("Date Obj: ", scheduleTestDate.toISOString());
                    console.log(`time hour: ${scheduleTestDate.getHours()}`);
                    // if(scheduleTestObj < today) 
                    //     throw new Error("Schedule must occur in the future!");
                    // if the schedule is past the start date, start it anyway. otherwise, an invalid cronjob will be created
                    if(scheduleTestDate < today){
                        console.log(`scheduleTestDate < today`);
                        delete scheduleObj['date'];
                        delete scheduleObj['month'];
                        delete scheduleObj['year'];
                    }else{
                        console.log(`scheduleTestDate > today`);
                    }
                    console.log(`scheduleObj: ${JSON.stringify(scheduleObj)}`);
                }else 
                    throw new Error(`Year input must be >= ${MIN_MONTH}  or <= ${MAX_MONTH}`);
            }
            schedule_config['schedule'] = validSchedule;
            req.body = schedule_config;
            next();
        }
        catch(exc){
            res.status(400).send(exc.toString);
        }
    }
}
module.exports = scheduleMiddleware;

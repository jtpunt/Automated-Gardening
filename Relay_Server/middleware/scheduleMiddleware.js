let scheduleMiddleware = {
    cancelSchedule(scheduleController){
        return function(req, res, next){
            var schedule_id = req.params.schedule_id;
            console.log(typeof schedule_id);
            try{
                scheduleController.cancelSchedule(schedule_id);
                console.log("Successfully Canceled!");
                res.status(200).end();
            }catch(err){
                console.log("Error caught!\n");
                console.log(err);
                res.write("404: ", JSON.stringify(err));
                res.status(404).end();
            }
        }
    },
    checkScheduleInputs(req, res, next){
        var newSchedule = req.body;
        try{
        // newSchedule = {
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
                // Check For Date Based Scheduling Details
                if(newSchedule['schedule']['start_date'] !== undefined){
                    // Make sure the rest of the Date Based Scheduling Details were not left out
                    if(newSchedule['schedule']['start_date']['date'] === undefined)
                        throw new Error("Date input required for date-based scheduling");
                    if(newSchedule['schedule']['start_date']['month'] === undefined)
                        throw new Error("Month input required for date-based scheduling");
                    if(newSchedule['schedule']['start_date']['year'] === undefined)
                        throw new Error("Year input requried for date-based scheduling")
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
            next();
        }catch(exc){
                    console.log(`err: ${exc}`);
        //res.write(err.toString());
            res.status(404).send(exc.toString());
        }
    },
	createSchedules: (scheduleController, outletController) => {
        return async function(req, res, next){
             var newSchedule = req.body;
             if(
                newSchedule['schedule']['start_time'] !== undefined && 
                newSchedule['schedule']['end_time']   !== undefined &&  
                newSchedule['schedule']['start_date'] !== undefined &&
                newSchedule['schedule']['end_date']   !== undefined
                ){
                console.log("New schedule with start_time, end_time, start_date, and end_date");
                let device_start = { // we need to rewrite our device values for our start schedule
                    ... newSchedule['device'], // take every key: value stored in the 'device' key
                    desired_state: true // overwrite what we receieved for desired state in the 'device' key to be 'on'
                    
                },
                device_end = { // // we need to rewrite our device values for our end schedule
                    ... newSchedule['device'],
                    desired_state: false // overwrite what we receieved for desired state in the 'device' key to be 'off'
                }
                let on_start_time = {
                    ... newSchedule['schedule'], // grabs dayOfWeek or date, month year
                    ... newSchedule['schedule']['start_date'], 
                    ... newSchedule['schedule']['start_time'] // grabs second, minute, hour
                },
                off_end_time   = {
                    ... newSchedule['schedule'], // grabs dayOfWeek or date, month year
                    ... newSchedule['schedule']['start_date'],
                    ... newSchedule['schedule']['end_time'] 
                    
                },
                on_end_schedule_time = {
                    ... newSchedule['schedule']['end_date'],
                    ... newSchedule['schedule']['start_time'] 
                },
                off_end_schedule_time = {
                    ... newSchedule['schedule']['end_date'],
                    ... newSchedule['schedule']['end_time'] 
                }
                let on_schedule = { // on schedule
                    ... newSchedule,
                    schedule: on_start_time,
                    device: device_start 
                },
                off_schedule   = { // off schedule
                    ... newSchedule, 
                    schedule: off_end_time,
                    device: device_end
                },
                on_end_schedule = {
                    ... newSchedule,
                    schedule: on_end_schedule_time,
                    device: device_start
                },
                off_end_schedule = {
                    ... newSchedule,
                    schedule: off_end_schedule_time,
                    device: device_end
                }
                let start_date = newSchedule['schedule']['start_date'],
                    end_date   = newSchedule['schedule']['end_date'];
                // let new_on_schedule = scheduleController.buildSchedule(start_time),
                //     new_off_schedule = scheduleController.buildSchedule(end_time);
                    
                let on_time_timestamp = new Date(),
                    off_time_timestamp = new Date(),
                    start_date_timestamp = new Date(start_date['year'], start_date['month'], start_date['date']),
                    end_date_timestamp = new Date(end_date['year'], end_date['month'], end_date['date']);

                console.log(`end_schedule: ${JSON.stringify(on_end_schedule)}`);
                
                on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
                off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
                
                // if(on_time_timestamp > off_time_timestamp)
                if(start_date_timestamp > end_date_timestamp)
                    res.status(404).send("start_date must be less than end_date")
                else if(on_time_timestamp === off_time_timestamp)
                    res.status(404).send("start_time must not be equal to the end_time")
                else{
                    // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                    scheduleController.isScheduleOverlapping(on_schedule, off_schedule);
                    scheduleController.isScheduleConflicting(off_schedule);
                    scheduleController.isScheduleConflicting(on_schedule);

                    let off_schedule_args = [
                        off_schedule, 
                        outletController.activateRelay, 
                        outletController,
                        Number(off_schedule['device']['gpio']), 
                        Boolean(off_schedule['device']['desired_state'])
                    ]
               
                    // create the off schedule and grab the id
                    let offScheduleId = await scheduleController.createSchedule(...off_schedule_args);
                    on_schedule['schedule']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'
                    off_end_schedule['schedule']['startScheduleId'] = offScheduleId;

                    let off_end_schedule_args = [
                        off_end_schedule, 
                        scheduleController.deleteSchedule, 
                        scheduleController, 
                        offScheduleId
                    ]

                    let offEndScheduleId = await scheduleController.createSchedule(...off_end_schedule_args);
                    off_schedule['schedule']['endScheduleId'] = offEndScheduleId;

                    let on_schedule_args = [
                        on_schedule, 
                        outletController.activateRelay, 
                        outletController,
                        Number(on_schedule['device']['gpio']), 
                        Boolean(on_schedule['device']['desired_state'])
                    ]
                    // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                    let onScheduleId = await scheduleController.createSchedule(...on_schedule_args);
                    off_schedule['schedule']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'
                    on_end_schedule['schedule']['startScheduleId'] = onScheduleId;

                    let on_end_schedule_args = [
                        on_end_schedule, 
                        scheduleController.deleteSchedule, 
                        scheduleController, 
                        onScheduleId
                    ]
                    let onEndScheduleId = await scheduleController.createSchedule(...on_end_schedule_args);
                    on_schedule['schedule']['endScheduleId'] = onEndScheduleId;

                    scheduleController.editSchedule(offScheduleId, off_schedule, outletController.activateRelay, outletController);  
                    scheduleController.editSchedule(onScheduleId, on_schedule, outletController.activateRelay, outletController);
                
                    console.log(`endScheduleId: ${onEndScheduleId}`);
                    console.log(`offScheduleId: ${offEndScheduleId}`);
                }

            }
            // you can set a schedule with a start time, end time, and start date
            else if(
                newSchedule['schedule']['start_time'] !== undefined && 
                newSchedule['schedule']['end_time']   !== undefined &&
                newSchedule['schedule']['start_date'] !== undefined
                ){
                console.log("New schedule with start_time, end_time and start_date");
                let device_start = { // we need to rewrite our device values for our start schedule
                    ... newSchedule['device'], // take every key: value stored in the 'device' key
                    desired_state: true // overwrite what we receieved for desired state in the 'device' key to be 'on'
                },
                device_end = { // // we need to rewrite our device values for our end schedule
                    ... newSchedule['device'],
                    desired_state: false // overwrite what we receieved for desired state in the 'device' key to be 'off'
                }
                let on_start_time = {
                    ... newSchedule['schedule'],
                    ... newSchedule['schedule']['start_date'], // grabs dayOfWeek or date, month year
                    ... newSchedule['schedule']['start_time'] // grabs second, minute, hour
                },
                off_end_time   = {
                    ... newSchedule['schedule'],
                    ... newSchedule['schedule']['start_date'],
                    ... newSchedule['schedule']['end_time'] 
                    
                };

                let on_schedule = { // on schedule
                    ... newSchedule,
                    schedule: on_start_time,
                    device: device_start
                },
                off_schedule   = { // off schedule
                    ... newSchedule, 
                    schedule: off_end_time,
                    device: device_end
                };

                // let new_on_schedule = scheduleController.buildSchedule(start_time),
                //     new_off_schedule = scheduleController.buildSchedule(end_time);
                    
                let on_time_timestamp = new Date(),
                    off_time_timestamp = new Date();
                
                on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
                off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
                
                if(on_time_timestamp > off_time_timestamp)
                    res.status(404).send("start_time must be less than end_time")
                else if(on_time_timestamp === off_time_timestamp)
                    res.status(404).send("start_time must not be equal to the end_time")
                else{
                    // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                    scheduleController.isScheduleOverlapping(on_schedule, off_schedule);
                    scheduleController.isScheduleConflicting(off_schedule);
                    scheduleController.isScheduleConflicting(on_schedule);

                    let off_schedule_args = [
                        off_schedule, 
                        outletController.activateRelay, 
                        outletController,
                        Number(off_schedule['device']['gpio']), 
                        Boolean(off_schedule['device']['desired_state'])
                    ]
                    // create the off schedule and grab the id
                    let offScheduleId = await scheduleController.createSchedule(...off_schedule_args);
                    on_schedule['schedule']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'

                    let on_schedule_args = [
                        on_schedule, 
                        outletController.activateRelay, 
                        outletController,
                        Number(on_schedule['device']['gpio']), 
                        Boolean(on_schedule['device']['desired_state'])
                    ]
                    // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                    let onScheduleId = await scheduleController.createSchedule(...on_schedule_args);
                    off_schedule['schedule']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'

                    scheduleController.editSchedule(offScheduleId, off_schedule, outletController.activateRelay, outletController);  

                }
            }
            // you can set a schedule with a start time and end time
            else if(
                newSchedule['schedule']['start_time'] !== undefined && 
                newSchedule['schedule']['end_time']   !== undefined
                ){
                console.log("New schedule with start_time, and end_time");
                let device_start = { // we need to rewrite our device values for our start schedule
                    ... newSchedule['device'], // take every key: value stored in the 'device' key
                    desired_state: true // overwrite what we receieved for desired state in the 'device' key to be 'on'
                },
                device_end = { // // we need to rewrite our device values for our end schedule
                    ... newSchedule['device'],
                    desired_state: false // overwrite what we receieved for desired state in the 'device' key to be 'off'
                }
                let on_start_time = {
                    ... newSchedule['schedule'],
                    ... newSchedule['schedule']['start_time'] // grabs second, minute, hour
                },
                off_end_time   = {
                    ... newSchedule['schedule'],
                    ... newSchedule['schedule']['end_time'] 
                };

                let on_schedule = { // on schedule
                    ... newSchedule,
                    schedule: on_start_time,
                    device: device_start
                },
                off_schedule   = { // off schedule
                    ... newSchedule, 
                    schedule: off_end_time,
                    device: device_end
                };

                // let new_on_schedule = scheduleController.buildSchedule(start_time),
                //     new_off_schedule = scheduleController.buildSchedule(end_time);
                    
                let on_time_timestamp = new Date(),
                    off_time_timestamp = new Date();
                
                on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
                off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
                
                if(on_time_timestamp > off_time_timestamp)
                    res.status(404).send("start_time must be less than end_time")
                else if(on_time_timestamp === off_time_timestamp)
                    res.status(404).send("start_time must not be equal to the end_time")
                else{
                    // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                    scheduleController.isScheduleOverlapping(on_schedule, off_schedule);
                    scheduleController.isScheduleConflicting(off_schedule);
                    scheduleController.isScheduleConflicting(on_schedule);
                    
                    console.log(`off_schedule: ${JSON.stringify(off_schedule)}`);
                    // create the off schedule and grab the id
                    let off_schedule_args = [
                        off_schedule, 
                        outletController.activateRelay, 
                        outletController,
                        Number(off_schedule['device']['gpio']), 
                        Boolean(off_schedule['device']['desired_state'])
                    ]
                    let offScheduleId = await scheduleController.createSchedule(...off_schedule_args);
                    on_schedule['schedule']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'
                    
                    console.log(`on_schedule: ${JSON.stringify(on_schedule)}`);
                    let on_schedule_args = [
                        on_schedule, 
                        outletController.activateRelay, 
                        outletController,
                        Number(on_schedule['device']['gpio']), 
                        Boolean(on_schedule['device']['desired_state'])
                    ]
                    // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                    let onScheduleId = await scheduleController.createSchedule(...on_schedule_args);
                    off_schedule['schedule']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'

                    scheduleController.editSchedule(offScheduleId, off_schedule, outletController.activateRelay, outletController);  

                }
            }
            // This functionality has no use for the smart gardening application, however,
            // it would be useful for a light switch app. Example, you manually turn the lights on at 10:00pm,
            // fall asleep and forget to turn the lights off. You can set the lights to turn off automatically at 11:00pm
            // you can set a schedule with just an end_time 
            else if(newSchedule['schedule']['end_time'] !== undefined){ // you can set a schedule with only an end time
            // example usage: we want to make sure the lights are off by 2am
                console.log("in else with start_time");

                let device_end = { // // we need to rewrite our device values for our end schedule
                    ... newSchedule['device'],
                    desired_state: false // overwrite what we receieved for desired state in the 'device' key to be 'off'
                },  
                    off_end_time   = {
                    ... newSchedule['schedule'],
                    ... newSchedule['schedule']['end_time'] 
                },  
                    off_schedule   = { // off schedule
                    ... newSchedule, 
                    schedule: off_end_time,
                    device: device_end
                };
      
                scheduleController.isScheduleConflicting(off_schedule);

                let off_schedule_args = [
                    off_schedule, 
                    outletController.activateRelay, 
                    outletController,
                    Number(off_schedule['device']['gpio']), 
                    Boolean(off_schedule['device']['desired_state'])
                ]
                let value = await scheduleController.createSchedule(...off_schedule_args);
                console.log(`value returned: ${value}`);
                //value.then((value) => console.log(value));
                console.log("Schedule successfully created!\n");
            }else {
                res.status(404).send("no start_time or end_times found");
            }
            res.status(200).end();
        }
    }, 
    deleteSchedule: (scheduleController) => {
        return function(req, res, next){
            var schedule_id = req.params.schedule_id;
            try{
                scheduleController.deleteSchedule(schedule_id);
                res.status(200).end();
            }catch(err){
                res.status(404).send(err.toString());
            }
        }
    },
    updateSchedule: (scheduleController, outletController) => {
        return function(req, res, next){
            var schedule_id = req.params.schedule_id;
            var updatedSchedule = req.body;
            try{
                // validate newSchedule['device']['gpio'] is a gpio that is currently being used in the system

                let prevScheduleId = updatedSchedule['schedule']['prevScheduleId'],
                    nextScheduleId = updatedSchedule['schedule']['nextScheduleId'],
                    my_schedule = {
                        ... updatedSchedule,
                        schedule:   updatedSchedule['schedule']['start_time'] || 
                                    updatedSchedule['schedule']['end_time']
                    };
                    
                my_schedule['schedule']['prevScheduleId'] = updatedSchedule['schedule']['prevScheduleId'],
                my_schedule['schedule']['nextScheduleId'] = updatedSchedule['schedule']['nextScheduleId']

                scheduleController.editSchedule(schedule_id, my_schedule, outletController.activateRelay, outletController);
                console.log("Successfully Updated!");
                res.status(200).send("Successfully updated!");
            
            }catch(err){
                res.status(404).send(err.toString);
            }
        }
    }
}
module.exports = scheduleMiddleware;

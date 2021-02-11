var scheduleMethods = {
    cancelNextScheduleReq(scheduleHelper){
        return function(req, res, next){
            let schedule_id        = req.params.schedule_id,
                nextInvocationDate = scheduleHelper.getDateOfNextInvocation(schedule_id);
            if(nextInvocationDate === undefined)
                res.status(404).send(`Next Invocation Date Not Found For Schedule id - ${schedule_id}`);
            else{
                scheduleHelper.cancelNextSchedule(schedule_id);
                res.status(200).send(`Schedule id ${schedule_id} with next invocation date of ${nextInvocationDate} has been canceled.`);
            }
            
        }
    },
    cancelScheduleReq(scheduleHelper){
        return function(req, res, next){
            let schedule_id        = req.params.schedule_id,
                nextInvocationDate = scheduleHelper.getDateOfNextInvocation(schedule_id);
            if(nextInvocationDate === undefined)
                res.status(404).send(`Next Invocation Date Not Found For Schedule id - ${schedule_id}`);
            else{
                scheduleHelper.cancelSchedule(schedule_id);
                res.status(200).send(`Schedule id ${schedule_id} with next invocation date of ${nextInvocationDate} has been canceled.`);
            }
            
        }
    },
    createSchedulesReq: (scheduleHelper, outletHelper) => {
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
                    ... newSchedule['schedule']['start_date'], 
                    ... newSchedule['schedule']['start_time'] // grabs second, minute, hour
                },
                off_end_time   = {
                    ... newSchedule['schedule']['start_date'],
                    ... newSchedule['schedule']['end_time'] 
                    
                },
                on_end_schedule_time = {
                    ... newSchedule['schedule']['end_date'],
                    ... newSchedule['schedule']['end_time']  
                },
                off_end_schedule_time = {
                    ... newSchedule['schedule']['end_date'],
                    ... newSchedule['schedule']['end_time'] 
                }
                console.log(`on_end_schedule_time: ${JSON.stringify(on_end_schedule_time)}`);
                console.log(`off_end_schedule_time: ${JSON.stringify(off_end_schedule_time)}`);
                if(newSchedule['schedule']['dayOfWeek']){
                    on_start_time['dayOfWeek'] = newSchedule['schedule']['dayOfWeek'];
                    off_end_time['dayOfWeek'] = newSchedule['schedule']['dayOfWeek'];
                    // on_end_schedule_time['dayOfWeek'] = newSchedule['schedule']['dayOfWeek'];
                    // off_end_schedule_time['dayOfWeek'] = newSchedule['schedule']['dayOfWeek'];
                }
                let on_schedule = { // on schedule
                    // ... newSchedule,
                    schedule: on_start_time,
                    device: device_start,
                    relational: {}
                },
                off_schedule   = { // off schedule
                    // ... newSchedule, 
                    schedule: off_end_time,
                    device: device_end,
                    relational: {}
                },
                on_end_schedule = {
                    // ... newSchedule,
                    schedule: on_end_schedule_time,
                    device: device_start,
                    relational: {}
                },
                off_end_schedule = {
                    // ... newSchedule,
                    schedule: off_end_schedule_time,
                    device: device_end,
                    relational: {}
                }
                console.log(`on_end_schedule: ${JSON.stringify(on_end_schedule)}`);
                console.log(`off_end_schedule: ${JSON.stringify(off_end_schedule)}`);
                let start_date = newSchedule['schedule']['start_date'],
                    end_date   = newSchedule['schedule']['end_date'];

                let on_time_timestamp = new Date(),
                    off_time_timestamp = new Date(),
                    start_date_timestamp = new Date(start_date['year'], start_date['month'], start_date['date']),
                    end_date_timestamp = new Date(end_date['year'], end_date['month'], end_date['date']);

                on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
                off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
                
                if(start_date_timestamp > end_date_timestamp)
                    res.status(404).send("start_date must be less than end_date")
                else if(on_time_timestamp.toString() === off_time_timestamp.toString())
                    res.status(404).send("start_time must not be equal to the end_time")
                else{

                    // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                    let overlappingMsg = scheduleHelper.isScheduleOverlapping(on_schedule, off_schedule);
                    let conflictingMsg = scheduleHelper.isScheduleConflicting(off_schedule);
                    conflictingMsg += scheduleHelper.isScheduleConflicting(on_schedule);
                    if(overlappingMsg !== "" || conflictingMsg !== ""){
                        res.status(400).send(overlappingMsg + " " + conflictingMsg);
                    }else{
                        let off_schedule_args = [
                            off_schedule, 
                            outletHelper.activateRelayByGpio, 
                            outletHelper,
                            Number(off_schedule['device']['gpio']), 
                            Boolean(off_schedule['device']['desired_state'])
                        ]
                   
                        // create the off schedule and grab the id
                        let offScheduleId = await scheduleHelper.createSchedule(...off_schedule_args);
                        on_schedule['relational']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'
                        off_end_schedule['relational']['startScheduleId'] = offScheduleId;

                        let off_end_schedule_args = [
                            off_end_schedule, 
                            scheduleHelper.deleteStartAndEndSchedules, 
                            scheduleHelper, 
                            offScheduleId
                        ]

                        let offEndScheduleId = await scheduleHelper.createSchedule(...off_end_schedule_args);
                        off_schedule['relational']['endScheduleId'] = offEndScheduleId;

                        let on_schedule_args = [
                            on_schedule, 
                            outletHelper.activateRelayByGpio, 
                            outletHelper,
                            Number(on_schedule['device']['gpio']), 
                            Boolean(on_schedule['device']['desired_state'])
                        ]
                        // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                        let onScheduleId = await scheduleHelper.createSchedule(...on_schedule_args);
                        off_schedule['relational']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'
                        on_end_schedule['relational']['startScheduleId'] = onScheduleId;

                        let on_end_schedule_args = [
                            on_end_schedule, 
                            scheduleHelper.deleteStartAndEndSchedules, 
                            scheduleHelper, 
                            onScheduleId
                        ]
                        let onEndScheduleId = await scheduleHelper.createSchedule(...on_end_schedule_args);
                        on_schedule['relational']['endScheduleId'] = onEndScheduleId;

                        scheduleHelper.updateScheduleRelationship(offScheduleId, off_schedule);
                        scheduleHelper.updateScheduleRelationship(onScheduleId, on_schedule);
                        scheduleHelper.startActiveSchedules(outletHelper.activateRelayByGpio, outletHelper);
                    }
                    
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
                    ... newSchedule['schedule']['start_date'], // grabs dayOfWeek or date, month year
                    ... newSchedule['schedule']['start_time'] // grabs second, minute, hour
                },
                off_end_time   = {
                    ... newSchedule['schedule']['start_date'],
                    ... newSchedule['schedule']['end_time'] 
                    
                };
                if(newSchedule['schedule']['dayOfWeek']){
                    on_start_time['dayOfWeek'] = newSchedule['schedule']['dayOfWeek'];
                    off_end_time['dayOfWeek'] = newSchedule['schedule']['dayOfWeek'];
                }
                let on_schedule = { // on schedule
                    ... newSchedule,
                    schedule: on_start_time,
                    device: device_start,
                    relational: {}
                },
                off_schedule   = { // off schedule
                    ... newSchedule, 
                    schedule: off_end_time,
                    device: device_end,
                    relational: {}
                };

                let on_time_timestamp = new Date(),
                    off_time_timestamp = new Date();
                
                on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
                off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
                
                if(on_time_timestamp.toString() === off_time_timestamp.toString())
                    res.status(404).send("start_time must not be equal to the end_time")
                else{
                    // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                    let overlappingMsg = scheduleHelper.isScheduleOverlapping(on_schedule, off_schedule);
                    let conflictingMsg = scheduleHelper.isScheduleConflicting(off_schedule);
                    conflictingMsg += scheduleHelper.isScheduleConflicting(on_schedule);
                    if(overlappingMsg !== "" || conflictingMsg !== ""){
                        res.status(400).send(overlappingMsg + " " + conflictingMsg);
                    }else{
                        let off_schedule_args = [
                            off_schedule, 
                            outletHelper.activateRelayByGpio, 
                            outletHelper,
                            Number(off_schedule['device']['gpio']), 
                            Boolean(off_schedule['device']['desired_state'])
                        ]
                        // create the off schedule and grab the id
                        let offScheduleId = await scheduleHelper.createSchedule(...off_schedule_args);
                        on_schedule['relational']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'

                        let on_schedule_args = [
                            on_schedule, 
                            outletHelper.activateRelayByGpio, 
                            outletHelper,
                            Number(on_schedule['device']['gpio']), 
                            Boolean(on_schedule['device']['desired_state'])
                        ]
                        // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                        let onScheduleId = await scheduleHelper.createSchedule(...on_schedule_args);
                        off_schedule['relational']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'

                        scheduleHelper.updateScheduleRelationship(offScheduleId, off_schedule);
                        scheduleHelper.startActiveSchedules(outletController.activateRelay, outletController);
                    }
                }
            }
            // you can set a schedule with a start time and end time
            else if(
                newSchedule['schedule']['start_time'] !== undefined && 
                newSchedule['schedule']['end_time']   !== undefined
                ){
                console.log(`new schedule with start_time and end_time: ${JSON.stringify(newSchedule)}`);
                let device_start = { // we need to rewrite our device values for our start schedule
                    ... newSchedule['device'], // take every key: value stored in the 'device' key
                    desired_state: true // overwrite what we receieved for desired state in the 'device' key to be 'on'
                },
                device_end = { // // we need to rewrite our device values for our end schedule
                    ... newSchedule['device'],
                    desired_state: false // overwrite what we receieved for desired state in the 'device' key to be 'off'
                }
                let on_start_time = {
                    ... newSchedule['schedule']['start_time'] // grabs second, minute, hour
                },
                off_end_time   = {
                    ... newSchedule['schedule']['end_time']
                };
                if(newSchedule['schedule']['dayOfWeek']){
                    on_start_time['dayOfWeek'] = newSchedule['schedule']['dayOfWeek'];
                    off_end_time['dayOfWeek'] = newSchedule['schedule']['dayOfWeek'];
                }
                let on_schedule = { // on schedule
                    schedule: on_start_time,
                    device: device_start,
                    relational: {}
                },
                off_schedule   = { // off schedule
                    schedule: off_end_time,
                    device: device_end,
                    relational: {}
                };
                    
                let on_time_timestamp = new Date(),
                    off_time_timestamp = new Date();

                on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
                off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
                
                if(on_time_timestamp.toString() === off_time_timestamp.toString())
                    res.status(404).send("start_time must not be equal to the end_time")
                else{
                    // have to also make sure that our saved schedules don't conflict with the new schedule that we are trying to add
                    let overlappingMsg = scheduleHelper.isScheduleOverlapping(on_schedule, off_schedule);
                    let conflictingMsg = scheduleHelper.isScheduleConflicting(off_schedule);
                    conflictingMsg += scheduleHelper.isScheduleConflicting(on_schedule);
                    
                    if(overlappingMsg !== "" || conflictingMsg !== ""){
                        res.status(400).send(overlappingMsg + " " + conflictingMsg);
                    }else{
                        // create the off schedule and grab the id
                        let off_schedule_args = [
                            off_schedule, 
                            outletHelper.activateRelayByGpio, 
                            outletHelper,
                            Number(off_schedule['device']['gpio']), 
                            Boolean(off_schedule['device']['desired_state'])
                        ]
                        let offScheduleId = await scheduleHelper.createSchedule(...off_schedule_args);
                        on_schedule['relational']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'
                        
                        console.log(`on_schedule: ${JSON.stringify(on_schedule)}`);
                        let on_schedule_args = [
                            on_schedule, 
                            outletHelper.activateRelayByGpio, 
                            outletHelper,
                            Number(on_schedule['device']['gpio']), 
                            Boolean(on_schedule['device']['desired_state'])
                        ]
                        // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                        let onScheduleId = await scheduleHelper.createSchedule(...on_schedule_args);
                        off_schedule['relational']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'

                        scheduleHelper.updateScheduleRelationship(offScheduleId, off_schedule);
                        scheduleHelper.startActiveSchedules(outletHelper.activateRelayByGpio, outletHelper);
                    }
                }
            }
            // This functionality has no use for the smart gardening application, however,
            // it would be useful for a light switch app. Example, you manually turn the lights on at 10:00pm,
            // fall asleep and forget to turn the lights off. You can set the lights to turn off automatically at 11:00pm
            // you can set a schedule with just an end_time 
            else if(newSchedule['schedule']['end_time'] !== undefined){ // you can set a schedule with only an end time
            // example usage: we want to make sure the lights are off by 2am

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
                    device: device_end,
                    relational: {}
                };
      
                let conflictingMsg = scheduleHelper.isScheduleConflicting(off_schedule);
                if(conflictingMsg !== ""){
                    res.status(400).send(conflictingMsg);
                }else{
                    let off_schedule_args = [
                        off_schedule, 
                        outletHelper.activateRelayByGpio, 
                        outletHelper,
                        Number(off_schedule['device']['gpio']), 
                        Boolean(off_schedule['device']['desired_state'])
                    ]
                    let value = await scheduleHelper.createSchedule(...off_schedule_args);
                }
                
            }else {
                res.status(404).send("no start_time or end_times found");
            }
            res.status(200).end();
        }
    },
    deleteScheduleReq: (scheduleHelper) => {
        return function(req, res, next){
            let schedule_id = req.params.schedule_id;
            scheduleHelper.deleteSchedule(schedule_id);
            res.status(200).send(`Schedule id - ${schedule_id} has been successfully deleted!`);
        }
    },
    getDateOfNextInvocationReq: (scheduleHelper) => {
        return function(req, res, next){
            let schedule_id    = req.params.schedule_id,
                nextInvocation = scheduleHelper.getDateOfNextInvocation(schedule_id);
            if(nextInvocation === undefined)
                res.status(404).send(`Next Invocation Date Not Found For Schedule id - ${schedule_id}`);
            else
                res.status(200).send(nextInvocation.toString());
        }
    },
    getScheduleReq(scheduleHelper){
        return function(req, res, next){
            let schedule_id    = req.params.schedule_id,
                schedule       = scheduleHelper.getScheduleById(schedule_id);
            res.status(200).send(schedule);
        }
    },
    getSchedulesReq(scheduleHelper){
        return function(req, res, next){
            res.status(200).send(scheduleHelper.scheduleObj);
        }
    },
    updateScheduleReq: (scheduleHelper, outletHelper) => {
        return function(req, res, next){
            let schedule_id     = req.params.schedule_id,
                updatedSchedule = req.body;
                prevScheduleId  = updatedSchedule['relational']['prevScheduleId'],
                nextScheduleId  = updatedSchedule['relational']['nextScheduleId'],
                my_schedule     = {
                    ... updatedSchedule,
                    schedule:   updatedSchedule['schedule']['start_time'] || 
                                updatedSchedule['schedule']['end_time']
                };
            console.log(`updatedSchedule: ${JSON.stringify(updatedSchedule)}`);
            my_schedule['relational']['prevScheduleId'] = updatedSchedule['relational']['prevScheduleId'],
            my_schedule['relational']['nextScheduleId'] = updatedSchedule['relational']['nextScheduleId']

            scheduleHelper.editSchedule(schedule_id, my_schedule, outletHelper.activateRelayByGpio, outletHelper);
            console.log("Successfully Updated!");
            res.status(200).send("Successfully updated!");
            
        }
    },
    resumeScheduleReq: (scheduleHelper, outletHelper) => {
        return function(req, res, next){
            var schedule_id = req.params.schedule_id;

            scheduleHelper.resumeSchedule(schedule_id, outletHelper.activateRelayByGpio, outletHelper);
            let nextInvocationDate = scheduleHelper.getDateOfNextInvocation(schedule_id);
            if(nextInvocationDate === undefined)
                res.status(400).send(`Schedule id ${schedule_id} did not successfully resume`);
            else
                res.status(200).send(`Schedule id - ${schedule_id} has successfully resumed on ${nextInvocationDate}`);
            
        }
    }
}
module.exports = scheduleMethods;

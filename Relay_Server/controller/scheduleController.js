var async           = require("asyncawait/async"),
    await           = require("asyncawait/await");



var scheduleMethods = {
    cancelScheduleReq(scheduleHelper){
        return function(req, res, next){
            var schedule_id = req.params.schedule_id;
            if(!self.doesScheduleExist(schedule_id))
                res.status(404).send(`Schedule id - ${schedule_id} does not exist!`);
            else{
                let nextInvocationDate = scheduleHelper.getDateOfNextInvocation(schedule_id);
                if(nextInvocationDate === undefined)
                    res.status(404).send(`Next Invocation Date Not Found For Schedule id - ${schedule_id}`);
                else{
                    scheduleHelper.cancelSchedule(schedule_id);
                    res.status(200).send(`Schedule id ${schedule_id} with next invocation date of ${nextInvocationDate} has been canceled.`);
                }
            }
        }
    },
    cancelNextScheduleReq(scheduleHelper){
        return function(req, res, next){
            var schedule_id = req.params.schedule_id;
            if(!self.doesScheduleExist(schedule_id))
                res.status(404).send(`Schedule id - ${schedule_id} does not exist!`);
            else{
                let nextInvocationDate = scheduleHelper.getDateOfNextInvocation(schedule_id);
                if(nextInvocationDate === undefined)
                    res.status(404).send(`Next Invocation Date Not Found For Schedule id - ${schedule_id}`);
                else{
                    scheduleHelper.cancelNextSchedule(schedule_id);
                    res.status(200).send(`Schedule id ${schedule_id} with next invocation date of ${nextInvocationDate} has been canceled.`);
                }
            }
        }
    },
    getDateOfNextInvocationReq: (scheduleHelper) => {
        return function(req, res, next){
            let schedule_id = req.params.schedule_id;
            if(!scheduleHelper.doesScheduleExist(schedule_id))
                res.status(404).send(`Schedule id - ${schedule_id} does not exist!`);
            else{
                let nextInvocation = scheduleHelper.getDateOfNextInvocation(schedule_id);
                if(nextInvocation === undefined)
                    res.status(404).send(`Next Invocation Date Not Found For Schedule id - ${schedule_id}`);
                else
                    res.status(200).send(nextInvocation.toString());
            }
            
        }
    },
    deleteScheduleReq: (scheduleHelper) => {
        return function(req, res, next){
            let schedule_id = req.params.schedule_id;
            if(!scheduleHelper.doesScheduleExist(schedule_id))
                res.status(404).send(`Schedule id - ${schedule_id} does not exist!`);
            else{
                scheduleHelper.deleteSchedule(schedule_id);
                res.status(200).send(`Schedule id - ${schedule_id} has been successfully deleted!`);
            }
        }
    },
    createSchedulesReq: (scheduleHelper, outletController) => {
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
                    let overlappingMsg = scheduleHelper.isScheduleOverlapping(on_schedule, off_schedule);
                    let conflictingMsg = scheduleHelper.isScheduleConflicting(off_schedule);
                    conflictingMsg += scheduleHelper.isScheduleConflicting(on_schedule);
                    if(overlappingMsg !== "" || conflictingMsg !== ""){
                        res.status(400).send(overlappingMsg + " " + conflictingMsg);
                    }else{
                        let off_schedule_args = [
                            off_schedule, 
                            outletController.activateRelay, 
                            outletController,
                            Number(off_schedule['device']['gpio']), 
                            Boolean(off_schedule['device']['desired_state'])
                        ]
                   
                        // create the off schedule and grab the id
                        let offScheduleId = await scheduleHelper.createSchedule(...off_schedule_args);
                        on_schedule['schedule']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'
                        off_end_schedule['schedule']['startScheduleId'] = offScheduleId;

                        let off_end_schedule_args = [
                            off_end_schedule, 
                            scheduleController.deleteSchedule, 
                            scheduleController, 
                            offScheduleId
                        ]

                        let offEndScheduleId = await scheduleHelper.createSchedule(...off_end_schedule_args);
                        off_schedule['schedule']['endScheduleId'] = offEndScheduleId;

                        let on_schedule_args = [
                            on_schedule, 
                            outletController.activateRelay, 
                            outletController,
                            Number(on_schedule['device']['gpio']), 
                            Boolean(on_schedule['device']['desired_state'])
                        ]
                        // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                        let onScheduleId = await scheduleHelper.createSchedule(...on_schedule_args);
                        off_schedule['schedule']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'
                        on_end_schedule['schedule']['startScheduleId'] = onScheduleId;

                        let on_end_schedule_args = [
                            off_end_schedule, 
                            scheduleController.deleteSchedule, 
                            scheduleController, 
                            onScheduleId
                        ]
                        let onEndScheduleId = await scheduleHelper.createSchedule(...on_end_schedule_args);
                        on_schedule['schedule']['endScheduleId'] = onEndScheduleId;

                        //scheduleController.editSchedule(offScheduleId, off_schedule, outletController.activateRelay, outletController);  
                        //scheduleController.editSchedule(onScheduleId, on_schedule, outletController.activateRelay, outletController);
                        scheduleHelper.updateScheduleRelationship(offScheduleId, off_schedule);
                        scheduleHelper.updateScheduleRelationship(onScheduleId, on_schedule);
                        console.log(`endScheduleId: ${onEndScheduleId}`);
                        console.log(`offScheduleId: ${offEndScheduleId}`);
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
                
                if(on_start_time['second'] === 0)  on_start_time['second'] = '00';
                if(on_start_time['minute'] === 0)  on_start_time['minute'] = '00';
                if(on_start_time['hour'] === 0)    on_start_time['hour']   = '00';

                if(off_end_time['second'] === 0)  off_end_time['second'] = '00';
                if(off_end_time['minute'] === 0)  off_end_time['minute'] = '00';
                if(off_end_time['hour'] === 0)    off_end_time['hour']   = '00';
                on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
                off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
                
                if(on_time_timestamp === off_time_timestamp)
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
                            outletController.activateRelay, 
                            outletController,
                            Number(off_schedule['device']['gpio']), 
                            Boolean(off_schedule['device']['desired_state'])
                        ]
                        // create the off schedule and grab the id
                        let offScheduleId = await scheduleHelper.createSchedule(...off_schedule_args);
                        on_schedule['schedule']['nextScheduleId'] = offScheduleId; // associate the on schedule with the off schedule - 'nextScheduleId'

                        let on_schedule_args = [
                            on_schedule, 
                            outletController.activateRelay, 
                            outletController,
                            Number(on_schedule['device']['gpio']), 
                            Boolean(on_schedule['device']['desired_state'])
                        ]
                        // create the on schedule that's now associated with the off schedule and grab the id - 'prevScheduleId'
                        let onScheduleId = await scheduleHelper.createSchedule(...on_schedule_args);
                        off_schedule['schedule']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'

                        //scheduleController.editSchedule(offScheduleId, off_schedule, outletController.activateRelay, outletController);  
                        scheduleHelper.updateScheduleRelationship(offScheduleId, off_schedule);
                    }
                }
            }
            // you can set a schedule with a start time and end time
            else if(
                newSchedule['schedule']['start_time'] !== undefined && 
                newSchedule['schedule']['end_time']   !== undefined
                ){
                console.log("New schedule with start_time, and end_time");
                console.log(`schedule: ${JSON.stringify(newSchedule['schedule'])}`);
                console.log(`start_time: ${JSON.stringify(newSchedule['schedule']['start_time'])}`);
                console.log(`end_time: ${JSON.stringify(newSchedule['schedule']['end_time'])}`);
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

                console.log(`on_start_time: ${JSON.stringify(on_start_time)}`);
                console.log(`off_end_time: ${JSON.stringify(off_end_time)}`);
                // let new_on_schedule = scheduleController.buildSchedule(start_time),
                //     new_off_schedule = scheduleController.buildSchedule(end_time);
                    
                let on_time_timestamp = new Date(),
                    off_time_timestamp = new Date();
                
                if(on_start_time['second'] === 0)  on_start_time['second'] = '00';
                if(on_start_time['minute'] === 0)  on_start_time['minute'] = '00';
                if(on_start_time['hour'] === 0)    on_start_time['hour']   = '00';

                if(off_end_time['second'] === 0)  off_end_time['second'] = '00';
                if(off_end_time['minute'] === 0)  off_end_time['minute'] = '00';
                if(off_end_time['hour'] === 0)    off_end_time['hour']   = '00';

                on_time_timestamp.setHours(on_start_time['hour'], on_start_time['minute'], on_start_time['second']); 
                off_time_timestamp.setHours(off_end_time['hour'], off_end_time['minute'], off_end_time['second']); 
                
                if(on_time_timestamp === off_time_timestamp)
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
                            outletController.activateRelay, 
                            outletController,
                            Number(off_schedule['device']['gpio']), 
                            Boolean(off_schedule['device']['desired_state'])
                        ]
                        let offScheduleId = await scheduleHelper.createSchedule(...off_schedule_args);
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
                        let onScheduleId = await scheduleHelper.createSchedule(...on_schedule_args);
                        off_schedule['schedule']['prevScheduleId'] = onScheduleId; // associate the off schedule with the on schedule - 'prevScheduleId'

                        //scheduleController.editSchedule(offScheduleId, off_schedule, outletController.activateRelay, outletController);  
                        scheduleHelper.updateScheduleRelationship(offScheduleId, off_schedule);
                    }
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
      
                let conflictingMsg = scheduleHelper.isScheduleConflicting(off_schedule);
                if(conflictingMsg !== ""){
                    res.status(400).send(conflictingMsg);
                }else{
                    let off_schedule_args = [
                        off_schedule, 
                        outletController.activateRelay, 
                        outletController,
                        Number(off_schedule['device']['gpio']), 
                        Boolean(off_schedule['device']['desired_state'])
                    ]
                    let value = await scheduleHelper.createSchedule(...off_schedule_args);
                    console.log(`value returned: ${value}`);
                    //value.then((value) => console.log(value));
                    console.log("Schedule successfully created!\n");
                }
                
            }else {
                res.status(404).send("no start_time or end_times found");
            }
            res.status(200).end();
        }
    },
    updateScheduleReq: (scheduleHelper, outletController) => {
        return function(req, res, next){
            var schedule_id = req.params.schedule_id;
            var updatedSchedule = req.body;
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
            if(!scheduleHelper.doesScheduleExist(schedule_id))
                res.status(404).send(`Schedule id - ${schedule_id} does not exist!`);
            else{
                scheduleHelper.editSchedule(schedule_id, my_schedule, outletController.activateRelay, outletController);
                console.log("Successfully Updated!");
                res.status(200).send("Successfully updated!");
            }
        }
    },
    resumeScheduleReq: (scheduleHelper) => {
        return function(req, res, next){
            var schedule_id = req.params.schedule_id;
            if(!scheduleHelper.doesScheduleExist(schedule_id))
                res.status(404).send(`Schedule id - ${schedule_id} does not exist!`);
            else{
                scheduleHelper.resumeSchedule(schedule_id, outletController.activateRelay, outletController);
                let nextInvocationDate = scheduleHelper.getDateOfNextInvocation(schedule_id);
                if(nextInvocationDate === undefined)
                    res.status(400).send(`Schedule id ${schedule_id} did not successfully resume`);
                else
                    res.status(200).send(`Schedule id - ${schedule_id} has successfully resumed on ${nextInvocationDate}`);
            }
        }
    }
}
module.exports = scheduleMethods;

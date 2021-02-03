let Scheduler       = require("../models/scheduler"),
    Device          = require("../models/device"),
    node_schedule   = require('node-schedule'),
    ip              = require("ip"),
    JobBuilder      = require("../classes/job");
    localIP         = ip.address();

let scheduleHelpers = {
    scheduleObj: {},
    doesScheduleExist: function(schedule_id){
        return schedule_id in this.scheduleObj;
    },
    getScheduleJobById: function(schedule_id){
        if(!this.doesScheduleExist(schedule_id))
            return null;
        return this.scheduleObj[schedule_id];
    },
    getScheduleConfigById: function(schedule_id){
        if(!this.doesScheduleExist(schedule_id))
            return null;
        return this.scheduleObj[schedule_id].schedule_config;
    },
    getDateOfNextInvocation: function(schedule_id){
        let job = this.getScheduleJobById(schedule_id);
        if(!job) 
            return job;
        return job.nextInvocationDate;
        //return job.nextInvocationDate;        
    },
    // invalidates any job. All  planned invocations will be canceled
    cancelSchedule: function(schedule_id){
        let job = this.getScheduleJobById(schedule_id);
        if(job){
            console.log(`Next Schedule before ${job.nextInvocationDate} being canceled`);
            job.cancelJob();
            console.log(`Next Schedule after being ${job.nextInvocationDate} canceled`)
        }
    },
    // invalidates the next planned invocation
    cancelNextSchedule: function(schedule_id, activateRelayFn, context){
        let job = this.getScheduleJobById(schedule_id);
        if(job){
            console.log(`Next Schedule before ${job.nextInvocationDate} being canceled`);
            job.cancelNextJob();
            console.log(`Next Schedule after being ${job.nextInvocationDate} canceled`)
        }
    },
    startActiveSchedules: function(activateRelayFn, context){
        let self  = this,
            today = new Date();

        for(const [schedule_id, job] of Object.entries(this.scheduleObj)){
            console.log(`key: ${schedule_id} value: ${JSON.stringify(job)}`);
            if(!job.nextScheduleId)
                console.log("nextScheduleId is undefined");
            else{
                console.log(`nextScheduleId is not undefined`);
                let isScheduleActive = self.scheduleIsActive(schedule_id, today);
                if(isScheduleActive === true)
                    activateRelayFn.call(context, job.gpio, job.desired_state);
            }
        }
    },
    resumeSchedule: function(schedule_id, fn, context){
        let self  = this,
            today = new Date(w),
            job   = self.getScheduleJobById(schedule_id);
            
        if(!job){
            console.log("Schedule config is NULL");
        }else{
            let jobArgs = [fn, context, job.gpio, job.desired_state],
                job     = new JobBuilder()
                    .withSchedule(job.schedule)
                    .withRelational(job.relational)
                    .withDevice(job.device)
                    .withJobFunction(...jobArgs)
                    .build()

            self.scheduleObj[schedule_id] = job;
            self.startActiveSchedules(activateRelayFn, context);
        }
        
    },
    createSchedule: async function(new_schedule_config, fn, context, ...args){
        let self            = this,
            device_gpio     = new_schedule_config['device']['gpio'],
            desired_state   = new_schedule_config['device']['desired_state'],
            jobArgs         = [fn, context, ...args, device_gpio, desired_state],
            job             = new JobBuilder()
                .withSchedule(new_schedule_config['schedule'])
                .withRelational(new_schedule_config['relational'])
                .withDevice(new_schedule_config['device'])
                .withJobFunction(...jobArgs)
                .build()
        console.log(`Create schedule original: ${JSON.stringify(new_schedule_config)}`);
        let newScheduleResponse = await Scheduler.create(new_schedule_config);
    
        if(newScheduleResponse === undefined)
            return newScheduleResponse;
        else{
            let schedule_id  = newScheduleResponse["_id"];
            self.scheduleObj[schedule_id] = job;
            console.log(`Created Schedule: ${JSON.stringify(self.scheduleObj[schedule_id].schedule_config)}`);
            return schedule_id;
        }
    },
    // Finds schedules (by the GPIO we are checking against) that would occur on the same day
    // and returns the indices refering to those schedules in our scheduleArr
    findSameDaySchedulesAndRetIds: function(schedule_config){
        let self      = this,
            date      = schedule_config['schedule']['date'],
            month     = schedule_config['schedule']['month'],
            year      = schedule_config['schedule']['year'],
            gpio      = Number(schedule_config['device']['gpio']),
            dayOfWeek = (schedule_config['schedule']['dayOfWeek']) ? Array.from(schedule_config['schedule']['dayOfWeek']) : null,
            timestamp = new Date(),
            indices   = [],
            intersect = function(a, b){
                return a.filter(Set.prototype.has, new Set(b));
            };
            
        console.log(`schedule_config in findSameDay..${JSON.stringify(schedule_config)}`);

        // recurrence based scheduling
        if(dayOfWeek && dayOfWeek.length){ 
            console.log("Recurrence Based Scheduling");
            // loop through our schedules and find another schedule that runs on same days as the schedule we are trying to add
            for(const [schedule_id, job] of Object.entries(self.scheduleObj)){
                let sched_second    = job.second,
                    sched_minute    = job.minute,
                    sched_hour      = job.hour,
                    sched_date      = job.date,
                    sched_month     = job.month,
                    sched_year      = job.year,
                    sched_gpio      = job.gpio,
                    sched_dayOfWeek = job.dayOfWeek ? Array.from(job.dayOfWeek) : null;
                if(job.nextScheduleId && gpio === sched_gpio){
                    // recurrence based schedule compared to recurrence based scheduling
                    if(sched_dayOfWeek && sched_dayOfWeek.length){
                        // the times these schedules are set for are all the same for recurrence based scheduling
                        let common_days = intersect(dayOfWeek, sched_dayOfWeek);
                        // are there common days between these recurrence-based schedules?
                        if(common_days.length > 0)
                            indices.push(schedule_id);
                    }
                    // recurrence based scheduling compared to date based scheduling
                    else if (sched_date && sched_month  && sched_year){
                        let sched_timestamp = new Date(sched_year, sched_month, sched_date, sched_hour, sched_minute, sched_second);
                        let sched_numDay = sched_timestamp.getDay();
                        if(dayOfWeek.includes(sched_numDay))
                            indices.push(schedule_id);
                    }
                    // otherwise, recurrence based scheduling compared check to daily 1 time - off schedules
                    else
                        indices.push(schedule_id);
                }
            }
        }
        // date based scheduling
        else if(date && month && year){ 
            // loop through our schedules and find another schedule that runs on same days as the schedule we are trying to add
            for(const [schedule_id, job] of Object.entries(self.scheduleObj)){
                let sched_date      = job.date,
                    sched_month     = job.month,
                    sched_year      = job.year,
                    sched_gpio      = job.gpio,
                    sched_dayOfWeek = (job.dayOfWeek) ? Array.from(job.dayOfWeek) : null;
                
                if(job.nextScheduleId && gpio === sched_gpio){
                    // date based scheduling compared to recurrence based scheduling
                    if(sched_dayOfWeek && sched_dayOfWeek.length){
                        let datebased_timestamp = new Date(year, month, date, hour, minute, second);
                        let datebased_numDay = datebased_timestamp.getDay();
                        
                        if(sched_dayOfWeek.includes(datebased_numDay))
                            indices.push(schedule_id);
                    }
                    // date based scheduling compared to date based scheduling
                    else if (sched_date && sched_month && sched_year){
                        if(date === sched_date && month === sched_month && year === sched_year)
                            indices.push(schedule_id);
                    }
                    // otherwise, date based scheduling compared check to 1 time - off schedules
                    else
                        indices.push(schedule_id);
                }
            }
        }
        // otherwise, everyday 1 time - off schedules
        else{
            console.log(`everyday 1 time schedules`);
            // loop through our schedules and find another schedule that runs on same days as the schedule we are trying to add
            for(const [schedule_id, job] of Object.entries(self.scheduleObj)){
                let sched_date      = job.date,
                    sched_month     = job.month,
                    sched_year      = job.year,
                    sched_gpio      = job.gpio,
                    sched_dayOfWeek = (job.dayOfWeek) ? Array.from(job.dayOfWeek) : null;
                console.log(`Iterating through schedules`);
                if(job.nextScheduleId && gpio === sched_gpio){
                //if(schedule_obj["_id"] !== schedule_id){
                    // everyday 1 time - off schedules compared to recurrence based scheduling
                    if(sched_dayOfWeek && sched_dayOfWeek.length)
                        indices.push(schedule_id);
                    // everyday 1 time - off schedules compared to date based scheduling
                    else if (sched_date && sched_month && sched_year)
                        indices.push(schedule_id);
                    // otherwise, 1 time - off schedules compared check to everyday 1 time - off schedules
                    else
                        indices.push(schedule_id);
                }else{
                    console.log(`nextScheduleId: ${job.nextScheduleId}`);
                }
            }
        }
        console.log(`schedule ids: ${indices}`);
        return indices;
    },
    isScheduleOverlapping: function(on_schedule_config, off_schedule_config){
        let self              = this,
            conflictMsg       = "",
            buildTimeStamp    = (schedule) => { return new Date((new Date).setHours(schedule['hour'], schedule['minute'], schedule['second']));},
            new_on_timestamp  = buildTimeStamp(on_schedule_config['schedule']),
            new_off_timestamp = buildTimeStamp(off_schedule_config['schedule']),
            schedule_ids      = self.findSameDaySchedulesAndRetIds(on_schedule_config);
        
        schedule_ids.forEach(function(schedule_id){
            let sched_on_job          = self.scheduleObj[schedule_id],
                sched_off_mongo_id    = sched_on_job.nextScheduleId,
                sched_on_timestamp    = sched_on_job.timestamp;

             if(self.doesScheduleExist(sched_off_mongo_id)){
                let sched_off_timestamp = self.scheduleObj[sched_off_mongo_id].timestamp;
                if(new_on_timestamp <= sched_on_timestamp && new_off_timestamp >= sched_off_timestamp)
                    conflictMsg += `Schedule is overlapping. `;
            }
            
        });
        console.log(`conflictMsg: ${conflictMsg}`);
        return conflictMsg;
    },
    isScheduleConflicting: function(schedule_config){
        let self           = this,
            conflictMsg    = "",
            buildTimeStamp = (schedule) => { return new Date((new Date).setHours(schedule['hour'], schedule['minute'], schedule['second']));},
            timestamp      = buildTimeStamp(schedule_config['schedule']);
    
        console.log("in isScheduleConflicting");
        let handleScheduleConflictsMsg = function(isScheduleConflicting, schedule_id){
            // is there a schedule conflict?
            if(isScheduleConflicting){
                console.log("In handleScheduleConflictsMsg");
                    
                let sched_on_job     = self.scheduleObj[schedule_id],
                    offScheduleId    = sched_on_job.schedule_config['relational']['nextScheduleId'],
                    on_timestamp     = sched_on_job.timestamp;
                
                if(self.doesScheduleExist(offScheduleId)){
                    let off_timestamp       = self.scheduleObj[offScheduleId].timestamp,
                        timestamp_options   = { hour: 'numeric', minute: 'numeric', hour12: true },
                        fixed_on_timestamp  = on_timestamp.toLocaleString('en-US', timestamp_options),
                        fixed_timestamp     = timestamp.toLocaleString('en-US', timestamp_options),
                        fixed_off_timestamp = off_timestamp.toLocaleString('en-US', timestamp_options);
                        
                    return `New Schedule timestamp - ${fixed_timestamp} Conflicts with ON - ${fixed_on_timestamp} and OFF - ${fixed_off_timestamp}`;
                }
            }else // No Schedule Conflict Found
                return "";
            
        }
        
        let schedule_ids = self.findSameDaySchedulesAndRetIds(schedule_config);
        console.log(`same day schedule ids: ${schedule_ids}`);
        schedule_ids.forEach(function(schedule_id){
            if(self.doesScheduleExist(schedule_id)){
                let isScheduleConflicting = self.scheduleIsActive(schedule_id, timestamp);

                conflictMsg += handleScheduleConflictsMsg(isScheduleConflicting, schedule_id);
            }
        });4
        return conflictMsg;
    },
    // Finds the next_schedule_config that's associated with the prev_schedule_config
    // and returns the boolean result of whether the 2nd argument, timestamp is greater than or equal to 
    // the timestamp within the prev_schedule_config object and is also less tan the timestamp within 
    // the next_schedule_config object
    // Comparison does not use date, or day of week, but assumes these schedules are happening on the same day
    scheduleIsActive: function(schedule_id, timestamp){
        let self   = this,
            result = false;
        
        let job = self.getScheduleJobById(schedule_id);

        if(!job){
            console.log(`job is null`);
        }else{
            let desired_state = job.desired_state,
                onScheduleId  = job.prevScheduleId,
                offScheduleId = job.nextScheduleId;
             console.log(`in scheduleIsActive`);
            // schedules could be loaded out of order. For example, we could be looking at the schedule that turns the outlet off. we need to first look at the schedule that turns the outlet on
            if(desired_state == true && offScheduleId){ // 'on' schedule
                console.log("Processing 'on' schedule");
                if(offScheduleId in this.scheduleObj){
                    let activeToday = false;
                    let datebased_timestamp = new Date();
                    // check date, month, year, dayOfWeek
                    if(job.date && job.month && job.year){
                        datebased_timestamp = new Date(job.year, job.month, job.date, job.hour, job.minute, job.second);
                        console.log(`datebased_timestamp: ${datebased_timestamp}`);
                    }

                    if(job.dayOfWeek && job.dayOfWeek.length){
                        let numDay = datebased_timestamp.getDay();
                        if(job.dayOfWeek.includes(numDay)){
                            activesToday = true;
                        }
                    }
                    if(activeToday){
                        let on_schedule_timestamp  = self.scheduleObj[schedule_id].timestamp,
                            off_schedule_timestamp = self.scheduleObj[offScheduleId].timestamp;
                        console.log(`on_schedule_timestamp: ${on_schedule_timestamp}`)
                        console.log(`off_schedule_timestamp: ${off_schedule_timestamp}`);
                        if(off_schedule_timestamp < on_schedule_timestamp)
                            off_schedule_timestamp.setDate(off_schedule_timestamp.getDate() + 1);

                        if(timestamp >= on_schedule_timestamp && timestamp < off_schedule_timestamp)
                            result = true;
                    }else{
                        console.log(`dayOfWeek does not activate today`);
                    }
                }else{ // schedule not found
                    console.log("Off Schedule not found!!");
                }
                
            }else{
                console.log(`off schedule - desired_state: ${desired_state} - typeof - ${typeof desired_state}`);
                console.log(`onScheduleId - ${onScheduleId}`);
                console.log(`offScheduleId - ${offScheduleId}`);
            }

        }
        return result;
    },
    // gets all the schedules for this device from the database and stores them in the scheduleArr
    // if the schedule is active, then the associated outlet is activated
    getSchedules: function(activateRelayFn, context){
        let self = this,
            sanitize_input = (input) => {return (Number(input) === 0) ? Number(input) : Number(input) || undefined};

        Device.findOne({local_ip: localIP, deviceType: "Relay Server"}, function(err, myDevices){
            if(err){
                console.log(err);
            }else{
                
                try{
                   let deviceSchedulePromise = async () => { return await Scheduler.find({'device.id': myDevices["_id"]}); }
                   
                    deviceSchedulePromise().then(function(result){
                        console.log(`result: ${result}`);
                        return result;
                    }, function(err){
                        console.log(`err: ${err}`);
                    }).then(function(schedule_configs){
                        console.log(`schedule_configs: ${schedule_configs}`);
                        schedule_configs.forEach(function(schedule_config){
                            console.log(`schedule_config: ${schedule_config}`);

                            let startScheduleId = schedule_config['relational']['startScheduleId'],
                                endScheduleId   = schedule_config['relational']['endScheduleId'],
                                device_gpio     = schedule_config['device']['gpio'],
                                desired_state   = schedule_config['device']['desired_state'];

                            // should put this code in the job class
                            let second = schedule_config['schedule']['second'],
                                minute = schedule_config['schedule']['minute'],
                                hour   = schedule_config['schedule']['hour'],
                                date   = schedule_config['schedule']['date'],
                                month  = schedule_config['schedule']['month'],
                                year   = schedule_config['schedule']['year'];

                            if(date >= 0 && month >= 0 && year){
                                let today     = new Date(),
                                    timestamp = new Date(year, month, date, hour, minute, second);

                                // node-schedule cannot create jobs that are set for a date in the past
                                // the quick fix is to remove the date, month and year attributes
                                if(endScheduleId && timestamp < today){ // we processing a start schedule
                                    console.log(`schedule_config will create invalid job with stored date: ${JSON.stringify(schedule_config)}`)
                                    delete schedule_config['schedule']['date'];
                                    delete schedule_config['schedule']['month'];
                                    delete schedule_config['schedule']['year'];
                                    console.log(`schedule_config fixed? - ${JSON.stringify(schedule_config)}`);
                                }
                                // if the current date is passed the end schedule's timestamp, this means that the
                                // the schedule set (prevSchedule, endSchedule, nextSchedule, endSchedule - processed in this order)
                                // failed to be removed from the database, remove the end schedule and it's associated start schedule
                                // from local memory and from mongo
                                if(startScheduleId && timestamp < today){ // we are processing an end schedule
                                    console.log("Current date is passed the end schedule date, schedule needs to be deleted");
                                    console.log(`timestamp: ${timestamp} - today: ${today}`);
                                    console.log(`timestamp > today? ${timestamp > today}`);
                                    console.log(`startScheduleId: ${startScheduleId} needs to be deleted`);
                                    console.log(`current schedule: ${schedule_config['_id']} needs to be deleted!`);
                                    self.deleteSchedule(startScheduleId);
                                    self.deleteSchedule(schedule_config['_id']);


                                }
                            }

                            let jobArgs = startScheduleId ? 
                                [self.deleteSchedule, self, startScheduleId.toString()] :
                                [activateRelayFn, context, device_gpio, desired_state];

                            let job = new JobBuilder()
                                .withSchedule(schedule_config['schedule'])
                                .withRelational(schedule_config['relational'])
                                .withDevice(schedule_config['device'])
                                .withJobFunction(...jobArgs)
                                .build()

                            self.scheduleObj[schedule_config['_id']] = job;
                            console.log(`next invocation - ${self.getDateOfNextInvocation(schedule_config['_id'])}`);
                        });
                        console.log(`Done processing schedules: ${JSON.stringify(self.scheduleObj)}`);
                       
                        self.startActiveSchedules(activateRelayFn, context);
                    }).catch(function(err){
                        console.log(`Error caught: ${err}`);
                    })
                   
                }catch(err){
                    console.log(`Error caught: ${err}`);
                }
            }
        });
    },
    // schedule_id - the mongo id of the schedule we are trying to access and update
    // updated_schedule_config - the updated schedule configuration
    // activateRelayFn - the function that turns the outlet on/off
    // context - refers to the context that the activateRelayFn function resides in, without the context, activateRelayFn does not work
    // Updates a schedule by id, updates the schedule config in the scheduleArr and then places the associated outlet in the correct state
    // (on/off) since the new schedule details may require it to turn on or off based on whatever state the associated outlet was in beforehand
    editSchedule: function(schedule_id, updated_schedule_config, activateRelayFn, context){
        let self                  = this,
            schedule_conflict     = false,
            today                 = new Date(),
            updated_device        = updated_schedule_config['device'],
            updated_schedule      = updated_schedule_config['schedule'],
            updated_relational    = updated_schedule_config['relational'],
            updated_device_gpio   = updated_device['device']['gpio'],
            updated_desired_state = updated_device['device']['desired_state']
            onScheduleId          = updated_relational['relational']['prevScheduleId'],
            offScheduleId         = updated_relational['relational']['nextScheduleId'],
            job                   = self.getScheduleJobById(schedule_id);
        if(!job){
            console.log(`job is null`);
        }else{


            console.log(`schedule_id: ${schedule_id}`);
            console.log(`updateSchedule: ${JSON.stringify(updated_schedule_config)}`);
          
            if(!onScheduleId in self.scheduleObj)
                throw new Error("Invalid id provided for prevScheduleId");

            if(!offScheduleId in self.scheduleObj)
                throw new Error("Invalid id provided for nextScheduleId");
            
            console.log("about to cancel schedule");

            let args         = [updated_device_gpio, updated_desired_state],
                updatedJobFn = function(){ activateRelayFn.call(context, ...args); };
                

            job.updateSchedJobAndDevice(updated_device, updated_schedule, updated_relational, updatedJobFn);

            Scheduler.findByIdAndUpdate(schedule_id, {$set: updated_schedule_config}, (err, schedule) => {
                if(err){
                    console.log(err);
                    throw err;
                } else {
                    console.log("Schedule canceled and removed!");

                    //self.setSchedule(obj, index);
                    // CHANGE NEEDED: does not account for updating the 'ON' schedule to an earlier time that would make the schedule be active
                    //self.startActiveSchedules(activateRelayFn, context);
                    
                    
                    if(onScheduleId){ // updating off schedule?
                        console.log("updating off schedule");
                        // get the on schedule
                        // let onScheduleIndex  = self.findScheduleIndex(onScheduleId.toString()),
                        //     schedule_config  = self.scheduleArr[onScheduleIndex]['schedule_config'],
                        //     device_gpio      = schedule_config['device']['gpio'],
                        //     desired_state    = schedule_config['device']['desired_state'],
                        //     isScheduleActive = self.scheduleIsActive(schedule_config, today);
                            
                        // if(isScheduleActive === true){
                        //     console.log("Schedule is active");
                        //     console.log("Desired state is on");
                        //     activateRelayFn.call(context,  device_gpio, desired_state);     
                        // }
                        // else{
                        //     console.log("Schedule is not active");
                        //     activateRelayFn.call(context, device_gpio, 0);
                        // }
                    }
                    if(offScheduleId){ // updating on schedule?
                        console.log("Updating on schedule");
                        // let schedule_config  = self.scheduleArr[index]['schedule_config'],
                        //     device_gpio      = schedule_config['device']['gpio'],
                        //     desired_state    = schedule_config['device']['desired_state'],
                        //     isScheduleActive = self.scheduleIsActive(schedule_config, today);
                        // if(isScheduleActive === true){
                        //     console.log("Schedule is active");
                        //     console.log("Desired state is on");
                        //     activateRelayFn.call(context,  device_gpio, desired_state);     
                        // }
                        // else{
                        //     console.log("Schedule is not active");
                        //     activateRelayFn.call(context, device_gpio, 0);
                        // }
                    }

                    self.startActiveSchedules(activateRelayFn, context);

                    for(const [schedule_id, job] of Object.entries(self.scheduleObj)){
                        //console.log(`my schedule config: ${JSON.stringify(schedule_obj)}`);
                        let device_gpio     = job.gpio,
                            desired_state   = job.desired_state,
                            prevSheduleId   = job.prevScheduleId,
                            nextScheduleId  = job.nextScheduleId,
                            sched_id        = schedule_id.toString();
                        
      
                        if(!nextScheduleId)
                            console.log("nextScheduleId is undefined");
                        else{
                            console.log(`nextScheduleId: ${nextScheduleId}`);
                            nextScheduleId = nextScheduleId.toString();
                            // schedule_id is the schedule we are trying to see is active or not
                            if(sched_id === schedule_id || nextScheduleId === schedule_id){
                                let isScheduleActive = self.scheduleIsActive(schedule_id, today);
                                if(isScheduleActive === true && desired_state === true){
                                    console.log("Schedule is active");
                                    console.log("Desired state is on");
                                    activateRelayFn.call(context,  device_gpio, desired_state);     
                                }
                                else{
                                    console.log("Schedule is not active");
                                    activateRelayFn.call(context, device_gpio, 0);
                                }    
                            }
                            
                        }
                    }
                }
            });
        }
       
    },
    updateScheduleRelationship: function(schedule_id, updated_schedule_config){
        let self = this;

        Scheduler.findByIdAndUpdate(schedule_id, {$set: updated_schedule_config}, (err, schedule) => {
            if(err){
                console.log(err)
            }else{
                console.log("successfully updated schedule");
                console.log(`Schedule before: ${JSON.stringify(self.scheduleObj[schedule_id].schedule_config)}`);
                self.scheduleObj[schedule_id].relational = updated_schedule_config['relational'];
                console.log(`Schedule After: ${JSON.stringify(self.scheduleObj[schedule_id].schedule_config)}`);
            }
        });
    },
    // // schedule_id - the mongo id of the schedule we are trying to access and delete
    // // Removes the schedule in the scheduleArr and deletes any schedules (next/prev/start/endScheduleId's) that are associated with it
    // // 1/8/2021 - deleting should turn off the associated outlet if it is somehow turned on
    deleteSchedule: function(schedule_id){
        console.log(`In deleteSchedule Function with ${schedule_id}`);
        let self = this,
            job  = self.getScheduleJobById(schedule_id);
            // prevScheduleId = job.prevScheduleId,
            // nextScheduleId = job.nextScheduleId,
            // startScheduleId = job.startScheduleId,
            // endScheduleId   = job.endScheduleId;


        if(job !== undefined){ // has the job been processed to local memory?
            self.cancelSchedule(schedule_id);
        }

        Scheduler.findByIdAndRemove(schedule_id, (err) => {
            if(err){
                console.log(err);
                throw err;
            }
            else{
                // try{
                    // let schedules = [schedule_id];
                    // if(prevScheduleId){

                    //     let prevJob = self.getScheduleJobById(prevScheduleId);
                    //     if(prevJob){
                    //         schedules.push(job.prevScheduleId.toString());
                    //         if(self.doesScheduleExist(prevJob.endScheduleId)){
                    //             schedules.push(prevJob.endScheduleId.toString());
                    //         }
                    //     }
                    //     if(self.doesScheduleExist(job.endScheduleId)){
                    //         // end schedule wont have a set prev or next schedule
                    //         console.log(`endScheduleId: ${job.endScheduleId}`);
                    //         schedules.push(job.endScheduleId.toString());

                    //     }   
                    // }else if(nextScheduleId){
                    //     let nextJob = self.getScheduleJobById(nextScheduleId);
                    //     if(nextJob){
                    //         schedules.push(nextScheduleId);
                    //         if(self.doesScheduleExist(nextJob.endScheduleId)){
                    //             schedules.push(nextJob.endScheduleId.toString());
                    //         }
                    //     }
                    //     if(self.doesScheduleExist(job.endScheduleId)){
                    //         // end schedule wont have a set prev or next schedule
                    //         console.log(`endScheduleId: ${job.endScheduleId}`);
                    //         schedules.push(job.endScheduleId.toString());
                    //     }   
                    // }else if(startScheduleId){
                    //     console.log(`Associated Start Schedule Found`);
                    //     let startJob = self.getScheduleJobById(startScheduleId);
                    //     if(startJob){
                    //          // start schedule wont have a set prev or next schedule since it would mess up a lot of functions in this file
                    //         console.log(`startScheduleId: ${startScheduleId}`);
                    //         schedules.push(startScheduleId.toString());
                    //         // get the schedule associated with the startScheduleId
                    //         // see if the schedule is associated with an on or off schedule
                    //         // retrieve that on or off schedule if it exists and delete it       
                    //         if(startJob.nextScheduleId){
                    //             let nextJob = self.getScheduleJobById(startJob.nextScheduleId);
                    //             if(nextJob){
                    //                 // end schedule wont have a set prev or next schedule
                    //                 console.log(`nextScheduleId: ${startJob.nextScheduleId}`);
                    //                 schedules.push(startJob.nextScheduleId.toString());
                    //                 if(self.doesScheduleExist(nextJob.endScheduleId)){
                    //                     schedules.push(nextJob.endScheduleId.toString());
                    //                 }
                    //             }
                    //         }
                    //         if(startJob.prevScheduleId){
                    //             let prevJob = self.getScheduleJobById(startJob.prevScheduleId);
                    //             if(prevJob){
                    //                 // end schedule wont have a set prev or next schedule
                    //                 console.log(`endScheduleId: ${startJob.prevScheduleId}`);
                    //                 schedules.push(startJob.prevScheduleId.toString());
                    //                 if(self.doesScheduleExist(prevJob.endScheduleId)){
                    //                     schedules.push(prevJob.endScheduleId.toString());
                    //                 }
                    //             }
                    //         }
                    //     }

                    // }else if(endScheduleId){
                    //     let endJob = self.getScheduleJobById(endScheduleId);
                    //     if(endJob){
                    //         console.log(`Associated End Schedule Found`);
                    //         schedules.push(endScheduleId.toString());

                    //         let nextJob = self.getScheduleJobById(endJob.nextScheduleId),
                    //             prevJob = self.getScheduleJobById(endJob.prevScheduleId);
                    //         if(nextJob){
                    //             console.log(`endScheduleId: ${endJob.nextScheduleId}`);
                    //             schedules.push(endJob.nextScheduleId);
                    //             if(self.doesScheduleExist(nextJob.endScheduleId())){
                    //                 schedules.push(nextJob.endScheduleId.toString());
                    //             }
                    //         }
                    //         if(prevJob){
                    //             console.log(`endScheduleId: ${endJob.prevScheduleId}`);
                    //             schedules.push(endJob.prevScheduleId.toString());
                    //             if(self.doesScheduleExist(prevJob.endScheduleId)){
                    //                 schedules.push(prevJob.endScheduleId.toString());
                    //             }
                    //         }
                    //     }
                    // }else{
                    //     console.log(`Unknown schedule found`);

                    // }
                    // console.log(`associated schedules found: ${schedules.toString()}`);
                    console.log(`Size of array Before removal: ${Object.keys(self.scheduleObj).length}`);
                    delete self.scheduleObj[schedule_id];
                    console.log(`Size of array after removal: ${Object.keys(self.scheduleObj).length}`);
                // }
                // catch(err){
                //     console.log(`Error: ${err.toString()}`);

                //     self.scheduleObj[schedule_id]['job'].cancel();
                //     console.log(`Size of array Before removal: ${Object.keys(self.scheduleObj).length}`);
                //     delete self.scheduleObj[schedule_id];

                //     console.log(`Size of array after removal: ${Object.keys(self.scheduleObj).length}`);
                // }
                
                // }else{

                    // check to see if the schedule is currently active

                    // self.scheduleArr[index]['job'].cancel();
                    // console.log(`Size of array Before removal: ${self.scheduleArr.length}`);
                    // self.scheduleArr.splice(index, 1);
                    // console.log(`Size of array after removal: ${self.scheduleArr.length}`);
                // }
            }
        });
    },
    deleteSchedules: function(...schedule_ids){
        let self = this;

        schedule_ids.forEach(function(schedule_id){
           
            Scheduler.findByIdAndRemove(schedule_id, (err) => {
                if(err){
                    console.log(err);
                    throw err;
                }
                else{
                    console.log("Canceling schedule");
                    self.cancelSchedule(schedule_id);
                    console.log("Back in deleteSchedules fn from cancelSchedule fn");
                    delete self.scheduleObj[schedule_id];
                    console.log(`Size of array: ${Object.keys(self.scheduleObj).length}`);
                }
            });
        });
    }
}
module.exports = scheduleHelpers;
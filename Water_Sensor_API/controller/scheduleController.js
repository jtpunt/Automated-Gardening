var Scheduler     = require("../models/scheduler"),
    Device        = require("../models/device"),
    WaterSettings = require("../models/waterSettings"),
    RelaySettings = require("../models/relaySettings"),
    schedule      = require('node-schedule'),
    ip            = require("ip"),
    async         = require("asyncawait/async"),
    await         = require("asyncawait/await"),
    localIP       = ip.address();

const MIN_SECOND = 0,
      MIN_MINUTE = 0,
      MIN_HOUR   = 0,
      MIN_DATE   = 1,
      MIN_MONTH  = 0,
      MIN_YEAR   = new Date().getFullYear(),
      MIN_DOW    = 0, // dayOfWeek
      
      MAX_SECOND = 59,
      MAX_MINUTE = 59,
      MAX_HOUR   = 23,
      MAX_DATE   = 31,
      MAX_MONTH  = 11,
      MAX_DOW    = 6;


var scheduleObj = {
    scheduleArr: [],
    // schedule_config: {
    //     
    // }
    buildSchedule: function(schedule_config){
        var scheduleObj = {};
        if(schedule_config['schedule']){
            // if we use short circuit evaluation on schedule['second'] to assign a value, and if schedule['second'] is 0, then this value will be ignored
            // and the right operand will be returned. This is not the behavior we want as second, minute, hour and month values can be 0
            let sanitize_input = (input) => {return (Number(input) === 0) ? Number(input) : Number(input) || undefined};
            
            const schedule  = schedule_config['schedule'] || undefined,
                  second    = sanitize_input(schedule['second']),
                  minute    = sanitize_input(schedule['minute']),
                  hour      = sanitize_input(schedule['hour']),
                  date      = Number(schedule['date'])  || undefined,
                  month     = sanitize_input(schedule['month']),
                  year      = Number(schedule['year']) || undefined,
                  dayOfWeek = (schedule['dayOfWeek']) ? Array.from(schedule['dayOfWeek']) : undefined;

            // Validate second input
            if(second !== undefined && !second.isNaN && Number.isInteger(second)){
                if(second >= MIN_SECOND && second <= MAX_SECOND)
                    scheduleObj['second'] = second;
                else 
                    throw new Error(`second input must be >= ${MIN_SECOND} or <= ${MAX_SECOND}`);
            }else 
                throw new Error("Invalid second input!");
            // Validate minute input
            if(minute !== undefined && !minute.isNaN && Number.isInteger(minute)){
                if(minute >= MIN_MINUTE && minute <= MAX_MINUTE)
                    scheduleObj['minute'] = minute;
                else 
                    throw new Error(`Minute input must be >= ${MIN_MINUTE} or <= ${MAX_MINUTE}`);
            }else 
                throw new Error("Invalid minute input!");
            // Validate hour input
            if(hour !== undefined && !hour.isNaN && Number.isInteger(hour)){
                if(hour >= MIN_HOUR && hour <= MAX_HOUR)
                    scheduleObj['hour'] = hour;
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
                scheduleObj['dayOfWeek'] = dayOfWeekArr; 
            }
            // valid date based scheduling details
            else if(date !== undefined && month !== undefined && year !== undefined){
                if(date >= MIN_DATE && date <= MAX_DATE)
                    scheduleObj['date'] = date;
                else 
                    throw new Error(`Date input must be >= ${MIN_DATE} or <= ${MAX_DATE}`);
                if(month >= MIN_MONTH && month <= MAX_MONTH)
                    scheduleObj['month'] = month;
                else 
                    throw new Error(`Month input must be >= ${MIN_MONTH} or <= ${MAX_MONTH}`);
                if(year >= MIN_YEAR){
                    scheduleObj['year'] = year;
                    let scheduleTestObj = new Date(year, month, date, hour, minute, second);
                    console.log("Date Obj: ", scheduleTestObj);
                    if(scheduleTestObj < new Date()) 
                        throw new Error("Schedule must occur in the future!");
                }else 
                    throw new Error(`Year input must be >= ${MIN_MONTH}  or <= ${MAX_MONTH}`);
            }
        }else 
            throw new Error("Schedule details not found!");
        return scheduleObj;
    },
    // params 1: schedule_config
    // params 2:
    // params 3:
    // params 4: desired_state is 0 (off) or 1(on)
    // pre:
    // post:
    buildJob: function(schedule_config, fn, context, gpio_pin, desired_state){
        let myScheduleObj = this.buildSchedule(schedule_config);

        let job = schedule.scheduleJob(myScheduleObj, function(){ fn.call(context, gpio_pin, desired_state); });
        
        return job;
    },
    getScheduleObjById: function(schedule_id){
        let self = this,
            index = self.findScheduleIndex(schedule_id);
        return self.scheduleArr[index];
    },
    getScheduleJobById: function(schedule_id){
        let self  = this,
            index = self.findScheduleIndex(schedule_id);
        return self.scheduleArr[index]['job'];
    },
    getScheduleConfigById: function(schedule_id){
        let self  = this,
            index = self.findScheduleIndex(schedule_id);
        return self.scheduleArr[index]['schedule_config'];
    },
    getDateOfNextInvocation: function(schedule_id){
        let self  = this,
            job   = self.getScheduleJobById(schedule_id),
            nextInvocationDate = job.nextInvocation();
        return nextInvocationDate;
    },
    setScheduleConfigById: function(schedule_id, schedule_config){
        let self   = this,
            config = self.getScheduleConfigById(schedule_id);
        config = schedule_config;
    },
    setScheduleJobById: function(schedule_id, job){
        let self     = this,
            schedule_job = self.getScheduleJobById(schedule_id);
        schedule_job = job;
    },
    // invalidates the next planned invocation or the job
    cancelNextSchedule: function(schedule_id, activateRelayFn, context){
        let self  = this,
            job   = self.getScheduleJobById(schedule_id);
                
        console.log(`Next Schedule for ${job.nextInvocation()}`)
        job.cancelNext();
        console.log("Has been successfully canceled");
    },
        // invalidates any job. All  planned invocations will be canceled
    cancelSchedule: function(schedule_id){
        let self  = this,
            job   = self.getScheduleJobById(schedule_id);
                
        console.log(`Next Schedule for ${job.nextInvocation()}`)
        job.cancel();
        console.log("Has been successfully canceled");
    },
    startActiveSchedules: function(activateRelayFn, context){
        let self  = this,
            today = new Date();
            
        self.scheduleArr.forEach(function(schedule_obj){
            //console.log(`my schedule config: ${JSON.stringify(schedule_obj)}`);
            let desired_state  = Boolean(schedule_obj['schedule_config']['device']['desired_state']),
                nextScheduleId = schedule_obj['schedule_config']['schedule']['nextScheduleId'],
                device_gpio    = Number(schedule_obj['schedule_config']['device']['gpio']);
            
            console.log("REGULAR SCHEDULING");
            if(nextScheduleId === undefined)
                console.log("nextScheduleId is undefined");
            else{
                let isScheduleActive = self.scheduleIsActive(schedule_obj['schedule_config'], today);
                if(isScheduleActive === true)
                    activateRelayFn.call(context,  device_gpio, desired_state);
            }
        });
    },
    resumeSchedule: function(schedule_id, activateRelayFn, context){
        let self            = this,
            reschedule      = true,
            today           = new Date(),
            index           = self.findScheduleIndex(schedule_id),
            schedule_config = self.scheduleArr[index]['schedule_config'];
            
            // schedule_config = self.getScheduleConfigById(schedule_id),
            // schedule_job    = self.getScheduleJobById(schedule_id);

            
        // if self.scheduleArr[index]['job'].nextInvocation() === undefined, dont rebuild job?
        let job = self.buildJob(
            schedule_config, 
            activateRelayFn, 
            context, 
            Number(schedule_config['device']['gpio']), 
            Boolean(schedule_config['device']['desired_state'])
        );

        self.scheduleArr[index]['job'] = job;
        console.log(`All Schedules for ${self.scheduleArr[index]['job']}`)
        console.log("Have been resumed");
        self.startActiveSchedules(activateRelayFn, context);
    },
    createSchedule: async function(new_schedule_config, activateRelayFn, context){
        let self                = this;
        let job                 = self.buildJob(
            new_schedule_config, 
            activateRelayFn, 
            context, 
            Number(new_schedule_config['device']['gpio']), 
            Boolean(new_schedule_config['device']['desired_state'])
        );
        let newScheduleResponse = await Scheduler.create(new_schedule_config);
    
        if(newScheduleResponse === undefined)
            return newScheduleResponse;
        else{
            console.log(`await result: ${newScheduleResponse}`);
            var obj = { "schedule_config": newScheduleResponse, job };
            self.setSchedule(obj);
            return newScheduleResponse["_id"];
        }
    },
    findSameDaySchedulesAndRetIdxs: function(schedule_config){
        let self      = this,
            second    = Number(schedule_config['schedule']['second'])|| undefined,
            minute    = Number(schedule_config['schedule']['minute'])|| undefined,
            hour      = Number(schedule_config['schedule']['hour'])  || undefined,
            date      = Number(schedule_config['schedule']['date'])  || undefined,
            month     = Number(schedule_config['schedule']['month']) || undefined,
            year      = Number(schedule_config['schedule']['year'])  || undefined,
            gpio      = Number(schedule_config['device']['gpio'])    || undefined,
            dayOfWeek = (schedule_config['schedule']['dayOfWeek']) ? Array.from(schedule_config['schedule']['dayOfWeek']) : undefined,
            timestamp = new Date(),
            indices   = [],
            intersect = function(a, b){
                return a.filter(Set.prototype.has, new Set(b));
            };
            
            
        // '00' from minute, second, or hour will create an invalid date object
        if(schedule_config['schedule']['second'] === '00')
            second = 0;
        if(schedule_config['schedule']['minute'] === '00')
            minute = 0;
        if(schedule_config['schedule']['hour'] == '00')
            hour = 0;
        timestamp.setHours(hour, minute, second);  

        // recurrence based scheduling
        if(dayOfWeek !== undefined && dayOfWeek.length){ 
            console.log("Recurrence Based Scheduling");
            // loop through our schedules and find another schedule that runs on same days as the schedule we are trying to add
            self.scheduleArr.forEach(function(schedule_obj, index){
                let arr_second        = Number(schedule_obj['schedule_config']['schedule']['second'])|| undefined,
                    arr_minute        = Number(schedule_obj['schedule_config']['schedule']['minute'])|| undefined,
                    arr_hour          = Number(schedule_obj['schedule_config']['schedule']['hour'])  || undefined,
                    arr_date          = Number(schedule_obj['schedule_config']['schedule']['date'])  || undefined,
                    arr_month         = Number(schedule_obj['schedule_config']['schedule']['month']) || undefined,
                    arr_year          = Number(schedule_obj['schedule_config']['schedule']['year'])  || undefined,
                    arr_gpio          = Number(schedule_obj['schedule_config']['device']['gpio'])    || undefined,
                    arr_dayOfWeek     = (schedule_obj['schedule_config']['schedule']['dayOfWeek']) ? Array.from(schedule_obj['schedule_config']['schedule']['dayOfWeek']) : undefined;
                if(schedule_obj['schedule_config']['schedule']['nextScheduleId'] !== undefined && gpio === arr_gpio){
                    // recurrence based schedule compared to recurrence based scheduling
                    if(arr_dayOfWeek !== undefined && arr_dayOfWeek.length){
                        // the times these schedules are set for are all the same for recurrence based scheduling
                        let common_days = intersect(dayOfWeek, arr_dayOfWeek);
                        // are there common days between these recurrence-based schedules?
                        if(common_days.length > 0)
                            indices.push(index);
                    }
                    // recurrence based scheduling compared to date based scheduling
                    else if (arr_date !== undefined && arr_month !== undefined && arr_year !== undefined){
                        let arr_timestamp = new Date(arr_year, arr_month, arr_date, arr_hour, arr_minute, arr_second);
                        let arr_numDay = arr_timestamp.getDay();
                        if(dayOfWeek.includes(arr_numDay))
                            indices.push(index);
                    }
                    // otherwise, recurrence based scheduling compared check to daily 1 time - off schedules
                    else
                        indices.push(index);
                }
            });
        }
        // date based scheduling
        else if(date !== undefined && month !== undefined && year !== undefined){ 
            // loop through our schedules and find another schedule that runs on same days as the schedule we are trying to add
            self.scheduleArr.forEach(function(schedule_obj, index){
                let arr_date          = Number(schedule_obj['schedule_config']['schedule']['date'])  || undefined,
                    arr_month         = Number(schedule_obj['schedule_config']['schedule']['month']) || undefined,
                    arr_year          = Number(schedule_obj['schedule_config']['schedule']['year'])  || undefined,
                    arr_gpio          = Number(schedule_obj['schedule_config']['device']['gpio'])    || undefined,
                    arr_dayOfWeek     = (schedule_obj['schedule_config']['schedule']['dayOfWeek']) ? Array.from(schedule_obj['schedule_config']['schedule']['dayOfWeek']) : undefined;
                
                if(schedule_obj['schedule_config']['schedule']['nextScheduleId'] !== undefined && gpio === arr_gpio){
                    // date based scheduling compared to recurrence based scheduling
                    if(arr_dayOfWeek !== undefined && arr_dayOfWeek.length){
                        let datebased_timestamp = new Date(year, month, date, hour, minute, second);
                        let datebased_numDay = datebased_timestamp.getDay();
                        
                        if(arr_dayOfWeek.includes(datebased_numDay))
                            indices.push(index);
                    }
                    // date based scheduling compared to date based scheduling
                    else if (arr_date !== undefined && arr_month !== undefined && arr_year !== undefined){
                        if(date === arr_date && month === arr_month && year === arr_year)
                            indices.push(index);
                    }
                    // otherwise, date based scheduling compared check to 1 time - off schedules
                    else
                        indices.push(index);
                }
            });
        }
        // otherwise, everyday 1 time - off schedules
        else{
            // loop through our schedules and find another schedule that runs on same days as the schedule we are trying to add
            self.scheduleArr.forEach(function(schedule_obj, index){
                let arr_date      = Number(schedule_obj['schedule_config']['schedule']['date'])  || undefined,
                    arr_month     = Number(schedule_obj['schedule_config']['schedule']['month']) || undefined,
                    arr_year      = Number(schedule_obj['schedule_config']['schedule']['year'])  || undefined,
                    arr_gpio      = Number(schedule_obj['schedule_config']['device']['gpio'])    || undefined,
                    arr_dayOfWeek = (schedule_obj['schedule_config']['schedule']['dayOfWeek']) ? Array.from(schedule_obj['schedule_config']['schedule']['dayOfWeek']) : undefined;
                    
                if(schedule_obj['schedule_config']['schedule']['nextScheduleId'] !== undefined && gpio === arr_gpio){
                //if(schedule_obj["_id"] !== schedule_id){
                    // everyday 1 time - off schedules compared to recurrence based scheduling
                    if(arr_dayOfWeek !== undefined && arr_dayOfWeek.length)
                        indices.push(index);
                    // everyday 1 time - off schedules compared to date based scheduling
                    else if (arr_date !== undefined && arr_month !== undefined && arr_year !== undefined)
                        indices.push(index);
                    // otherwise, 1 time - off schedules compared check to everyday 1 time - off schedules
                    else
                        indices.push(index);
                }
            });
        }
        return indices;
    },
    isScheduleOverlapping: function(on_schedule_config, off_schedule_config){
        let self              = this,
            new_on_second     = Number(on_schedule_config['schedule']['second'])  || undefined,
            new_on_minute     = Number(on_schedule_config['schedule']['minute'])  || undefined,
            new_on_hour       = Number(on_schedule_config['schedule']['hour'  ])  || undefined,
            
            new_off_second    = Number(off_schedule_config['schedule']['second']) || undefined,
            new_off_minute    = Number(off_schedule_config['schedule']['minute']) || undefined,
            new_off_hour      = Number(off_schedule_config['schedule']['hour'])   || undefined, 
            new_on_timestamp  = new Date(),
            new_off_timestamp = new Date();
            
        let conflictMsg       = "",
            indices           = [];
        
        console.log("in isScheduleOverlapping");
        // '00' from minute, second, or hour will create an invalid date object
        if(on_schedule_config['schedule']['second'] === '00')
            new_on_second = 0;
        if(on_schedule_config['schedule']['minute'] === '00')
            new_on_minute = 0;
        if(on_schedule_config['schedule']['hour'] == '00')
            new_on_hour = 0;
        // '00' from minute, second, or hour will create an invalid date object
        if(off_schedule_config['schedule']['second'] === '00')
            new_off_second = 0;
        if(off_schedule_config['schedule']['minute'] === '00')
            new_off_minute = 0;
        if(off_schedule_config['schedule']['hour'] == '00')
            new_off_hour = 0;
            
        new_on_timestamp.setHours(new_on_hour, new_on_minute, new_on_second);  
        new_off_timestamp.setHours(new_off_hour, new_off_minute, new_off_second);
        
        indices = self.findSameDaySchedulesAndRetIdxs(on_schedule_config);
        console.log("indexes: " + indices);
        
        indices.forEach(function(index){
            if(index >= 0){
                let arr_on_schedule_obj    = self.scheduleArr[index],
                    arr_on_schedule_config = arr_on_schedule_obj['schedule_config'],
                    arr_on_second          = arr_on_schedule_config['schedule']['second'],
                    arr_on_minute          = arr_on_schedule_config['schedule']['minute'],
                    arr_on_hour            = arr_on_schedule_config['schedule']['hour'],
                    arr_off_mongo_id       = arr_on_schedule_config['schedule']['nextScheduleId'].toString(),
                    arr_on_timestamp       = new Date();
                
                
                let arr_off_schedule_index  = self.findScheduleIndex(arr_off_mongo_id),
                    arr_off_schedule_obj    = self.scheduleArr[arr_off_schedule_index],
                    arr_off_schedule_config = arr_off_schedule_obj['schedule_config'],
                    arr_off_second          = arr_off_schedule_config['schedule']['second'],
                    arr_off_minute          = arr_off_schedule_config['schedule']['minute'],
                    arr_off_hour            = arr_off_schedule_config['schedule']['hour'],
                    arr_off_timestamp       = new Date();
                    
                arr_on_timestamp.setHours(arr_on_hour, arr_on_minute, arr_on_second);
                arr_off_timestamp.setHours(arr_off_hour, arr_off_minute, arr_off_second);
                
                console.log(`on_timestamp ${new_on_timestamp}, timestamp: ${arr_on_timestamp}, off_timestamp" ${new_off_timestamp}, timestamp1: ${arr_off_timestamp}`);
                
                let timestamp_options   = { hour: 'numeric', minute: 'numeric', hour12: true },
                    fixed_on_timestamp  = new_on_timestamp.toLocaleString('en-US', timestamp_options),
                    fixed_timestamp1    = arr_on_timestamp.toLocaleString('en-US', timestamp_options),
                    fixed_timestamp2    = arr_off_timestamp.toLocaleString('en-US', timestamp_options),
                    fixed_off_timestamp = new_off_timestamp.toLocaleString('en-US', timestamp_options);
                
                if(new_on_timestamp <= arr_on_timestamp && new_off_timestamp >= arr_off_timestamp)
                   conflictMsg += `Schedule is overlapping`;
            }
        });
        if(conflictMsg !== "")
            throw new Error(conflictMsg);
    },
    isScheduleConflicting: function(schedule_config){
        let self        = this,
            second      = Number(schedule_config['schedule']['second'])|| undefined,
            minute      = Number(schedule_config['schedule']['minute'])|| undefined,
            hour        = Number(schedule_config['schedule']['hour'])  || undefined,
            timestamp   = new Date();
            
        let conflictMsg = "",
            indices     = [];

        console.log("in isScheduleConflicting");
        let handleScheduleConflictsMsg = function(isScheduleConflicting, schedule_obj){
            // is there a schedule conflict?
            if(isScheduleConflicting){
                console.log("In handleScheduleConflictsMsg");
                let second           = schedule_obj['schedule']['second'],
                    minute           = schedule_obj['schedule']['minute'],
                    hour             = schedule_obj['schedule']['hour'];
                    
                let offScheduleId    = schedule_obj['schedule']['nextScheduleId'].toString(),
                    offScheduleIndex = self.findScheduleIndex(offScheduleId);
                    
                let on_timestamp     = new Date(),
                    off_timestamp    = new Date();
                    
                on_timestamp.setHours(hour, minute, second);
                
                if(offScheduleIndex !== -1){
                    let off_schedule_config = self.scheduleArr[offScheduleIndex]['schedule_config'],
                        off_schedule_second = off_schedule_config['schedule']['second'],
                        off_schedule_minute = off_schedule_config['schedule']['minute'],
                        off_schedule_hour   = off_schedule_config['schedule']['hour'];
                        
                    off_timestamp.setHours(off_schedule_hour, off_schedule_minute, off_schedule_second);
                    let timestamp_options   = { hour: 'numeric', minute: 'numeric', hour12: true };
                    
                    let fixed_on_timestamp  = on_timestamp.toLocaleString('en-US', timestamp_options),
                        fixed_timestamp     = timestamp.toLocaleString('en-US', timestamp_options),
                        fixed_off_timestamp = off_timestamp.toLocaleString('en-US', timestamp_options);
                        
                    return `New Schedule timestamp - ${fixed_timestamp} Conflicts with ON - ${fixed_on_timestamp} and OFF - ${fixed_off_timestamp}`;
                }else
                    console.log("offScheduleIndex === -1");
            }else // No Schedule Conflict Found
                return "";
            
        }
        // '00' from minute, second, or hour will create an invalid date object
        if(schedule_config['schedule']['second'] === '00')
            second = 0;
        if(schedule_config['schedule']['minute'] === '00')
            minute = 0;
        if(schedule_config['schedule']['hour'] === '00')
            hour = 0;
            
        timestamp.setHours(hour, minute, second);  
        
        indices = self.findSameDaySchedulesAndRetIdxs(schedule_config);
        console.log("indexes: " + indices);
        
        indices.forEach(function(index){
            if(index >= 0){
                let schedule_obj          = self.scheduleArr[index],
                    isScheduleConflicting = self.scheduleIsActive(schedule_obj['schedule_config'], timestamp);

                conflictMsg += handleScheduleConflictsMsg(isScheduleConflicting, schedule_obj['schedule_config']);
            }
        });
        if(conflictMsg !== ""){
            throw new Error(conflictMsg);
        }
    },
    // Finds the next_schedule_config that's associated with the prev_schedule_config
    // and returns the boolean result of whether the 2nd argument, timestamp is greater than or equal to 
    // the timestamp within the prev_schedule_config object and is also less tan the timestamp within 
    // the next_schedule_config object
    // Comparison does not use date, or day of week, but assumes these schedules are happening on the same day
    scheduleIsActive: function(on_schedule_config, timestamp){
        let self = this,
            result = false,
            sanitize_input = (input) => {return (Number(input) === 0) ? Number(input) : Number(input) || undefined};
            
        // check to see if 1 of the schedules is active right now.
        if(on_schedule_config === undefined || on_schedule_config === null)
            return result;
        
        let on_schedule_second = sanitize_input(on_schedule_config['schedule']['second']),
            on_schedule_minute = sanitize_input(on_schedule_config['schedule']['minute']),
            on_schedule_hour   = sanitize_input(on_schedule_config['schedule']['hour']),
            desired_state      = Boolean(on_schedule_config['device']['desired_state']),
            onScheduleId       = on_schedule_config['schedule']['prevScheduleId'],
            offScheduleId      = on_schedule_config['schedule']['nextScheduleId'];
            
        // schedules could be loaded out of order. For example, we could be looking at the schedule that turns the outlet off. we need to first look at the schedule that turns the outlet on
        if(desired_state !== undefined && desired_state === true && onScheduleId === undefined && offScheduleId !== undefined){ // 'on' schedule
            console.log("Processing 'on' schedule");
            let offScheduleIndex = self.findScheduleIndex(on_schedule_config['schedule']['nextScheduleId'].toString());
    
            if(offScheduleIndex !== -1){
                let today                  = new Date(),
                    on_schedule_timestamp  = new Date(),
                    off_schedule_timestamp = new Date(),
                    off_schedule_config    = self.scheduleArr[offScheduleIndex]['schedule_config'],
                    off_schedule_second    = sanitize_input(off_schedule_config['schedule']['second']),
                    off_schedule_minute    = sanitize_input(off_schedule_config['schedule']['minute']),
                    off_schedule_hour      = sanitize_input(off_schedule_config['schedule']['hour']);
                        
                on_schedule_timestamp.setHours(on_schedule_hour, on_schedule_minute, on_schedule_second);
                off_schedule_timestamp.setHours(off_schedule_hour, off_schedule_minute, off_schedule_second);
                
                // console.log(`prev_schedule_timestamp: ${prev_schedule_timestamp}`);
                // console.log(`today timestamp:  ${today}`);
                // console.log(`next_schedule_timestamp: ${next_schedule_timestamp}`);
                if(timestamp >= on_schedule_timestamp && timestamp < off_schedule_timestamp)
                    result = true;
            }else{ // schedule not found
                console.log("Schedule not found!!");
            }
            
        }else{
            console.log("There is a problem with the inputs given.")
            console.log(`desired_state: ${desired_state}`);
            console.log(`prevScheduleId:  ${onScheduleId}`);
            console.log(`nextScheduleId:  ${offScheduleId}`);
        }
        return result;
    },
    // TO DO - pass in the device id, remove the Device mongodb model, remove the 'include ../models/Device' line at the top of the file
    getSchedulesTest: function(fn, context){
        let self = this;

        Device.findOne({local_ip: localIP, deviceType: 'Water Sensor'}, function(err, device){
            if(err) console.log(err.toString);
            else{
                console.log("Found device: " + device);
                console.log("Device id: " + device['_id']);
                WaterSettings.findOne({ waterId: device['_id'] }, function(err, water_config){
                    if(err) console.log(err);
                    else{
                        console.log(`water_config found: ${water_config}`);
                        let checkMinsBefore = water_config['checkMinsBefore'],
                            checkMinsAfter  = water_config['checkMinsAfter'];
                        RelaySettings.find({ }, function(err, relay_config){
                            if(err) console.log(err);
                            else{
                                console.log("Relay settings found: " + relay_config);
                            }
                        });
                        // Scheduler.find({'device.id': water_config["relayId"]}, function(err, schedule_configs){
                        //     if(err) console.log(err);
                        //     else{
                        //         console.log(`Schedule configurations found: ${schedule_configs}`);
                        //         schedule_configs.forEach(function(schedule_config){
                        //             console.log(`schedule_config: ${schedule_config}`);
                        //             let schedule = schedule_config['schedule'],
                        //                 second   = schedule['second'],
                        //                 minute   = schedule['minute'],
                        //                 hour     = schedule['hour'],
                        //                 timestamp = new Date();

                        //             timestamp.setHours(hour, minute, second);

                        //             if(schedule_config['device']['desired_state'] === true) // on?
                        //                 // adjust timestamp to check a set amount of time before the water pumps start
                        //                 timestamp.setMinutes(timestamp.getMinutes() - checkMinsBefore);
                        //             else
                        //                 // adjust timestamp to check a set amount of time after the water pump shuts off
                        //                 timestamp.setMinutes(timestamp.getMinutes() - checkMinsAfter);
                                    
                        //             console.log(`checkMinsBefore at: ${timestamp.toString()}`);
                        //             schedule_config['schedule']['second'] = timestamp.getSeconds();
                        //             schedule_config['schedule']['minute'] = timestamp.getMinutes();
                        //             schedule_config['schedule']['hour']   = timestamp.getHours();
                        //             let job = self.buildJob(
                        //                 schedule_config, 
                        //                 fn, 
                        //                 context, 
                        //                 Number(schedule_config['device']['gpio']), 
                        //                 Boolean(schedule_config['device']['desired_state'])
                        //             );
                        //             console.log("Job created: " + job);
                        //             console.log("Next invocation: " + job.nextInvocation());
                        //             var obj = {"schedule_config": schedule_config, job};
                        //             self.setSchedule(obj);
                        //         });
                        //         console.log(`Done processing schedules: ${self.scheduleArr.length}`);
                        //         // with node-schedule, create new crontab like schedules
                        //         // that occur a specified amount of time before and after our relay turns on
                        //         //  - > water_config['checkMinsBefore'] and water_config['checkMinsAfter'],
                                
                        //         // if our water config is set up to prevent this, send an HTTP request to
                        //         // to our relay device and cancel it's upcoming schedule to prevent it form overwatering
                        //         // - > water_config['cancelRelay'] 
                        //         // - > http GET /schedule/:schedule_id/cancel
                                
                        //         // 
                        //     }
                        // });
                    };
                });
            }
        });
    },
    getSchedules: function(activateRelayFn, context){
        let self = this,
            sanitize_input = (input) => {return (Number(input) === 0) ? Number(input) : Number(input) || undefined};

        Device.findOne({local_ip: localIP}, function(err, myDevices){
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
                            let job = self.buildJob(
                                schedule_config, 
                                activateRelayFn, 
                                context, 
                                Number(schedule_config['device']['gpio']), 
                                Boolean(schedule_config['device']['desired_state'])
                            );
                            var obj = {"schedule_config": schedule_config, job};
                            self.setSchedule(obj);
                        });
                        console.log(`Done processing schedules: ${self.scheduleArr.length}`);
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
    setSchedule: function(new_schedule_config, index){
        let self = this;
        if(index !== undefined){
            if(typeof index !== Number){
                throw new Error("index is not a number!");
            }else if(index > self.scheduleArr.length){
                throw new Error("index provided is not valid!")
            }else{
                self.scheduleArr[index] = null;
                self.scheduleArr[index] = new_schedule_config;
            }
        }else{
            self.scheduleArr.push(new_schedule_config);
        }
    },
    editSchedule: function(schedule_id, updated_schedule_config, activateRelayFn, context){
        let self              = this,
            schedule_conflict = false,
            today             = new Date(),
            onScheduleId      = updated_schedule_config['schedule']['prevScheduleId'] || undefined,
            offScheduleId     = updated_schedule_config['schedule']['nextScheduleId'] || undefined,
            index             = self.findScheduleIndex(schedule_id);
        console.log(`schedule_id: ${schedule_id}`);
        console.log(`updateSchedule: ${updated_schedule_config}`);
        console.log(`Match found at index: ${index}`);
        

        if(onScheduleId !== undefined){
            let onScheduleIndex = self.findScheduleIndex(onScheduleId.toString());
            if(onScheduleIndex === -1)
                throw new Error("Invalid id provided for prevScheduleId");
        }
        if(offScheduleId !== undefined){
            let offScheduleIndex = self.findScheduleIndex(offScheduleId.toString());
            if(offScheduleIndex === -1)
                throw new Error("Invalid id provided for nextScheduleId");
        }

        let job = self.buildJob(
            updated_schedule_config, 
            activateRelayFn, 
            context, 
            Number(updated_schedule_config['device']['gpio']), 
            Boolean(updated_schedule_config['device']['desired_state'])
        );

        Scheduler.findByIdAndUpdate(schedule_id, {$set: updated_schedule_config}, (err, schedule) => {
            if(err){
                console.log(err);
                throw err;
            } else {
                console.log("Schedule canceled and removed!");

                let updated_schedule_device = updated_schedule_config['device'],
                    updated_schedule_schedule = updated_schedule_config['schedule'];
                
                let schedule_config = {
                    "device": updated_schedule_device,
                    "schedule": updated_schedule_schedule,
                    "_id": schedule['_id']
                };
                // self.scheduleArr[index].updateSchedule(updated_schedule_device, updated_schedule_schedule, job);
                // let schedule_config1 = new Schedule_Config(updated_schedule_device, updated_schedule_schedule, schedule["_id"]);
                var obj = {"schedule_config": schedule_config, job};
                self.scheduleArr[index] = null;
                self.scheduleArr[index] = obj;
                //self.setSchedule(obj, index);
                // CHANGE NEEDED: does not account for updating the 'ON' schedule to an earlier time that would make the schedule be active
                //self.startActiveSchedules(activateRelayFn, context);
                
                
                if(onScheduleId !== undefined){ // updating off schedule?
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
                if(offScheduleId !== undefined){ // updating on schedule?
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

                
                self.scheduleArr.forEach(function(schedule_obj){
                    //console.log(`my schedule config: ${JSON.stringify(schedule_obj)}`);
                    let desired_state  = Boolean(schedule_obj['schedule_config']['device']['desired_state']),
                        prevSheduleId  = schedule_obj['schedule_config']['schedule']['prevScheduleId'],
                        nextScheduleId = schedule_obj['schedule_config']['schedule']['nextScheduleId'],
                        sched_id       = schedule_obj['schedule_config']['_id'].toString(),
                        device_gpio    = Number(schedule_obj['schedule_config']['device']['gpio']);
                    
  
                    if(nextScheduleId === undefined)
                        console.log("nextScheduleId is undefined");
                    else{
                        nextScheduleId = nextScheduleId.toString();
                        // schedule_id is the schedule we are trying to see is active or not
                        if(sched_id === schedule_id || nextScheduleId === schedule_id){
                            let isScheduleActive = self.scheduleIsActive(schedule_obj['schedule_config'], today);
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
                });
            }
        });
    },
    deleteSchedule: function(schedule_id){
        let self = this,
            index = self.findScheduleIndex(schedule_id);
            
        console.log(`Deleting Schedule Function: ${index}`);
        console.log(`Match found at index: ${index}`);
        
        Scheduler.findByIdAndRemove(schedule_id, (err) => {
            if(err){
                console.log(err);
                throw err;
            }
            else{
                console.log("in else");
                //self.cancelSchedule(schedule_id);
                //self.scheduleArr[index]['job'].cancel();
                console.log("Schedule canceled and removed!\n");
                self.scheduleArr.splice(index, 1);
                console.log(self.scheduleArr.length);
            }
        });
    },
    findScheduleIndex: function(schedule_id){
        let index = this.scheduleArr.findIndex((scheduleObj) => scheduleObj['schedule_config']['_id'] == schedule_id);
        if(index === -1)
            throw "Schedule not found!";
        return index;
    }
}
module.exports = scheduleObj;
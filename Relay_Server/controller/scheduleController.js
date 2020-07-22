var Scheduler     = require("../models/scheduler"),
    Device        = require("../models/device"),
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
                if(second >= MIN_SECOND && second <= MAX_SECOND){
                    scheduleObj['second'] = second;
                }else throw new Error(`second input must be >= ${MIN_SECOND} or <= ${MAX_SECOND}`);
            }else throw new Error("Invalid second input!");
            // Validate minute input
            if(minute !== undefined && !minute.isNaN && Number.isInteger(minute)){
                if(minute >= MIN_MINUTE && minute <= MAX_MINUTE){
                    scheduleObj['minute'] = minute;
                }else throw new Error(`Minute input must be >= ${MIN_MINUTE} or <= ${MAX_MINUTE}`);
            }else throw new Error("Invalid minute input!");
            // Validate hour input
            if(hour !== undefined && !hour.isNaN && Number.isInteger(hour)){
                if(hour >= MIN_HOUR && hour <= MAX_HOUR){
                    scheduleObj['hour'] = hour;
                }else throw new Error(`Minute input must be >= ${MIN_HOUR} or <= ${MAX_HOUR}`)
            }else throw new Error("Invalid hour input!");
            if(dayOfWeek !== undefined && dayOfWeek.length){
                console.log("dayOfWeek scheduling");
                let dayOfWeekArr = dayOfWeek.map(function(day){
                    // dayOfWeek = 0 - 6
                    if(!Number.isNaN(day) && Number(day) >= MIN_DOW && Number(day) <= MAX_DOW){
                        return parseInt(day);
                    }else throw new Error("Invalid day of week input.");
                });
                scheduleObj['dayOfWeek'] = dayOfWeekArr; 
            }
            // valid date input
            else if(date !== undefined && month !== undefined && year !== undefined){
                console.log("DATE BASED SCHEDULING");
                // DATE-BASED SCHEDULING
                if(date >= MIN_DATE && date <= MAX_DATE){
                    scheduleObj['date'] = date;
                }else throw new Error(`Date input must be >= ${MIN_DATE} or <= ${MAX_DATE}`);
                if(month >= MIN_MONTH && month <= MAX_MONTH){
                    scheduleObj['month'] = month;
                }else throw new Error(`Month input must be >= ${MIN_MONTH} or <= ${MAX_MONTH}`);
                if(year >= MIN_YEAR){
                    scheduleObj['year'] = year;
                    
                    let scheduleTestObj = new Date(year, month, date, hour, minute, second);
                    console.log("Date Obj: ", scheduleTestObj);
                    if(scheduleTestObj < new Date()) 
                        throw new Error("Schedule must occur in the future!");
                }else throw new Error(`Year input must be >= ${MIN_MONTH}  or <= ${MAX_MONTH}`);
            }
        }else throw new Error("Schedule details not found!");
        return scheduleObj;
    },
    // params 1: schedule_config
    // params 2:
    // params 3:
    // params 4: desired_state is 0 (off) or 1(on)
    // pre:
    // post:
    buildJob: function(schedule_config, activateRelayFn, context, gpio_pin, desired_state){
        let myScheduleObj = this.buildSchedule(schedule_config);

        let job = schedule.scheduleJob(myScheduleObj, function(){ activateRelayFn.call(context, gpio_pin, desired_state); });
        
        return job;
    },
    // invalidates any job. All  planned invocations will be canceled
    cancelSchedule: function(schedule_id, activateRelayFn, context){
        let self  = this,
            index = self.findScheduleIndex(schedule_id);
        if(index !== -1){   
        // cancel(reschedule) - when you set reschedule to true then the Job is newly scheduled afterwards
            console.log(`All Schedules for ${self.scheduleArr[index]['job'].nextInvocation()}`)
            self.scheduleArr[index]['job'].cancel();
            let device_gpio = self.scheduleArr[index]['schedule_config']['device']['gpio'],
                desired_state = false;
                
            activateRelayFn.call(context,  device_gpio, desired_state);
            console.log("Have been successfully canceled");
        }else{
            console.log("Schedule not found!");
            throw "Schedule not found!";
        }
            
    },
    // invalidates the next planned invocation or the job
    cancelNextSchedule: function(schedule_id){
        let self  = this,
            index = self.findScheduleIndex(schedule_id);
        if(index !== -1){   
            // cancelNext(reschedule) - when you set reschedule to true then the Job is newly scheduled afterwards
            console.log(`Next Schedule for ${self.scheduleArr[index]['job'].nextInvocation()}`)
            self.scheduleArr[index]['job'].cancelNext();
            console.log("Has been successfully canceled");
        }else{
            console.log("Schedule not found!");
            throw "Schedule not found!";
        }
    },
    resumeSchedule: function(schedule_id, activateRelayFn, context){
        let self  = this,
            reschedule = true,
            index = self.findScheduleIndex(schedule_id);
        if(index !== -1){   
            console.log(`All Schedules for ${self.scheduleArr[index]['job'].nextInvocation()}`)
            let schedule_config = self.scheduleArr[index]['schedule_config'];
            
            let job = self.buildJob(
                schedule_config, 
                activateRelayFn, 
                context, 
                Number(schedule_config['device']['gpio']), 
                Boolean(schedule_config['device']['desired_state'])
            );

            self.scheduleArr[index]['job'] = job;
            console.log(`All Schedules for ${self.scheduleArr[index]['job'].nextInvocation()}`)
            console.log("Have been resumed");
            
            self.scheduleArr.forEach(function(schedule_obj){
                console.log(`my schedule config: ${JSON.stringify(schedule_obj)}`);
                let desired_state  = Boolean(schedule_obj['schedule_config']['device']['desired_state']),
                    nextScheduleId = schedule_obj['schedule_config']['schedule']['nextScheduleId'],
                    device_gpio    = Number(schedule_obj['schedule_config']['device']['gpio']);
                
                console.log("REGULAR SCHEDULING");
                if(nextScheduleId === undefined){
                    console.log("nextScheduleId is undefined");
                }else{
                    let today                   = new Date();
                    let isScheduleActive = self.scheduleIsActive(schedule_obj['schedule_config'], today);
                    
                    desired_state = (isScheduleActive === true) ?  Boolean(desired_state) : Boolean(isScheduleActive);
                    //console.log("schedule is " (desired_state === true) ? " active" : " not active" );
                    activateRelayFn.call(context,  device_gpio, desired_state);
                    
                }
            });
            
            
        }else{
            console.log("Schedule not found!");
            throw "Schedule not found!";
        }
    },
    createSchedule: async function(new_schedule_config, activateRelayFn, context){
        let self              = this;
        let newScheduleResponse = await Scheduler.create(new_schedule_config);
        
        if(newScheduleResponse === undefined){
            return newScheduleResponse;
        }else{
            console.log(`await result: ${newScheduleResponse}`);
            let job = self.buildJob(
                new_schedule_config, 
                activateRelayFn, 
                context, 
                Number(newScheduleResponse['device']['gpio']), 
                Boolean(newScheduleResponse['device']['desired_state'])
            );
            var obj = { "schedule_config": newScheduleResponse, job };
            self.setSchedule(obj);
            return newScheduleResponse["_id"];
        }
        
        
    },
    findSameDayScheduleAndRetIdxs: function(schedule_config){
        let self      = this,
            second    = Number(schedule_config['schedule']['second'])|| undefined,
            minute    = Number(schedule_config['schedule']['minute'])|| undefined,
            hour      = Number(schedule_config['schedule']['hour'])  || undefined,
            date      = Number(schedule_config['schedule']['date'])  || undefined,
            month     = Number(schedule_config['schedule']['month']) || undefined,
            year      = Number(schedule_config['schedule']['year'])  || undefined,
            gpio      = Number(schedule_config['device']['gpio'])    || undefined,
            dayOfWeek = (schedule_config['schedule']['dayOfWeek']) ? Array.from(schedule_config['schedule']['dayOfWeek']) : undefined,
            timestamp = new Date();
            
        let indexes = [];
            
        // '00' from minute, second, or hour will create an invalid date object
        if(schedule_config['schedule']['second'] === '00'){
            second = 0;
        }
        if(schedule_config['schedule']['minute'] === '00'){
            minute = 0;
        }
        if(schedule_config['schedule']['hour'] == '00'){
            hour = 0;
        }
        timestamp.setHours(hour, minute, second);  
        let intersect = function(a, b){
            return a.filter(Set.prototype.has, new Set(b));
        }
        // recurrence based scheduling
        if(dayOfWeek !== undefined && dayOfWeek.length){ 
            console.log("Recurrence Based Scheduling");
            // loop through our schedules and find another schedule that runs on same days as the schedule we are trying to add
            
            // dayOfWeek: [1, 2, 3, 4, 5]
            // scheduleArr[0]['schedule_config']['schedule']['dayOfWeek']: [0, 2, 4, 5]
            
            // we need to return an array that holds overlapping numbers from both dayOfWeek arrays: [2, 4, 5];
            // we we need to check [2,4,5] or just [2]? the time that these schedules go off are the same,
            // however, we will need to double check them for date-based scheduling, so it is necessary to check these
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
                        if(common_days.length > 0){
                            indexes.push(index);
                        }
                    }
                    // recurrence based scheduling compared to date based scheduling
                    else if (arr_date !== undefined && arr_month !== undefined && arr_year !== undefined){
                        let arr_timestamp = new Date(arr_year, arr_month, arr_date, arr_hour, arr_minute, arr_second);
                        let arr_numDay = arr_timestamp.getDay();
                        if(dayOfWeek.includes(arr_numDay)){
                            indexes.push(index);
                        }
                    }
                    // otherwise, recurrence based scheduling compared check to daily 1 time - off schedules
                    else{
                        indexes.push(index);
                    }
                }
            });
        }
        // date based scheduling
        else if(date !== undefined && month !== undefined && year !== undefined){ 
            console.log("Date based scheduling");
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
                    // date based scheduling compared to recurrence based scheduling
                    if(arr_dayOfWeek !== undefined && arr_dayOfWeek.length){
                        let datebased_timestamp = new Date(year, month, date, hour, minute, second);
                        let datebased_numDay = datebased_timestamp.getDay();
                        
                        if(arr_dayOfWeek.includes(datebased_numDay)){
                            indexes.push(index);
                        }
                    }
                    // date based scheduling compared to date based scheduling
                    else if (arr_date !== undefined && arr_month !== undefined && arr_year !== undefined){
                        if(date === arr_date && month === arr_month && year === arr_year){
                            indexes.push(index);
                        }
                    }
                    // otherwise, date based scheduling compared check to 1 time - off schedules
                    else{
                        indexes.push(index);
                    }
                }
            });
        }
        // otherwise, everyday 1 time - off schedules
        else{
            self.scheduleArr.forEach(function(schedule_obj, index){
                let arr_date      = Number(schedule_obj['schedule_config']['schedule']['date'])  || undefined,
                    arr_month     = Number(schedule_obj['schedule_config']['schedule']['month']) || undefined,
                    arr_year      = Number(schedule_obj['schedule_config']['schedule']['year'])  || undefined,
                    arr_gpio      = Number(schedule_obj['schedule_config']['device']['gpio'])    || undefined,
                    arr_dayOfWeek = (schedule_obj['schedule_config']['schedule']['dayOfWeek']) ? Array.from(schedule_obj['schedule_config']['schedule']['dayOfWeek']) : undefined;
                    
                if(schedule_obj['schedule_config']['schedule']['nextScheduleId'] !== undefined && gpio === arr_gpio){
                //if(schedule_obj["_id"] !== schedule_id){
                    // everyday 1 time - off schedules compared to recurrence based scheduling
                    if(arr_dayOfWeek !== undefined && arr_dayOfWeek.length){
                        indexes.push(index);
                    }
                    // everyday 1 time - off schedules compared to date based scheduling
                    else if (arr_date !== undefined && arr_month !== undefined && arr_year !== undefined){
                        indexes.push(index);
                    }
                    // otherwise, 1 time - off schedules compared check to everyday 1 time - off schedules
                    else{ 
                        indexes.push(index);
                    }
                }
            });
            
        }
        return indexes;
    },
    areSchedulesOnSameDay: function(schedule_config){

    },
    isScheduleOverlapping: function(start_schedule_config, end_schedule_config){
        let self      = this,
            start_second    = Number(start_schedule_config['schedule']['second'])|| undefined,
            start_minute    = Number(start_schedule_config['schedule']['minute'])|| undefined,
            start_hour      = Number(start_schedule_config['schedule']['hour'])  || undefined,
            end_second      = Number(end_schedule_config['schedule']['second'])  || undefined,
            end_minute      = Number(end_schedule_config['schedule']['minute'])  || undefined,
            end_hour        = Number(end_schedule_config['schedule']['hour'])    || undefined, 
            on_timestamp    = new Date(),
            off_timestamp   = new Date();
            
        let conflictMsg = "",
            indexes     = [];
        
        console.log("in isScheduleOverlapping");
        // '00' from minute, second, or hour will create an invalid date object
        if(start_schedule_config['schedule']['second'] === '00'){
            start_second = 0;
        }
        if(start_schedule_config['schedule']['minute'] === '00'){
            start_minute = 0;
        }
        if(start_schedule_config['schedule']['hour'] == '00'){
            start_hour = 0;
        }
        // '00' from minute, second, or hour will create an invalid date object
        if(end_schedule_config['schedule']['second'] === '00'){
            end_second = 0;
        }
        if(end_schedule_config['schedule']['minute'] === '00'){
            end_minute = 0;
        }
        if(end_schedule_config['schedule']['hour'] == '00'){
            end_hour = 0;
        }
        on_timestamp.setHours(start_hour, start_minute, start_second);  
        off_timestamp.setHours(end_hour, end_minute, end_second);
        
        indexes = self.findSameDayScheduleAndRetIdxs(start_schedule_config);
        console.log("indexes: " + indexes);
        
        indexes.forEach(function(index){
            if(index >= 0){
                let schedule_obj    = self.scheduleArr[index],
                    schedule_config = schedule_obj['schedule_config'],
                    second          = schedule_config['schedule']['second'],
                    minute          = schedule_config['schedule']['minute'],
                    hour            = schedule_config['schedule']['hour'],
                    timestamp       = new Date();
                
                console.log(schedule_config);
                console.log(schedule_config['schedule']['nextScheduleId'].toString());
                let idx = self.findScheduleIndex(schedule_config['schedule']['nextScheduleId'].toString());
                
                let schedule_index    = self.findScheduleIndex(schedule_config['schedule']['nextScheduleId'].toString()),
                    schedule_obj1     = self.scheduleArr[schedule_index],
                    schedule_config1 = schedule_obj1['schedule_config'],
                    second1          = schedule_config1['schedule']['second'],
                    minute1          = schedule_config1['schedule']['minute'],
                    hour1            = schedule_config1['schedule']['hour'],
                    timestamp1       = new Date();
                    
                timestamp.setHours(hour, minute, second);
                timestamp1.setHours(hour1, minute1, second1);
                
                console.log(`on_timestamp ${on_timestamp}, timestamp: ${timestamp}, off_timestamp" ${off_timestamp}, timestamp1: ${timestamp1}`);
                
                let timestamp_options = { hour: 'numeric', minute: 'numeric', hour12: true };
                
                let fixed_on_timestamp = on_timestamp.toLocaleString('en-US', timestamp_options);
                let fixed_timestamp1 = timestamp.toLocaleString('en-US', timestamp_options);
                let fixed_timestamp2 = timestamp1.toLocaleString('en-US', timestamp_options);
                let fixed_off_timestamp = off_timestamp.toLocaleString('en-US', timestamp_options);
                
                if(on_timestamp <= timestamp && off_timestamp >= timestamp1){
                   conflictMsg += `Schedule is overlapping`;
                }
            }
        });
        if(conflictMsg !== ""){
            throw new Error(conflictMsg);
        }
    },
    isScheduleConflicting: function(schedule_config){
        let self      = this,
            second    = Number(schedule_config['schedule']['second'])|| undefined,
            minute    = Number(schedule_config['schedule']['minute'])|| undefined,
            hour      = Number(schedule_config['schedule']['hour'])  || undefined,
            dayOfWeek = (schedule_config['schedule']['dayOfWeek']) ? Array.from(schedule_config['schedule']['dayOfWeek']) : undefined,
            timestamp = new Date();
            
        let conflictMsg = "",
            indexes     = [];

        console.log("in isScheduleConflicting");
        let handleScheduleConflictsMsg = function(isScheduleConflicting, schedule_obj){
            if(isScheduleConflicting){
                let second = schedule_obj['schedule_config']['schedule']['second'],
                    minute  = schedule_obj['schedule_config']['schedule']['minute'],
                    hour   = schedule_obj['schedule_config']['schedule']['hour'];
                let on_timestamp = new Date(),
                    off_timestamp = new Date();
                    
                on_timestamp.setHours(hour, minute, second);
                
                let nextScheduleIndex = self.findScheduleIndex(schedule_obj['schedule_config']['schedule']['nextScheduleId'].toString());

                if(nextScheduleIndex !== -1){
                    let next_schedule_config    = self.scheduleArr[nextScheduleIndex]['schedule_config'],
                        next_schedule_second    = next_schedule_config['schedule']['second'],
                        next_schedule_minute    = next_schedule_config['schedule']['minute'],
                        next_schedule_hour      = next_schedule_config['schedule']['hour'];
                    off_timestamp.setHours(next_schedule_hour, next_schedule_minute, next_schedule_second);
                    let timestamp_options = { hour: 'numeric', minute: 'numeric', hour12: true };
                    
                    let fixed_on_timestamp = on_timestamp.toLocaleString('en-US', timestamp_options);
                    let fixed_timestamp = timestamp.toLocaleString('en-US', timestamp_options);
                    let fixed_off_timestamp = off_timestamp.toLocaleString('en-US', timestamp_options);
                    return `New Schedule timestamp - ${fixed_timestamp} Conflicts with ON - ${fixed_on_timestamp} and OFF - ${fixed_off_timestamp}, nextScheduleIndex: ${nextScheduleIndex}`;
                }
            }
        }
        
        // '00' from minute, second, or hour will create an invalid date object
        if(schedule_config['schedule']['second'] === '00'){
            second = 0;
        }
        if(schedule_config['schedule']['minute'] === '00'){
            minute = 0;
        }
        if(schedule_config['schedule']['hour'] == '00'){
            hour = 0;
        }
        timestamp.setHours(hour, minute, second);  
        
        indexes = self.findSameDayScheduleAndRetIdxs(schedule_config);
        console.log("indexes: " + indexes);
        
        indexes.forEach(function(index){
            if(index >= 0){
                let schedule_obj          = self.scheduleArr[index],
                    isScheduleConflicting = self.scheduleIsActive(schedule_obj['schedule_config'], timestamp);
                    
                conflictMsg += handleScheduleConflictsMsg(isScheduleConflicting, schedule_obj);
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
    scheduleIsActive: function(prev_schedule_config, timestamp){
        let self = this,
            result = false,
            sanitize_input = (input) => {return (Number(input) === 0) ? Number(input) : Number(input) || undefined};
            
        // check to see if 1 of the schedules is active right now.
        if(prev_schedule_config === undefined || prev_schedule_config === null){
            return result;
        }
        let prev_schedule_second = sanitize_input(prev_schedule_config['schedule']['second']),
            prev_schedule_minute = sanitize_input(prev_schedule_config['schedule']['minute']),
            prev_schedule_hour   = sanitize_input(prev_schedule_config['schedule']['hour']),
            desired_state        = Boolean(prev_schedule_config['device']['desired_state']),
            prevScheduleId       = prev_schedule_config['schedule']['prevScheduleId'],
            nextScheduleId       = prev_schedule_config['schedule']['nextScheduleId'];
            
        // schedules could be loaded out of order. For example, we could be looking at the schedule that turns the outlet off. we need to first look at the schedule that turns the outlet on
        if(desired_state !== undefined && desired_state === true && prevScheduleId === undefined && nextScheduleId !== undefined){ // 'on' schedule
            console.log("Processing 'on' schedule");
            let nextScheduleIndex = self.findScheduleIndex(prev_schedule_config['schedule']['nextScheduleId'].toString());
            
            if(nextScheduleIndex !== -1){
                let today                   = new Date(),
                    prev_schedule_timestamp = new Date(),
                    next_schedule_timestamp = new Date(),
                    now_hour                = Number(today.getHours()),
                    now_min                 = Number(today.getMinutes()),
                    now_second              = Number(today.getSeconds()),
                    next_schedule_config    = self.scheduleArr[nextScheduleIndex]['schedule_config'],
                    next_schedule_second    = sanitize_input(next_schedule_config['schedule']['second']),
                    next_schedule_minute    = sanitize_input(next_schedule_config['schedule']['minute']),
                    next_schedule_hour      = sanitize_input(next_schedule_config['schedule']['hour']);
                        
                    // console.log(`nowHour:      ${now_hour}     -      nextScheduleHour:      ${next_schedule_hour}`);
                    // console.log(`nowMin: "     ${now_min}      -      nextScheduleMin:       ${next_schedule_minute}`);
                    // console.log(`nowSecond:    ${now_second}   -      nextScheduleSecond:    ${next_schedule_second}`);
                    
                    prev_schedule_timestamp.setHours(prev_schedule_hour, prev_schedule_minute, prev_schedule_second);
                    next_schedule_timestamp.setHours(next_schedule_hour, next_schedule_minute, next_schedule_second);
                    
                    // console.log(`prev_schedule_timestamp: ${prev_schedule_timestamp}`);
                    // console.log(`today timestamp:  ${today}`);
                    // console.log(`next_schedule_timestamp: ${next_schedule_timestamp}`);
                    if(timestamp >= prev_schedule_timestamp && timestamp < next_schedule_timestamp){
                        result = true;
                    }
                    
            }else{ // schedule not found
                console.log("Schedule not found!!");
            }
            
        }else{
            console.log("There is a problem with the inputs given.")
            console.log(`desired_state: ${desired_state}`);
            console.log(`prevScheduleId:  ${prevScheduleId}`);
            console.log(`nextScheduleId:  ${nextScheduleId}`);
        }
        return result;
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
                        self.scheduleArr.forEach(function(schedule_obj){
                            console.log("my schedule config: " + JSON.stringify(schedule_obj));
                            let date          = Number(schedule_obj['schedule_config']['schedule']['date'])  || undefined,
                                month         = sanitize_input(schedule_obj['schedule_config']['schedule']['month']),
                                year          = Number(schedule_obj['schedule_config']['schedule']['year']) || undefined,
                                dayOfWeek     = (schedule_obj['schedule_config']['schedule']['dayOfWeek']) ? Array.from(schedule_obj['schedule_config']['schedule']['dayOfWeek']) : undefined,
                                today         = new Date(),
                                desired_state = Boolean(schedule_obj['schedule_config']['device']['desired_state']),
                                device_gpio   = Number(schedule_obj['schedule_config']['device']['gpio']);
                                
                            console.log("REGULAR SCHEDULING");
                            let nextScheduleId = schedule_obj['schedule_config']['schedule']['nextScheduleId'];
                            if(nextScheduleId === undefined){
                                console.log("nextScheduleId is undefined");
                            }else{
                                let today = new Date()
                                let isScheduleActive = self.scheduleIsActive(schedule_obj['schedule_config'], today);
                                desired_state = (isScheduleActive === true) ?  Boolean(desired_state) : Boolean(isScheduleActive);
                                //console.log("schedule is " (desired_state === true) ? " active" : " not active" );
                                activateRelayFn.call(context,  device_gpio, desired_state);
                            }
                        });
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
        let self  = this,
            schedule_conflict = false,
            index = self.findScheduleIndex(schedule_id);
        console.log(`schedule_id: ${schedule_id}`);
        console.log(`updateSchedule: ${updated_schedule_config}`);
        console.log(self.scheduleArr);
        if(index !== -1){
            console.log(`Match found at index: ${index}`);
            // let start_time_timestamp = new Date(),
            //     end_time_timestamp = new Date();
            // if(updated_schedule_config['schedule']['nextScheduleId'] !== undefined){
            //     start_time_timestamp.setHours(updated_schedule_config['schedule']['hour'], updated_schedule_config['schedule']['minute'], updated_schedule_config['schedule']['second']); 
            // }else if(updated_schedule_config['schedule']['prevScheduleId'] !== undefined){
            //     end_time_timestamp.setHours(updated_schedule_config['schedule']['hour'], updated_schedule_config['schedule']['minute'], updated_schedule_config['schedule']['second']);
            // }else{
            //     // make sure the everyday once a day schedule doesn't conflict with any other schedules
            // }
        
            //schedule_conflict ^= self.isScheduleConflicting(updated_schedule_config, schedule_id); // true - there is a schedule conflict
            let timestamp = new Date();
            // isSheduleConflicting?
            
            Scheduler.findByIdAndUpdate(schedule_id, {$set: updated_schedule_config}, (err, schedule) => {
                if(err){
                    console.log(err);
                    throw err;
                } else {
                    self.scheduleArr[index]['job'].cancel();
                    console.log("Schedule canceled and removed!");
                    let job = self.buildJob(
                        updated_schedule_config, 
                        activateRelayFn, 
                        context, 
                        Number(updated_schedule_config['device']['gpio']), 
                        Boolean(updated_schedule_config['device']['desired_state'])
                    );
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
                    self.scheduleArr.forEach(function(schedule_obj){
                        console.log(`my schedule config: ${JSON.stringify(schedule_obj)}`);
                        let desired_state  = Boolean(schedule_obj['schedule_config']['device']['desired_state']),
                            nextScheduleId = schedule_obj['schedule_config']['schedule']['nextScheduleId'],
                            device_gpio    = Number(schedule_obj['schedule_config']['device']['gpio']);
                        
                        console.log("REGULAR SCHEDULING");
                        if(nextScheduleId === undefined){
                            console.log("nextScheduleId is undefined");
                        }else{
                            let today                   = new Date();
                            let isScheduleActive = self.scheduleIsActive(schedule_obj['schedule_config'], today);
                            
                            desired_state = (isScheduleActive === true) ?  Boolean(desired_state) : Boolean(isScheduleActive);
                            //console.log("schedule is " (desired_state === true) ? " active" : " not active" );
                            activateRelayFn.call(context,  device_gpio, desired_state);
                            
                        }
                    });
                }
            });
        }else{
            console.log("Schedule not found!");
            throw "Schedule not found!";
        }
    },
    deleteSchedule: function(schedule_id){
        let self = this;
        let index = this.findScheduleIndex(schedule_id);
        console.log(`Deleting Schedule Function: ${index}`);
        if(index !== -1){
            console.log(`Match found at index: ${index}`);
            Scheduler.findByIdAndRemove(schedule_id, (err) => {
                if(err){
                    console.log(err);
                    throw err;
                }
                else{
                    console.log("in else");
                    self.scheduleArr[index]['job'].cancel();
                    console.log("Schedule canceled and removed!\n");
                    self.scheduleArr.splice(index, 1);
                    console.log(self.scheduleArr.length);
                }
            });
        }else{
            throw "Schedule not found!";
        }
    },
    findScheduleIndex: function(schedule_id){
        return this.scheduleArr.findIndex((scheduleObj) => scheduleObj['schedule_config']['_id'] == schedule_id);
    }
}
module.exports = scheduleObj;
var Scheduler     = require("../models/scheduler"),
    Device        = require("../models/device"),
    schedule      = require('node-schedule'),
    ip            = require("ip"),
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
            // console.log("mySchedule: ", mySchedule);
            console.log("schedule: ", schedule);
            console.log("second: ",schedule_config['schedule']['second']);
            console.log("second: ", second);
            console.log("minute: ", minute);
            console.log("hour: ", hour);
            console.log("date: ", date);
            console.log("month: ", month);
            console.log("year: ", year);
            // Validate second input
            if(second !== undefined && !second.isNaN && Number.isInteger(second)){
                if(second >= MIN_SECOND && second <= MAX_SECOND){
                    scheduleObj['second'] = second;
                }else throw new Error('Second input must be >= ' + MIN_SECOND + 'or <= ' +  MAX_SECOND);
            }else throw new Error("Invalid second input!");
            // Validate minute input
            if(minute !== undefined && !minute.isNaN && Number.isInteger(minute)){
                if(minute >= MIN_MINUTE && minute <= MAX_MINUTE){
                    scheduleObj['minute'] = minute;
                }else throw new Error('Minute input must be >= ' + MIN_MINUTE + ' or <= ' + MAX_MINUTE);
            }else throw new Error("Invalid minute input!");
            // Validate hour input
            if(hour !== undefined && !hour.isNaN && Number.isInteger(hour)){
                if(hour >= MIN_HOUR && hour <= MAX_HOUR){
                    scheduleObj['hour'] = hour;
                }else throw new Error('Minute input must be >= ' + MIN_HOUR + ' or <= ' + MAX_HOUR)
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
                }else throw new Error('Date input must be >= ' + MIN_DATE + ' or <= ' + MAX_DATE);
                if(month >= MIN_MONTH && month <= MAX_MONTH){
                    scheduleObj['month'] = month;
                }else throw new Error('Month input must be >= ' + MIN_MONTH + ' or <= ' + MAX_MONTH);
                if(year >= MIN_YEAR){
                    scheduleObj['year'] = year;
                    scheduleObj = new Date(year, month, date, hour, minute, second);
                    console.log("Date Obj: ", scheduleObj);
                    if(scheduleObj < new Date()) throw new Error("Schedule must occur in the future!");
                }else throw new Error('Year input must be >= ' + MIN_MONTH + ' or <= ' + MAX_MONTH);
            }
        }else throw new Error("Schedule details not found!");
        return scheduleObj;
    },
    // params 1: schedule_config
    // params 2:
    // params 3:
    // params 4: desired_state is 0 (off) or 1(on)
    buildJob: function(schedule_config, activateRelayFn, context, gpio_pin, desired_state){
        let myScheduleObj = this.buildSchedule(schedule_config);
        console.log("myScheduleObj: ", myScheduleObj);
        // let job = schedule.scheduleJob(myScheduleObj['schedule'], function(){
        let job = schedule.scheduleJob(myScheduleObj, function(){
            console.log('Schedule created!');
            activateRelayFn.call(context, gpio_pin, desired_state);
        });
        console.log("Job: ", job);
        return job;
        // var obj = {"_id": mySchedule['_id'], job};
    },
    createSchedule: function(new_schedule_config, activateRelayFn, context){
        let self = this;
        console.log(this, activateRelayFn);
        console.log('createSchedule: ' + new_schedule_config);
        Scheduler.create(new_schedule_config, (err, mySchedule) =>{
            if(err) {
                console.log(err);
                throw err;
            }
            else{
                console.log(mySchedule + ' created.');
                mySchedule.save();
                let job = self.buildJob(
                    new_schedule_config, 
                    activateRelayFn, 
                    context, 
                    Number(new_schedule_config['device']['gpio']), 
                    Boolean(new_schedule_config['device']['desired_state'])
                );
                var obj = {"_id": mySchedule['_id'], job};
                self.setSchedule(obj);
            }
        });
    },
    getSchedules: function(activateRelayFn, context){
        let self = this;
        let sanitize_input = (input) => {return (Number(input) === 0) ? Number(input) : Number(input) || undefined};
        Device.findOne({local_ip: localIP}, function(err, myDevices){
            if(err){
                console.log(err);
            }else{
                Scheduler.find({'device.id': myDevices["_id"]}, function(err, schedule_configs){
                    console.log(schedule_configs);
                    let processed_ids = [];
                    schedule_configs.forEach(function(schedule_config){
                        console.log(schedule_config);
                        let job = self.buildJob(
                            schedule_config, 
                            activateRelayFn, 
                            context, 
                            Number(schedule_config['device']['gpio']), 
                            Boolean(schedule_config['device']['desired_state'])
                        );
                        console.log(job);
                        var obj = {"_id": schedule_config['_id'], job};
                        self.setSchedule(obj);
                        
                        // check to see if 1 of the schedules is active right now.
                        let second    = sanitize_input(schedule_config['schedule']['second']),
                            minute    = sanitize_input(schedule_config['schedule']['minute']),
                            hour      = sanitize_input(schedule_config['schedule']['hour']),
                            date      = Number(schedule_config['schedule']['date'])  || undefined,
                            month     = sanitize_input(schedule_config['schedule']['month']),
                            year      = Number(schedule_config['schedule']['year']) || undefined,
                            dayOfWeek = (schedule_config['schedule']['dayOfWeek']) ? Array.from(schedule_config['schedule']['dayOfWeek']) : undefined,
                            today = new Date(),
                            desired_state = Boolean(schedule_config['device']['desired_state']);
                        // RECURRENCE BASED SCHEDULING
                        if(dayOfWeek !== undefined && dayOfWeek.length){
                            if(dayOfWeek.includes(today.getDay())){ // does our dayofweek array 
                                let prevScheduleId =  sanitize_input(scheduleObj['schedule']['prevScheduleId']),
                                    nextScheduleId =  sanitize_input(scheduleObj['schedule']['nextScheduleId']);
                                // schedules could be loaded out of order. For example, we could be looking at the schedule that turns the outlet off. we need to first look at the schedule that turns the outlet on
                                if(desired_state !== undefined && desired_state === true && prevScheduleId === undefined){ // 'on' schedule
                                    // have we already processed the 'off' schedule?
                                    if(processed_ids.includes(nextScheduleId)){
                                        
                                    }else{ // we need to get the 'off' schedule first
                                        Scheduler.findById(nextScheduleId, (err, next_schedule_config) => {
                                            if(err){
                                                console.log("schedule not found: " + err);
                                            }else{
                                               
                                                let now_hour = today.getHours(),
                                                    now_min  = today.getMinutes(),
                                                    now_second = today.getSeconds();
                                                // check hour
                                                if(now_hour >= hour && now_hour <= next_schedule_config['schedule']['hour']){
                                                    // check minute
                                                    if(now_min >= minute && now_min <= next_schedule_config['schedule']['minute']){
                                                         // check second
                                                        if(now_second >= second && now_second <= next_schedule_config['schedule']['second']){
                                                            activateRelayFn.call(context,  Number(next_schedule_config['device']['gpio']), Boolean(desired_state));
                                                            processed_ids.push(nextScheduleId);
                                                        }
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }else if(desired_state !== undefined && desired_state === false && nextScheduleId === undefined){ // 'off' schedule
                                    // have we already processed the schedule?
                                    if(processed_ids.includes(prevScheduleId)){
                                        
                                    }else{ // we need to get the 'on' schedule first
                                        Scheduler.findById(prevScheduleId, (err, prev_schedule_config) => {
                                            if(err){
                                                console.log("schedule not found: " + err);
                                            }else{
                                               
                                                let now_hour = today.getHours(),
                                                    now_min  = today.getMinutes(),
                                                    now_second = today.getSeconds();
                                                // check hour
                                                if(now_hour >= prev_schedule_config['schedule']['hour'] && now_hour <= hour){
                                                    // check minute
                                                    if(now_min >= prev_schedule_config['schedule']['minute'] && now_min <= minute){
                                                         // check second
                                                        if(now_second >= prev_schedule_config['schedule']['second'] && now_second <= second){
                                                            activateRelayFn.call(context,  Number(prev_schedule_config['device']['gpio']), Boolean(desired_state));
                                                            processed_ids.push(prevScheduleId);
                                                        }
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        }
                        // CHECK LATER: i am not sure if you can associate date based scheduling together - though you probably can
                        else if(date !== undefined && month !== undefined && year !== undefined){ // DATE BASED SCHEDULING
                            // are we in the right year?
                            if(year === today.getYear()){
                                // are we in the right month?
                                if(month === today.getMonth()){
                                    // is the date correct? 0 - 31, etc
                                    if(date === today.getDate()){
                                        let prevScheduleId = scheduleObj['schedule']['prevScheduleId'],
                                        nextScheduleId = scheduleObj['schedule']['nextScheduleId'];
                                        // schedules could be loaded out of order. For example, we could be looking at the schedule that turns the outlet off. we need to first look at the schedule that turns the outlet on
                                        if(desired_state !== undefined && desired_state === true && prevScheduleId === undefined){ // 'on' schedule
                                            // have we already processed the 'off' schedule?
                                            if(processed_ids.includes(nextScheduleId)){
                                                
                                            }else{ // we need to get the 'off' schedule first
                                                Scheduler.findById(nextScheduleId, (err, next_schedule_config) => {
                                                    if(err){
                                                        console.log("schedule not found: " + err);
                                                    }else{
                                                       
                                                        let now_hour = today.getHours(),
                                                            now_min  = today.getMinutes(),
                                                            now_second = today.getSeconds();
                                                        // check hour
                                                        if(now_hour >= hour && now_hour <= next_schedule_config['schedule']['hour']){
                                                            // check minute
                                                            if(now_min >= minute && now_min <= next_schedule_config['schedule']['minute']){
                                                                 // check second
                                                                if(now_second >= second && now_second <= next_schedule_config['schedule']['second']){
                                                                    activateRelayFn.call(context,  Number(next_schedule_config['device']['gpio']), Boolean(desired_state));
                                                                    processed_ids.push(prevScheduleId);
                                                                    processed_ids.push(nextScheduleId);
                                                                }
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                        }else if(desired_state !== undefined && desired_state === false && nextScheduleId === undefined){ // 'off' schedule
                                            // have we already processed the schedule?
                                            if(processed_ids.includes(prevScheduleId)){
                                                
                                            }else{ // we need to get the 'on' schedule first
                                                Scheduler.findById(prevScheduleId, (err, prev_schedule_config) => {
                                                    if(err){
                                                        console.log("schedule not found: " + err);
                                                    }else{
                                                       
                                                        let now_hour = today.getHours(),
                                                            now_min  = today.getMinutes(),
                                                            now_second = today.getSeconds();
                                                        // check hour
                                                        if(now_hour >= prev_schedule_config['schedule']['hour'] && now_hour <= hour){
                                                            // check minute
                                                            if(now_min >= prev_schedule_config['schedule']['minute'] && now_min <= minute){
                                                                 // check second
                                                                if(now_second >= prev_schedule_config['schedule']['second'] && now_second <= second){
                                                                    activateRelayFn.call(context,  Number(prev_schedule_config['device']['gpio']), Boolean(desired_state));
                                                                    processed_ids.push(prevScheduleId);
                                                                    processed_ids.push(nextScheduleId);
                                                                }
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                            
                        }else{ // regular scheduling
                            let prevScheduleId =  'prevScheduleId' in scheduleObj['schedule'] ? sanitize_input(scheduleObj['schedule']['prevScheduleId']) : undefined,
                                nextScheduleId =  'nextcheduleId' in scheduleObj['schedule'] ? sanitize_input(scheduleObj['schedule']['nextScheduleId']) : undefined;
                            // schedules could be loaded out of order. For example, we could be looking at the schedule that turns the outlet off. we need to first look at the schedule that turns the outlet on
                            if(desired_state !== undefined && desired_state === true && prevScheduleId === undefined){ // 'on' schedule
                                // have we already processed the 'off' schedule?
                                if(processed_ids.includes(nextScheduleId)){
                                    
                                }else{ // we need to get the 'off' schedule first
                                    Scheduler.findById(nextScheduleId, (err, next_schedule_config) => {
                                        if(err){
                                            console.log("schedule not found: " + err);
                                        }else{
                                           
                                            let now_hour = today.getHours(),
                                                now_min  = today.getMinutes(),
                                                now_second = today.getSeconds();
                                            // check hour
                                            if(now_hour >= hour && now_hour <= next_schedule_config['schedule']['hour']){
                                                // check minute
                                                if(now_min >= minute && now_min <= next_schedule_config['schedule']['minute']){
                                                     // check second
                                                    if(now_second >= second && now_second <= next_schedule_config['schedule']['second']){
                                                        activateRelayFn.call(context,  Number(next_schedule_config['device']['gpio']), Boolean(desired_state));
                                                        processed_ids.push(prevScheduleId);
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                            }else if(desired_state !== undefined && desired_state === false && nextScheduleId === undefined){ // 'off' schedule
                                // have we already processed the schedule?
                                if(processed_ids.includes(prevScheduleId)){
                                    
                                }else{ // we need to get the 'on' schedule first
                                    Scheduler.findById(prevScheduleId, (err, prev_schedule_config) => {
                                        if(err){
                                            console.log("schedule not found: " + err);
                                        }else{
                                           
                                            let now_hour = today.getHours(),
                                                now_min  = today.getMinutes(),
                                                now_second = today.getSeconds();
                                            // check hour
                                            if(now_hour >= prev_schedule_config['schedule']['hour'] && now_hour <= hour){
                                                // check minute
                                                if(now_min >= prev_schedule_config['schedule']['minute'] && now_min <= minute){
                                                     // check second
                                                    if(now_second >= prev_schedule_config['schedule']['second'] && now_second <= second){
                                                        activateRelayFn.call(context,  Number(prev_schedule_config['device']['gpio']), Boolean(desired_state));
                                                        processed_ids.push(prevScheduleId);
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                            }
                        }
                        
                    })
                    
                });
            }
        });
    },
    setSchedule: function(new_schedule_config){
        console.log("Received Schedule Obj\n");
        this.scheduleArr.push(new_schedule_config);
        console.log('My scheduleArr - ' + this.scheduleArr);
    },
    editSchedule: function(schedule_id, updated_schedule_config, activateRelayFn, context){
        let self = this;
        let index = this.findSchedule(schedule_id);
        console.log("schedule_id: " + schedule_id);
        console.log('updateSchedule: ' + updated_schedule_config);
        console.log(self.scheduleArr);
        if(index !== -1){
            console.log('Match found at index: ' + index);
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
                    
                    var obj = {"_id": schedule_id, job};
                    self.scheduleArr[index] = null;
                    self.scheduleArr[index] = obj;
                }
            });
        }else{
            console.log("Schedule not found!");
            throw "Schedule not found!";
        }
    },
    deleteSchedule: function(schedule_id){
        let self = this;
        let index = this.findSchedule(schedule_id);
        console.log('Deleting Schedule Function: ' + index);
        if(index !== -1){
            console.log('Match found at index: ' + index);
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
    findSchedule: function(schedule_id){
        return this.scheduleArr.findIndex((schedule_config) => schedule_config['_id'] == schedule_id);
    }
}
module.exports = scheduleObj;
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
    scheduleIsActive: function(prev_schedule_config){
        let self = this;
        let sanitize_input = (input) => {return (Number(input) === 0) ? Number(input) : Number(input) || undefined};
        // check to see if 1 of the schedules is active right now.
        if(prev_schedule_config === undefined || prev_schedule_config === null){
            return false;
        }
        let prev_schedule_second = sanitize_input(prev_schedule_config['schedule']['second']),
            prev_schedule_minute = sanitize_input(prev_schedule_config['schedule']['minute']),
            prev_schedule_hour   = sanitize_input(prev_schedule_config['schedule']['hour']),
            desired_state        = Boolean(prev_schedule_config['device']['desired_state']),
            prevScheduleId       = prev_schedule_config['schedule']['prevScheduleId'],
            nextScheduleId       = prev_schedule_config['schedule']['nextScheduleId'],
            isScheduleActive     = false;
            
        console.log("undefined? : " + prevScheduleId, nextScheduleId);
            // schedules could be loaded out of order. For example, we could be looking at the schedule that turns the outlet off. we need to first look at the schedule that turns the outlet on
        if(desired_state !== undefined && desired_state === true && prevScheduleId === undefined && nextScheduleId !== undefined){ // 'on' schedule
            console.log("Processing 'on' schedule");


            Scheduler.findById(nextScheduleId, (err, next_schedule_config) => {
                if(err){
                    console.log("schedule not found: " + err);
                }else{
                    console.log("nextScheduleId found in database");
                    let today                = new Date(),
                        now_hour             = Number(today.getHours()),
                        now_min              = Number(today.getMinutes()),
                        now_second           = Number(today.getSeconds()),
                        next_schedule_second = sanitize_input(next_schedule_config['schedule']['second']),
                        next_schedule_minute = sanitize_input(next_schedule_config['schedule']['minute']),
                        next_schedule_hour   = sanitize_input(next_schedule_config['schedule']['hour']);
                        
                        
                    console.log("nowHour: "   + now_hour   + " - " + "nextScheduleHour: "   + next_schedule_config['schedule']['hour']);
                    console.log("nowMin: "    + now_min    + " - " + "nextScheduleMin: "    + next_schedule_config['schedule']['minute']);
                    console.log("nowSecond: " + now_second + " - " + "nextScheduleSecond: " + next_schedule_config['schedule']['second']);
                    
                    let prev_schedule_timestamp = new Date(),
                        next_schedule_timestamp = new Date();
                        
                    prev_schedule_timestamp.setHours(prev_schedule_hour, prev_schedule_minute, prev_schedule_second);
                    next_schedule_timestamp.setHours(next_schedule_hour, next_schedule_minute, next_schedule_second);
                    
                    if(today >= prev_schedule_timestamp && today < next_schedule_timestamp){
                        isScheduleActive = true;
                    }else{
                        console.log("timestamp is not okay");
                        console.log("prev_schedule_timestamp: " + prev_schedule_timestamp);
                        console.log("now: " + today);
                        console.log("next_schedule_timestamp: " + next_schedule_timestamp);
                        console.log("now > prev_schedule_timestamp", today > prev_schedule_timestamp);
                        console.log("now < next_schedule_timestamp", today < next_schedule_timestamp);
                    }
                  
                }
            });
            
        }else{
            console.log("There is a problem with the inputs given.")
            console.log("desired_state: " + desired_state)
            console.log("prevScheduleId: " + prevScheduleId);
            console.log("nextScheduleId: " + nextScheduleId);
        }
        return isScheduleActive;
    },
    getSchedules: function(activateRelayFn, context){
        let self = this;
        let sanitize_input = (input) => {return (Number(input) === 0) ? Number(input) : Number(input) || undefined};
        let processed_ids = [];
        Device.findOne({local_ip: localIP}, function(err, myDevices){
            if(err){
                console.log(err);
            }else{
                Scheduler.find({'device.id': myDevices["_id"]}, function(err, schedule_configs){
                    console.log(schedule_configs);
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
                        
                        // API can handle single (standalone) schedule configurations - prevScheduleId and nextScheduleId can both be undefined
                        // for example, this is a smart gardening app, but it can also be used as a smart home application
                        // i.e., I have a smart outlet set up to turn my living room lights on from 7:00pm - 8:00pm, but I can also use my smart home android app to toggle my lights on or off at any given time
                        // I may want a schedule set up to turn my lights off past 2:00am in case I forgot to turn them off. This way, I am not wasting electricity by my lights being on all night long
                        
                        // API definition - a single standalone schedule must not interfere with two schedules that are associated with each other
                        // i.e., two schedules that run from 6:00pm - 7:00pm,
                        //       one schedule cannot be setup between 6:00pm, more specifically, you cannot set up an 'off' schedule at 6:30pm. However, a single 'on' schedule would be appropriate
                        
                        
                        // check to see if 1 of the schedules is active right now.
                        let date      = Number(schedule_config['schedule']['date'])  || undefined,
                            month     = sanitize_input(schedule_config['schedule']['month']),
                            year      = Number(schedule_config['schedule']['year']) || undefined,
                            dayOfWeek = (schedule_config['schedule']['dayOfWeek']) ? Array.from(schedule_config['schedule']['dayOfWeek']) : undefined,
                            today = new Date(),
                            desired_state = Boolean(schedule_config['device']['desired_state']);
                        // RECURRENCE BASED SCHEDULING
                        if(dayOfWeek !== undefined && dayOfWeek.length){
                            console.log("RECURRENCE BASED SCHEDULING");
                            if(dayOfWeek.includes(today.getDay())){ // does our dayofweek array 
                                let nextScheduleId =  schedule_config['schedule']['nextScheduleId'];
                                    
                                // have we already processed the 'off' schedule?
                                if(processed_ids.includes(nextScheduleId)){
                                    console.log("This schedule has already been processed.");
                                }else{
                                    if(self.scheduleIsActive(schedule_config)){
                                        console.log("Schedule is active");
                                        activateRelayFn.call(context,  Number(schedule_config['device']['gpio']), Boolean(desired_state));
                                        processed_ids.push(schedule_config["_id"]);
                                        processed_ids.push(nextScheduleId);
                                    }
                                }
                            }
                        }
                        // CHECK LATER: i am not sure if you can associate date based scheduling together - though you probably can
                        else if(date !== undefined && month !== undefined && year !== undefined){ // DATE BASED SCHEDULING
                            console.log("DATE BASED SCHEDULING");
                            // are we in the right year?
                            if(year === today.getYear()){
                                // are we in the right month?
                                if(month === today.getMonth()){
                                    // is the date correct? 0 - 31, etc
                                    if(date === today.getDate()){
                                        let nextScheduleId = schedule_config['schedule']['nextScheduleId'];
                                            
                                        // have we already processed the 'off' schedule?
                                        if(processed_ids.includes(nextScheduleId)){
                                            console.log("This schedule has already been processed.");
                                        }else{ 
                                            console.log("Schedule is active");
                                            if(self.scheduleIsActive(schedule_config)){
                                                activateRelayFn.call(context,  Number(schedule_config['device']['gpio']), Boolean(desired_state));
                                                processed_ids.push(schedule_config["_id"]);
                                                processed_ids.push(nextScheduleId);
                                            }
                                        }
                                    }
                                }
                            }
                            
                        }else{ // regular scheduling
                            console.log("REGULAR SCHEDULING");
                            let nextScheduleId = schedule_config['schedule']['nextScheduleId'];
                            // have we already processed the 'off' schedule?
                            if(processed_ids.includes(nextScheduleId)){
                                console.log("nextScheduleId has already been processed");
                            }else{ // we need to get the 'off' schedule first
                                if(self.scheduleIsActive(schedule_config)){
                                    console.log("Schedule is active");
                                    activateRelayFn.call(context,  Number(schedule_config['device']['gpio']), Boolean(desired_state));
                                    processed_ids.push(schedule_config["_id"]);
                                    processed_ids.push(nextScheduleId);
                                }
                            }
                        }
                        
                    });
                    
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
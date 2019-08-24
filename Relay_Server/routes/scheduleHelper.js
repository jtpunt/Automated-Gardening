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
    buildSchedule: function(mySchedule){
        var scheduleObj = {};
        if(mySchedule['schedule']){
            // if we use short circuit evaluation on schedule['second'] to assign a value, and schedule['second'] is 0, then this value will be ignored
            // and the right operand will be returned. This is not the behavior we want as second, minute, hour and month values can be 0
            const schedule  = mySchedule['schedule']            || undefined,
                  second    = (Number(schedule['second']) === 0) ? Number(schedule['second']) : Number(schedule['second']) || undefined,
                  minute    = (Number(schedule['minute']) === 0) ? Number(schedule['minute']) : Number(schedule['minute']) || undefined,
                  hour      = (Number(schedule['hour']) === 0)   ? Number(schedule['hour'])   : Number(schedule['hour'])   || undefined,
                  date      = Number(schedule['date'])          || undefined,
                  month     = (Number(schedule['month']) === 0)  ? Number(schedule['month'])  : Number(schedule['month'])  || undefined,
                  year      = Number(schedule['year'])          || undefined,
                  dayOfWeek = (schedule['dayOfWeek']) ? Array.from(schedule['dayOfWeek']) : undefined;
            // console.log("mySchedule: ", mySchedule);
            console.log("schedule: ", schedule);
            console.log("second: ", mySchedule['schedule']['second']);
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
                }else throw new Error('Second input must be >= ${MIN_SECOND} or <= ${MAX_SECOND}');
            }else throw new Error("Invalid second input!");
            // Validate minute input
            if(minute !== undefined && !minute.isNaN && Number.isInteger(minute)){
                if(minute >= MIN_MINUTE && minute <= MAX_MINUTE){
                    scheduleObj['minute'] = minute;
                }else throw new Error('Minute input must be >= ${MIN_MINUTE} or <= ${MAX_MINUTE}');
            }else throw new Error("Invalid minute input!");
            // Validate hour input
            if(hour !== undefined && !hour.isNaN && Number.isInteger(hour)){
                if(hour >= MIN_HOUR && hour <= MAX_HOUR){
                    scheduleObj['hour'] = hour;
                }else throw new Error('Minute input must be >= ${MIN_HOUR} or <= ${MAX_HOUR}')
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
                // DATE-BASED SCHEDULING
                if(date >= MIN_DATE && date <= MAX_DATE){
                    scheduleObj['date'] = date;
                }else throw new Error('Date input must be >= ${MIN_DATE} or <= ${MAX_DATE}');
                if(month >= MIN_MONTH && month <= MAX_MONTH){
                    scheduleObj['month'] = month;
                }else throw new Error('Month input must be >= ${MIN_MONTH} or <= ${MAX_MONTH}');
                if(year >= MIN_YEAR){
                    scheduleObj['year'] = year;
                }else throw new Error('Year input must be >= ${MIN_MONTH} or <= ${MAX_MONTH}');
            }
        }else throw new Error("Schedule details not found!");
        return scheduleObj;
    },
    buildJob: function(mySchedule, activateRelayFn, context, gpio_pin){
        let myScheduleObj = this.buildSchedule(mySchedule);
        console.log("myScheduleObj: ", myScheduleObj);
        // let scheduleObj = {
        //     second: mySchedule['schedule']['second'],
        //     minute: mySchedule['schedule']['minute'],
        //     hour: mySchedule['schedule']['hour'],
        // };
        // if(mySchedule['schedule']['dayOfWeek'] && Array.isArray(mySchedule['schedule']['dayOfWeek']) && mySchedule['schedule']['dayOfWeek'].length){
        //     console.log("dayOfWeek scheduling");
        //     let dayOfWeek = Array.from(mySchedule['schedule']['dayOfWeek']).map(function(day){
        //         // dayOfWeek = 0 - 6
        //         if(!Number.isNaN(day) && Number(day) >= 0 && Number(day) <= 6){
        //             return parseInt(day);
        //         }else throw new Error("Invalid day of week input.");
        //     });
        //     scheduleObj['dayOfWeek'] = dayOfWeek;
        // }
        // console.log(scheduleObj);
          
        let job = schedule.scheduleJob(myScheduleObj, function(){
            console.log('Schedule created!');
            activateRelayFn.call(context, gpio_pin);
        });
        console.log("Job: ", job);
        return job;
        // var obj = {"_id": mySchedule['_id'], job};
    },
    createSchedule: function(newSchedule, activateRelayFn, context){
        let self = this;
        console.log(this, activateRelayFn);
        console.log('createSchedule: ${newSchedule}');
        Scheduler.create(newSchedule, (err, mySchedule) =>{
            if(err) {
                console.log(err);
                throw err;
            }
            else{
                console.log('${mySchedule} - created.');
                mySchedule.save();
                let job = self.buildJob(newSchedule, activateRelayFn, context, Number(mySchedule['device']['gpio']));
                var obj = {"_id": mySchedule['_id'], job};
                self.setSchedule(obj);
            }
        });
    },
    getSchedules: function(activateRelayFn, context){
        let self = this;
        Device.findOne({local_ip: localIP}, function(err, myDevices){
            if(err){
                console.log(err);
            }else{
                Scheduler.find({'device.id': myDevices["_id"]}, function(err, savedSchedules){
                    console.log(savedSchedules);
                    savedSchedules.forEach(function(mySchedule){
                        console.log(mySchedule);
                        let job = self.buildJob(mySchedule, activateRelayFn, context, Number(mySchedule['device']['gpio']));
                        console.log(job);
                        var obj = {"_id": mySchedule['_id'], job};
                        self.setSchedule(obj);
                    })
                    
                });
            }
        });
    },
    setSchedule: function(newScheduleObj){
        console.log("Received Schedule Obj\n");
        this.scheduleArr.push(newScheduleObj);
        console.log('My scheduleArr - ${this.scheduleArr}');
    },
    editSchedule: function(schedule_id, updatedSchedule){
        let self = this;
        let index = this.findSchedule(schedule_id);
        console.log('Editing Schedule Function: ${index}');
        console.log('updateSchedule: ${updateSchedule}');
        if(index !== -1){
            console.log('Match found at index: ${index}');
            Scheduler.findByIdAndUpdate(schedule_id, {$set: updatedSchedule}, (err, schedule) => {
                if(err){
                    console.log(err);
                    throw err;
                } else {
                    self.scheduleArr[index]['job'].cancel();
                    console.log("Schedule canceled and removed!");
                    self.scheduleArr[index]['job'].reschedule(updatedSchedule['schedule']);
                }
            });
        }else{
            throw "Schedule not found!";
        }
    },
    deleteSchedule: function(schedule_id){
        let self = this;
        let index = this.findSchedule(schedule_id);
        console.log('Deleting Schedule Function: ${index}');
        if(index !== -1){
            console.log('Match found at index: ${index}');
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
        return this.scheduleArr.findIndex((mySchedule) => mySchedule['_id'] == schedule_id);
    }
}
module.exports = scheduleObj;
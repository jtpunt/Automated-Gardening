var Scheduler     = require("../models/scheduler"),
    Device        = require("../models/device"),
    schedule      = require('node-schedule'),
    ip            = require("ip"),
    localIP       = ip.address();

var scheduleObj = {
    scheduleArr: [],
    buildJob: function(mySchedule, activateRelayFn, context, gpio_pin){
        let scheduleObj = {
            second: mySchedule['schedule']['second'],
            minute: mySchedule['schedule']['minute'],
            hour: mySchedule['schedule']['hour'],
        };
        if(mySchedule['schedule']['dayOfWeek'] && Array.isArray(mySchedule['schedule']['dayOfWeek']) && mySchedule['schedule']['dayOfWeek'].length){
            console.log("dayOfWeek scheduling");
            let dayOfWeek = Array.from(mySchedule['schedule']['dayOfWeek']).map(function(day){
                // dayOfWeek = 0 - 6
                if(!Number.isNaN(day) && Number(day) >= 0 && Number(day) <= 6){
                    return parseInt(day);
                }throw new Error("Invalid day of week input.");
            });
            scheduleObj['dayOfWeek'] = dayOfWeek;
        }
        console.log(scheduleObj);
           
        let job = schedule.scheduleJob(scheduleObj, function(){
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
        console.log("createSchedule: ", newSchedule);
        Scheduler.create(newSchedule, (err, mySchedule) =>{
            if(err) {
                console.log(err);
                throw err;
            }
            else{
                console.log(mySchedule, " created");
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
        console.log("My scheduleArr", this.scheduleArr);
    },
    editSchedule: function(schedule_id, updatedSchedule){
        let self = this;
        let index = this.findSchedule(schedule_id);
        console.log("Editing Schedule Function: ", index);
        console.log("updateSchedule: ", updatedSchedule);
        if(index !== -1){
            console.log("Match found at index, ", index);
            Scheduler.findByIdAndUpdate(schedule_id, {$set: updatedSchedule}, (err, schedule) => {
                if(err){
                    console.log(err);
                    throw err;
                } else {
                    self.scheduleArr[index]['job'].cancel();
                    console.log("Schedule canceled and removed!\n");
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
        console.log("Deleting Schedule Function: ", index);
        if(index !== -1){
            console.log("Match found at index, ", index);
            Scheduler.findByIdAndRemove(schedule_id, (err) => {
                if(err){
                    console.log(err);
                    throw err;
                }
                else{
                    console.log("in else\n");
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
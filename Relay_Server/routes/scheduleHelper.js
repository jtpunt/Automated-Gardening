var Scheduler     = require("../models/scheduler"),
    schedule      = require('node-schedule'),
    ip            = require("ip"),
    localIP       = ip.address();
    
var scheduleObj = {
    scheduleArr: [],
    createSchedule: function(newSchedule, activateRelay, context){
        let self = this;
        console.log(this, activateRelay);
        console.log("createSchedule: ", newSchedule);
        Scheduler.create(newSchedule, (err, mySchedule) =>{
            if(err) {
                console.log(err);
                throw err;
            }
            else{
                console.log(mySchedule, " created");
                // mySchedule.device.id = newSchedule['_id'];
                // mySchedule.device.local_ip = newSchedule['local_ip'];
                mySchedule.save();
                // var newSchedule = {
                //     second: mySchedule['second'],
                //     minute: mySchedule['minute'],
                //     hour: mySchedule['hour'],
                // };
                if(newSchedule['schedule']['year']){ // Date-based Scheduling
                    if(newSchedule['schedule']['month'] && newSchedule['schedule']['date'] && newSchedule['schedule']['hour'] && newSchedule['schedule']['minute'] && newSchedule['schedule']['second'])
                    var rule = new Date(newSchedule['schedule']['month'], newSchedule['schedule']['date'], newSchedule['schedule']['hour'], newSchedule['schedule']['minute'], newSchedule['schedule']['second']);
                    
                    
                }else if(newSchedule['schedule']['dayOfWeek']){ // Cron-style Scheduling
                    var rule = "";
                    if(newSchedule['schedule']['second']){
                        rule += newSchedule['schedule']['second'] + " ";
                    }else rule += " *";
                    if(newSchedule['schedule']['minute']){
                         rule += newSchedule['schedule']['minute'] + " ";
                    }else rule += " *";
                    if(newSchedule['schedule']['hour']){
                        rule += newSchedule['schedule']['hour'] + " ";
                    }else rule += " *";
                    if(newSchedule['schedule']['month']){
                        rule += newSchedule['schedule']['month'] + " ";
                    }else rule += " *";
                    if(newSchedule['schedule']['dayOfWeek']){
                        rule += newSchedule['schedule']['dayOfWeek'] + " ";
                    }else rule += " *";

                }else{
                    
                }
                if(rule !== "" || rule !== undefined){
                    var job = schedule.scheduleJob(rule, function(){
                        console.log('Schedule created!');
                        activateRelay.call(context, Number(newSchedule['device']['gpio']));
                    });
                }
                // console.log(newSchedule['schedule']);
                // var job = schedule.scheduleJob(newSchedule['schedule'], function(){
                //     console.log('Schedule created!');
                //     activateRelay.call(context, Number(newSchedule['device']['gpio']));
                // });
                var obj = {"_id": mySchedule['_id'], job};
                self.setSchedule(obj);
            }
        });
    },
    getSchedules: function(activateRelay, context){
        let self = this;
        // Devices.find({local_ip: localIP}, function(err, myDevices){
        //     if(err){
        //         console.log(err);
        //     }else{
        //         Scheduler.find({device_id: myDevices["_id"]}, function(err, mySchedules){
                    
        //         });
        //     }
        // }
        Scheduler.find({local_ip: localIP}, function(err, mySchedules){
            if(err)
                console.log(err);
            else{
                console.log(mySchedules);
                mySchedules.forEach(function(mySchedule){
                    var newSchedule = {
                        // commented out second below because it would cause the relay to be activated every other second
                        second: mySchedule['second'],
                        minute: mySchedule['minute'],
                        hour: mySchedule['hour'],
                        // date: mySchedule['date'],
                        // month: mySchedule['month'],
                        // year: mySchedule['year'],
                        // dayOfWeek: mySchedule['dayOfWeek']
                    };
                    // var node_schedule      = require('node-schedule');
                    var job = schedule.scheduleJob(newSchedule, function(){
                        console.log('Schedule created!');
                        activateRelay.call(context, Number(mySchedule['gpio']));
                    });
                    console.log(job);
                    var obj = {"_id": mySchedule['_id'], job};
                    self.setSchedule(obj);
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
        if(index !== -1){
            console.log("Match found at index, ", index);
            // console.log(mySchedule._id);
            Scheduler.findByIdAndUpdate(schedule_id, {$set: updatedSchedule}, (err, schedule) => {
                if(err){
                    console.log(err);
                    throw err;
                } else {
                    self.scheduleArr[index]['job'].cancel();
                    console.log("Schedule canceled and removed!\n");
                    self.scheduleArr[index]['job'].reschedule(updatedSchedule);
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
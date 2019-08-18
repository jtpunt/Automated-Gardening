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
                var scheduleObj = {
                    second: mySchedule['schedule']['second'],
                    minute: mySchedule['schedule']['minute'],
                    hour: mySchedule['schedule']['hour'],
                };
                console.log(scheduleObj);
                // if(newSchedule['schedule']['year']){ // Date-based Scheduling
                //     if(newSchedule['schedule']['month'] && newSchedule['schedule']['date'] && newSchedule['schedule']['hour'] && newSchedule['schedule']['minute'] && newSchedule['schedule']['second']){
                //         console.log("Date-based Scheduling"); 
                //         // var rule = new Date(newSchedule['schedule']['year'], newSchedule['schedule']['month'], newSchedule['schedule']['date'], newSchedule['schedule']['hour'],  newSchedule['schedule']['minute'], newSchedule['schedule']['second']);
                //         var rule = new Date(2012, 11, 21, 5, 30, 0);
                //         console.log(rule);
                //         var job = schedule.scheduleJob(rule, function(){
                //             console.log('Schedule created!');
                //             // activateRelay.call(context, Number(newSchedule['device']['gpio']));
                //         });
                //         console.log("Job: ", job);
                //         var obj = {"_id": mySchedule['_id'], job};
                //         self.setSchedule(obj);
                //     }else throw "Invalid Format for Date-based Scheduling!";
                    
                // }else if(newSchedule['schedule']['dayOfWeek']){ // Cron-style Scheduling
                //     console.log("Cron-style Scheduling");
                //     var rule = "";
                //     if(newSchedule['schedule']['second']){
                //         rule += newSchedule['schedule']['second'] + " ";
                //     }else rule += " *";
                //     if(newSchedule['schedule']['minute']){
                //          rule += newSchedule['schedule']['minute'] + " ";
                //     }else rule += " *";
                //     if(newSchedule['schedule']['hour']){
                //         rule += newSchedule['schedule']['hour'] + " ";
                //     }else rule += " *";
                //     if(newSchedule['schedule']['month']){
                //         rule += newSchedule['schedule']['month'] + " ";
                //     }else rule += " *";
                //     if(newSchedule['schedule']['dayOfWeek']){
                //         rule += newSchedule['schedule']['dayOfWeek'] + " ";
                //     }else rule += " *";
                //         console.log(rule);
                //     var job1 = schedule.scheduleJob(rule, function(){
                //         console.log('Schedule created!');
                //         activateRelay.call(context, Number(newSchedule['device']['gpio']));
                //     });
                //     var obj = {"_id": mySchedule['_id'], job1};
                //     self.setSchedule(obj);
                // }else{
                    
                // }
                // console.log(newSchedule['schedule']);
                var job = schedule.scheduleJob(scheduleObj, function(){
                    console.log('Schedule created!');
                    activateRelay.call(context, Number(newSchedule['device']['gpio']));
                });
                console.log("Job: ", job);
                var obj = {"_id": mySchedule['_id'], job};
                self.setSchedule(obj);
            }
        });
    },
    getSchedules: function(activateRelay, context){
        let self = this;
        Devices.find({local_ip: localIP}, function(err, myDevices){
            if(err){
                console.log(err);
            }else{
                Scheduler.find({'device.id': myDevices[0]["_id"]}, function(err, mySchedules){
                    console.log(mySchedules);
                    mySchedules.forEach(function(mySchedule){
                        console.log(mySchedule);
                        var newSchedule = {
                            second: mySchedule['schedule']['second'],
                            minute: mySchedule['schedule']['minute'],
                            hour: mySchedule['schedule']['hour'],
                        };
                        var job = schedule.scheduleJob(newSchedule, function(){
                            console.log('Schedule created!');
                            activateRelay.call(context, Number(mySchedule['device']['gpio']));
                        });
                        console.log(job);
                        var obj = {"_id": mySchedule['_id'], job};
                        self.setSchedule(obj);
                    })
                    
                });
            }
        });
        // Scheduler.find({'device.local_ip': localIP}, function(err, mySchedules){
        //     if(err)
        //         console.log(err);
        //     else{
        //         console.log(mySchedules);
        //         mySchedules.forEach(function(mySchedule){
        //             console.log(mySchedule);
        //             if('schedule' in mySchedule){
        //                 console.log("Schedule key found!");
        //                 var newSchedule = {
        //                 // commented out second below because it would cause the relay to be activated every other second
        //                     second: mySchedule['schedule']['second'],
        //                     minute: mySchedule['schedule']['minute'],
        //                     hour: mySchedule['schedule']['hour'],
        //                     // date: mySchedule['date'],
        //                     // month: mySchedule['month'],
        //                     // year: mySchedule['year'],
        //                     // dayOfWeek: mySchedule['dayOfWeek']
        //                 };
        //                 // var node_schedule      = require('node-schedule');
        //                 var job = schedule.scheduleJob(newSchedule, function(){
        //                     console.log('Schedule created!');
        //                     activateRelay.call(context, Number(mySchedule['device']['gpio']));
        //                 });
        //                 console.log(job);
        //                 var obj = {"_id": mySchedule['_id'], job};
        //                 self.setSchedule(obj);
        //             }
        //         });
        //     }
        // });
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
            // console.log(mySchedule._id);
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
var Scheduler     = require("../models/scheduler"),
    schedule      = require('node-schedule'),
    ip            = require("ip"),
    localIP       = ip.address();
    
var scheduleObj = {
    scheduleArr: [],
    createSchedule: function(newSchedule, activateRelay){
        let self = this;
        Scheduler.create(newSchedule, (err, mySchedule) =>{
            if(err) {
                console.log(err);
                throw err;
            }
            else{
                console.log(mySchedule, " created");
                mySchedule.save();
                var newSchedule = {
                    minute: mySchedule['minute'],
                    hour: mySchedule['hour'],
                };
                console.log(newSchedule);
                var job = schedule.scheduleJob(newSchedule, function(){
                    console.log('Schedule created!');
                    activateRelay(Number(mySchedule['gpio']));
                });
                var db_id = schedule._id;
                var obj = {"_id": mySchedule['_id'], job};
                self.setSchedule(obj);
            }
        });
    },
    getSchedules: async function(activateRelay){
        let self = this;
        try{
            const doc = await Scheduler.find({local_ip: localIP});
            return doc;
        }
        catch(err){
            console.log(err);
        }
        // Scheduler.find({local_ip: localIP}, function(err, mySchedules){
        //     if(err)
        //         console.log(err);
        //     else{
        //         console.log(mySchedules);
        //         mySchedules.forEach(function(mySchedule){
        //             var newSchedule = {
        //                 // commented out second below because it would cause the relay to be activated every other second
        //                 // second: mySchedule['second'],
        //                 minute: mySchedule['minute'],
        //                 hour: mySchedule['hour'],
        //                 // date: mySchedule['date'],
        //                 // month: mySchedule['month'],
        //                 // year: mySchedule['year'],
        //                 // dayOfWeek: mySchedule['dayOfWeek']
        //             };
        //             // var node_schedule      = require('node-schedule');
        //             var job = schedule.scheduleJob(newSchedule, function(){
        //                 console.log('Schedule created!');
        //                 activateRelay(Number(mySchedule['gpio']));
        //             });
        //             console.log(job);
        //             var obj = {"_id": mySchedule['_id'], job};
        //             self.setSchedule(obj);
        //         });
        //     }
        // });
    },
    setSchedule: function(newScheduleObj){
        console.log("Received Schedule Obj\n");
        this.scheduleArr.push(newScheduleObj);
        console.log("My scheduleArr", this.scheduleArr);
    },
    editSchedule: function(schedule_id, newSchedule){
        let self = this;
        let index = this.findSchedule(schedule_id);
        console.log("Editing Schedule Function: ", index);
        if(index !== -1){
            console.log("Match found at index, ", index);
            // console.log(mySchedule._id);
            Scheduler.findByIdAndUpdate(schedule_id, {$set: newSchedule}, (err, schedule) => {
                if(err){
                    console.log(err);
                    throw err;
                } else {
                    self.scheduleArr[index]['job'].cancel();
                    console.log("Schedule canceled and removed!\n");
                    self.scheduleArr[index]['job'].reschedule(newSchedule);
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
        // let i = -1;
        // console.log("Searching for schedule..\n");
        // this.scheduleArr.forEach(function(mySchedule, index){
        //     if(mySchedule._id == schedule_id){
        //         i = index;
        //         return i;
        //     }
        // })
        // return i;
    }
}
module.exports = scheduleObj;
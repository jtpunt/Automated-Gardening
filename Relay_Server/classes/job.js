let node_schedule = require('node-schedule');
class Device{
    constructor(device){
        this._id           = device['id'];
        this.desired_state = device['desired_state'];
        this.gpio          = device['gpio'];
    }
    get device(){
        return {
            _id:           this._id,
            desired_state: this.desired_state,
            gpio:          this.gpio
        }
    }
    set device(updatedDevice){
        this._id           = updatedDevice['id'];
        this.desired_state = updatedDevice['desired_state'];
        this.gpio          = updatedDevice['gpio'];
    }
}
// testing this
class Schedule extends Device{
    constructor(schedule, device){
        super(device);
        this.second    = schedule['second'];    // required
        this.minute    = schedule['minute'];    // required
        this.hour      = schedule['hour'];      // required
        this.date      = schedule['date'];      // optional
        this.month     = schedule['month'];     // optional
        this.year      = schedule['year'];      // optional
        this.dayOfWeek = schedule['dayOfWeek']; // optional
    }
    get schedule(){
        let obj = {
            second:    this.second,
            minute:    this.minute,
            hour:      this.hour,
        }
        let optionalProps = ['date', 'month', 'year', 'dayOfWeek']
        optionalProps.forEach(optionProp => {
            if(optionProp in this && this[optionProp] !== undefined)
                obj[optionProp] = this.optionProp;
        });
        return obj;
    }
    set schedule(newSchedule){
        this.second    = newSchedule['second'];
        this.minute    = newSchedule['minute'];
        this.hour      = newSchedule['hour'];
        this.date      = newSchedule['date'];
        this.month     = newSchedule['month'];
        this.year      = newSchedule['year'];
        this.dayOfWeek = newSchedule['dayOfWeek'];
    }
}
class Job extends Schedule{
    constructor(schedule, device, jobFunction){
        super(schedule, device);
        this.jobFunction = jobFunction;
        this.job = node_schedule.scheduleJob(this.schedule, this.jobFunction)
    }
    // use case: schedule is updated, but the job function's parameters are the same
    // The schedule is overwritten and then the job is rescheduled, which automically
    // cancels the old schedule
    updateSchedAndJob(updatedSchedule){
        this.schedule = updatedSchedule;
        return job.rescheduleJob;
    }
    // use case: the schedule and the job's function's paremeters are different
    // such as turning the relay on/off, or which gpio (smart outlet) to use, which
    // requires this.device to be updated as well, since the functions inside schedule
    // helper depend on it to work
    updateSchedJobAndDevice(updatedDevice, updatedSchedule, updatedJobFunction){
        this.cancelJob();
        this.device   = updatedDevice;
        this.schedule = updatedSchedule;
        this.jobFn    = updatedJobFunction;
        this.job      = node_schedule.scheduleJob(this.schedule, this.jobFunction);
    }
    /* Invalidates all planned invocation for the job. */
    cancelJob(reschedule){ this.job.cancel(); }
    /* Invalidates the next planned invocation for the job. */
    cancelNextJob(reschedule){ this.job.cancelNext(); }
    /* Returns a date object for the next planned invocation for this job. 
     * If no invocation is planned, then null is returned. */
    get nextInvocationDate(){ return this.job.nextInvocation(); }
    /* All planned invocations are canceled and registers the job completely new again using
     * the schedule data stored in the Schedule class. Returns true/false on success/failure. */
    get rescheduleJob(){ return this.job.reschedule(this.schedule); }
    set jobFn(newJobFunction){ this.jobFunction = newJobFunction; }
}
/* Ref - Pg. 243 - Node.js Design Patterns - 3rd Edition - Mario Casciaro, Luciano Mammino */
class JobBuilder{
    withSchedule(schedule){ 
        this.schedule = schedule; 
        return this;
    }
    withDevice(device){ 
        this.device = device; 
        return this;
    }
    withJobFunction(fn, context, ...args){ 
        this.jobFunction = function(){ fn.call(context, ...args); } 
        return this;
    }
    build(){ return new Job(this.schedule, this.device, this.jobFunction); }
}
var test = {
    buildTestSchedule1: function(){
        return {
            second: 45,
            minute: 7,
            hour: 0
        }
    },
    buildTestSchedule2: function(){
        return {
            second: 1,
            minute: 40,
            hour: 17
        }
    },
    buildTestDevice1: function(){
        return{
            id: 1,
            desired_state: true,
            gpio: 2
        }
    },
    buildTestDevice2: function(){
        return{
            id: 2,
            desired_state: false,
            gpio: 3
        }
    },
    print1: function(...args){
        console.log(...args);
    },
    print2: function(...args){
        console.log(...args);
    },
    buildJobFn: function(fn, context, ...args){
        return function(){ fn.call(context, ...args); } 
    }
}
let testSchedule1 = test.buildTestSchedule1(),
    testSchedule2 = test.buildTestSchedule2();

let testDevice1 = test.buildTestDevice1(),
    testDevice2 = test.buildTestDevice2();

let jobFnArgs1 = [test.print1, test, "hello"],
    jobFnArgs2 = [test.print2, test, "yowhatup"];


let job = new JobBuilder()
    .withSchedule(testSchedule1)
    .withDevice(testDevice1)
    .withJobFunction(...jobFnArgs1)
    .build()

console.log(`next nextInvocation: ${job.nextInvocationDate}`)
console.log(`job: ${JSON.stringify(job.schedule)}`);

job.schedule = testSchedule2;
let updatedJobFn = test.buildJobFn(...jobFnArgs2);
job.updateSchedJobAndDevice(testDevice2, testSchedule2, updatedJobFn);
console.log(`job: ${JSON.stringify(job.schedule)}`);

// let result = job.rescheduleJob;
// job.cancelJob; 
//job.cancelNextJob(); 
console.log(`next nextInvocation: ${job.nextInvocationDate}}`)

console.log(`device: ${JSON.stringify(job.device)}`)
module.exports = {Device, Schedule, Job, JobBuilder};
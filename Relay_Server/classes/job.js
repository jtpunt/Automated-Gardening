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

function buildTestSchedule() {
    return {
        second: 45,
        minute: 7,
        hour: 0
    }
}
function buildTestSchedule1() {
    return {
        second: 1,
        minute: 1,
        hour: 1
    }
}
function buildTestDevice(){
    return{
        id: 1,
        desired_state: true,
        gpio: 3
    }
}
var test = {
    print: function(...args){
        console.log(...args);
    }
}
let testSchedule = buildTestSchedule();
let testSchedule1 = buildTestSchedule1();

let testDevice = buildTestDevice();
let jobFnArgs = [test.print, test, "hello"]


let job = new JobBuilder()
    .withSchedule(testSchedule)
    .withDevice(testDevice)
    .withJobFunction(...jobFnArgs)
    .build()

console.log(`next nextInvocation: ${job.nextInvocationDate}`)
console.log(`job: ${JSON.stringify(job.schedule)}`);

job.schedule = testSchedule1;
console.log(`job: ${JSON.stringify(job.schedule)}`);

let result = job.rescheduleJob;
// job.cancelJob; 
//job.cancelNextJob(); 
console.log(`next nextInvocation: ${job.nextInvocationDate}}`)

console.log(`device: ${JSON.stringify(job.device)}`)
// module.exports = Job;
let node_schedule        = require('node-schedule');
class Device{
    constructor(device){
        this._id           = device['id'];
        this.desired_state = device['desired_state'];
        this.gpio          = device['gpio'];
    }
    get device(){
        return {
            id:            this._id,
            desired_state: this.desired_state,
            gpio:          this.gpio
        }
    }
}
// testing this
class Schedule extends Device{
    constructor(schedule, device){
        super(device);
        this.second    = schedule['second'];
        this.minute    = schedule['minute'];
        this.hour      = schedule['hour'];
        this.date      = schedule['date'];
        this.month     = schedule['month'];
        this.year      = schedule['year'];
        this.dayOfWeek = schedule['dayOfWeek'];
    }
    set newSchedule(newSchedule){
        this.second    = newSchedule['second'];
        this.minute    = newSchedule['minute'];
        this.hour      = newSchedule['hour'];
        this.date      = newSchedule['date'];
        this.month     = newSchedule['month'];
        this.year      = newSchedule['year'];
        this.dayOfWeek = newSchedule['dayOfWeek'];
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
}
class Job extends Schedule{
    constructor(schedule, device, fn, context, ...args){
        super(schedule, device);
        this.job = null
        this.job = this.createJob(fn, context, ...args);
        console.log(this.job);
        console.log(this.schedule);
    }
    createJob(fn, context, ...args){
        console.log("Creating job");
        return node_schedule.scheduleJob(
            this.schedule, function(){ fn.call(context, ...args); }
        )
    }
    cancelJob(){ 
        this.job.cancel(); 
    }
    cancelNextJob(){
        this.job.cancelNext();
    }
    get nextInvocationDate(){
        return this.job.nextInvocation();
    }
}
class JobBuilder{
    withDevice(device){

    }
    withSchedule(schedule){

    }
    withJob(fn, context, ...args){
        
    }
    build(){
        return new Job();
    }
}

function buildTestSchedule() {
    return {
        second: 0,
        minute: 0,
        hour: 0
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
let testDevice = buildTestDevice();
console.log(`testDevice: ${JSON.stringify(testDevice)}`);
let job = new Job(testSchedule, testDevice, test.print, test, "hello");
console.log(`next nextInvocation: ${job.nextInvocationDate}`)
// // let job = new JobBuilder(testSchedule)
// //     .build();
console.log(`job: ${JSON.stringify(job.schedule)}`);
console.log(`device: ${JSON.stringify(job.device)}`)
// module.exports = Job;
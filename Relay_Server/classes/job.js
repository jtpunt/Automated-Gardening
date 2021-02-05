let node_schedule = require('node-schedule');
class Device{
    #_id
    #gpio
    #desired_state
    constructor(device){
        this.#_id           = device['id'];
        this.#gpio          = device['gpio'];
        this.#desired_state = device['desired_state'];
    }
    /*************************** Device GETTERS ***************************/
    get device(){
        return {
            _id:           this.#_id,
            gpio:          this.#gpio,
            desired_state: this.#desired_state
        }
    }
    get _id()           { return this.#_id;          }
    get gpio()          { return this.#gpio          };
    get desired_state() { return this.#desired_state };
    /*************************** Device SETTERS ***************************/
    set device(updatedDevice){
        this.#_id           = updatedDevice['id'];
        this.#gpio          = updatedDevice['gpio'];
        this.#desired_state = updatedDevice['desired_state'];
    }
    set _id(_id)                     { this.#_id           = _id;           }
    set gpio(gpio)                   { this.#gpio          = gpio;          }
    set desired_state(desired_state) { this.#desired_state = desired_state; }
}
class Relational extends Device{
    #prevScheduleId
    #nextScheduleId
    #startScheduleId
    #endScheduleId
    constructor(relational, device){
        super(device);
        this.#prevScheduleId  = relational['prevScheduleId'];
        this.#nextScheduleId  = relational['nextScheduleId'];
        this.#startScheduleId = relational['startScheduleId'];
        this.#endScheduleId   = relational['endScheduleId'];
    }
    /*************************** Relational GETTERS ***************************/
    get relational(){
        return {
            prevScheduleId:  this.#prevScheduleId,
            nextScheduleId:  this.#nextScheduleId,
            startScheduleId: this.#startScheduleId,
            endScheduleId:   this.#endScheduleId
        }
    }
    get prevScheduleId() { return this.#prevScheduleId;  }
    get nextScheduleId() { return this.#nextScheduleId;  }
    get startScheduleId(){ return this.#startScheduleId; }
    get endScheduleId()  { return this.#endScheduleId;   }
    /*************************** Relational SETTERS ***************************/
    set relational(relational){
        this.#prevScheduleId  = relational['prevScheduleId'];
        this.#nextScheduleId  = relational['nextScheduleId'];
        this.#startScheduleId = relational['startScheduleId'];
        this.#endScheduleId   = relational['endScheduleId'];
    }
    set prevScheduleId(prevScheduleId)  { this.#prevScheduleId  = prevScheduleId;  }
    set nextScheduleId(nextScheduleId)  { this.#nextScheduleId  = nextScheduleId;  }
    set startScheduleId(startScheduleId){ this.#startScheduleId = startScheduleId; }
    set endScheduleId(endScheduleId)    { this.#endScheduleId   = endScheduleId;   }

}
// testing this
class Schedule extends Relational{
    #second
    #minute
    #hour
    #date
    #month
    #year
    #dayOfWeek
    constructor(schedule, relational, device){
        super(relational, device);
        console.log(`schedule constructor with: ${JSON.stringify(schedule)}`);
        this.#second    = schedule['second'];    // required
        this.#minute    = schedule['minute'];    // required
        this.#hour      = schedule['hour'];      // required
        this.#date      = schedule['date'];      // optional
        this.#month     = schedule['month'];     // optional
        this.#year      = schedule['year'];      // optional
        this.#dayOfWeek = schedule['dayOfWeek']; // optional
        console.log(`month? - ${this.month}`);
    }
    /*************************** Schedule GETTERS ***************************/
    get schedule(){
        let obj = {
            second: this.second,
            minute: this.minute,
            hour:   this.hour
        }
        if(this.date !== undefined)  obj.date      = this.date; // date could be zero
        if(this.month !== undefined) obj.month     = this.month; // month could be zero
        if(this.year)           obj.year      = this.year;
        if(this.dayOfWeek)      obj.dayOfWeek = this.dayOfWeek;

        return obj;
    }
    get second()   { return this.#second;    }
    get minute()   { return this.#minute;    }
    get hour()     { return this.#hour;      }
    get date()     { return this.#date;      }
    get month()    { return this.#month;     }
    get year()     { return this.#year;      }
    get dayOfWeek(){ return this.#dayOfWeek; }
        // Returns a timestamp based on the current day with just the hour, minute, and second properties 
    // as the findSameDaySchedulesAndRetIds function gives us schedules that would occur on the same day, 
    // so we can ignore date, month, year, and dayOfWeek properties.
    get timestamp(){ return new Date((new Date).setHours(this.hour, this.minute, this.second));}
    /*************************** Schedule SETTERS ***************************/
    set schedule(newSchedule){
        this.second    = newSchedule['second'];
        this.minute    = newSchedule['minute'];
        this.hour      = newSchedule['hour'];
        this.date      = newSchedule['date'];
        this.month     = newSchedule['month'];
        this.year      = newSchedule['year'];
        this.dayOfWeek = newSchedule['dayOfWeek'];
    }
    set second(second)      { this.#second    = second;    }
    set minute(minute)      { this.#minute    = minute;    }
    set hour(hour)          { this.#hour      = hour;      }
    set date(date)          { this.#date      = date;      }
    set month(month)        { this.#month     = month;     }
    set year(year)          { this.#year      = year;      }
    set dayOfWeek(dayOfWeek){ this.#dayOfWeek = dayOfWeek; }
}
class Job extends Schedule{
    constructor(schedule, relational, device, jobFunction){
        super(schedule, relational, device);
        this.jobFunction = jobFunction;
        console.log(`job constructor Schedule - ${JSON.stringify(this.schedule)}`);
        this.job = node_schedule.scheduleJob(this.schedule, this.jobFunction)
    }
    /*************************** Job METHODS ***************************/
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
    updateSchedJobAndDevice(updatedDevice, updatedSchedule, updatedRelational, updatedJobFunction){
        this.cancelJob();
        this.device     = updatedDevice;
        this.schedule   = updatedSchedule;
        this.relational = updatedRelational;
        this.jobFn      = updatedJobFunction;
        this.job        = node_schedule.scheduleJob(this.schedule, this.jobFunction);
    }
    /* Invalidates all planned invocation for the job. */
    cancelJob(reschedule){ this.job.cancel(); }
    /* Invalidates the next planned invocation for the job. */
    cancelNextJob(reschedule){ this.job.cancelNext(); }
    /*************************** Job GETTERS ***************************/
    /* Returns a date object for the next planned invocation for this job. 
     * If no invocation is planned, then null is returned. */
    get nextInvocationDate(){ return this.job.nextInvocation(); }
    /* All planned invocations are canceled and registers the job completely new again using
     * the schedule data stored in the Schedule class. Returns true/false on success/failure. */
    get rescheduleJob(){ return this.job.reschedule(this.schedule); }
    get schedule_config(){
        return {
            device:     this.device,
            schedule:   this.schedule,
            relational: this.relational
        }
    }
    /*************************** Job SETTERS ***************************/
    set jobFn(newJobFunction){ this.jobFunction = newJobFunction; }
}
/* Ref - Pg. 243 - Node.js Design Patterns - 3rd Edition - Mario Casciaro, Luciano Mammino */
class JobBuilder{
    withSchedule(schedule){ 
        this.schedule = schedule; 
        return this;
    }
    withRelational(relational){
        this.relational = relational;
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
    build(){ return new Job(this.schedule, this.relational, this.device, this.jobFunction); }
}
var test = {
    buildTestSchedule1: function(){
        return {
            second: 0,
            minute: 30,
            hour: 13,
            date: 28,
            month: 1,
            year: 2021
        }
    },
    buildTestSchedule2: function(){
        return {
            second: 1,
            minute: 40,
            hour: 17
        }
    },
    buildRelational1: function(){
        return {
            startScheduleId: 1,
            endScheduleId:   2
        }
    },
    buildRelational2: function(){
        return {
            startScheduleId: 1,
            endScheduleId:   2
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

let testRelational1 = test.buildRelational1(),
    testRelational2 = test.buildRelational2();

let testDevice1 = test.buildTestDevice1(),
    testDevice2 = test.buildTestDevice2();

let jobFnArgs1 = [test.print1, test, "hello"],
    jobFnArgs2 = [test.print2, test, "yowhatup"];


// let job = new JobBuilder()
//     .withSchedule(testSchedule1)
//     .withRelational(testRelational1)
//     .withDevice(testDevice1)
//     .withJobFunction(...jobFnArgs1)
//     .build()

// console.log(`next nextInvocation: ${job.nextInvocationDate}`)
// console.log(`schedule1: ${JSON.stringify(job.schedule)}`);
// console.log(`relational: ${JSON.stringify(job.relational)}`)
// job.schedule = testSchedule2;
// let updatedJobFn = test.buildJobFn(...jobFnArgs2);
// job.updateSchedJobAndDevice(testDevice2, testSchedule2, updatedJobFn);
// console.log(`schedule2: ${JSON.stringify(job.schedule)}`);
// console.log(`job: ${JSON.stringify(job)}`)
// let result = job.rescheduleJob;
// job.cancelJob; 
//job.cancelNextJob(); 
// console.log(job.timestamp);
// console.log(`next nextInvocation: ${job.nextInvocationDate}}`)
// console.log(`device: ${JSON.stringify(job.device)}`)
// console.log(`desired_state: ${job.desired_state}`);
module.exports = JobBuilder;
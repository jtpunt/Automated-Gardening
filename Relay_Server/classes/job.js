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
        return {
            second:    this.second,
            minute:    this.minute,
            hour:      this.hour,
            date:      this.date,
            month:     this.month,
            year:      this.year,
            dayOfWeek: this.dayOfWeek
        }
    }
}
class Job extends Schedule{
    constructor(schedule, device){
        super(schedule, device);
        this.job = null;
    }
}
class JobBuilder{
    withDevice(device){

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
let testSchedule = buildTestSchedule();
let testDevice = buildTestDevice();
console.log(`testDevice: ${JSON.stringify(testDevice)}`);
let job = new Job(testSchedule, testDevice);

// // let job = new JobBuilder(testSchedule)
// //     .build();
console.log(`job: ${JSON.stringify(job.schedule)}`);
console.log(`device: ${JSON.stringify(job.device)}`)
// module.exports = Job;
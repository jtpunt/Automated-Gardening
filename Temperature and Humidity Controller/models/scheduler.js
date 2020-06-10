var mongoose = require("mongoose");
var scheduleSchema = new mongoose.Schema({
    device: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device"
        },
        local_ip: String,
        gpio: Number,
        desired_state: Boolean
    }, 
    schedule: {
        second: Number,
        minute: Number,
        hour: Number,
        date: Number,
        month: Number,
        year: Number,
        dayOfWeek: [],
        prevScheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scheduler"
        },
        nextScheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scheduler"
        }
    }
    
});
module.exports = mongoose.model('Scheduler', scheduleSchema, 'schedules');

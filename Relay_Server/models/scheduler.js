var mongoose = require("mongoose");
var scheduleSchema = new mongoose.Schema({
    device: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device"
        },
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
        dayOfWeek: []
    }
    relational: {
        prevScheduleId: { // associated with desired_state === true. Turn the relay on
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scheduler"
        },
        nextScheduleId: { // associated with desired_state === false. Turn the relay off
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scheduler"
        },
        startScheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scheduler"
        },
        endScheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scheduler"
        }
    }
    
});
module.exports = mongoose.model('Scheduler', scheduleSchema, 'schedules');

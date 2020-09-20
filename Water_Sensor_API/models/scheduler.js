var mongoose = require("mongoose");
var scheduleSchema = new mongoose.Schema({
    device: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device"
        },
        gpio: Number,
        desired_state: Boolean // TO DO - take this code out, moved to new 'relaySettings.js' schema
    }, 
    schedule: {
        second: Number,
        minute: Number,
        hour: Number,
        date: Number,
        month: Number,
        year: Number,
        dayOfWeek: [],
        // TO DO - change to 'onScheduleId'
        prevScheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scheduler"
        },
        // TO DO - change to 'offScheduleId'
        nextScheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Scheduler"
        }, 
        runAtInterval: {
            Interval: Number,
            time_format: {
                format: String, // seconds is not a valid format
                enum: ['minutes', 'hours']
            }
        }
    }
    
});
module.exports = mongoose.model('Scheduler', scheduleSchema, 'schedules');

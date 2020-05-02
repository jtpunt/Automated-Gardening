var mongoose = require("mongoose");
var scheduleSchema = new mongoose.Schema({
    device: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device"
        },
        local_ip: String,
        gpio: Number,
        OnOff: Boolean
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
    
});
module.exports = mongoose.model('Scheduler', scheduleSchema, 'schedules');

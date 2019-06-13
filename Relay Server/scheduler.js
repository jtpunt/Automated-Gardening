var mongoose = require("mongoose");
var schedulerSchema = new mongoose.Schema({
    local_ip: String,
    gpio: Number,
    second: Number,
    minute: Number,
    hour: Number,
    date: Number,
    month: Number,
    year: Number,
    dayOfWeek: Number
    
});
module.exports = mongoose.model('Scheduler', scheduleSchema, 'schedules');

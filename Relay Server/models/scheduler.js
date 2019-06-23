var mongoose = require("mongoose");
var scheduleSchema = new mongoose.Schema({
    device: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device"
        }
    }
    gpio: Number,
    second: Number,
    minute: Number,
    hour: Number,
    date: Number,
    month: Number,
    year: Number,
    dayOfWeek: Number
    
});
module.exports = mongoose.model('Schedule', scheduleSchema);

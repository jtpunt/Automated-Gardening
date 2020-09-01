var mongoose = require("mongoose");
var chartSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device"
    },
    temp: Number,
    humid: Number,
    date: String,
});
module.exports = mongoose.model('Chart', chartSchema, 'sensor_readings');

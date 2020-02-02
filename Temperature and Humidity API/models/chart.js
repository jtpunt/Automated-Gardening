var mongoose = require("mongoose");
var chartSchema = new mongoose.Schema({
    humid: Number,
    date: String,
    temp: Number,
});
module.exports = mongoose.model('Chart', chartSchema, 'sensor_readings');

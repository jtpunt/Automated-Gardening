var mongoose = require("mongoose");
var sensorSchema = new mongoose.Schema({
    sensor: Number,
    pin: Number,
});
module.exports = mongoose.model('Sensor', sensorSchema, 'sensors');

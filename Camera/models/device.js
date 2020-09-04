var mongoose = require("mongoose");
var deviceSchema = new mongoose.Schema({
    local_ip: String,
    deviceName: String,
    deviceType: {
        type: String,
        enum: ['DHT11 Sensor', 'DHT22 Sensor', 'Relay Server', 'Soil Moisture Sensor', 'Water Level Sensor', 'Camera']
    },
    gpio: [ {
        type: Number,
        enum: [2,3,4,5,6,12,13,16,17,18,19,20,21,22,23,24,25,26,27]
        }
    ]
});
deviceSchema.index({local_ip: 1, deviceType: 1}, { unique: true});
module.exports = mongoose.model('Device', deviceSchema, 'devices');

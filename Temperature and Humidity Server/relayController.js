var schedule      = require('node-schedule'),
    http          = require('http');


var lightsOn = schedule.scheduleJob('0 20 * * *', function(){
    http.get("http://192.168.1.129:5000/2", (resp)=> { console.log(resp)});
});
var lightsOff = schedule.scheduleJob('0 8 * * *', function(){
    http.get("http://192.168.1.129:5000/2", (resp)=> { console.log(resp)});
});
var pumpOn = schedule.scheduleJob('0 19 * * *', function(){
    http.get("http://192.168.1.129:5000/3", (resp)=> { console.log(resp)});
});
var pumpOff = schedule.scheduleJob('10 19 * * *', function(){
    http.get("http://192.168.1.129:5000/3", (resp)=> { console.log(resp)});
});
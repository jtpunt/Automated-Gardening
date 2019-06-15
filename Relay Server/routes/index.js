const Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var schedule      = require('node-schedule');
var Scheduler     = require("../models/scheduler");
// Living room lights use 'out', otherwise, set to 'high'
const outlet1 = new Gpio(2, 'out'); //use GPIO pin 4, and specify that it is output
const outlet2 = new Gpio(3, 'out');
const APPROVED_GPIO = [2,3]; // gpios that the system is set up to handle
var schedules = [];
var ip = require("ip");
var localIP = ip.address();
console.log(localIP);
Scheduler.find({local_ip: localIP}, (err, mySchedules) => {
    if(err)
        console.log(err);
    else{
        console.log(mySchedules);
        mySchedules.forEach(function(mySchedule){
            var newSchedule = { 
                local_ip: mySchedule.local_ip, 
                gpio: mySchedule.gpio,
                second: mySchedule.second,
                minute: mySchedule.minute,
                hour: mySchedule.hour,
                date: mySchedule.date,
                month: mySchedule.month,
                year: mySchedule.year,
                dayOfWeek: mySchedule.dayOfWeek
            };
            var node_schedule      = require('node-schedule');
            var j = node_schedule.scheduleJob(mySchedule, function(){
                console.log('Schedule created!');
                activateRelay(newSchedule['gpio']);
            });
            var db_id = mySchedule._id;
            var obj = {"_id": mySchedule._id, j};
            schedules.push(obj);
        });
        console.log(schedules);
    }
});
function activateRelay(gpio_input) { //function to start blinkingp
    if(gpio_input === 2){
        if (outlet1.readSync() === 0) { //check the pin state, if the state is 0 (or off)
            outlet1.writeSync(1); //set pin state to 1 (turn LED on)
        } else {
            outlet1.writeSync(0); //set pin state to 0 (turn LED off)
        }
    }else{
        if (outlet2.readSync() === 0) { //check the pin state, if the state is 0 (or off)
            outlet2.writeSync(1); //set pin state to 1 (turn LED on)
        } else {
            outlet2.writeSync(0); //set pin state to 0 (turn LED off)
        }
    }
}
function getStatus(gpio_input, res){
    if(gpio_input === 2){
        res.write(JSON.stringify(outlet1.readSync()));
    }else{
        res.write(JSON.stringify(outlet2.readSync()));
    }
}
function validateInput(gpio_input, res, fn){
    if(Number.isNaN(gpio_input)){ // make sure a number was passed in
        console.log("not a number!\n");
        return false;
    }else if(APPROVED_GPIO.includes(gpio_input)){ // was 2 or 3 passed in?
        fn(gpio_input, res);
        res.status(200).end();
    }else{
        console.log("in else\n");
        res.status(400).end();
    }
}
module.exports = function(app) {
        // returns all schedules
    app.get('/schedule', function(req, res) {
        Scheduler.find({}, (err, schedules) => {
            if(err)
                console.log(err);
            else{
                console.log(schedules);
                res.write(JSON.stringify(schedules));
                res.status(200).end();
            }
            
        });
    });
    // add a new chedule
    app.post('/schedule', function(req, res){
        console.log(req.body);
        var newSchedule = { 
            local_ip: req.body.local_ip, 
            gpio: req.body.gpio,
            second: req.body.second,
            minute: req.body.minute,
            hour: req.body.hour,
            date: req.body.date,
            month: req.body.month,
            year: req.body.year,
            dayOfWeek: req.body.dayOfWeek
        };
        Scheduler.create(newSchedule, (err, schedule) =>{
            if(err) console.log(err);
            else{
                console.log(schedule, " created");
                schedule.save();
                var mySchedule = {
                    second: newSchedule['second'],
                    minute: newSchedule['minute'],
                    hour: newSchedule['hour'],
                    date: newSchedule['date'],
                    month: newSchedule['month'],
                    year: newSchedule['year'],
                    dayOfWeek: newSchedule['dayOfWeek']
                };
                console.log(mySchedule);
                console.log(schedule._id);
                var node_schedule      = require('node-schedule');
                var j = node_schedule.scheduleJob(mySchedule, function(){
                    console.log('Schedule created!');
                    activateRelay(newSchedule['gpio']);
                });
                var db_id = schedule._id;
                var obj = {"_id": schedule._id, j};
                schedules.push(obj);
                console.log(schedules);
            }
        });
    });
    app.get('/schedule/:schedule_id', function(req, res) {
        Scheduler.findById(req.params.schedule_id, (err, foundSchedule) =>{
            if(err) res.redirect("back");
            else{
                console.log(foundSchedule);
                res.write(JSON.stringify(foundSchedule));
            }
        }); 
    });
    // edit an existing schedule
    app.put('/schedule/:schedule_id', function(req, res){
        let newSchedule = { 
            local_ip: req.body.local_ip, 
            gpio: req.body.gpio,
            second: req.body.second,
            minute: req.body.minute,
            hour: req.body.hour,
            date: req.body.date,
            month: req.body.month,
            year: req.body.year,
            dayOfWeek: req.body.dayOfWeek
        };
        Scheduler.findByIdAndUpdate(req.params.schedule_id, {$set: newData}, (err, schedule) => {
            if(err){
                console.log(err);
            } else {
                console.log("Successfully Updated!");
                console.log(schedule);
            }
        });
    });
    // delete an existing schedule
    app.delete('/schedule/:schedule_id', function(req, res){
        var schedule_id = req.params.schedule_id;
        console.log(typeof schedule_id);
        schedules.forEach(function(mySchedule, i){
            console.log(typeof mySchedule._id);
            if(mySchedule._id == schedule_id){
                console.log("Match found at index, ", i);
            }
        })
        // Scheduler.findByIdAndRemove(req.params.schedule_id, (err) => {
        //     if(err)
        //         console.log(err);
        //     else
        //         console.log("Success!");
        // });
    });
    app.get('/:id', function(req, res){
        console.log("in /:id route\n");
        var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
        validateInput(gpio_input, res, activateRelay);
    });
    app.get('/status/:id', function(req, res){
        console.log("in /status/:id route\n");
        var gpio_input = Number(req.params.id); // convert our string to a number, since '2' !== 2
        validateInput(gpio_input, res, getStatus);
    });
};

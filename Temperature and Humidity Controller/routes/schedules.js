var express       = require("express"),
    http          = require('http'),
    Device        = require("../models/device"),
    Scheduler     = require("../models/scheduler");
    querystring   = require('querystring'),
    router        = express.Router();
function buildSchedule(mySchedule){
    var obj = {};
    if(mySchedule.local_ip !== null && mySchedule.local_ip !== undefined){
        console.log("VALID IP\n");
        obj.local_ip = mySchedule.local_ip;
    }
    if(mySchedule.gpio !== null && mySchedule.gpio !== undefined){
        console.log("VALID GPIO\n");
        obj.gpio = mySchedule.gpio;
    }
    if(mySchedule.second !== null && mySchedule.second !== undefined){
        console.log("VALID SECOND\n");
        obj.second = mySchedule.second;
    }
    if(mySchedule.time !== null && mySchedule.time !== undefined){
        console.log("VALID TIME\n");
        obj.minute = mySchedule.time.split(":")[1];
        obj.hour = mySchedule.time.split(":")[0];
    }
    if(mySchedule.date !== null && mySchedule.date !== undefined){
        obj.date = mySchedule.date;
    }
    if(mySchedule.month !== null && mySchedule.month !== undefined){
        obj.month = mySchedule.month;
    }
    if(mySchedule.year !== null && mySchedule.year !== undefined){
        obj.year = mySchedule.year;
    }
    if(mySchedule.dayOfWeek !== null && mySchedule.dayOfWeek !== undefined){
        obj.dayOfWeek = mySchedule.dayOfWeek;
    }
    return obj;
}
// CREATE mongodb schema for devices, etc, relays, temp/humid sensors, water sensors
// then return ip address of all relay devices. query the 1st device in that list to
// return all schedules set by all relays
// ALSO, set up a route on the relay to return all the schedules for that device
// Shows all active schedules
router.get("/", (req, res) =>{
    Device.find({deviceType: "Relay Server"}, (err, devices) =>{
        if(err) console.log(err);
        else{
            Scheduler.find({}, (err, schedule) => {
                if(err) console.log(err);
                else{
                    console.log("result:", schedule);
                    res.render("schedule/index", {schedules: schedule, devices: devices, stylesheets: ["/static/css/sensors.css"]});
                    res.status(200).end();
                }
                // console.log(schedule);
                // res.render("schedule/index", {schedules: schedule, devices: devices, stylesheets: ["/static/css/sensors.css"]});
            });
            // http.get("http://192.168.1.12:5000/schedule", (resp) => {
            //     // console.log(resp)
            //     let str = '';
            //     resp.on('data', function(chunk) {
            //         var data = JSON.parse(chunk);
            //         console.log(data);
            //         res.render("schedule/index", {schedules: data, devices: devices, stylesheets: ["/static/css/sensors.css"]});
            //         // res.status(200).end();
            //     });
            // }).on("error", (err) => {
            //     console.log("Error: " + err.message);
            //     res.render("500");
            //     res.status(500).end();
            // });
        }
    });

});
router.get("/:relay_id", (req, res) => {
   // return all the schedules for that relay
    // Shows all active schedules
});
router.post("/", (req, res) => {
    const scheduleObj = buildSchedule(req.body);
    const scheduleStr = querystring.stringify(scheduleObj);
    const options = {
        hostname: req.body.local_ip,
        port: 5000,
        path: '/schedule',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(scheduleStr)
        }
    };
    const myReq = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });
    
    myReq.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    
    // Write data to request body
    myReq.write(scheduleStr);
    myReq.end();
    res.redirect("/schedule");
    res.status(200).end();
});
//EDIT
router.get("/:schedule_id/edit", (req, res) => {
    Scheduler.findById(req.params.schedule_id, (err, foundSchedule) =>{
        if(err) console.log(err);
        else{
                res.render("schedule/edit", {schedule: foundSchedule, stylesheets: ["/static/css/sensors.css"]});
                res.status(200).end();
        }
    });
});
// UPDATE
router.put("/:schedule_id/local_ip/:local_ip", (req, res) => {
    console.log("in put route with ", req.params.schedule_id, ', ', req.params.local_ip, '\n');
    const scheduleObj = buildSchedule(req.body);
    const scheduleStr = querystring.stringify(scheduleObj);
    const options = {
        hostname: req.body.local_ip,
        port: 5000,
        path: '/schedule',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(scheduleStr)
        }
    };
    const myReq = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });
    
    myReq.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    
    // Write data to request body
    myReq.write(scheduleStr);
    myReq.end();
    res.redirect("/schedule");
    res.status(200).end();
})
router.delete("/:schedule_id/local_ip/:local_ip", (req, res) => {
    console.log("in delete route with ", req.params.schedule_id, ', ', req.params.local_ip, '\n');
    const options = {
        hostname: req.params.local_ip,
        port: 5000,
        path: '/schedule/' + req.params.schedule_id,
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // 'Content-Length': Buffer.byteLength(newSchedule)
        }
    };
    const myReq = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });
    
    myReq.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    myReq.end();
    res.redirect("/schedule");
});

module.exports = router;
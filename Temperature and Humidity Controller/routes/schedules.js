var express       = require("express"),
    http          = require('http'),
    Device        = require("../models/device"),
    Scheduler     = require("../models/scheduler");
    querystring   = require('querystring'),
    router        = express.Router();
function buildSchedule(mySchedule){
    var obj = {};
    obj.device = {};
    var date = new Date();
    console.log("buildSchedule: ", mySchedule);
    if(mySchedule['_id'] !== null && mySchedule['_id'] !== undefined){
        console.log("VALID _ID");
        obj['device']['id'] = mySchedule['_id'];
    }
    if(mySchedule.local_ip !== null && mySchedule.local_ip !== undefined){
        console.log("VALID IP\n");
        obj.local_ip = mySchedule.local_ip;
        obj['device']['local_ip'] = mySchedule.local_ip;
    }
    if(mySchedule.gpio !== null && mySchedule.gpio !== undefined){
        console.log("VALID GPIO\n");
        obj.gpio = mySchedule.gpio;
    }
    if(mySchedule.time !== null && mySchedule.time !== undefined){
        console.log("VALID TIME\n");
        let splitTimeArr = mySchedule.time.split(":");
        obj.second = splitTimeArr[2];
        obj.minute = splitTimeArr[1];
        obj.hour = splitTimeArr[0];
    }
    if(mySchedule.date !== null && mySchedule.date !== undefined && mySchedule.DateCheckBox === "on"){
        let myDate = new Date(mySchedule.date);
        let day = myDate.getDate();
        let month = myDate.getMonth();
        let year = myDate.getFullYear();
        let currYear = date.getFullYear();
        console.log(year, currYear);
        // date = 1 - 31
        if(day >= 1 && day <= 31){
            obj.date = day;
        }else throw new Error("Invalid date input.");
        // month = 0 - 11
        if(month >= 0 && month <= 11){
            obj.month = month;
        }else throw new Error("Invalid month input.");
        // year = current year or above
        if(year >= currYear){
            obj.year = mySchedule.year;
        }else throw new Error("Invalid year input.");
    }
    // dayOfWeek = 0 - 6
    if(mySchedule.dayOfWeek !== null && mySchedule.dayOfWeek !== undefined && mySchedule.DayOfWeekCheckBox === "on"){
        let dayOfWeek = mySchedule.dayOfWeek.map(function(day){
            if(!Number.isNaN(day) && Number(day) >= 0 && Number(day) <= 6){
                return parseInt(day);
            }throw new Error("Invalid day of week input.");
        });
        console.log(dayOfWeek);
    }
    return obj;
}
var groupBy = function(data, key) { // `data` is an array of objects, `key` is the key (or property accessor) to group by
  // reduce runs this anonymous function on each element of `data` (the `item` parameter,
  // returning the `storage` parameter at the end
  console.log(typeof data);
  return data.reduce(function(storage, item) {
    // get the first instance of the key by which we're grouping
    var group = item["local_ip"];
    // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
    storage[group] = storage[group] || [];
    
    // add this item to its group within `storage`
    storage[group].push(item);
    
    // return the updated storage to the reduce function, which will then loop through the next 
    return storage; 
  }, {}); // {} is the initial value of the storage
};
router.get("/", (req, res) =>{
    Device.find({deviceType: "Relay Server"}, (err, devices) =>{
        if(err) console.log(err);
        else{
            Scheduler.find({}, (err, schedule) => {
                if(err) console.log(err);
                else{
                    // console.log("result:", schedule, devices);
                    let schedulesByIp = groupBy(schedule, 'local_ip');
                    console.log(schedulesByIp);
                    res.render("schedule/index", {schedules: schedulesByIp, devices: devices, stylesheets: ["/static/css/sensors.css"]});
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
router.post("/", (req, resp) => {
    
    try{
        var scheduleObj = buildSchedule(req.body);
    }catch(err){
        console.log(err);
        res.status(500).end();
    }
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
            resp.redirect("/schedule");
            resp.status(200).end();
        });
    });
    
    myReq.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    
    // Write data to request body
    myReq.write(scheduleStr);
    myReq.end();
});
//EDIT
router.get("/:schedule_id/edit", (req, res) => {
    console.log("in get EDIT route with ", req.params.schedule_id, '\n');
    Scheduler.findById(req.params.schedule_id, (err, foundSchedule) =>{
        if(err) console.log(err);
        else{
                console.log(foundSchedule);
                res.render("schedule/edit", {schedule: foundSchedule, stylesheets: ["/static/css/sensors.css"]});
                res.status(200).end();
        }
    });
});
// UPDATE
router.put("/:schedule_id/local_ip/:local_ip", (req, resp) => {
    console.log("in put route with ", req.params.schedule_id, ', ', req.params.local_ip, '\n');
    const scheduleObj = buildSchedule(req.body);
    const scheduleStr = querystring.stringify(scheduleObj);
    const options = {
        hostname: req.body.local_ip,
        port: 5000,
        path: '/schedule/' + req.params.schedule_id,
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
            console.log(res.statusCode);
            resp.redirect("/schedule");
            resp.status(200).end();
        });
    });
    
    myReq.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    
    // Write data to request body
    myReq.write(scheduleStr);
    myReq.end();
})
router.delete("/:schedule_id/local_ip/:local_ip", (req, resp) => {
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
            console.log(res.statusCode);
            resp.redirect("/schedule");
            resp.status(200).end();
        });
    });
    
    myReq.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
    myReq.end();
});

module.exports = router;
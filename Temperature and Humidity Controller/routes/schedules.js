var express       = require("express"),
    http          = require('http'),
    Device        = require("../models/device"),
    Scheduler     = require("../models/scheduler");
    querystring   = require('querystring'),
    router        = express.Router();
    
function buildSchedule(mySchedule){
    var obj = {};
    obj.device = {};
    obj.schedule = {};
    var date = new Date();
    console.log("buildSchedule: ", mySchedule);
    if(mySchedule['device']['id'] !== null && mySchedule['device']['id'] !== undefined){
        console.log("VALID _ID");
        obj['device']['id'] = mySchedule['device']['id'];
    }
    // if(mySchedule['device']['local_ip'] !== null && mySchedule['device']['local_ip'] !== undefined){
    //     console.log("VALID IP\n");
    //     obj['device']['local_ip'] = mySchedule['device']['local_ip'];
    // }
    if(mySchedule['device']['gpio'] !== null && mySchedule['device']['gpio'] !== undefined){
        console.log("VALID GPIO\n");
        obj['device']['gpio'] = mySchedule['device']['gpio'];
    }
    if(mySchedule['schedule']['time'] !== null && mySchedule['schedule']['time'] !== undefined){
        console.log("VALID TIME\n");
        let splitTimeArr = mySchedule['schedule']['time'].split(":");
        obj['schedule']['second'] = splitTimeArr[2];
        obj['schedule']['minute'] = splitTimeArr[1];
        obj['schedule']['hour'] = splitTimeArr[0];
    }
    if(mySchedule['schedule']['date'] !== null && mySchedule['schedule']['date'] !== undefined && mySchedule['schedule']['date'] !== '' && mySchedule.DateCheckBox === "on"){
        let myDate = new Date(mySchedule['schedule']['date']);
        let day = myDate.getDate();
        let month = myDate.getMonth();
        let year = myDate.getFullYear();
        let currYear = date.getFullYear();
        console.log(year, currYear);
        // date = 1 - 31
        if(day >= 1 && day <= 31){
            obj['schedule']['date'] = day;
        }else throw new Error("Invalid date input.");
        // month = 0 - 11
        if(month >= 0 && month <= 11){
            obj['schedule']['month'] = month;
        }else throw new Error("Invalid month input.");
        // year = current year or above
        if(year >= currYear){
            obj['schedule']['year'] = year;
        }else throw new Error("Invalid year input.");
    }
    if(mySchedule['schedule']['dayOfWeek'] && mySchedule['DayOfWeekCheckBox'] === "on"){
        console.log("VALID dayOfWeek.");
        let dayOfWeek = Array.from(mySchedule['schedule']['dayOfWeek']).map(function(day){
            // dayOfWeek = 0 - 6
            if(!Number.isNaN(day) && Number(day) >= 0 && Number(day) <= 6){
                return parseInt(day);
            }throw new Error("Invalid day of week input.");
        });
        obj['schedule']['dayOfWeek'] = dayOfWeek;
        console.log(dayOfWeek);
    }
    return obj;
}
var groupBy = function(data, key, nestedKey) { // `data` is an array of objects, `key` is the key (or property accessor) to group by
  // reduce runs this anonymous function on each element of `data` (the `item` parameter,
  // returning the `storage` parameter at the end
  console.log(typeof data);
  return data.reduce(function(storage, item) {
    // get the first instance of the key by which we're grouping
    var group = item[key][nestedKey];
    
    // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
    storage[group] = storage[group] || [];
    
    // add this item to its group within `storage`
    storage[group].push(item);
    
    // return the updated storage to the reduce function, which will then loop through the next 
    return storage; 
  }, {}); // {} is the initial value of the storage
};
// NOT COMPLETE
router.get("/", (req, res) =>{
    Device.find({deviceType: "Relay Server"}, (err, devices) =>{
        if(err) console.log(err);
        else{
            Scheduler.find({}, (err, schedules) => {
                if(err) console.log(err);
                else{
                    // Loop through each schedule, find the device it is associated with and grab the devices local ip address
                    schedules.forEach(function(schedule){
                        let found = devices.find(function(device) { 
                            return device['_id'].toString() === schedule['device']['id'].toString()
                        });
                        if(found !== undefined){
                            schedule['device']['local_ip'] = found['local_ip'];
                        }
                    });
                    console.log(schedules);
                    let schedulesByIp = groupBy(schedules, 'device', 'local_ip');
                    console.log("SchedulesbyIp: ", schedulesByIp);
                    res.render("schedule/index", {schedules: schedulesByIp, devices: devices, stylesheets: ["/static/css/sensors.css"]});
                    res.status(200).end();
                }
            });
        }
    });

});
router.get("/:relay_id", (req, res) => {
   // return all the schedules for that relay
    // Shows all active schedules
});
router.post("/", (req, res) => {
    
    try{
        var scheduleObj = buildSchedule(req.body);
    }catch(err){
        console.log(err);
        res.status(500).end();
    }finally{
        console.log("finally..", scheduleObj);
        const scheduleStr = JSON.stringify(scheduleObj);
        console.log(scheduleStr);
        const options = {
            hostname: req.body.device.local_ip,
            port: 5000,
            path: '/schedule',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(scheduleStr)
            }
        };
        const myReq = http.request(options, (resp) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            resp.setEncoding('utf8');
            resp.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
            });
            resp.on('end', () => {
                console.log('No more data in response.');
                res.redirect("/schedule");
                res.status(201).end();
            });
        });
        
        myReq.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
        
        // Write data to request body
        myReq.write(scheduleStr);
        myReq.end();
    }
   
});
//EDIT
router.get("/:schedule_id/edit", (req, res) => {
    console.log("in get EDIT route with ", req.params.schedule_id, '\n');
    Scheduler.findById(req.params.schedule_id, (err, foundSchedule) =>{
        if(err) console.log(err);
        else{
            // We need to get the GPIO setup of the device
            Device.findById(foundSchedule['device']['id'], (err, foundDevice) => {
                console.log("FoundSchedule: ", foundSchedule, "FoundDevice: ", foundDevice);
                res.render("schedule/edit", {schedule: foundSchedule, device: foundDevice, stylesheets: ["/static/css/sensors.css"]});
                res.status(200).end();
            })
        }
    });
});
// UPDATE
router.put("/:schedule_id/local_ip/:local_ip", (req, resp) => {
    console.log("in put route with ", req.params.schedule_id, ', ', req.params.local_ip, '\n');
    try{
        console.log("UPDATE ROUTE: ", req.body);
        var scheduleObj = buildSchedule(req.body);
    }catch(err){
        console.log(err);
        res.status(500).end();
    }finally{
        const scheduleStr = JSON.stringify(scheduleObj);
        const options = {
            hostname: req.params.local_ip,
            port: 5000,
            path: '/schedule/' + req.params.schedule_id,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
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
                resp.status(201).end();
            });
        });
        
        myReq.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
        
        // Write data to request body
        myReq.write(scheduleStr);
        myReq.end();
    }
});
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
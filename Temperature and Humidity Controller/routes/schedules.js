var express       = require("express"),
    http          = require('http'),
    Device        = require("../models/device"),
    Scheduler     = require("../models/scheduler");
    querystring   = require('querystring'),
    router        = express.Router();
function buildOptions(hostname, port, path, method, json){
    let options = {
        hostname: hostname,
        port: port,
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(json)
        }
    }
    return options;
}
function buildSchedule(mySchedule){
    var obj = {};
    obj.device = {};
    obj.schedule = {};
    var date = new Date();
    console.log(`buildSchedule: ${mySchedule}`);
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
    if(mySchedule['device']['desired_state'] !== null && mySchedule['device']['desired_state'] !== undefined){
        console.log("VALID On/Off\n");
        if(mySchedule['device']['desired_state'] === "on" || mySchedule['device']['desired_state'] === "off"){
            if(mySchedule['device']['desired_state'] === "on"){
                 obj['device']['desired_state'] = 1;
            }else{
                 obj['device']['desired_state'] = 0;
            }
        }
        
    }else{
        obj['device']['desired_state'] = 0;
        console.log("no desired state posted");
    }
    if(mySchedule['schedule']['start_time'] !== null && mySchedule['schedule']['start_time'] !== undefined){
        console.log("VALID TIME\n");
        let splitTimeArr = mySchedule['schedule']['start_time'].split(":");
        console.log(`splitTimeArr: ${splitTimeArr}`);
        console.log(splitTimeArr);
        obj['schedule']['start_time']['second'] = splitTimeArr[2];
        obj['schedule']['start_time']['minute'] = splitTimeArr[1];
        obj['schedule']['start_time']['hour']   = splitTimeArr[0];
        console.log(obj['schedule']);
    }
    // if(mySchedule['schedule']['end_time'] !== null && mySchedule['schedule']['end_time'] !== undefined){
    //     console.log("VALID TIME\n");
    //     let splitTimeArr = mySchedule['schedule']['end_time'].split(":");
    //     obj['schedule']['end_time']['second'] = splitTimeArr[2];
    //     obj['schedule']['end_time']['minute'] = splitTimeArr[1];
    //     obj['schedule']['end_time']['hour'] = splitTimeArr[0];
    // }
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
        if(myDate < new Date()) throw new Error("Schedule must occur in the future!");
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
    if(mySchedule['schedule']['prevScheduleId'] !== null && mySchedule['schedule']['prevScheduleId'] !== undefined){
        if(Number(mySchedule['schedule']['prevScheduleId']) !== 0){ // 'none' was selected, which has a value of 0
            console.log("VALID prevScheduleId");
            obj['schedule']['prevScheduleId'] = mySchedule['schedule']['prevScheduleId'];
        }
    }
    if(mySchedule['schedule']['nextScheduleId'] !== null && mySchedule['schedule']['nextScheduleId'] !== undefined){
        if(Number(mySchedule['schedule']['nextScheduleId']) !== 0){ // 'none' was selected, which has a value of 0
            console.log("VALID nextScheduleId");
            obj['schedule']['nextScheduleId'] = mySchedule['schedule']['nextScheduleId'];
        }
    }
    return obj;
}

// data = array of schedule configurations
// data = [{ device: {}, schedule: {}]},..n]
// key = 'device'
// nestedKey = 'local_ip'
var groupBy = function(data, key, nestedKey) { // `data` is an array of objects, `key` is the key (or property accessor) to group by
  // reduce runs this anonymous function on each element of `data` (the `item` parameter,
  // returning the `storage` parameter at the end
  console.log(typeof data);
  return data.reduce(function(storage, item) {
    // get the first instance of the key by which we're grouping
    var group = item[key][nestedKey];
    
    // set `storage` for this instance of group to the outer scope (if not empty) or initialize it
    // group in this case is our local ip address
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
                            return device['_id'].toString() == schedule['device']['id'].toString()
                        });
                        if(found !== undefined){
                            schedule['device']['local_ip'] = found['local_ip'];
                        }
                    });
                    console.log(schedules);
                    let schedulesByIp = groupBy(schedules, 'device', 'local_ip');
                    devices.sort((a, b) => (a['local_ip'].replace(/\./g,'') > b['local_ip'].replace(/\./g,'') ? 1: -1));
                    console.log(`SchedulesbyIp: ${schedulesByIp}`);
                    res.render("schedule/index", {schedules: schedulesByIp, devices: devices, errors: [], success: [], stylesheets: ["/static/css/table.css"]});
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
        console.log(`New Schedule Received ${req.body}`)
        var scheduleObj = buildSchedule(req.body);
    }catch(err){
        console.log(err);
        res.status(500).end();
    }finally{
        console.log(`finally.. ${scheduleObj}`);
        const scheduleStr = JSON.stringify(scheduleObj);
        console.log(scheduleStr);
        const options = buildOptions(req.body.device.local_ip, 5000, '/schedule', 'POST', scheduleStr);
        // {
        //     hostname: req.body.device.local_ip,
        //     port: 5000,
        //     path: '/schedule',
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Content-Length': Buffer.byteLength(scheduleStr)
        //     }
        // };
        const myReq = http.request(options, (resp) => {
            let myChunk = '';
            resp.setEncoding('utf8');
            resp.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
                myChunk += chunk;
            });
            resp.on('end', () => {
                console.log('No more data in response.');
                console.log(`STATUS: ${resp.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(resp.headers)}`);
                if(resp.statusCode !== 200){
                    Device.find({deviceType: "Relay Server"}, (err, devices) =>{
                        if(err) console.log(err);
                        else{
                            Scheduler.find({}, (err, schedules) => {
                                if(err) console.log(err);
                                else{
                                    // Loop through each schedule, find the device it is associated with and grab the devices local ip address
                                    schedules.forEach(function(schedule){
                                        let found = devices.find(function(device) { 
                                            return device['_id'].toString() == schedule['device']['id'].toString()
                                        });
                                        if(found !== undefined){
                                            schedule['device']['local_ip'] = found['local_ip'];
                                        }
                                    });
                                    console.log(schedules);
                                    let schedulesByIp = groupBy(schedules, 'device', 'local_ip');
                                    devices.sort((a, b) => (a['local_ip'].replace(/\./g,'') > b['local_ip'].replace(/\./g,'') ? 1: -1));
                                    console.log(`SchedulesbyIp: ${schedulesByIp}`);
                                    res.render("schedule/index", {schedules: schedulesByIp, devices: devices, errors: myChunk, success: [], stylesheets: ["/static/css/table.css"]});
                                    res.status(200).end();
                                }
                            });
                        }
                    });
                }else{
                    Device.find({deviceType: "Relay Server"}, (err, devices) =>{
                        if(err) console.log(err);
                        else{
                            Scheduler.find({}, (err, schedules) => {
                                if(err) console.log(err);
                                else{
                                    // Loop through each schedule, find the device it is associated with and grab the devices local ip address
                                    schedules.forEach(function(schedule){
                                        let found = devices.find(function(device) { 
                                            return device['_id'].toString() == schedule['device']['id'].toString()
                                        });
                                        if(found !== undefined){
                                            schedule['device']['local_ip'] = found['local_ip'];
                                        }
                                    });
                                    console.log(schedules);
                                    let schedulesByIp = groupBy(schedules, 'device', 'local_ip');
                                    devices.sort((a, b) => (a['local_ip'].replace(/\./g,'') > b['local_ip'].replace(/\./g,'') ? 1: -1));
                                    console.log(`SchedulesbyIp: ${schedulesByIp}`);
                                    res.render("schedule/index", {schedules: schedulesByIp, devices: devices, errors: [], success: [], stylesheets: ["/static/css/table.css"]});
                                    res.status(200).end();
                                }
                            });
                        }
                    });
                }
                
            });
        });
        
        myReq.on('error', (e) => {
            let errorMessage = e.message;
            console.error(`problem with request: ${errorMessage}`);
            Device.find({deviceType: "Relay Server"}, (err, devices) =>{
                if(err) console.log(err);
                else{
                    Scheduler.find({}, (err, schedules) => {
                        if(err) console.log(err);
                        else{
                            // Loop through each schedule, find the device it is associated with and grab the devices local ip address
                            schedules.forEach(function(schedule){
                                let found = devices.find(function(device) { 
                                    return device['_id'].toString() == schedule['device']['id'].toString()
                                });
                                if(found !== undefined){
                                    schedule['device']['local_ip'] = found['local_ip'];
                                }
                            });
                            console.log(schedules);
                            let schedulesByIp = groupBy(schedules, 'device', 'local_ip');
                            devices.sort((a, b) => (a['local_ip'].replace(/\./g,'') > b['local_ip'].replace(/\./g,'') ? 1: -1));
                            console.log(`SchedulesbyIp: ${schedulesByIp}`);
                            res.render("schedule/index", {schedules: schedulesByIp, devices: devices, errors: errorMessage, success: [], stylesheets: ["/static/css/table.css"]});
                            res.status(200).end();
                        }
                    });
                }
            });
        });
        myReq.write(scheduleStr);
        myReq.end();
    }
   
});
//EDIT
router.get("/:schedule_id/edit", (req, res) => {
    console.log(`in get EDIT route with ${req.params.schedule_id}`);
    Scheduler.findById(req.params.schedule_id, (err, foundSchedule) =>{
        if(err) console.log(err);
        else{
            Scheduler.find({"device.id": foundSchedule['device']['id']}, (err, foundSchedules) => {
               if(err) console.log(err);
               else{
                   console.log(`Schedule associated with: ${foundSchedule['device']['id']}`);
                   console.log(`Assocaited schedules: ${foundSchedules}`);
               }
               // We need to get the GPIO setup of the device
                Device.findById(foundSchedule['device']['id'], (err, foundDevice) => {
                    console.log(`FoundSchedule: ${foundSchedule}\nFoundDevice: ${foundDevice}`);
                    // We need to get a list of all schedules assocaited with the device we found
                    
                    res.render("schedule/edit", {
                        schedule: foundSchedule, 
                        device: foundDevice, 
                        deviceSchedules: foundSchedules,  
                        stylesheets: ["/static/css/table.css"]
                    });
                    res.status(200).end();
                });
            });
        }
    });
});
// UPDATE
router.put("/:schedule_id/local_ip/:local_ip", (req, res) => {
    console.log(`in put route with ${req.params.schedule_id}, ${req.params.local_ip}`);
    try{
        console.log(`UPDATE ROUTE: ${req.body}`);
        var scheduleObj = buildSchedule(req.body);
    }catch(err){
        console.log(err);
        res.status(500).end();
    }finally{
        const scheduleStr = JSON.stringify(scheduleObj);
        console.log(`scheduleStr ${scheduleStr}`);
        const options = buildOptions(req.params.local_ip, 5000, '/schedule/' + req.params.schedule_id, 'PUT', scheduleStr);
        console.log(`options: ${options}`);
        // {
        //     hostname: req.params.local_ip,
        //     port: 5000,
        //     path: '/schedule/' + req.params.schedule_id,
        //     method: 'PUT',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Content-Length': Buffer.byteLength(scheduleStr)
        //     }
        // };
        const myReq = http.request(options, (resp) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(resp.headers)}`);
            resp.setEncoding('utf8');
            resp.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
            });
            resp.on('end', () => {
                console.log('No more data in response.');
                console.log(resp.statusCode);
                // res.redirect("/schedule");
                // res.status(201).end();
                Device.find({deviceType: "Relay Server"}, (err, devices) =>{
                    if(err) console.log(err);
                    else{
                        Scheduler.find({}, (err, schedules) => {
                            if(err) console.log(err);
                            else{
                                // Loop through each schedule, find the device it is associated with and grab the devices local ip address
                                schedules.forEach(function(schedule){
                                    let found = devices.find(function(device) { 
                                        return device['_id'].toString() == schedule['device']['id'].toString()
                                    });
                                    if(found !== undefined){
                                        schedule['device']['local_ip'] = found['local_ip'];
                                    }
                                });
                                console.log(schedules);
                                let schedulesByIp = groupBy(schedules, 'device', 'local_ip');
                                devices.sort((a, b) => (a['local_ip'].replace(/\./g,'') > b['local_ip'].replace(/\./g,'') ? 1: -1));
                                console.log(`SchedulesbyIp: ${schedulesByIp}`);
                                res.render("schedule/index", {schedules: schedulesByIp, devices: devices, errors: [], success: "Schedule successfully updated", stylesheets: ["/static/css/table.css"]});
                                res.status(201).end();
                            }
                        });
                    }
                });
            });
        });
        
        myReq.on('error', (e) => {
            let errorMessage = e.message;
            console.error(`problem with request: ${errorMessage}`);
            Device.find({deviceType: "Relay Server"}, (err, devices) =>{
                if(err) console.log(err);
                else{
                    Scheduler.find({}, (err, schedules) => {
                        if(err) console.log(err);
                        else{
                            // Loop through each schedule, find the device it is associated with and grab the devices local ip address
                            schedules.forEach(function(schedule){
                                let found = devices.find(function(device) { 
                                    return device['_id'].toString() == schedule['device']['id'].toString()
                                });
                                if(found !== undefined){
                                    schedule['device']['local_ip'] = found['local_ip'];
                                }
                            });
                            console.log(schedules);
                            let schedulesByIp = groupBy(schedules, 'device', 'local_ip');
                            devices.sort((a, b) => (a['local_ip'].replace(/\./g,'') > b['local_ip'].replace(/\./g,'') ? 1: -1));
                            console.log(`SchedulesbyIp: ${schedulesByIp}`);
                            res.render("schedule/index", {schedules: schedulesByIp, devices: devices, errors: errorMessage, stylesheets: ["/static/css/table.css"]});
                            res.status(200).end();
                        }
                    });
                }
            });
        });
        
        // Write data to request body
        myReq.write(scheduleStr);
        myReq.end();
    }
});
router.delete("/:schedule_id/local_ip/:local_ip", (req, res) => {
    console.log(`in delete route with ${req.params.schedule_id}, ${req.params.local_ip}`);
    // buildOptions(req.params.local_ip, 5000, '/schedule/' + req.params.schedule_id, 'DELETE', scheduleStr, undefined);
    const options = 
    {
        hostname: req.params.local_ip,
        port: 5000,
        path: '/schedule/' + req.params.schedule_id,
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // 'Content-Length': Buffer.byteLength(newSchedule)
        }
    };
    const myReq = http.request(options, (resp) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(resp.headers)}`);
        resp.setEncoding('utf8');
        resp.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        resp.on('end', () => {
            console.log('No more data in response.');
            console.log(res.statusCode);
            res.redirect("/schedule");
            res.status(200).end();
        });
    });
    
    myReq.on('error', (e) => {
        let errorMessage = e.message;
        console.error(`problem with request: ${errorMessage}`);
        Device.find({deviceType: "Relay Server"}, (err, devices) =>{
            if(err) console.log(err);
            else{
                Scheduler.find({}, (err, schedules) => {
                    if(err) console.log(err);
                    else{
                        // Loop through each schedule, find the device it is associated with and grab the devices local ip address
                        schedules.forEach(function(schedule){
                            let found = devices.find(function(device) { 
                                return device['_id'].toString() == schedule['device']['id'].toString()
                            });
                            if(found !== undefined){
                                schedule['device']['local_ip'] = found['local_ip'];
                            }
                        });
                        console.log(schedules);
                        let schedulesByIp = groupBy(schedules, 'device', 'local_ip');
                        devices.sort((a, b) => (a['local_ip'].replace(/\./g,'') > b['local_ip'].replace(/\./g,'') ? 1: -1));
                        console.log(`SchedulesbyIp: ${schedulesByIp}`);
                        res.render("schedule/index", {schedules: schedulesByIp, devices: devices, errors: errorMessage, stylesheets: ["/static/css/table.css"]});
                        res.status(200).end();
                    }
                });
            }
        });
    });
    
    myReq.end();
});

module.exports = router;
var express       = require("express"),
    http          = require('http'),
    Device        = require("../models/device"),
    Scheduler     = require("../models/scheduler"),
    User          = require("../models/user"),
    RelaySettings = require("../models/relaySettings"),
    middleware    = require("../middleware"),
    querystring   = require('querystring'),
    async         = require("asyncawait/async"),
    await         = require("asyncawait/await"),
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
    if(mySchedule['device']['id'] !== null && mySchedule['device']['id'] !== undefined)
        obj['device']['id'] = mySchedule['device']['id'];

    if(mySchedule['device']['gpio'] !== null && mySchedule['device']['gpio'] !== undefined)
        obj['device']['gpio'] = mySchedule['device']['gpio'];
    
    if(mySchedule['device']['desired_state'] !== null && mySchedule['device']['desired_state'] !== undefined){
        console.log("VALID On/Off\n");
        if(mySchedule['device']['desired_state'] === "on" || mySchedule['device']['desired_state'] === "off"){
            if(mySchedule['device']['desired_state'] === "on")
                 obj['device']['desired_state'] = 1;
            else
                 obj['device']['desired_state'] = 0;
        }
        
    }else // no desired state posted, make it 0 'off' by default
        obj['device']['desired_state'] = 0;
    
    if(mySchedule['schedule']['start_time'] !== null && mySchedule['schedule']['start_time'] !== undefined){
        let splitTimeArr = mySchedule['schedule']['start_time'].split(":");
        obj['schedule']['start_time'] = {
            second: splitTimeArr[2],
            minute: splitTimeArr[1],
            hour: splitTimeArr[0]
        };
    }
    if(mySchedule['schedule']['end_time'] !== null && mySchedule['schedule']['end_time'] !== undefined){
        console.log("VALID TIME\n");
        let splitTimeArr = mySchedule['schedule']['end_time'].split(":");
        obj['schedule']['end_time'] = {
            second: splitTimeArr[2],
            minute: splitTimeArr[1],
            hour: splitTimeArr[0]
        };
    }
    if(mySchedule['schedule']['start_date'] !== null && mySchedule['schedule']['start_date'] !== undefined && mySchedule['schedule']['start_date'] !== '' && mySchedule.StartDateCheckBox === "on"){
        // the replace method changes '-' (iso format) to '/', etc. "2020-10-11" to "2020/10/11"
        // without this, JS would create date objects that were 1 day off
        let myDate   = new Date(mySchedule['schedule']['start_date'].replace(/-/g, '\/')), 
            day      = myDate.getDate(), // 1 - 31
            month    = myDate.getMonth(), // 0 - 11
            year     = myDate.getFullYear(), // returns a 4 digit year
            currYear = date.getFullYear();

        obj['schedule']['start_date'] = {};
        // date = 1 - 31
        if(day >= 1 && day <= 31)
            obj['schedule']['start_date']['date'] = day;
        else 
            throw new Error("Invalid date input.");
        console.log(`Day: ${obj['schedule']['start_date']['date']}`);
        // month = 0 - 11
        if(month >= 0 && month <= 11)
            obj['schedule']['start_date']['month'] = month;
        else 
            throw new Error("Invalid month input.");
        console.log(`Month: ${obj['schedule']['start_date']['month']}`);
        // year = current year or above
        if(year >= currYear)
            obj['schedule']['start_date']['year'] = year;
        else 
            throw new Error("Invalid year input.");
        console.log(`Year: ${obj['schedule']['start_date']['year']}`);
        console.log(`myDate: ${myDate}`);
        // if(myDate < new Date()) 
        //     throw new Error("Schedule must occur in the future!");
    }
    if(mySchedule['schedule']['end_date'] !== null && mySchedule['schedule']['end_date'] !== undefined && mySchedule['schedule']['end_date'] !== '' && mySchedule.EndDateCheckBox === "on"){
        // the replace method changes '-' (iso format) to '/', etc. "2020-10-11" to "2020/10/11"
        // without this, JS would create date objects that were 1 day off
        let myDate   = new Date(mySchedule['schedule']['end_date'].replace(/-/g, '\/')), 
            day      = myDate.getDate(), // 1 - 31
            month    = myDate.getMonth(), // 0 - 11
            year     = myDate.getFullYear(), // returns a 4 digit year
            currYear = date.getFullYear();
        obj['schedule']['end_date'] = {};
        // date = 1 - 31
        if(day >= 1 && day <= 31)
            obj['schedule']['end_date']['date'] = day;
        else 
            throw new Error("Invalid date input.");
        console.log(`Day: ${obj['schedule']['start_date']['date']}`);
        // month = 0 - 11
        if(month >= 0 && month <= 11)
            obj['schedule']['end_date']['month'] = month;
        else 
            throw new Error("Invalid month input.");
        console.log(`Month: ${obj['schedule']['end_date']['month']}`);
        // year = current year or above
        if(year >= currYear)
            obj['schedule']['end_date']['year'] = year;
        else 
            throw new Error("Invalid year input.");
        console.log(`Year: ${obj['schedule']['end_date']['year']}`);
        console.log(`myDate: ${myDate}`);
        // if(myDate < new Date()) 
        //     throw new Error("Schedule is past the end date!");
    }
    if(mySchedule['schedule']['dayOfWeek'] && mySchedule['DayOfWeekCheckBox'] === "on"){
        let dayOfWeek = Array.from(mySchedule['schedule']['dayOfWeek']).map(function(day){
            // dayOfWeek = 0 - 6
            if(!Number.isNaN(day) && Number(day) >= 0 && Number(day) <= 6){
                return parseInt(day);
            }throw new Error("Invalid day of week input.");
        });
        obj['schedule']['dayOfWeek'] = dayOfWeek;
    }
    if(mySchedule['schedule']['prevScheduleId'] !== null && mySchedule['schedule']['prevScheduleId'] !== undefined){
        if(Number(mySchedule['schedule']['prevScheduleId']) !== 0) // 'none' was selected, which has a value of 0
            obj['schedule']['prevScheduleId'] = mySchedule['schedule']['prevScheduleId'];
    }
    if(mySchedule['schedule']['nextScheduleId'] !== null && mySchedule['schedule']['nextScheduleId'] !== undefined){
        if(Number(mySchedule['schedule']['nextScheduleId']) !== 0)// 'none' was selected, which has a value of 0
            obj['schedule']['nextScheduleId'] = mySchedule['schedule']['nextScheduleId'];
    }
    if(mySchedule['schedule']['endScheduleId'] !== null && mySchedule['schedule']['endScheduleId'] !== undefined)
        if(Number(mySchedule['schedule']['endScheduleId']) !== 0)
            obj['schedule']['endScheduleId'] = mySchedule['schedule']['endScheduleId'];
    return obj;
}

// data = array of schedule configurations
// data = [{ device: {}, schedule: {}]},..n]
// key = 'device'
// nestedKey = 'local_ip'
var groupBy = function(data, key, nestedKey) { // `data` is an array of objects, `key` is the key (or property accessor) to group by
  // reduce runs this anonymous function on each element of `data` (the `item` parameter,
  // returning the `storage` parameter at the end
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
async function getRelayDevices() {
     let relayDevices = await Device.find({deviceType: "Relay Server"});
     //let consoleMsg =  "relay devices: " + relayDevices + "\n" + 
        // "typeof: " + typeof relayDevices +  "\n" +
        // "length: " + relayDevices.length;
     //console.log(consoleMsg);
     return relayDevices;

};
async function getSchedules(){
    let schedules = await Scheduler.find({});
    // let consoleMsg =  "schedules: " + schedules + "\n" + 
    //     "typeof: " + typeof schedules +  "\n" +
    //     "length: " + schedules.length;
    return schedules;
}
async function getRelaySettings(){
    let relaySettings = await RelaySettings.find({});
    return relaySettings;
}
async function getAdminCredentions(){
    let adminCredentials = await User.findOne({"username": "admin"});
    return adminCredentials;
}
function addLocalIPsToSchedules(schedules, relayDevices){
    schedules.forEach(function(schedule){
        let found = relayDevices.find(function(device) { 
            return device['_id'].toString() == schedule['device']['id'].toString()
        });
        if(found !== undefined){
            schedule['device']['local_ip'] = found['local_ip'];
        }
    });
}
// schedules.sort(addLocalIPsToSchedules(relayDevices);
// NOT COMPLETE
router.get("/", middleware.isLoggedIn, async (req, res) =>{
    let page_name = "schedules",
        relayDevices,
        schedules,
        relaySettings;
    
    try{
        relayDevices    = await getRelayDevices();
        schedules       = await getSchedules();
        relaySettings   = await getRelaySettings();

        if(!relayDevices){
            throw new Error("relay devices not valid!");
        }
        if(!schedules){
            throw new Error(("schedules not valid!"));
        }
        console.log(`RelaySettings: ${JSON.stringify(relaySettings)}`);
        addLocalIPsToSchedules(schedules, relayDevices);
        let schedulesByIp = groupBy(schedules, 'device', 'local_ip');
        // remove our periods between each octet to get an integer value and then sort
        relayDevices.sort(
            (a, b) => 
            (a['local_ip'].replace(/\./g,'') > b['local_ip'].replace(/\./g,'') ? 1: -1)
        );

        res.render("schedule/index", {
            page_name: page_name,
            schedules: schedulesByIp, 
            devices: relayDevices, 
            relaySettings: relaySettings,
            stylesheets: ["/static/css/table.css"]
        });
        res.status(200).end();
        
    }catch(exc){
        console.log("exc: " + exc.toString());
        res.render("schedule/index", {
            schedules: [], 
            devices: [], 
            stylesheets: ["/static/css/table.css"]
        });
        req.flash("error", exc.toString());
        res.status(400).end();
    }
});
router.get("/:relay_id", (req, res) => {
   // return all the schedules for that relay
    // Shows all active schedules
});
router.post("/", middleware.isLoggedIn, async (req, res) => {
    let adminCredentials;
    try{
        console.log(`Body: ${JSON.stringify(req.body)}`);
        var scheduleObj = buildSchedule(req.body);
        
        adminCredentials = await getAdminCredentions();

        if(!adminCredentials || adminCredentials === 0){
            throw new Error("admin credentials not valid!")
        }
        scheduleObj['admin_id'] = adminCredentials['_id'];
        
        const scheduleStr = JSON.stringify(scheduleObj);
        const options = buildOptions(req.body.device.local_ip, 5000, '/schedule', 'POST', scheduleStr);
        
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
                    req.flash("error", myChunk);
                    res.redirect("/schedule");
                    res.status(resp.statusCode).end();
                    
                }else{
                    req.flash("success", "Schedule was successfully added");
                    res.redirect("/schedule");
                    res.status(resp.statusCode).end();
                }
            });
        });
        
        myReq.on('error', (e) => {
            let errorMessage = e.message;
            console.error(`problem with request: ${errorMessage}`);
            req.flash("error", errorMessage);
            res.redirect("/schedule");
            res.status(400).end();
        });
        myReq.write(scheduleStr);
        myReq.end();
        
    }catch(err){
        console.log(err);
        req.flash("error", err);
        res.redirect("/schedule");
        res.status(500).end();
    }
});
//EDIT
router.get("/:schedule_id/edit", middleware.isLoggedIn, (req, res) => {
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
router.put("/:schedule_id/local_ip/:local_ip", middleware.isLoggedIn, async (req, res) => {
    console.log(`in put route with ${req.params.schedule_id}, ${req.params.local_ip}`);
    let adminCredentials;
    try{
        console.log(`UPDATE ROUTE: ${req.body}`);
        var scheduleObj   = buildSchedule(req.body);
        

        
        adminCredentials  = await getAdminCredentions();

        if(!adminCredentials || adminCredentials === 0){
            throw new Error("admin credentials not valid!")
        }
        scheduleObj['admin_id'] = adminCredentials['_id'];
        console.log("Admin credentials: " + adminCredentials);
        console.log("Admin mongo id: " + adminCredentials['_id']);
        
        const scheduleStr = JSON.stringify(scheduleObj);
        const options     = buildOptions(req.params.local_ip, 5000, '/schedule/' + req.params.schedule_id, 'PUT', scheduleStr);
        // console.log(`scheduleStr ${scheduleStr}`);
        // console.log(`options: ${options}`);
        
        const myReq = http.request(options, (resp) => {
            let myChunk = '';
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(resp.headers)}`);
            resp.setEncoding('utf8');
            resp.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
                myChunk += chunk;
            });
            resp.on('end', () => {
                console.log('No more data in response.' + resp.statusCode);
                console.log(resp.statusCode);

                if(resp.statusCode !== 200){
                    req.flash("error", myChunk);
                    res.redirect("/schedule");
                    res.status(resp.statusCode).end();
                    
                }else{
                    req.flash("success", "Schedule was successfully updated");
                    res.redirect("/schedule");
                    res.status(resp.statusCode).end();
                }
            });
        });
        
        myReq.on('error', (e) => {
            let errorMessage = e.message;
            console.error(`problem with request: ${errorMessage}`);
            req.flash("error", errorMessage);
            res.redirect("/schedule");
            res.status(400).end();
        });
        
        // Write data to request body
        myReq.write(scheduleStr);
        myReq.end();
        
        
    }catch(exc){
        console.log("Catch: " + exc);
        req.flash("error", exc.toString());
        res.redirect("/schedule");
        res.status(400).end();
    }
});
router.delete("/:schedule_id/local_ip/:local_ip", middleware.isLoggedIn, async (req, res) => {
    console.log(`in delete route with ${req.params.schedule_id}, ${req.params.local_ip}`);
    let adminCredentials;
    try{


        adminCredentials  = await getAdminCredentions();
        let credentialsJSON = JSON.stringify({ admin_id: adminCredentials['_id']});
        const options = buildOptions(req.params.local_ip, 5000, '/schedule/' + req.params.schedule_id, 'DELETE', credentialsJSON);
        if(!adminCredentials || adminCredentials === 0){
            throw new Error("admin credentials not valid!")
        }
        
        console.log("Admin credentials: " + adminCredentials);
        console.log("Admin mongo id: " + adminCredentials['_id']);

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
                req.flash("success", "Schedule was successfully deleted!");
                res.redirect("/schedule");
                res.status(200).end();
            });
        });
        
        myReq.on('error', (e) => {
            let errorMessage = e.message;
            console.error(`problem with request: ${errorMessage}`);
            req.flash("error", errorMessage);
            res.redirect("/schedule");
            res.status(400).end();
        });
        myReq.write(credentialsJSON);
        myReq.end();
    }catch(exc){
        console.log("exc: " + exc.toString());
        res.render("schedule/index", {
            schedules: [], 
            devices: [], 
            errors: exc.toString(), 
            success: [],
            stylesheets: ["/static/css/table.css"]
        });
        req.flash("error", exc.toString());
        res.redirect("/schedule");
        res.status(400).end();
    }
});

module.exports = router;
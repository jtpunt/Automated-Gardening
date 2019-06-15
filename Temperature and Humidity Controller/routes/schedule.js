var express    = require("express"),
    http       = require('http'),
    querystring= require('querystring'),
    router     = express.Router();

// Shows all active schedules
router.get("/", (req, res) =>{
    http.get("http://192.168.1.12:5000/schedule", (resp) => {
        // console.log(resp)
        let str = '';
        resp.on('data', function(chunk) {
            var data = JSON.parse(chunk);
            console.log(data);
            res.render("schedule", {schedules: data, stylesheets: ["/static/css/sensors.css"]});
            // res.status(200).end();
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);

    });
});
router.post("/", (req, res) => {
    console.log(req.body);
    console.log(req.body.time.split(":")[0]);
    const newSchedule = querystring.stringify({ 
        local_ip: req.body.local_ip, 
        gpio: req.body.pin,
        second: req.body.second,
        minute: req.body.time.split(":")[1],
        hour: req.body.time.split(":")[0],
        date: req.body.date,
        month: req.body.month,
        year: req.body.year,
        dayOfWeek: req.body.dayOfWeek
    });
    const options = {
        hostname: '192.168.1.12',
        port: 5000,
        path: '/schedule',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(newSchedule)
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
    myReq.write(newSchedule);
    myReq.end();
    res.status(200).end();
});
//EDIT
router.get("/:schedule_id/edit", (req, res) => {

});
// UPDATE
router.put("/:schedule_id", (req, res) => {

})
router.delete("/:schedule_id/local_ip/:local_ip", (req, res) => {
    console.log("in delete route with ", req.params.schedule_id, ', ', req.params.local_ip, '\n');
    res.status(200).end();

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
    
    // Write data to request body
    // myReq.write(newSchedule);
    myReq.end();
});

module.exports = router;
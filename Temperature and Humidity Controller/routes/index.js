var express = require("express"),
    async = require("asyncawait/async"),
    await = require("asyncawait/await"),
    Sensor = require("../models/sensor"),
    Device = require("../models/device"),
    http = require('http'),
    router = express.Router();


// root route
router.get("/", (req, res) => {
    Device.find({deviceType: "DHT11 Sensor"},  (err, devices)=>{
        if(err) console.log(err);
        else{
            console.log(devices);
            var data = [];
            devices.forEach(function(device, i, arr){
                console.log(device);
                 http.get("http://" +device['local_ip'] + ":" + device['port'] + "/", (resp) => {
                    // console.log(resp)
                    resp.on('data', function(chunk) {
                        var myData = JSON.parse(chunk);
                        myData.forEach(function(reading){
                          reading['_id'] = device['_id'];
                          data.push(reading); 
                        });
                        console.log("data arr: ", data);
                        if(i == arr.length - 1){
                            console.log("data arr: ", data);
                            res.render("index", { sensors: data, scripts: ["/static/js/drawGauges.js"], stylesheets: ["/static/css/spinner.css"] });
                        }
                    });
                }).on("error", (err) => {
                    console.log("Error: " + err.message);
            
                });
            })
            console.log(data);
        }
    });
    // http.get("http://192.168.1.128:8080/readings", (resp) => {
    //     // console.log(resp)
    //     let str = '';
    //     resp.on('data', function(chunk) {
    //         var data = JSON.parse(chunk);
    //         console.log(data);
    //         res.render("index", { sensors: data, scripts: ["/static/js/drawGauges.js"], stylesheets: ["/static/css/spinner.css"] });
    //     });
    // }).on("error", (err) => {
    //     console.log("Error: " + err.message);

    // });
});
module.exports = router;

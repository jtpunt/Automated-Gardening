var express = require("express"),
    async = require("asyncawait/async"),
    await = require("asyncawait/await"),
    Sensor = require("../models/sensor"),
    http = require('http'),
    router = express.Router();


// root route
router.get("/", (req, res) => {
    http.get("http://192.168.1.128:8080/readings", (resp) => {
        console.log(resp)
        let str = '';
        resp.on('data', function(chunk) {
            var data = JSON.parse(chunk);
            res.render("index", { sensors: data, scripts: ["/static/js/drawGauges.js"], stylesheets: ["/static/css/spinner.css"] });
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);

    });
});
module.exports = router;

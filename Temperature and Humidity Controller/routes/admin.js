var express = require("express"),
    Sensor = require("../models/sensor"),
    Device = require("../models/device"),
    router = express.Router();
    
router.get("/", (req, res) => {
    res.render("admin/dashboard");
    res.status(200).end();
});

module.exports = router;
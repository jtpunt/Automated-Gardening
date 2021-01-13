var express = require("express"),
    Sensor = require("../models/sensor"),
    Device = require("../models/device"),
    middleware = require("../middleware"),
    router = express.Router();
    
router.get("/", middleware.isLoggedIn, (req, res) => {
	let page_name = "home";
    res.render("admin/dashboard", { page_name: page_name});
    res.status(200).end();
});

module.exports = router;
var express = require("express"),
    Sensor = require("../models/sensor"),
    Device = require("../models/device"),
    middleware = require("../middleware"),
    router = express.Router();
    
router.get("/", middleware.isLoggedIn, (req, res) => {
	let page_name = "camera";
    res.render("camera/index", { page_name: page_name});
    res.status(200).end();
});
router.get("/image", middleware.isLoggedIn, (req, res) => {
	let page_name = "image";
    res.render("camera/image", { page_name: page_name});
    res.status(200).end();
});
router.get("/video", middleware.isLoggedIn, (req, res) => {
	let page_name = "video";
    res.render("camera/video", { page_name: page_name});
    res.status(200).end();
});
module.exports = router;
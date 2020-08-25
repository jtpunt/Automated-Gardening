var express = require("express"),
    Sensor = require("../models/sensor"),
    Device = require("../models/device"),
    middleware = require("../middleware"),
    router = express.Router();
    
router.get("/", middleware.isLoggedIn, (req, res) => {
    // res.render("admin/dashboard", { 
    // 	stylesheets: ["/static/css/sidebar.css"] 
    // });
    res.redirect("/");
    res.status(200).end();
});

module.exports = router;
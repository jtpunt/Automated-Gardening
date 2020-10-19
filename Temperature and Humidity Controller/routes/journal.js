var express    = require("express"),
    middleware = require("../middleware"),
    Device     = require("../models/device"),
    Camera     = require("../models/cameraSettings"),
    WaterSettings = require("../models/waterSettings"),
    RelaySettings = require("../models/relaySettings"),
    router     = express.Router();

    // Shows all devices
router.get("/", middleware.isLoggedIn, (req, res) =>{
    let page_name = "journal";

    res.render("journal/index", {
        page_name: page_name,
        stylesheets: ["/static/css/table.css"]
    });
    res.status(200).end();

});
router.get("/:journal_id", (req, res) => {

});
router.post("/", (req, res) => {

});

module.exports = router;
var express    = require("express"),
    middleware = require("../middleware"),
    Device     = require("../models/device"),
    Camera     = require("../models/cameraSettings"),
    Room       = require("../models/room"),
    WaterSettings = require("../models/waterSettings"),
    RelaySettings = require("../models/relaySettings"),
    router     = express.Router();

    // Shows all devices
router.get("/", middleware.isLoggedIn, (req, res) =>{
    let page_name = "room";

    res.render("room/index", {
        page_name: page_name,
        stylesheets: ["/static/css/table.css"]
    });
    res.status(200).end();

});
router.get("/:room_id", (req, res) => {

});
router.post("/", (req, res) => {
    console.log(`in POST -> /room with body: ${JSON.stringify(req.body)}`);
    res.status(200).end();
});

module.exports = router;
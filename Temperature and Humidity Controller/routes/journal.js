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
    let page_name = "journal";

    Room.find( (err, rooms) => {
        if(err) console.log(err.toString());
        else{
            res.render("journal/index", {
                page_name: page_name,
                rooms: rooms,
                stylesheets: ["/static/css/table.css"]
            });
            res.status(200).end();
        }
    });
});
router.get("/:journal_id", (req, res) => {

});
router.post("/", (req, res) => {

});

module.exports = router;
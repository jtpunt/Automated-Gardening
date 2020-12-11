var express    = require("express"),
    middleware = require("../middleware"),
    Device     = require("../models/device"),
    Camera     = require("../models/cameraSettings"),
    Room       = require("../models/room"),
    WaterSettings = require("../models/waterSettings"),
    RelaySettings = require("../models/relaySettings"),
    router     = express.Router();
// Gallons Per Hour Per Line
function calcGPHPerLine(waterDetails){
    let waterFlowRate = waterDetails['waterFlowRate'] || undefined,
        numOfWaterLines = waterDetails['numOfWaterLines'] || undefined;

    if(waterFlowRate === undefined && numOfWaterLines === undefined){
        return -1;
    }
    return waterFlowRate / numOfWaterLines;
}
// Gallons Per Minute Per Line
function calcGPMPerLine(waterDetails){
    let GPMPerLine = calcGPHPerLine(waterDetails);
    if(GPMPerLine === -1) return GPMPerLine;
    return GPMPerLine / 60;
}
function convertGallonsToCups(gallons){
    return gallons * 16;
}
router.get("/", middleware.isLoggedIn, (req, res) =>{
    let page_name = "journal";
    console.log("In Journal");
    // will need to retrieve all journals to see which rooms are already in use
    Room.find( (err, rooms) => {
        if(err) console.log(err.toString());
        else{

            rooms.forEach(function(room){
                console.log(`Room: ${JSON.stringify(room)}`);
                if(room['roomWaterDetails'] && room['roomWaterDetails'].length){
                    room['roomWaterDetails'].forEach(function(waterDetails){
                        console.log(waterDetails);
                        let GPMPerLine = calcGPMPerLine(waterDetails),
                            CPMPerLine = convertGallonsToCups(GPMPerLine),
                            cupsNeeded = 1.50,
                            timeNeeded = (cupsNeeded / CPMPerLine) * 60;
                        console.log("GPM Per Line " + GPMPerLine);
                        console.log(`Cups Per Minute Per Line - ${CPMPerLine}` );
                        console.log(`Water Needed - ${cupsNeeded} cups - runs for  + ${ timeNeeded } seconds`);
                    });
                }
            })
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
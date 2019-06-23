var express    = require("express"),
    Device         = require("../models/device"),
    router     = express.Router();

// Shows all devices
router.get("/", (req, res) =>{
    Device.find( (err, devices)=>{
        if(err) console.log(err);
        else{
            console.log(devices);
            res.status(200).end();
        }
    })
});
router.get("/:device_id", (req, res) => {

});
router.post("/", (req, res) => {

});
//EDIT
router.get("/:device_id/edit", (req, res) => {

});
// UPDATE
router.put("/:device_id", (req, res) => {

})
router.delete("/:device_id", (req, res) => {

});

module.exports = router;
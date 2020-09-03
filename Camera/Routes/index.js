var express = require("express"),
    raspividStream = require('raspivid-stream'),
    stream = raspividStream(),
    router = express.Router();

router.get("/", (req, res) => {
    videoStream.on('data', (data) => {
        console.log(data);
        res.send(data, { binary: true }, (error) => { if (error) console.error(error); });
    });
});
module.exports = router;

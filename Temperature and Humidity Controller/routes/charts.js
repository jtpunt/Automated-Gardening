var express    = require("express"),
    Chart     = require("../models/chart"),
    router     = express.Router();

router.get("/", function(req, res){
    Chart.find({}, {"_id" : false}, (err, chart) => { //remove _id from query result
        if(err) console.log(err);
        else{
          chart.sort((a,b) => {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return new Date(b.date) - new Date(a.date);
          });
         // console.log("Data before render: " + chart);
          res.render("charts", {charts: chart, scripts: ["/static/js/drawCharts.js"], stylesheets: ["/static/css/spinner.css"]});
        }
    });
});
router.get("/data", function(req, res){
   // let mySort = {"date": -1, "_id" : false};
    let mySort = {"date": -1};
    Chart.find().sort(mySort).exec(function(err, chart){ //remove _id from query result
        if(err) console.log(err);
        else{
          res.write(JSON.stringify(chart));
          res.status("200").end();
        }
    });
    // var first = true;
    // var stream = Chart.find().sort({"date": -1, "_id" : false}).stream()
    // stream.on('error', function (err) {
    //   console.error(err)
    // })
    // stream.on('data', function (reading) {
    //   console.log(reading)
    //   if(first){
    //     first = false;
    //     res.write(JSON.stringify(reading));
    //   }else{
    //       res.write(", " + JSON.stringify(reading));
    //   }
    // })
    // stream.on('end', function(){
    //   console.log("Stream ended successfully\n");
    //   res.status(400).end();
    // });
});

module.exports = router;

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
          res.render("charts", {charts: chart, scripts: ["/static/js/drawCharts.js"], stylesheets: ["/static/css/charts.css"]});
        }
    });
});
module.exports = router;

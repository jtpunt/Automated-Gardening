var schedule = require('node-schedule');

var date = new Date(2020, 7, 6, 18, 44, 0);

var j = schedule.scheduleJob(date, function(y){
  console.log(y);
  var x = schedule.scheduleJob('*/1 * * * *', function(){
    
        
      console.log(`This should execute every minute starting at: `, date);
    });
    console.log(`x: ${x.nextInvocation()}`);

});
console.log(`j: ${j.nextInvocation()}`);


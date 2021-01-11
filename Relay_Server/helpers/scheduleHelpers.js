const MIN_SECOND = 0,
      MIN_MINUTE = 0,
      MIN_HOUR   = 0,
      MIN_DATE   = 1,
      MIN_MONTH  = 0,
      MIN_YEAR   = new Date().getFullYear(),
      MIN_DOW    = 0, // dayOfWeek
      
      MAX_SECOND = 59,
      MAX_MINUTE = 59,
      MAX_HOUR   = 23,
      MAX_DATE   = 31,
      MAX_MONTH  = 11,
      MAX_DOW    = 6;

let scheduleHelpers = {
    buildSchedule: function(schedule_config){
        var scheduleObj = {};
        if(schedule_config['schedule']){
            // if we use short circuit evaluation on schedule['second'] to assign a value, and if schedule['second'] is 0, then this value will be ignored
            // and the right operand will be returned. This is not the behavior we want as second, minute, hour and month values can be 0
            let sanitize_input = (input) => {return (Number(input) === 0) ? Number(input) : Number(input) || undefined};
            
            const schedule  = schedule_config['schedule'] || undefined,
                  second    = sanitize_input(schedule['second']),
                  minute    = sanitize_input(schedule['minute']),
                  hour      = sanitize_input(schedule['hour']),
                  date      = Number(schedule['date'])  || undefined,
                  month     = sanitize_input(schedule['month']),
                  year      = Number(schedule['year']) || undefined,
                  dayOfWeek = (schedule['dayOfWeek']) ? Array.from(schedule['dayOfWeek']) : undefined,
                  today     = new Date();

            // Validate second input
            if(second !== undefined && !second.isNaN && Number.isInteger(second)){
                if(second >= MIN_SECOND && second <= MAX_SECOND)
                    scheduleObj['second'] = second;
                else 
                    throw new Error(`second input must be >= ${MIN_SECOND} or <= ${MAX_SECOND}`);
            }else 
                throw new Error("Invalid second input!");
            // Validate minute input
            if(minute !== undefined && !minute.isNaN && Number.isInteger(minute)){
                if(minute >= MIN_MINUTE && minute <= MAX_MINUTE)
                    scheduleObj['minute'] = minute;
                else 
                    throw new Error(`Minute input must be >= ${MIN_MINUTE} or <= ${MAX_MINUTE}`);
            }else 
                throw new Error("Invalid minute input!");
            // Validate hour input
            if(hour !== undefined && !hour.isNaN && Number.isInteger(hour)){
                if(hour >= MIN_HOUR && hour <= MAX_HOUR)
                    scheduleObj['hour'] = hour;
                else 
                    throw new Error(`Minute input must be >= ${MIN_HOUR} or <= ${MAX_HOUR}`)
            }else 
                throw new Error("Invalid hour input!");
                
            // Validate Inputs for Day of Week Based Scheduling
            if(dayOfWeek !== undefined && dayOfWeek.length){
                let dayOfWeekArr = dayOfWeek.map(function(day){
                    // dayOfWeek = 0 - 6
                    if(!Number.isNaN(day) && Number(day) >= MIN_DOW && Number(day) <= MAX_DOW)
                        return parseInt(day);
                    else throw new Error("Invalid day of week input.");
                });
                scheduleObj['dayOfWeek'] = dayOfWeekArr; 
            }
            // valid date based scheduling details
            else if(date !== undefined && month !== undefined && year !== undefined){
                if(date >= MIN_DATE && date <= MAX_DATE)
                    scheduleObj['date'] = date;
                else 
                    throw new Error(`Date input must be >= ${MIN_DATE} or <= ${MAX_DATE}`);
                if(month >= MIN_MONTH && month <= MAX_MONTH)
                    scheduleObj['month'] = month;
                else 
                    throw new Error(`Month input must be >= ${MIN_MONTH} or <= ${MAX_MONTH}`);
                if(year >= MIN_YEAR){
                    scheduleObj['year'] = year;
                    //let scheduleTestDate = new Date(year, month, date, hour, minute, second, 0);
                    let scheduleTestDate = new Date(Date.UTC(year, month, date, hour, minute, second));  
                    console.log(`hour: ${hour}`);
                    console.log(`minute: ${minute}`);
                    console.log(`second: ${second}`);
                    console.log("Date Obj: ", scheduleTestDate.toISOString());
                    console.log(`time hour: ${scheduleTestDate.getHours()}`);
                    // if(scheduleTestObj < today) 
                    //     throw new Error("Schedule must occur in the future!");
                    // if the schedule is past the start date, start it anyway. otherwise, an invalid cronjob will be created
                    if(scheduleTestDate < today){
                        console.log(`scheduleTestDate < today`);
                        delete scheduleObj['date'];
                        delete scheduleObj['month'];
                        delete scheduleObj['year'];
                    }else{
                        console.log(`scheduleTestDate > today`);
                    }
                    console.log(`scheduleObj: ${JSON.stringify(scheduleObj)}`);
                }else 
                    throw new Error(`Year input must be >= ${MIN_MONTH}  or <= ${MAX_MONTH}`);
            }
        }else 
            throw new Error("Schedule details not found!");
        return scheduleObj;
    },
    buildJob: function(myScheduleObj, fn, context, ...args){
        let job = schedule.scheduleJob(myScheduleObj, function(){ fn.call(context, ...args); });
        console.log(`next invocation: ${job.nextInvocation()}`);
        return job;
    }
}
module.exports = scheduleHelpers;
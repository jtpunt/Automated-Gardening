var http               = require('http'),
    User               = require("./models/user"),
	async              = require("asyncawait/async"),
	await              = require("asyncawait/await"),
	env                = process.env.NODE_ENV || 'development',
	config             = require('./config')[env],
	mongoose           = require("mongoose"),
    connStr            = config.getConnStr();

var targetIp = "192.168.254.201",
	port     = "5000",
	scheduleId = "5f72802198466e03be898256";

let options = {
    server : {
        useNewUrlParser: true,
        reconnectTries : 300,
        reconnectInterval: 60000,
        autoReconnect : true
    }
}

var obj = {
	
	test2: function(adminCredentials, targetIp, port, scheduleId){
        let self             = this,
            waterDetected    = true;

        if(waterDetected === true){
            self.cancelRelay(adminCredentials, targetIp, port, scheduleId);
        }

    },
    detectWater: function(){
        return true;
    },
    cancelRelay: function(adminCredentials, targetIp, port, scheduleId){
        // http code
        let payload = { };
        if(!adminCredentials || adminCredentials === 0){
            throw new Error("admin credentials not valid!")
        }
        payload['admin_id'] = adminCredentials['_id'];
        
        const payloadStr = JSON.stringify(payload);
        const options = buildOptions(targetIp, port, "/schedule/" + scheduleId + "/cancel", 'POST', payloadStr);
        
        const myReq = http.request(options, (resp) => {
            let myChunk = '';
            resp.setEncoding('utf8');
            resp.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
                myChunk += chunk;
            });
            resp.on('end', () => {
                console.log('No more data in response.');
                console.log(`STATUS: ${resp.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(resp.headers)}`);
                if(resp.statusCode !== 200){
                    // error
                    console.log("Error on cancel");
                    
                }else{
                    // success 
                    console.log("Cancel request was successful");
                }
            });
        });
        
        myReq.on('error', (e) => {
            let errorMessage = e.message;
            console.error(`problem with request: ${errorMessage}`);
        });
        myReq.write(scheduleStr);
        myReq.end();
    }
}







mongoose.connect(connStr, options, function(err){
    if(err){
        console.log("Error connecting to mongodb", err);
        // default schedule here
        setTimeout(function() {
            console.log('Connection failed. Retrying in 30 seconds.');
        }, 30000);
    }else{
    	let adminCredentialsPromise = async () => { return await User.findOne({"username": "admin"}); }
                   
		adminCredentialsPromise().then(function(result){
		    console.log(`result: ${result}`);
		    return result;
		}, function(err){
		    console.log(`err: ${err}`);
		}).then(function(admin_credentials){
			obj.test2(admin_credentials, targetIp, port, scheduleId);
			console.log("Done");
		});

    }
});



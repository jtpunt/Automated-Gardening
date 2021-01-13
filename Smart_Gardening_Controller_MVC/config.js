var config = {
    development: {
        //mongodb connection settings
        database: {
            host:   'dht-sensors.ehnet.mongodb.net',
            port:   '19191',
            db:     'dht-sensors',
            username: 'jtpunt',
            password: '1ch33s31',
            queryString: 'retryWrites=true&w=majority'
        },
        getConnStr: function(){

            return 'mongodb+srv://' + this.database.username + ':' + this.database.password + '@' +  this.database.host + '/' + this.database.db + '?' + this.database.queryString;
        },
        //server details
        server: {
            port: '5000'
        }
    },
    production: {
        database: {
            host:   'dht-sensors.ehnet.mongodb.net',
            port:   '19191',
            db:     'dht-sensors',
            username: 'jtpunt',
            password: '1ch33s31',
            queryString: 'retryWrites=true&w=majority'
        },
        getConnStr: function(){
                        return 'mongodb+srv://' + this.database.username + ':' + this.database.password + '@' +  this.database.host + '/' + this.database.db + '?' + this.database.queryString;
        },
        //server details
        server: {
            port: '5000'
        }
    }
};



module.exports = config

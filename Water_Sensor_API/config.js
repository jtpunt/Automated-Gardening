var config = {
    development: {
        //mongodb connection settings
        database: {
            host:   'ds219191.mlab.com',
            port:   '19191',
            db:     'dht-sensors',
            username: 'jtpunt',
            password: '1ch33s31'
        },
        getConnStr: function(){
            return 'mongodb://' + this.database.username + ':' + this.database.password + '@' +  this.database.host + ':' + this.database.port + '/' + this.database.db;
        },
        //server details
        server: {
            port: '5000'
        }
    },
    production: {
        database: {
                host:   'ds219191.mlab.com',
                port:   '19191',
                db:     'dht-sensors',
                username: 'jtpunt',
                password: '1ch33s31'
        },
        getConnStr: function(){
            return 'mongodb://' + this.production.username + ':' + this.production.password + '@' +  this.production.host + ':' + this.production.port + '/' + this.production.db;
        },
        //server details
        server: {
            port: '5000'
        }
    }
};



module.exports = config
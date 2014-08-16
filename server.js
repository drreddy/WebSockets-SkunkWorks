var PORT = 80;

var express = require('express');
var server;
var io;
var app;
var dict = require('./dictionary');

//var mongoose = require('mongoose');

// var Schema = mongoose.Schema;

// var sentimentSchema = new Schema({
//   positive: [{ word: String, value: Number }],
//   negative: [{ word: String, value: Number }]
// });

// sentimentSchema.index({ name: 1, type: -1 }); // schema level

// var setimentDict = mongoose.model('setimentDict', sentimentSchema);

// var db = mongoose.connection;
    
// db.on('error', function callback () {
//     console.log('connection error');
// });

// db.once('open', function callback () {
//     console.log('connected');
// });


var twitter = require('twit')

var T = new twitter({
    consumer_key: 'key',
    consumer_secret: 'secret',
    access_token: 'accessToken',
    access_token_secret: 'token secret'
});

// Setup a very simple express application.
app = express();

app.use(express.static(__dirname + '/public/skunkworks'));

app.use('/hangout',express.static(__dirname + '/public/hangout'));

app.use('/happy',express.static(__dirname + '/public/happyness-check'));

server = require('http').createServer(app);
server.listen(PORT);

// socket.io augments our existing HTTP server instance.
io = require('socket.io').listen(server);
 

io.sockets.on('connection', function (socket) {
    
    socket.on('hangout',function(){
      socket.emit('mssg', 'test message sending through sockets after client connection');  
    })
    
    socket.on("send date", function() {
        id = setInterval(function() {
            socket.emit('date', JSON.stringify(new Date()));
        }, 1000);
    });

    socket.on("send data", function() {
        
        var stream = T.stream('statuses/filter', {'locations':'-180,-90,180,90', 'language':'en'})
        
        stream.on('tweet', function(data) {
          /*console.log(tweet.coordinates);*/
          if (data.coordinates){
            if (data.coordinates !== null){
              //If so then build up some nice json and send out to web sockets
              var outputPoint = {"tweet":data.text,"toc":data.created_at,"pic":data.user.profile_image_url,"user":data.user.screen_name,"lat": data.coordinates.coordinates[0],"lng": data.coordinates.coordinates[1]};
              
              socket.broadcast.emit("data-stream", outputPoint);

              //Send out to web sockets channel.
              socket.emit('data-stream', outputPoint);
            }
            else if(data.place){
              if(data.place.bounding_box === 'Polygon'){
                // Calculate the center of the bounding box for the tweet
                var coord, _i, _len;
                var centerLat = 0;
                var centerLng = 0;

                for (_i = 0, _len = coords.length; _i < _len; _i++) {
                  coord = coords[_i];
                  centerLat += coord[0];
                  centerLng += coord[1];
                }
                centerLat = centerLat / coords.length;
                centerLng = centerLng / coords.length;

                // Build json object and broadcast it
                var outputPoint = {"tweet":data.text,"toc":data.created_at,"pic":data.user.profile_image_url,"user":data.user.screen_name,"lat": centerLat,"lng": centerLng};
                
                socket.broadcast.emit("data-stream", outputPoint);

              }
            }
          } 
        });

        setTimeout(function(){
          stream.stop();
          socket.emit('done');
        }, 10000);  
    });
    
    socket.on("send mood data", function() {
        
        var stream = T.stream('statuses/filter', {'locations':'-180,-90,180,90', 'language':'en'})
        
        stream.on('tweet', function(data) {
          /*console.log(tweet.coordinates);*/
          if (data.coordinates){
            if (data.coordinates !== null){

              tweetStrArray = data.text.split(' ');
              sent_val = 0
              for (var x in tweetStrArray){
                sanitized_word = tweetStrArray[x].toLowerCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
                if(dict.hasOwnProperty(sanitized_word)){
                  sent_val += dict[sanitized_word];
                }
              }
              //If so then build up some nice json and send out to web sockets
              var outputPoint = {"tweet":data.text,"toc":data.created_at,"pic":data.user.profile_image_url,"user":data.user.screen_name,"lat": data.coordinates.coordinates[0],"lng": data.coordinates.coordinates[1],"sentiment": sent_val};
              
              socket.broadcast.emit("mood-data-stream", outputPoint);

              //Send out to web sockets channel.
              socket.emit('mood-data-stream', outputPoint);
            }
            else if(data.place){
              if(data.place.bounding_box === 'Polygon'){
                // Calculate the center of the bounding box for the tweet
                var coord, _i, _len;
                var centerLat = 0;
                var centerLng = 0;

                for (_i = 0, _len = coords.length; _i < _len; _i++) {
                  coord = coords[_i];
                  centerLat += coord[0];
                  centerLng += coord[1];
                }
                centerLat = centerLat / coords.length;
                centerLng = centerLng / coords.length;

                tweetStrArray = data.text.split(' ');
                sent_val = 0
                for (var x in tweetStrArray){
                  sanitized_word = tweetStrArray[x].toLowerCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"");
                  if(dict.hasOwnProperty(sanitized_word)){
                    sent_val += dict[sanitized_word];
                  }
                }

                // Build json object and broadcast it
                var outputPoint = {"tweet":data.text,"toc":data.created_at,"pic":data.user.profile_image_url,"user":data.user.screen_name,"lat": centerLat,"lng": centerLng,"sentiment": sent_val};
                
                socket.broadcast.emit("mood-data-stream", outputPoint);

              }
            }
          } 
        });

        setTimeout(function(){
          stream.stop();
          socket.emit('mood data sent');
        }, 10000);  
    });
});

//Error handler
process.on('uncaughtException', function (exception) {
  // handle or ignore error
  console.log(exception);
});
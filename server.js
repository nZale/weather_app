    var express  = require('express');
    var app      = express();                            
    var bodyParser = require('body-parser');
    var http = require('http');
    var schedule = require('node-schedule');
    var server = http.createServer(app);
    var io = require('socket.io').listen(server);
    var https = require('https');
    var request = require('request');

    // configuration 
    app.use(express.static(__dirname + '/app'));                 // set the static files location /public/img will be /img for users
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json

    // start server ======================================
    var port = process.env.PORT || 5000;
    server.listen(port);
    console.log("App listening on port " + port);

    // web main page
    app.get('*', function(req, res) {
        res.sendFile(__dirname + '/app/index.html');
    });

    var rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(0, 59, 30);

    var job = schedule.scheduleJob(rule, function(){
      getWeather();
      console.log("Job done @ " + new Date().getMinutes());
    });

    var weatherModel = function(){
      model = this;
      model.Location = '';
      model.Weather = '';
      model.Temperature = '';
      model.Humidity = '';
      model.TemperatureDif = 0;
      model.SuggestionCode = '';
      model.ChangeCode = "c_code_0.png";
      model.WeatherImage;
    }

    var weatherViewModel = function(model)
    {
        vm = this;
        w = model;
        vm.currentTemperature = 0;
        vm.setTemperatureDifference = function(num1, num2){
          return Math.ceil((num1 < num2)? num1-num2 : num2-num1 * 100)/100; ;
        };
        vm.ToString = function() {
          return "T: " + w.Temperature + " C: " + vm.currentTemperature + " D:" + w.TemperatureDif + " CD:" + w.ChangeCode;
        };
        vm.Suggestion = function() {
          if(model.Temperature <= 10)
            return "s_code_0.jpg";
          else if(model.Temperature > 10 && model.Temperature <= 20)
            return "s_code_1.jpg";
          else if(model.Temperature > 20 && model.Temperature <= 30)
            return "s_code_2.jpg";
          else if(model.Temperature > 30)
            return "s_code_3.jpg";
        };
        vm.setData = function(value){
          w.Location = value.display_location.full;
          w.Weather = value.weather;
          w.Temperature = value.temp_c;
          w.Humidity = value.relative_humidity;
          w.TemperatureDif = vm.setTemperatureDifference(vm.currentTemperature, w.Temperature);
          vm.currentTemperature = w.Temperature;
          w.SuggestionCode = vm.Suggestion();
          w.ChangeCode = vm.setChangeCode();
          w.WeatherImage = value.icon_url;
        }
        vm.toJSON = function() {
          return JSON.stringify({
            location : w.Location,
            weather : w.Weather,
            temperature : w.Temperature,
            humidity : w.Humidity,
            temp_dif : w.TemperatureDif,
            suggestion_code : w.SuggestionCode,
            change_code : w.ChangeCode,
            weather_image : w.WeatherImage
           }, null, '');
        };
        vm.setChangeCode = function(){
          if(w.TemperatureDif == 0)
            return "c_code_0.png";
          else if(w.TemperatureDif < 0)
            return "c_code_1.png";
          else if(w.TemperatureDif > 0)
            return "c_code_2.png";
        }
    }

    var weather = new weatherModel();
    var weatherVM = new weatherViewModel(weather);


    var getWeather = function(){ request('http://api.wunderground.com/api/43cce2bf1b0df44a/conditions/q/Norway/Oslo.json', function (error, response, data) {
        if (!error && response.statusCode == 200) {
          var result = JSON.parse(data);
          weatherVM.setData(result.current_observation);
          console.log(weatherVM.ToString());
          console.log(weatherVM.Suggestion())
          io.emit('sending-data', weatherVM.toJSON());
        }
      })
    }

    // create connection
    io.sockets.on('connection', function (socket) 
    {
      socket.on("get-data", function() 
      {
        //console.log((new Date()).toUTCString() + ' s : send tweets');    
        socket.broadcast.emit("sending-data", weatherVM.toJSON());              
        socket.emit('sending-data', weatherVM.toJSON());
        console.log((new Date()).toUTCString() + ' s : data sent!');       
      })

      // signal that client is connected
      //console.log((new Date()).toUTCString() + ' s : connected!');
      socket.emit("connected");
    });


    getWeather();
  
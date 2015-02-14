  	// search API params
	var app = angular.module('twitterApp', []); // register module

	function mainController($scope, $http, $interval) {
	  $scope.query;
	  $scope.refreshInterval = 10;
	  $scope.weather_data;	
	  $scope.weather_list = [];
	  $scope.date;
	  $scope.count = 0;
	  $scope.greeting = 'Weather information';
	  $scope.predicate = '-retweet_count';


	  // connect to the server and setup listener
	  function connect()
	  {
	  	if(io !== undefined) 
	  	{
	  		// server connection
		    var socket = io.connect('http://young-depths-1251.herokuapp.com');

		    // set listener for 'twitter-stream' message that will store incoming data
		    socket.on('sending-data', function (data) {
		    	//console.log(getDateTime() + ' c : getting tweets');
		    	var weather_info = JSON.parse(data);
		    	if(weather_info.weather == "")
		    		return;
    			getTime();
		    	$scope.weather_list.push(weather_info);
		    	$scope.count = $scope.weather_list.length;
		    	$scope.$apply();

		    });

		    // if the connection is made it will request for tweets by sending "get tweets" message
		    socket.on("connected", function(r) {
		   		//console.log(getDateTime() + ' c : connected!');
		     	socket.emit("get-data");
		    });

		    // 
		    socket.on('disconnect', function () {
			    socket.emit('client disconnected');
			    //console.log(getDateTime() + ' c : client disconnected!');
			});
		}
	  }

      //get current time
      function getTime() {
	    $scope.date = new Date().toLocaleTimeString();
	  }

	  function getDateTime()
	  {
	  	return (new Date()).toUTCString(); 
	  }

	  connect();
      //getTime();

      //refresh tweets
      $interval(function() {
	    //getTime();
	  	}, $scope.refreshInterval * 1000 * 60);
	}
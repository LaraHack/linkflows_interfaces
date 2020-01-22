
$("#getPicFromServer").on("click", getImageFromServer);

function getImageFromServer () {
	// var serverConnection = "http://127.0.0.1:8081/images/test.jpeg";
		var serverConnection = "http://localhost:8081/hello";

	$.get(serverConnection, function (data) {
		$("#testMessage").html(data);
		alert("Communication with server done!");
	});
	// var net = require('net');
	//
	// var client = new net.Socket();
	// client.connect(8081, '127.0.0.1', function() {
	// 	console.log('Connected');
	// 	client.write('Hello, server! Love, Client.');
	// });
	//
	// client.on('data', function(data) {
	// 	console.log('Received: ' + data);
	// 	client.destroy(); // kill client after server's response
	// });
	//
	// client.on('close', function() {
	// 	console.log('Connection closed');
	// });
}


$("#getMessage").on("click", getMessageFromServer);

function getMessageFromServer () {
	var serverConnection = "http://localhost:8081/";

	$.get(serverConnection, function (data, status) {
		$("#testMessage").text(data);
		$("#testMessage").show();
	});
}


function getDataFromVirtuoso () {
	var serverConnection = "http://localhost:8081/sparql";

	$.get(serverConnection, function (data, status) {
	    console.log("data:" + dataVirtuoso);
	    console.log("status:" + status);

	    var data = JSON.parse(dataVirtuoso);
	    console.log("_____________________");
	    console.log("json data:");
	    console.log(data);
	    console.log("_____________________");

			$("#testData").text(data);
			$("#testData").show();
		}
}

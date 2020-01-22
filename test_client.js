
$("#getMessage").on("click", getMessageFromServer);

function getMessageFromServer () {
	var serverConnection = "http://localhost:8081/";

	$.get(serverConnection, function (data, status) {
		$("#testMessage").text(data);
		$("#testMessage").show();
	});

}

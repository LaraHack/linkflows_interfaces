
$("#getMessage").on("click", getMessageFromServer);

function getMessageFromServer () {
	var serverConnection = "http://localhost:8081/";

	$.get(serverConnection, function (data, status) {
		$("#testMessage").text(data);
		$("#testMessage").show();
	});
}

$("#getData").on("click", getDataFromVirtuoso);

function getDataFromVirtuoso () {
	var serverConnection = "http://localhost:8081/sparql";

	$.get(serverConnection)
	  .done(function (dataVirtuoso, status)  {
	    console.log("data:" + dataVirtuoso);
	    console.log("status:" + status);

			$("#testData").text(dataVirtuoso);
			$("#testData").show();
	  })
	  // jqXHR is a JS XMLHTTPRequest object
	  // textStatus is the error and
	  // error is Internal Server Error
	  .fail(function (jqXHR, textStatus, error) {
	        console.log("Get error: " + error);

					$("#testData").text(textStatus);
					$("#testData").show();
	    });
}

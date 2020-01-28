var serverConnection = "http://localhost:8081/sparql";

$.get(serverConnection)
  .done(function (dataEVirtuoso, status)  {
    console.log("data:" + dataVirtuoso);
    console.log("status:" + status);

    var data = JSON.parse(dataVirtuoso);
    console.log("_____________________");
    console.log("json data:");
    console.log(data);
    console.log("_____________________");

  })
  // jqXHR is a JS XMLHTTPRequest object
  // textStatus is the error and
  // error is Internal Server Error
  .fail(function (jqXHR, textStatus, error) {
        console.log("Get error: " + error);
    });

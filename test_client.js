var checkedDimensions = new Map([
  ["article", true],
  ["section", true],
  ["paragraph", true],
  ["syntax", true],
  ["style", true],
  ["content", true],
  ["negative", true],
  ["neutral", true],
  ["positive", true],
  ["I1", true],
  ["I2", true],
  ["I3", true],
  ["I4", true],
  ["I5", true],
  ["compulsory", true],
  ["suggestion", true],
  ["no_action", true]
]);


function checkAllCheckboxes() {
  $('input[type="checkbox"]').prop("checked", true);
}

checkAllCheckboxes();

// id should be something in the form of '#myinput'
function checkboxChecked(id) {
  if ($(id).is(':checkbox') == true) {
    $(id).click(function() {
      if($(this).prop("checked") == true) {
        alert("Checkbox is checked.");
      }
      else if($(this).prop("checked") == false) {
        alert("Checkbox is unchecked.");
      }
    });
  }
}

// palette of colors used for all dimensions
var colors = {article: "#cd853f", section: "#deb887", paragraph: "#ffe4c4",
  syntax: "#c6deff", style: "#82cafa", content:"#9e7bff",
  negative: "#ff0000", neutral: "#ffff00", positive: "#008000",
  I1: "rgba(0, 0, 0, 0)", I2: "rgba(0, 0, 0, 0.25)", I3: "rgba(0, 0, 0, 0.5)", I4: "rgba(0, 0, 0, 0.75)", I5: "rgba(0, 0, 0, 1)",
  compulsory: "#ff6500", suggestion: "#ffa500", no_action: "#ffd700"};

// coloring a span element that acts as part of the legend for the graph
// from the color palette above, for one part of one dimension
function setSpanColor(dimName) {
  var spanId = "span" + dimName.charAt(0).toUpperCase() + dimName.slice(1);
  var spanFound = document.getElementById(spanId);
  if (spanFound) {
      spanFound.style.background = colors[dimName];
  }
}

// coloring the separate span elements that act as legend for the graph
// from the color palette above, for all dimensions
for (const [key, value] of Object.entries(colors)) {
  setSpanColor(key);
}

$("#getMessage").on("click", getMessageFromServer);

function getMessageFromServer () {
	var serverConnection = "http://localhost:8081/";

	$.get(serverConnection, function (data, status) {
		$("#testMessage").text(data);
		$("#testMessage").show();
	});
}

$("#getData").on("click", getDataFromVirtuoso);

function getDimensionsChecked() {
  checkedDimensions.forEach((checked, dimension) => {
    var dimensionCamelCase = String(dimension).charAt(0).toUpperCase() + String(dimension).substr(1).toLowerCase();
    var checkboxDimension = "checkbox".concat(dimensionCamelCase);
    checkedDimensions[dimension] = $("#".concat(checkboxDimension)).is(":checked");
    console.log(dimension + ":" + checkedDimensions[dimension]);
    });
}

function getDataFromVirtuoso () {
	var serverConnection = "http://localhost:8081/sparql";
  getDimensionsChecked();
	$.get(serverConnection, checkedDimensions)
	  .done((dataVirtuoso, status) => {
	    console.log("data:" + dataVirtuoso);
	    console.log("status:" + status);

			var results = preprocessVirtuosoResults(dataVirtuoso);
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

// Virtuoso results should be a CSV in the form of "reviewer","reviewComment","part","aspect","posNeg","impact","actionNeeded"
function preprocessVirtuosoResults(results) {
 	// first read CSV file with results
	  var csvData = [];
		console.log("in CSV");
		csvData = $.csv.toArrays(results);
		console.log("CSV data:" + csvData);
		return csvData;
}

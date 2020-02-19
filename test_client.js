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

		var reviewer = [];

		// for graph generation data needs to be in the form of
		// Reviewer,article,section,paragraph,syntax,style,content,negative,neutral,positive,I1,I2,I3,I4,I5,compulsory,suggestion,no_action
		for (var i = 1; i < csvData.length; i++) {
			if (!reviewer.includes(csvData[i][0])) {
				reviewer.push(csvData[i][0]);
			}
		}

		var graphCSVData = new Array(reviewer.length);

    reviewer.forEach( (editor, i) => {
      graphCSVData[i] = new Map([
        ["Reviewer " + (i+1), editor],
        ["article", 0],
        ["section", 0],
        ["paragraph", 0],
        ["syntax", 0],
        ["style", 0],
        ["content", 0],
        ["negative", 0],
        ["neutral", 0],
        ["positive", 0],
        ["I1", 0],
        ["I2", 0],
        ["I3", 0],
        ["I4", 0],
        ["I5", 0],
        ["compulsory", 0],
        ["suggestion", 0],
        ["no_action", 0]
        ]);
    });

    // article level
    var patternArticle = /.*\#article/;
    var patternSection = /.*\#section$/;
    var patternParagraph = /.*\#paragraph$/;

    // aspect
    var patternSyntax = /.*\#SyntaxComment$/;
    var patternStyle = /.*\#StyleComment$/;
    var patternContent = /.*\#ContentComment$/;

    // positivity/negativity
    var patternNegative = /.*\#NegativeComment$/;
    var patternNeutral = /.*\#NeutralComment$/;
    var patternPositive = /.*\#PositiveComment$/;

    // action needed
    var patternCompulsory = /.*\#ActionNeededComment$/;
    var patternSuggestion = /.*\#SuggestionComment$/;
    var patternNoAction = /.*\#NoActionNeededComment$/;

    // ordering in the current csvData: reviewer,reviewComment,part,aspect,posNeg,impact,actionNeeded
		for (i = 1; i < csvData.length; i++) {
			// find reviewer in graphCSVData
      var indexOfReviewer = reviewer.indexOf(csvData[i][0]);

      // if reviewer is found, then calculate counts for every dimension
      if (indexOfReviewer > -1) {
  			// check whether the part is article, section or paragraph
        if (patternArticle.test(csvData[i][2])){
          graphCSVData[indexOfReviewer].set("article", graphCSVData[indexOfReviewer].get("article")+1);
        }
        if (patternSection.test(csvData[i][2])){
          graphCSVData[indexOfReviewer].set("section", graphCSVData[indexOfReviewer].get("section")+1);
        }
        if (patternParagraph.test(csvData[i][2])){
          graphCSVData[indexOfReviewer].set("paragraph", graphCSVData[indexOfReviewer].get("paragraph")+1);
        }

        // check whether the aspect is syntax, style or content
        if (patternSyntax.test(csvData[i][3])){
          graphCSVData[indexOfReviewer].set("syntax", graphCSVData[indexOfReviewer].get("syntax")+1);
        }
        if (patternStyle.test(csvData[i][3])){
          graphCSVData[indexOfReviewer].set("style", graphCSVData[indexOfReviewer].get("style")+1);
        }
        if (patternContent.test(csvData[i][3])){
          graphCSVData[indexOfReviewer].set("content", graphCSVData[indexOfReviewer].get("content")+1);
        }

        // check whether the positivity/negativity dimension is negative, neutral or positive
        if (patternNegative.test(csvData[i][4])){
          graphCSVData[indexOfReviewer].set("negative", graphCSVData[indexOfReviewer].get("negative")+1);
        }
        if (patternNeutral.test(csvData[i][4])){
          graphCSVData[indexOfReviewer].set("neutral", graphCSVData[indexOfReviewer].get("neutral")+1);
        }
        if (patternPositive.test(csvData[i][4])){
          graphCSVData[indexOfReviewer].set("positive", graphCSVData[indexOfReviewer].get("positive")+1);
        }

        // check whether the impact is 1, 2, 3, 4 or 5
        if (0 < csvData[i][5] < 6){
          graphCSVData[indexOfReviewer].set("I"+csvData[i][5], graphCSVData[indexOfReviewer].get("I"+csvData[i][5])+1);
        }

        // check whether the action needed is compulsory, suggestion or no_action
        if (patternCompulsory.test(csvData[i][6])){
          graphCSVData[indexOfReviewer].set("compulsory", graphCSVData[indexOfReviewer].get("compulsory")+1);
        }
        if (patternSuggestion.test(csvData[i][6])){
          graphCSVData[indexOfReviewer].set("suggestion", graphCSVData[indexOfReviewer].get("suggestion")+1);
        }
        if (patternNoAction.test(csvData[i][6])){
          graphCSVData[indexOfReviewer].set("no_action", graphCSVData[indexOfReviewer].get("no_action")+1);
        }
      }
    }

    console.log(graphCSVData);

    return graphCSVData;
}

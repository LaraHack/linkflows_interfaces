// server address of the Virtuoso triple store
var serverConnection = "http://localhost:8081/sparql/commentsBySection";

// array containing the results retrieved from Virtuoso
var resultsVirtuoso = [];

// palette of colors used for all dimensions
var colors = {article: "#cd853f", section: "#deb887", paragraph: "#ffe4c4",
  syntax: "#c6deff", style: "#82cafa", content:"#9e7bff",
  negative: "#ff0000", neutral: "#ffff00", positive: "#008000",
  I1: "rgba(0, 0, 0, 0)", I2: "rgba(0, 0, 0, 0.25)", I3: "rgba(0, 0, 0, 0.5)", I4: "rgba(0, 0, 0, 0.75)", I5: "rgba(0, 0, 0, 1)",
  compulsory: "#ff6500", suggestion: "#ffa500", no_action: "#ffd700"};

// coloring the separate span elements that act as legend for the graph
// from the color palette above, for all dimensions
for (const [key, value] of Object.entries(colors)) {
  setSpanColor(key);
}

$("#divHeaderNavbar").load("include/navbar.html");

$("#divHeaderNavs").load("include/navs.html", function () {
  $("#aTableReviewers").removeClass("nav-link").addClass("nav-link active");
});

// coloring a span element that acts as part of the legend for the graph
// from the color palette above, for one part of one dimension
function setSpanColor(dimName) {
  var spanId = "span" + dimName.charAt(0).toUpperCase() + dimName.slice(1);
  var spanFound = document.getElementById(spanId);
  if (spanFound) {
      spanFound.style.background = colors[dimName];
  }
}

// get data from Virtuoso for the selected article
$.get(serverConnection)
.done((csvResultsVirtuoso, status) => {
  try { // in case there is any arror retrieving the data
    // create array with all results retrieved from the SPARQL endpoint
    resultsVirtuoso = $.csv.toArrays(csvResultsVirtuoso);

    // check if the results are empty or not
    if (resultsVirtuoso.length > 0) {
      console.log("RESULTS:" + JSON.stringify(resultsVirtuoso));
    } else { // no results retrieved
      console.log("No results retrieved!!!");
    }
  }
  catch(error) { // in case of error retrieving the data
    console.log("Error retrieving data: " + error);
  }
})
// failure to retrieve Virtuoso results
.fail(function (jqXHR, textStatus, error) {
    // remove the progress bar in case of error
    console.log("Error when connecting to the Virtuoso DB: " + error);
});

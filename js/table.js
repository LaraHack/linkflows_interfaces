// server address of the Virtuoso triple store
const serverGetComments = "http://localhost:8081/sparql/commentsBySection";
const serverGetSections = "http://localhost:8081/sparql/mainSections";

// array containing the results retrieved from Virtuoso
var resultsVirtuoso = [];

// array containing the results retrieved from Virtuoso, without the prefixes
var resultsNoPrefixes = [];

// array containing all main sections of the selected paper
// one element in the form of {Xi: SectionTitle}, where
// Xi = number of main section, where i = section i
// SectionTitle = title of the section; e.g. "Introduction"
var sections = [];

// counts of review comments for the table
// syntax,style,content,negative,neutral,positive,I1,I2,I3,I4,I5,compulsory,suggestion,no_action
var countsResults = [];

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

// get data from Virtuoso for the selected article: main sections
$.get(serverGetSections)
.done((csvResultsVirtuoso, status) => {
  try { // in case there is any arror retrieving the data
    // create array with all results retrieved from the SPARQL endpoint
    sections = $.csv.toArrays(csvResultsVirtuoso);
    sections.shift(); // first element contains the header, it is removed from the array

    // check if the results are empty or not
    if (sections.length > 0) {
      console.log("RESULTS:" + JSON.stringify(sections));
      for (let i = 0; i < sections.length; i++) {
        console.log("sections[" + i + "][1]" + sections[i][1]);
        $("#tblCommentsPerMainSections").append("<tr id='trSection_" + sections[i][0] + "'>" +
              "<td id='tdNr_" + sections[i][0] + "'>" + sections[i][0] + "</td>" +
              "<td align='left' id='tdTitle_" + sections[i][0] + "'>" + sections[i][1] + "</td>" +
              "<td align='center' id='tdSyntax_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdStyle_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdContent_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdNegative_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdNeutral_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdPositive_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdI1_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdI2_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdI3_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdI4_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdI5_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdCompulsory_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdSuggestion_" + sections[i][0] + "'></td>" +
              "<td align='center' id='tdNoAction_" + sections[i][0] + "'></td>" +
            "</tr>");
      }



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

// get data from Virtuoso for the selected article: number of comments per main section
$.get(serverGetComments)
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

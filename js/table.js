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

/*
 ******************************************
 * Patterns used for the Virtuoso results *
 ******************************************
 */

// aspect
var patternSyntax = /.*\#SyntaxComment$/;
var patternStyle = /.*\#StyleComment$/;
var patternContent = /.*\#ContentComment$/;
var aspect = "";

// positivity/negativity
var patternNegative = /.*\#NegativeComment$/;
var patternNeutral = /.*\#NeutralComment$/;
var patternPositive = /.*\#PositiveComment$/;
var pos_neg = "";

// impact
var impact = "";

// action needed
var patternCompulsory = /.*\#ActionNeededComment$/;
var patternSuggestion = /.*\#SuggestionComment$/;
var patternNoAction = /.*\#NoActionNeededComment$/;
var actionNeeded = "";


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
    // in case of error remove table header
    $("#tblCommentsPerMainSections").remove();

    $("#divContent").empty();
    $("#divContent").append("<div id='divError' style='text-align:center; color: red; font-size: large; border: #0275d8;'> <br/>Error retrieving the data. Please try again later and if the problem persists, please write an email to c.i.bucur@vu.nl <br/> <br/> Error when connecting to the Virtuoso DB: " + error + ", text status:"+ textStatus + "</div>");
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

      // remove the prefixes for the results, easier to handle
      resultsNoPrefixes = noPrefixesInVirtuosoResults(resultsVirtuoso);

      // check if the results are empty or not
      if (sections.length > 0) {
        // create initial empty count array for every section
        countsResults = initSectionsCounts(sections);

        if (countsResults != -1) {
          // calculate counts for all reviewers
          calculateCountsSections(resultsNoPrefixes, sections, countsResults);
          console.log("countsResults:" + JSON.stringify(countsResults));

          fillTableWithCounts(countsResults);
        }
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
    // in case of error remove table header
    $( "#tblCommentsPerMainSections").remove();

    $("#divContent").empty();
    $("#divContent").append("<div id='divError' style='text-align:center; color: red; font-size: large; border: #0275d8;'> <br/>Error retrieving the data. Please try again later and if the problem persists, please write an email to c.i.bucur@vu.nl <br/> <br/> Error when connecting to the Virtuoso DB: " + error + ", text status:"+ textStatus + "</div>");
    console.log("Error when connecting to the Virtuoso DB: " + error);
});

// preprocessing the results got from Virtuoso
function noPrefixesInVirtuosoResults(results) {
  var noPrefixes = [];

  for (let i = 1; i < results.length; i++) { // first line contains the headers, it will be omitted
    var resultItem = results[i].slice();

    // get the comment number without the sparql prefix
    resultItem[2] = resultItem[2].split("#").pop();

     // check whether the aspect is syntax, style or content
     if (patternSyntax.test(results[i][3])){
       resultItem[3] = "syntax";
     }
     if (patternStyle.test(results[i][3])) {
       resultItem[3] = "style";
     }
     if (patternContent.test(results[i][3])) {
       resultItem[3] = "content";
     }

     // check whether the positivity/negativity dimension is negative, neutral or positive
     if (patternNegative.test(results[i][4])) {
       resultItem[4] = "negative";
     }
     if (patternNeutral.test(results[i][4])) {
       resultItem[4] = "neutral";
     }
     if (patternPositive.test(results[i][4])) {
       resultItem[4] = "positive";
     }

     // check whether the action needed is compulsory, suggestion or no_action
     if (patternCompulsory.test(results[i][6])) {
       resultItem[6] = "compulsory";
     }
     if (patternSuggestion.test(results[i][6])) {
       resultItem[6] = "suggestion";
     }
     if (patternNoAction.test(results[i][6])) {
       resultItem[6] = "no_action";
     }

     noPrefixes.push(resultItem);

   }

   return noPrefixes;
}

// create empty section counts
function initSectionsCounts(mainSections) {
  // if array of reviewers exists and it is not empty
  if (Array.isArray(sections) && sections.length) {
    var sectionsCounts = [];

    // sectionNo,sectionTitle,syntax,style,content,negative,neutral,positive,I1,I2,I3,I4,I5,compulsory,suggestion,no_action
    for (let i = 0; i < sections.length; i++) {
      var countsPerSection = { "section": sections[i][0],
                    "title": sections[i][1],
                    "syntax": 0, "style": 0, "content": 0,
                    "negative": 0, "neutral": 0, "positive": 0,
                    "I1": 0, "I2": 0, "I3": 0, "I4": 0, "I5": 0,
                    "compulsory": 0, "suggestion": 0, "no_action": 0
      };
      sectionsCounts.push(countsPerSection);
    }
    return sectionsCounts;
  }
  return -1;
}

// calculate the number of review comments for each main section based on the retrieved results (no prefixes)
// results contain the following fields: "section", "title", "reviewComment","part","aspect","posNeg","impact","actionNeeded", "commentText"
function calculateCountsSections(results, sectionsList, sectionCounts) {
  for (let i = 0; i < results.length; i++) {
    var resultItem = results[i];

    for (let j = 0; j < sectionCounts.length; j++) {
      if (resultItem[0] == sectionCounts[j].section) {
        // if section is found, then calculate counts for every dimension

        // check whether the aspect is syntax, style or content
        if (resultItem[3] == "syntax"){
          sectionCounts[j].syntax = sectionCounts[j].syntax + 1;
        }
        if (resultItem[3] == "syntax") {
          sectionCounts[j].style = sectionCounts[j].style + 1;
        }
        if (resultItem[3] == "content") {
          sectionCounts[j].content = sectionCounts[j].content + 1;
        }

        // check whether the positivity/negativity dimension is negative, neutral or positive
        if (resultItem[4] == "negative") {
          sectionCounts[j].negative = sectionCounts[j].negative + 1;
        }
        if (resultItem[4] == "neutral") {
          sectionCounts[j].neutral = sectionCounts[j].neutral + 1;
        }
        if (resultItem[4] == "positive") {
          sectionCounts[j].positive = sectionCounts[j].positive + 1;
        }

        // check whether the impact is 1, 2, 3, 4 or 5
        if (0 < resultItem[5] < 6) {
          sectionCounts[j]["I" + resultItem[5]] = sectionCounts[j]["I" + resultItem[5]] + 1;
        }

        // check whether the action needed is compulsory, suggestion or no_action
        if (resultItem[6] == "compulsory") {
          sectionCounts[j].compulsory = sectionCounts[j].compulsory + 1;
        }
        if (resultItem[6] == "suggestion") {
          sectionCounts[j].suggestion = sectionCounts[j].suggestion + 1;
        }
        if (resultItem[6] == "no_action") {
          sectionCounts[j].no_action = sectionCounts[j].no_action + 1;
        }
      }
    }
  }
}

function createTableHeader() {
  // creating the header for the table
  $("#tblCommentsPerMainSections").append(
  "<col class='outlined'>" +
  "<col class='outlined'>" +
  "<colgroup span='3' class='outlined'></colgroup>" +
  "<colgroup span='3' class='outlined'></colgroup>" +
  "<colgroup span='5' class='outlined'></colgroup>" +
  "<colgroup span='3' class='outlined'></colgroup>" +
  "<tr>" +
    "<th class='borders' rowspan='2' style='text-align:center;'>Section</th>" +
    "<th class='borders' rowspan='2' style='text-align:center;'>Title</th>" +
    "<th class='borders' colspan='3' scope='colgroup' style='text-align:center;'>Aspect</th>" +
    "<th class='borders' colspan='3' scope='colgroup' style='text-align:center;'>Positivity/Negativity</th>" +
    "<th class='borders' colspan='5' scope='colgroup' style='text-align:center;'>Impact</th>" +
    "<th class='borders' colspan='3' scope='colgroup' style='text-align:center;'>Action needed</th>" +
  "</tr>" +
  "<tr>" +
    "<th class='borders' style='text-align:center; background-color: #c6deff;'>syntax</th>" +
    "<th class='borders' style='text-align:center; background-color: #82cafa;'>style</th>" +
    "<th class='borders' style='text-align:center; background-color: #9e7bff;'>content</th>" +
    "<th class='borders' style='text-align:center; background-color: #ff0000;'>negative</th>" +
    "<th class='borders' style='text-align:center; background-color: #ffff00;'>neutral</th>" +
    "<th class='borders' style='text-align:center; background-color: #008000;'>positive</th>" +
    "<th class='borders' style='text-align:center; background-color: rgba(0, 0, 0, 0);'>I1</th>" +
    "<th class='borders' style='text-align:center; background-color: rgba(0, 0, 0, 0.25);'>I2</th>" +
    "<th class='borders' style='text-align:center; background-color: rgba(0, 0, 0, 0.5); color:white;'>I3</th>" +
    "<th class='borders' style='text-align:center; background-color: rgba(0, 0, 0, 0.75); color:white;'>I4</th>" +
    "<th class='borders' style='text-align:center; background-color: rgba(0, 0, 0, 1); color:white;'>I5</th>" +
    "<th class='borders' style='text-align:center; background-color: #ff6500;'>compulsory</th>" +
    "<th class='borders' style='text-align:center; background-color: #ffa500;'>suggestion</th>" +
    "<th class='borders' style='text-align:center; background-color: #ffd700;'>no action</th>" +
  "</tr>");
}

function addEmptyRows() {
  for (let i = 0; i < sections.length; i++) {
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
}

function fillTableWithCounts(counts) {
  if (Array.isArray(counts) && counts.length) {
    // create table header
    createTableHeader();

    // add an empty row for each main section of the article
    addEmptyRows();

    // add the counts for each dimension
    counts.forEach( (sectionCounts, index) => {
      // console.log("sectionCounts=" + JSON.stringify(sectionCounts));

      // aspect
      if (sectionCounts.syntax) {
        $("#tdSyntax_" + sectionCounts.section).text(sectionCounts.syntax);
      }
      if (sectionCounts.style) {
        $("#tdStyle_" + sectionCounts.section).text(sectionCounts.style);
      }
      if (sectionCounts.content) {
        $("#tdContent_" + sectionCounts.section).text(sectionCounts.content);
      }

      // positivity/negativity
      if (sectionCounts.positive) {
        $("#tdPositive_" + sectionCounts.section).text(sectionCounts.positive);
      }
      if (sectionCounts.neutral) {
        $("#tdNeutral_" + sectionCounts.section).text(sectionCounts.neutral);
      }
      if (sectionCounts.negative) {
        $("#tdNegative_" + sectionCounts.section).text(sectionCounts.negative);
      }

      // impact
      if (sectionCounts.I1) {
        $("#tdI1_" + sectionCounts.section).text(sectionCounts.I1);
      }
      if (sectionCounts.I2) {
        $("#tdI2_" + sectionCounts.section).text(sectionCounts.I2);
      }
      if (sectionCounts.I3) {
        $("#tdI3_" + sectionCounts.section).text(sectionCounts.I3);
      }
      if (sectionCounts.I4) {
        $("#tdI4_" + sectionCounts.section).text(sectionCounts.I4);
      }
      if (sectionCounts.I5) {
        $("#tdI5_" + sectionCounts.section).text(sectionCounts.I5);
      }

      // action_needed
      if (sectionCounts.compulsory) {
        $("#tdCompulsory_" + sectionCounts.section).text(sectionCounts.compulsory);
      }
      if (sectionCounts.suggestion) {
        $("#tdSuggestion_" + sectionCounts.section).text(sectionCounts.suggestion);
      }
      if (sectionCounts.no_action) {
        $("#tdNoAction_" + sectionCounts.section).text(sectionCounts.no_action);
      }
    });

  }
}

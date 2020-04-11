/*
 ********************************************
 * Declaration/Definition of variables used *
 ********************************************
 */

// server address of the Virtuoso triple store
var serverConnection = "http://localhost:8081/sparql";

// the dimensions and their checkbox-clicked status
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

// variables for the Virtuoso retrieved data

// array containing the results retrieved from Virtuoso
var resultsVirtuoso = [];

// array containing the results retrieved from Virtuoso, without the prefixes
var resultsNoPrefixes = [];

// array containing all reviewers of the selected paper
// one element in the form of {ORCiDk: Xk}, where
// ORCiDk = ORCiD of reviewer k, Xk = total number of review comments of reviewer k
var reviewers = [];

// for graph generation data needs to be in the form
// Reviewer,article,section,paragraph,syntax,style,content,negative,neutral,positive,I1,I2,I3,I4,I5,compulsory,suggestion,no_action
var countsResults = [];

// END of variables for the Virtuoso retrieved data

// definition of dimensions used in the grouped stacked chart
var dimensions = {
  "part" : ["article","section","paragraph"],
  "aspect" : ["syntax","style","content"],
  "positivity_negativity" : ["negative", "neutral", "positive"],
  "impact" : ["I1", "I2", "I3", "I4", "I5"],
  "action_needed" : ["compulsory", "suggestion", "no_action"]
}

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

// article level
var patternArticle = /.*\#article/;
var patternSection = /.*\#section$/;
var patternParagraph = /.*\#paragraph$/;
var articleLevel = "";

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


/*
 *****************************
 * Page loads for first time *
 *****************************
 */


$("#divHeaderNavbar").load("include/navbar.html");

$("#divHeaderNavs").load("include/navs.html", function () {
  $("#aGraphReviewers").removeClass("nav-link").addClass("nav-link active");
});


// all dimensions are selected
checkAllCheckboxes();

// add click function to get the review comments
$("#btnShowReviewComments").click(getReviewComments);

// coloring the separate span elements that act as legend for the graph
// from the color palette above, for all dimensions
for (const [key, value] of Object.entries(colors)) {
  setSpanColor(key);
}

// if the content of the review comments were shown before, delete them
$("#divReviewCommentsContent").empty();
$("#divReviewCommentsContent").append("<div id='divIntroContentReviewComments' style='text-align:center; color: #0275d8; font-size: large; border: #0275d8;'> <br/>Click on a rectangle in the graph to show the content of the review comments here</div>");

// check all dimensions
getDimensionsChecked();

// get data from Virtuoso for the selected article
$.get(serverConnection, checkedDimensions)
.done((csvResultsVirtuoso, status) => {
  console.log("data:" + csvResultsVirtuoso);
  console.log("status:" + status);

  // TODO: extra check here if the results are empty or not
  // create array with all results retrieved from the SPARQL endpoint
  resultsVirtuoso = $.csv.toArrays(csvResultsVirtuoso);

  // remove the prefixes for the results, easier to handle
  resultsNoPrefixes = noPrefixesInVirtuosoResults(resultsVirtuoso);
  console.log("NO PREFIXES:" + resultsNoPrefixes);

  // extract all reviewers of the selected paper and their total number of review comments
  reviewers = getTotalReviewersAndNrComments(resultsNoPrefixes);

  if (Object.keys(reviewers).length) {
    // create initial empty count array for every reviewer
    var reviewersCounts = initReviewersCounts(reviewers);

    if (reviewersCounts != -1) {
      // console.log("initCounts.length=" + reviewersCounts.length);
      // for (var i = 0; i < reviewersCounts.length; i++) {
      //   console.log("initCounts[" + i + "] =" + reviewersCounts[i]);
      //   for (key in reviewersCounts[i])
      //     console.log("key=" + key + "; value=" + (reviewersCounts[i])[key]);

      // calculate counts for all reviewers
      countsResults = calculateCountsReviewers(resultsNoPrefixes, reviewers, reviewersCounts);
      // console.log("COUNTS:" + countsResults);

      // draw the graph for the retrieved, preprocessed results
      // drawGraph(countsResults);
      }
  }
})
// failure to retrieve Virtuoso results
.fail(function (jqXHR, textStatus, error) {
      console.log("Get error: " + error);
      // remove the progress bar in case of error
      $("#divProgressBar").remove();

      $("#divIntroContentReviewComments").remove();
      $("#divReviewCommentsContent").append("<div id='divError' style='text-align:center; color: red; font-size: large; border: #0275d8;'> <br/>Error retrieving the data. Please try again later and if the problem persists, please write an email to c.i.bucur@vu.nl </div>");
});


/*
 **************************************************************
 * Functions used for preprocessing data and graph generation *
 **************************************************************
 */


// coloring a span element that acts as part of the legend for the graph
// from the color palette above, for one part of one dimension
function setSpanColor(dimName) {
  var spanId = "span" + dimName.charAt(0).toUpperCase() + dimName.slice(1);
  var spanFound = document.getElementById(spanId);
  if (spanFound) {
      spanFound.style.background = colors[dimName];
  }
}

// check all checkboxes for dimensions
function checkAllCheckboxes() {
  $('input[type="checkbox"]').prop("checked", true);
}

// check which checkboxes with dimensions are checked
function getDimensionsChecked() {
  checkedDimensions.forEach((checked, dimension) => {
    var dimensionCamelCase = String(dimension).charAt(0).toUpperCase() + String(dimension).substr(1).toLowerCase();
    var checkboxDimension = "checkbox".concat(dimensionCamelCase);
    checkedDimensions[dimension] = $("#".concat(checkboxDimension)).is(":checked");
    console.log(dimension + ":" + checkedDimensions[dimension]);
    });
}

// preprocessing the results got from Virtuoso
function noPrefixesInVirtuosoResults(results) {
  var noPrefixes = [];

  for (var i = 1; i < results.length; i++) { // first line contains the headers, it will be omitted
    var resultItem = results[i].slice();

    // get the comment number without the sparql prefix
    resultItem[1] = resultItem[1].split("#").pop();

     // check whether the part is article, section or paragraph
     if (patternArticle.test(results[i][2])) {
       // resultItem[i][2] = "article";
       resultItem[2] = "article";
     }
     if (patternSection.test(results[i][2])) {
       resultItem[2] = "section";
     }
     if (patternParagraph.test(results[i][2])) {
       resultItem[2] = "paragraph";
     }

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

     // check whether the impact is 1, 2, 3, 4 or 5
     // if (0 < results[i][5] < 6) {
     //   impact = "I" + results[i][5];
     // }

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

// get an array containing the reviewers (identified by their ORCiD) and their total number of review comments
// the array is in the form {ORCiD1: X1}, {ORCiD2: X2}, ..., {ORCiDk: Xk}, where
// Xk is the maxim number of review comments of the reviewer identified with ORCiDk
// k is the total number of reviewers for the selected article
function getTotalReviewersAndNrComments(results) {
  var reviewersAndNoComments = [];

  for (var i = 0; i < results.length; i++) {
    var ORCiD = results[i][0];

    if (!(ORCiD in reviewersAndNoComments)) {
      reviewersAndNoComments[ORCiD] = 1;
    } else { // if reviewer already added, add one more review comment
      reviewersAndNoComments[ORCiD] = reviewersAndNoComments[ORCiD] + 1;
    }
  }

  return reviewersAndNoComments;
}

// create empty reviewer counts for every reviewer => helper function for drawing
function initReviewersCounts(reviewers) {
  // if array of reviewers exists and it is not empty
  if (Array.isArray(reviewers) && Object.keys(reviewers).length) {
    var reviewersCounts = [];

    // for graph generation data needs to be in the form of
    // Reviewer,article,section,paragraph,syntax,style,content,negative,neutral,positive,I1,I2,I3,I4,I5,compulsory,suggestion,no_action
    Object.keys(reviewers).forEach( (ORCIDiD, index) => {
      // console.log("reviewer " + key + " = " + reviewers[key] + " -> " + index);
      var countsPerReviewer = { "Reviewer": "Reviewer " + (index + 1),
                    "article" : 0, "section": 0, "paragraph": 0,
                    "syntax": 0, "style": 0, "content": 0,
                    "negative": 0, "neutral": 0, "positive": 0,
                    "I1": 0, "I2": 0, "I3": 0, "I4": 0, "I5": 0,
                    "compulsory": 0, "suggestion": 0, "no_action": 0
      };
      reviewersCounts.push(countsPerReviewer);
    });
    return reviewersCounts;
  }
  return -1;
}

// preprocess results retrieved from the Virtuoso sparql endpoint
// Virtuoso results contain the following fields: "reviewer","reviewComment","part","aspect","posNeg","impact","actionNeeded", "reviewCommentContent"
function calculateCountsReviewers(results, reviewersList, reviewersCounts) {
  // ordering in the current csvResultsVirtuoso: reviewer,reviewComment,part,aspect,posNeg,impact,actionNeeded
  console.log("results.length=" + results.length);
  for (i = 0; i < results.length; i++) {
    var resultItem = results[i];
    console.log("resultItem=[" + i + "]=" + resultItem);
  	// find reviewer in reviewersList
    var indexOfReviewer = reviewersList.indexOf(resultItem[0]);

    // if reviewer is found, then calculate counts for every dimension
    if (indexOfReviewer > -1) {

      console.log(i + " -> " + resultItem[2] + "=" + checkedDimensions[resultItem[2]] +
      "; " + resultItem[3] + "=" + checkedDimensions[resultItem[3]] +
      "; " + resultItem[4] + "=" + checkedDimensions[resultItem[4]] +
      "; " + resultItem[5] + "=" + checkedDimensions["I" + resultItem[5]] +
      "; " + resultItem[6] + "=" + checkedDimensions[resultItem[6]] );

      // // check whether the part is article, section or paragraph
      // if (csvResultsVirtuosoNoPrefixes[i][2] == "article" && checkedDimensions["article"]) {
      //   reviewersCounts[indexOfReviewer].article =  reviewersCounts[indexOfReviewer].article + 1;
      // }
      // if (csvResultsVirtuosoNoPrefixes[i][2] == "section" && checkedDimensions["section"]) {
      //   reviewersCounts[indexOfReviewer].section = reviewersCounts[indexOfReviewer].section + 1;
      // }
      // if (csvResultsVirtuosoNoPrefixes[i][2] == "paragraph" && checkedDimensions["paragraph"]) {
      //   reviewersCounts[indexOfReviewer].paragraph = reviewersCounts[indexOfReviewer].paragraph + 1;
      // }
      //
      // // check whether the aspect is syntax, style or content
      // if (csvResultsVirtuosoNoPrefixes[i][3] == "syntax" && checkedDimensions["syntax"]){
      //   reviewersCounts[indexOfReviewer].syntax = reviewersCounts[indexOfReviewer].syntax + 1;
      // }
      // if (csvResultsVirtuosoNoPrefixes[i][3] == "style" && checkedDimensions["style"]) {
      //   reviewersCounts[indexOfReviewer].style = reviewersCounts[indexOfReviewer].style + 1;
      // }
      // if (csvResultsVirtuosoNoPrefixes[i][3] == "content" && checkedDimensions["content"]) {
      //   reviewersCounts[indexOfReviewer].content = reviewersCounts[indexOfReviewer].content + 1;
      // }
      //
      // // check whether the positivity/negativity dimension is negative, neutral or positive
      // if (csvResultsVirtuosoNoPrefixes[i][4] == "negative" && checkedDimensions["negative"]) {
      //   reviewersCounts[indexOfReviewer].negative = reviewersCounts[indexOfReviewer].negative + 1;
      // }
      // if (csvResultsVirtuosoNoPrefixes[i][4] == "neutral"  && checkedDimensions["neutral"]) {
      //   reviewersCounts[indexOfReviewer].neutral = reviewersCounts[indexOfReviewer].neutral + 1;
      // }
      // if (csvResultsVirtuosoNoPrefixes[i][4] == "positive" && checkedDimensions["positive"]) {
      //   reviewersCounts[indexOfReviewer].positive = reviewersCounts[indexOfReviewer].positive + 1;
      // }
      //
      // // check whether the impact is 1, 2, 3, 4 or 5
      // if (0 < csvResultsVirtuosoNoPrefixes[i][5] < 6 && checkedDimensions["I"+ csvResultsVirtuosoNoPrefixes[i][5]]) {
      //   reviewersCounts[indexOfReviewer]["I" + csvResultsVirtuosoNoPrefixes[i][5]] = reviewersCounts[indexOfReviewer]["I" + csvResultsVirtuosoNoPrefixes[i][5]] + 1;
      // }
      //
      // // check whether the action needed is compulsory, suggestion or no_action
      // if (csvResultsVirtuosoNoPrefixes[i][6] == "compulsory" && checkedDimensions["compulsory"]) {
      //   reviewersCounts[indexOfReviewer].compulsory = reviewersCounts[indexOfReviewer].compulsory + 1;
      // }
      // if (csvResultsVirtuosoNoPrefixes[i][6] == "suggestion" && checkedDimensions["suggestion"]) {
      //   reviewersCounts[indexOfReviewer].suggestion = reviewersCounts[indexOfReviewer].suggestion + 1;
      // }
      // if (csvResultsVirtuosoNoPrefixes[i][6] == "no_action" && checkedDimensions["no_action"]) {
      //   reviewersCounts[indexOfReviewer].no_action = reviewersCounts[indexOfReviewer].no_action + 1;
      // }
    }
  }
}


// function that draws the graph
// dataReviewers is the data in JSON format received after a GET request to the server
function drawGraph(dataReviewers) {
  // remove the progress bar before drawing the graph
  $("#divProgressBar").remove();

  // remove the graph that was drawn before
  d3.select("#divGraphArea").selectAll("svg").remove();

  // graph size
  var margin = {top: 10, right: 10, bottom: 30, left: 78},
      // width = 960 - margin.left - margin.right,
      width = 716 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  // settings for the x axis
  var x = d3.scale.linear()
      .range([0, width]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  // settings for the y axis: extra grouping on the y axis by using y0 and y1
  // grouping of reviewers
  var y0 = d3.scale.ordinal()
      .rangeRoundBands([height, 0], 0.1);

  // grouping of dimensions
  var y1 = d3.scale.ordinal();

  var yAxis = d3.svg.axis()
      .scale(y0)
      .orient("left");

  // palette of colors used for all dimensions
  var color = d3.scale.ordinal()
      .range(Object.values(colors));

  // graph dimensions
  var svg = d3.select("#divGraphArea").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + (margin.bottom + 10));

  // added inner child to put label outside the graph
  var inner = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xBegin;

  console.log("DATA REVIEWERS:" + dataReviewers);
  var data = JSON.parse(dataReviewers);
  // d3.csv(dataReviewers, (error, data) => {
    // d3.json(dataReviewers, (error, data) => {

    var rowHeaders = d3.keys(data[0]).filter(function(key) { return key !== "Reviewer"; });

     // set color range for the dimensions present in the data file
     var colorRange = [];

     for (var i = 0; i < rowHeaders.length; i++) {
       colorRange[i] = colors[rowHeaders[i]];
     }

     color.range(colorRange);

     //map colors in the defined palette to the dimensions of the data
     color.domain(rowHeaders);

     // get data for each dimension and
     // calculate the coordonates for the beginning and the end of each for the x axis
     data.forEach(function(d) {
       var xRow = new Array();
       d.rowDetails = rowHeaders.map(function(name) {
         for (ic in dimensions) {
           if($.inArray(name, dimensions[ic]) >= 0){
             if (!xRow[ic]){
               xRow[ic] = 0;
             }
             xBegin = xRow[ic];
             xRow[ic] += +d[name];
             return {reviewer: d.Reviewer, name: name, row: ic, xBegin: xBegin, xEnd: +d[name] + xBegin,};
           }
         }
       });
       // get maximum number of review comments for each reviewer
       d.total = d3.max(d.rowDetails, function(d) {
         return d.xEnd;
       });
     });

   // map data onto graph axes
   var reviewers = data.map(function(d) { return d.Reviewer; });

   y0.domain(reviewers);
   y1.domain(d3.keys(dimensions)).rangeRoundBands([0, y0.rangeBand()]);

   // x.domain([0, d3.max(data, function(d) {
   //   return d.total;
   // })]);
   // TODO: add max of the initial retrieved data from all reviewers
   x.domain([0, 45]);

   // draw x axis
   inner.append("g")
     .attr("class", "x axis")
     .attr("transform", "translate(0," + height + ")")
     .style("opacity", "0")
     .call(xAxis) ;

     // Add X axis label:
    inner.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", (width / 2) )
        // .attr("y", height + margin.top + 20)
        .attr("y", height + margin.bottom + 10)
        .style("font-size", 16)
        .text("Number of review comments");

   // draw y axis
   inner.append("g")
       .attr("class", "y axis")
       .call(yAxis)
       .append("text")
         .attr("transform", "rotate(0)")
         .attr("y", 6)
         .attr("dy", ".20em")
         .style("text-anchor", "end")
         .text(""); // .text("reviewers");

   inner.select('.x').transition().duration(500).delay(1300).style("opacity","1");

   // add grouped stacked bar and add Reviewers
   var grouped_stackedbar = inner.selectAll(".grouped_stackedbar")
     .data(data)
   .enter().append("g")
     .attr("class", "g")
     .attr("transform", function(d) {
       return "translate(0," + y0(d.Reviewer) + ")"; });

   // draw stacked bars for each dimension of each Reviewer
   grouped_stackedbar.selectAll("rect")
     .data(function(d) { return d.rowDetails; })
       .enter().append("rect")
         .attr("height", y1.rangeBand())
         .attr("y", function(d) {
           return y1(d.row);
         })
         .attr("x", function(d) {
           return x(d.xBegin);
         })
         .attr("width", function(d) {
           return x(d.xEnd) - x(d.xBegin);
         })
         .style("fill", function(d) { return color(d.name); })
         .on("mouseover", function(d) {
             d3.select(this).style("fill", d3.rgb(color(d.name)).darker(2));
         })
         .on("mouseout", function(d) {
             d3.select(this).style("fill", color(d.name))
         })
         // when a rectangle is clicked, the content of the review comments of the respective rectangle are shown
         .on("click", function(d ,i) {
          // empty contents of div where the content of the review comments is shown
           $("#divIntroContentReviewComments").remove();
           $("#divReviewCommentsContent").empty();

           var dataToShow = [];
           var reviewerId = ((d.reviewer).toString()).split(" ").pop(); // does this change d.reviewer data?!
           var resultsNoPrefixes = noPrefixesInVirtuosoResults();

           for (var i = 1; i < resultsNoPrefixes.length; i++) {
             if (reviewer[reviewerId-1] == resultsNoPrefixes[i][0]) {
               switch (d.row) {
                 case "part":
                  // the rectangle checked referres to the part of article targeted by the review comment
                  if (resultsNoPrefixes[i][2] == d.name) {
                    dataToShow.push(resultsNoPrefixes[i]);
                  }
                  break;
                case "aspect":
                  // the rectangle checked referres to the aspect of the review comment
                  if (resultsNoPrefixes[i][3] == d.name) {
                    dataToShow.push(resultsNoPrefixes[i]);
                  }
                  break;
                case "positivity_negativity":
                  // the rectangle checked referres to the positivity_negativity of the review comment
                  if (resultsNoPrefixes[i][4] == d.name) {
                    dataToShow.push(resultsNoPrefixes[i]);
                  }
                  break;
                case "impact":
                  // the rectangle checked referres to the impact of the review comment
                  if (("I" + resultsNoPrefixes[i][5]) == d.name) {
                    dataToShow.push(resultsNoPrefixes[i]);
                  }
                  break;
                case "action_needed":
                // the rectangle checked referres to the impact of the review comment
                  if (resultsNoPrefixes[i][6] == d.name) {
                    dataToShow.push(resultsNoPrefixes[i]);
                  }
                }
              }
            }

            // "draw" the contents of the review comments selected annotated with the dimensions values
            for (var i = 0; i < dataToShow.length; i++) {
              console.log("dataToShow[" + i + "]=" + dataToShow[i]);
              $("#divReviewCommentsContent").append("<div class='border border-dark rounded p-1'>" +
                "<span class='legendSmall' style='background: " + colors[dataToShow[i][2]] + "; width:75px;'>" + dataToShow[i][2] + "</span> " +
                "<span class='legendSmall' style='background: " + colors[dataToShow[i][3]] + ";'>" + dataToShow[i][3] + "</span> " +
                "<span class='legendSmall' style='background: " + colors[dataToShow[i][4]] + ";'>" + dataToShow[i][4] + "</span> " +
                "<span class='legendImpactSmall' style='background: " + colors[("I" + dataToShow[i][5])] + "; color:" + (dataToShow[i][5] > 2 ? "white" : "black") + ";'>" + dataToShow[i][5] + "</span> " +
                "<span class='legendSmall' style='background: " + colors[dataToShow[i][6]] + "; width:83px;'>" + dataToShow[i][6] + "</span> <br/> " +
                dataToShow[i][7] + "</div> <br/>");
            }
           });

   // add text labels for each dimension on top of the graph
   grouped_stackedbar.selectAll("text")
     .data(function(d) { return d.rowDetails; })
       .enter().append("text")
         .attr("x", function(d) {
           return x(d.xBegin) + (x(d.xEnd) - x(d.xBegin))/2;
         })
         .attr("y", function(d) {
           return y1(d.row);
         })
         .attr("dy", "1.2em")
         .style("font-size", "14px")
         .style("fill", function(d) {
           if (d.name == "I3" || d.name == "I4" || d.name == "I5")
             return "white";
           return "black";
         })
         .text(function(d,i) {
           return (d.xEnd-d.xBegin) !== 0 ? (d.xEnd-d.xBegin) : "";
         })
         .on("mouseover", function(d) {
             d3.select(this).style("fill", "white");
             d3.select(this).style("font-weight", "bold");
         })
         .on("mouseout", function(d) {
           d3.select(this).style("font-weight", "");
           d3.select(this).style("fill", function(d) {
             if (d.name == "I3" || d.name == "I4" || d.name == "I5")
               return "white";
             return "black";
           });
         });
  // })
}

// sends a request to the server to draw the graph
function getReviewComments() {
  getDimensionsChecked();
  $("#divReviewCommentsContent").empty();
  $("#divReviewCommentsContent").append("<div id='divIntroContentReviewComments' style='text-align:center; color: #0275d8; font-size: large; border: #0275d8;'> <br/> Click on a rectangle in the graph to show the content of the review comments here</div>");

  var newResults = getDataForGraph();
  drawGraph(newResults);

  console.log("NEW RESULTS: " + newResults);
  // $.get(serverConnection, checkedDimensions)
  // .done((dataVirtuoso, status) => {
	//     console.log("data:" + dataVirtuoso);
	//     console.log("status:" + status);
  //
	// 	var results = preprocessVirtuosoResults(dataVirtuoso);
  //   drawGraph(results);
  // })
  // // jqXHR is a JS XMLHTTPRequest object
  // // textStatus is the error and
  // // error is Internal Server Error
  // .fail(function (jqXHR, textStatus, error) {
  //       console.log("Get error: " + error);
  //   });
}

function getDataForGraph() {
  // var csvResultsVirtuoso = [];
  // csvResultsVirtuoso = $.csv.toArrays(csvResultsVirtuoso);

  // var reviewer = [];

  // for graph generation data needs to be in the form of
  // Reviewer,article,section,paragraph,syntax,style,content,negative,neutral,positive,I1,I2,I3,I4,I5,compulsory,suggestion,no_action
  // for (var i = 1; i < csvResultsVirtuoso.length; i++) {
  //   if (!reviewer.includes(csvResultsVirtuoso[i][0])) {
  //     reviewer.push(csvResultsVirtuoso[i][0]);
  //   }
  // }

  //var reviewersCounts = new Array(reviewer.length); // this declaration gives errors when setting values for keys

  var reviewersCounts = [];

  reviewer.forEach( (editor, i) => {
    // var countsPerReviewer = { ["Reviewer " + (i+1)] : editor,
    var countsPerReviewer = { "Reviewer": ["Reviewer " + (i+1)],
    // var countsPerReviewer = { "Reviewer": editor,
                  "article" : 0, "section": 0, "paragraph": 0,
                  "syntax": 0, "style": 0, "content": 0,
                  "negative": 0, "neutral": 0, "positive": 0,
                  "I1": 0, "I2": 0, "I3": 0, "I4": 0, "I5": 0,
                  "compulsory": 0, "suggestion": 0, "no_action": 0
                  };
    reviewersCounts.push(countsPerReviewer);
  });

  csvResultsVirtuosoNoPrefixes = noPrefixesInVirtuosoResults();
      console.log("NO PREFIXES:" + csvResultsVirtuosoNoPrefixes);
    console.log("ORIGINAL DATA:" + csvResultsVirtuoso);



  // ordering in the current csvResultsVirtuoso: reviewer,reviewComment,part,aspect,posNeg,impact,actionNeeded
  for (i = 1; i < csvResultsVirtuosoNoPrefixes.length; i++) {
    // find reviewer in graphcsvResultsVirtuoso
    var indexOfReviewer = reviewer.indexOf(csvResultsVirtuosoNoPrefixes[i][0]);

    // if reviewer is found, then calculate counts for every dimension
    if (indexOfReviewer > -1) {

      if (checkedDimensions[csvResultsVirtuosoNoPrefixes[i][2]] &&
          checkedDimensions[csvResultsVirtuosoNoPrefixes[i][3]] &&
          checkedDimensions[csvResultsVirtuosoNoPrefixes[i][4]] &&
          checkedDimensions["I" + csvResultsVirtuosoNoPrefixes[i][5]] &&
          checkedDimensions[csvResultsVirtuosoNoPrefixes[i][6]])
      {
          console.log(i + " -> " + csvResultsVirtuosoNoPrefixes[i][2] + "=" + checkedDimensions[csvResultsVirtuosoNoPrefixes[i][2]] +
          "; " + csvResultsVirtuosoNoPrefixes[i][3] + "=" + checkedDimensions[csvResultsVirtuosoNoPrefixes[i][3]] +
          "; " + csvResultsVirtuosoNoPrefixes[i][4] + "=" + checkedDimensions[csvResultsVirtuosoNoPrefixes[i][4]] +
          "; " + csvResultsVirtuosoNoPrefixes[i][5] + "=" + checkedDimensions["I" + csvResultsVirtuosoNoPrefixes[i][5]] +
          "; " + csvResultsVirtuosoNoPrefixes[i][6] + "=" + checkedDimensions[csvResultsVirtuosoNoPrefixes[i][6]] );

          // check whether the part is article, section or paragraph
          if (csvResultsVirtuosoNoPrefixes[i][2] == "article" && checkedDimensions["article"]) {
            reviewersCounts[indexOfReviewer].article =  reviewersCounts[indexOfReviewer].article + 1;
          }
          if (csvResultsVirtuosoNoPrefixes[i][2] == "section" && checkedDimensions["section"]) {
            reviewersCounts[indexOfReviewer].section = reviewersCounts[indexOfReviewer].section + 1;
          }
          if (csvResultsVirtuosoNoPrefixes[i][2] == "paragraph" && checkedDimensions["paragraph"]) {
            reviewersCounts[indexOfReviewer].paragraph = reviewersCounts[indexOfReviewer].paragraph + 1;
          }

          // check whether the aspect is syntax, style or content
          if (csvResultsVirtuosoNoPrefixes[i][3] == "syntax" && checkedDimensions["syntax"]){
            reviewersCounts[indexOfReviewer].syntax = reviewersCounts[indexOfReviewer].syntax + 1;
          }
          if (csvResultsVirtuosoNoPrefixes[i][3] == "style" && checkedDimensions["style"]) {
            reviewersCounts[indexOfReviewer].style = reviewersCounts[indexOfReviewer].style + 1;
          }
          if (csvResultsVirtuosoNoPrefixes[i][3] == "content" && checkedDimensions["content"]) {
            reviewersCounts[indexOfReviewer].content = reviewersCounts[indexOfReviewer].content + 1;
          }

          // check whether the positivity/negativity dimension is negative, neutral or positive
          if (csvResultsVirtuosoNoPrefixes[i][4] == "negative" && checkedDimensions["negative"]) {
            reviewersCounts[indexOfReviewer].negative = reviewersCounts[indexOfReviewer].negative + 1;
          }
          if (csvResultsVirtuosoNoPrefixes[i][4] == "neutral"  && checkedDimensions["neutral"]) {
            reviewersCounts[indexOfReviewer].neutral = reviewersCounts[indexOfReviewer].neutral + 1;
          }
          if (csvResultsVirtuosoNoPrefixes[i][4] == "positive" && checkedDimensions["positive"]) {
            reviewersCounts[indexOfReviewer].positive = reviewersCounts[indexOfReviewer].positive + 1;
          }

          // check whether the impact is 1, 2, 3, 4 or 5
          if (0 < csvResultsVirtuosoNoPrefixes[i][5] < 6 && checkedDimensions["I"+ csvResultsVirtuosoNoPrefixes[i][5]]) {
            reviewersCounts[indexOfReviewer]["I" + csvResultsVirtuosoNoPrefixes[i][5]] = reviewersCounts[indexOfReviewer]["I" + csvResultsVirtuosoNoPrefixes[i][5]] + 1;
          }

          // check whether the action needed is compulsory, suggestion or no_action
          if (csvResultsVirtuosoNoPrefixes[i][6] == "compulsory" && checkedDimensions["compulsory"]) {
            reviewersCounts[indexOfReviewer].compulsory = reviewersCounts[indexOfReviewer].compulsory + 1;
          }
          if (csvResultsVirtuosoNoPrefixes[i][6] == "suggestion" && checkedDimensions["suggestion"]) {
            reviewersCounts[indexOfReviewer].suggestion = reviewersCounts[indexOfReviewer].suggestion + 1;
          }
          if (csvResultsVirtuosoNoPrefixes[i][6] == "no_action" && checkedDimensions["no_action"]) {
            reviewersCounts[indexOfReviewer].no_action = reviewersCounts[indexOfReviewer].no_action + 1;
          }
      }
    }
  }

  return JSON.stringify(reviewersCounts);
}

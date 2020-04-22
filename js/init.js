/*
 ********************************************
 * Declaration/Definition of variables used *
 ********************************************
 */

// server address of the Virtuoso triple store
var serverConnection = "http://localhost:8081/sparql/commentsByReviewers"; // http://app:8081/sparql
// var serverConnection = "http://app:8081/sparql";

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

// array containing the results that are currently displayed based on the checked dimensions
// all results are without the prefixes; this is a subset of resultsNoPrefixes
var resultsToDisplay = [];

// array containing all reviewers of the selected paper
// one element in the form of {ORCiDk: Xk}, where
// ORCiDk = ORCiD of reviewer k, Xk = total number of review comments of reviewer k
var reviewers = [];

// maximum number of comments made by the reviewers, necessary for the x axis of the graph
var maxNrComments = 0;

// for graph generation data needs to be in the form
// ORCiD, reviewer,article,section,paragraph,syntax,style,content,negative,neutral,positive,I1,I2,I3,I4,I5,compulsory,suggestion,no_action
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
  try { // in case there is any arror retrieving the data
    // create array with all results retrieved from the SPARQL endpoint
    resultsVirtuoso = $.csv.toArrays(csvResultsVirtuoso);

    // check if the results are empty or not
    if (resultsVirtuoso.length > 0) {

      // remove the prefixes for the results, easier to handle
      resultsNoPrefixes = noPrefixesInVirtuosoResults(resultsVirtuoso);

      // extract all reviewers of the selected paper and their total number of review comments
      reviewers = getTotalReviewersAndNrComments(resultsNoPrefixes);
      maxNrComments = setMaxNrComments(reviewers);

      if (Object.keys(reviewers).length) {
        // create initial empty count array for every reviewer
        countsResults = initReviewersCounts(reviewers);

        if (countsResults != -1) {

          // calculate counts for all reviewers
          calculateCountsReviewers(resultsNoPrefixes, reviewers, countsResults, resultsToDisplay);

          // draw the graph for the retrieved, preprocessed results
          // drawGraph(JSON.stringify(reviewersCounts));
          drawGraph(countsResults);
          }
      }
    } else { // no results retrieved
      // remove the progress bar in case of error
      $("#divProgressBar").remove();
      $("#divIntroContentReviewComments").remove();
      $("#divReviewCommentsContent").empty();
      $("#divReviewCommentsContent").append("<div id='divError' style='text-align:center; color: red; font-size: large; border: #0275d8;'> <br/>No data was retrieved. If the problem persists, please write an email to c.i.bucur@vu.nl </div>");
    }
  }
  catch(error) { // in case of error retrieving the data
    $("#divProgressBar").remove();

    $("#divIntroContentReviewComments").remove();
    $("#divReviewCommentsContent").append("<div id='divError' style='text-align:center; color: red; font-size: large; border: #0275d8;'> <br/>Error retrieving the data. Please try again later and if the problem persists, please write an email to c.i.bucur@vu.nl <br/> <br/> Error: " + error + "</div>");
  }
})
// failure to retrieve Virtuoso results
.fail(function (jqXHR, textStatus, error) {
    // remove the progress bar in case of error
    $("#divProgressBar").remove();

    $("#divIntroContentReviewComments").remove();
    $("#divReviewCommentsContent").append("<div id='divError' style='text-align:center; color: red; font-size: large; border: #0275d8;'> <br/>Error retrieving the data. Please try again later and if the problem persists, please write an email to c.i.bucur@vu.nl <br/> <br/> Error: " + error + "</div>");
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
  // $(":checkbox").prop("checked", true);
  $('input[type="checkbox"]').prop("checked", true);
}

// check which checkboxes with dimensions are checked
function getDimensionsChecked() {
  checkedDimensions.forEach((checked, dimension) => {
    var dimensionCamelCase = String(dimension).charAt(0).toUpperCase() + String(dimension).substr(1).toLowerCase();
    var checkboxDimension = "checkbox".concat(dimensionCamelCase);

    checkedDimensions[dimension] = $("#".concat(checkboxDimension)).is(":checked");
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

// get the maximum number of comments of all reviewers
// useful for drawing the x axis
function setMaxNrComments(reviewers) {
  var max = 0;

  // if array of reviewers exists and it is not empty
  if (Array.isArray(reviewers) && Object.keys(reviewers).length) {

    Object.keys(reviewers).forEach( (ORCiD, index) => {
      (reviewers[ORCiD] > max ? (max = reviewers[ORCiD]) : max);
    });
  }

  return max;
}

// create empty reviewer counts for every reviewer => helper function for drawing
function initReviewersCounts(reviewers) {
  // if array of reviewers exists and it is not empty
  if (Array.isArray(reviewers) && Object.keys(reviewers).length) {
    var reviewersCounts = [];

    // for graph generation data needs to be in the form of
    // ORCiD, reviewer,article,section,paragraph,syntax,style,content,negative,neutral,positive,I1,I2,I3,I4,I5,compulsory,suggestion,no_action
    Object.keys(reviewers).forEach( (ORCiD, index) => {
      // console.log("reviewer " + key + " = " + reviewers[key] + " -> " + index);
      var countsPerReviewer = { "ORCiD": ORCiD,
                    "reviewer": "Reviewer " + (index + 1),
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

// calculate the number of review comments for each dimension based on the retrieved results (no prefixes)
// results contain the following fields: "reviewer","reviewComment","part","aspect","posNeg","impact","actionNeeded", "reviewCommentContent"
function calculateCountsReviewers(results, reviewersList, reviewersCounts, displayResults) {
  // if the array with results ot display is not empty, then empty it
  if (displayResults.length) {
    displayResults.length = 0;
  }

  console.log("results.length=" + results.length);
  for (var i = 0; i < results.length; i++) {
    var resultItem = results[i];

    for (var j = 0; j < reviewersCounts.length; j++) {
      if (resultItem[0] == reviewersCounts[j].ORCiD) {
        // if reviewer is found, then calculate counts for every dimension that is checked
        if (checkedDimensions[resultItem[2]] &&
            checkedDimensions[resultItem[3]] &&
            checkedDimensions[resultItem[4]] &&
            checkedDimensions["I" + resultItem[5]] &&
            checkedDimensions[resultItem[6]]) {

          // check whether the part is article, section or paragraph
          if (resultItem[2] == "article" && checkedDimensions["article"]) {
            reviewersCounts[j].article =  reviewersCounts[j].article + 1;
          }
          if (resultItem[2] == "section" && checkedDimensions["section"]) {
            reviewersCounts[j].section = reviewersCounts[j].section + 1;
          }
          if (resultItem[2] == "paragraph" && checkedDimensions["paragraph"]) {
            reviewersCounts[j].paragraph = reviewersCounts[j].paragraph + 1;
          }

          // check whether the aspect is syntax, style or content
          if (resultItem[3] == "syntax" && checkedDimensions["syntax"]){
            reviewersCounts[j].syntax = reviewersCounts[j].syntax + 1;
          }
          if (resultItem[3] == "style" && checkedDimensions["style"]) {
            reviewersCounts[j].style = reviewersCounts[j].style + 1;
          }
          if (resultItem[3] == "content" && checkedDimensions["content"]) {
            reviewersCounts[j].content = reviewersCounts[j].content + 1;
          }

          // check whether the positivity/negativity dimension is negative, neutral or positive
          if (resultItem[4] == "negative" && checkedDimensions["negative"]) {
            reviewersCounts[j].negative = reviewersCounts[j].negative + 1;
          }
          if (resultItem[4] == "neutral"  && checkedDimensions["neutral"]) {
            reviewersCounts[j].neutral = reviewersCounts[j].neutral + 1;
          }
          if (resultItem[4] == "positive" && checkedDimensions["positive"]) {
            reviewersCounts[j].positive = reviewersCounts[j].positive + 1;
          }

          // check whether the impact is 1, 2, 3, 4 or 5
          if (0 < resultItem[5] < 6 && checkedDimensions["I"+ resultItem[5]]) {
            reviewersCounts[j]["I" + resultItem[5]] = reviewersCounts[j]["I" + resultItem[5]] + 1;
          }

          // check whether the action needed is compulsory, suggestion or no_action
          if (resultItem[6] == "compulsory" && checkedDimensions["compulsory"]) {
            reviewersCounts[j].compulsory = reviewersCounts[j].compulsory + 1;
          }
          if (resultItem[6] == "suggestion" && checkedDimensions["suggestion"]) {
            reviewersCounts[j].suggestion = reviewersCounts[j].suggestion + 1;
          }
          if (resultItem[6] == "no_action" && checkedDimensions["no_action"]) {
            reviewersCounts[j].no_action = reviewersCounts[j].no_action + 1;
          }

          displayResults.push(resultItem);
        }
      }
    }
  }
}


// function that draws the graph
// dataReviewers is the data in JSON format received after a GET request to the server
// function drawGraph(dataReviewers) {
function drawGraph(data) {
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

  // var data = JSON.parse(dataReviewers);
  // d3.csv(dataReviewers, (error, data) => {
    // d3.json(dataReviewers, (error, data) => {

    // get all dimension headers present in the counts, except for the reviewer and the ORCiD
    // rowHeaders=article,section,paragraph,syntax,style,content,negative,neutral,positive,I1,I2,I3,I4,I5,compulsory,suggestion,no_action
    var rowHeaders = d3.keys(data[0]).filter(function(key) { return ((key !== "reviewer") && (key != "ORCiD")) });

     // set color range for the dimensions present in the data file
     var colorRange = [];

     for (var i = 0; i < rowHeaders.length; i++) {
       colorRange[i] = colors[rowHeaders[i]];
       // console.log("colorRange[" + i + "]=" + colorRange[i]);
     }

     color.range(colorRange);

     // map colors in the defined palette to the dimensions of the data
     color.domain(rowHeaders);

     // get data for each dimension of one reviewer at a time and
     // calculate the coordonates for the beginning and the end of each dimension for the x axis
     data.forEach((reviewerCounts) => {

       var xRow = new Array();
       reviewerCounts.rowDetails = rowHeaders.map((nameDimension) => {
         for (dim in dimensions) {
           if($.inArray(nameDimension, dimensions[dim]) >= 0){
             if (!xRow[dim]){
               xRow[dim] = 0;
             }
             xBegin = xRow[dim];
             xRow[dim] += +reviewerCounts[nameDimension];
             return {ORCiD: reviewerCounts.ORCiD, reviewer: reviewerCounts.reviewer, name: nameDimension, row: dim, xBegin: xBegin, xEnd: +reviewerCounts[nameDimension] + xBegin,};
           }
         }
       });
       // get maximum number of review comments for each reviewer
       reviewerCounts.total = d3.max(reviewerCounts.rowDetails, function(reviewerCounts) {
         return reviewerCounts.xEnd;
       });
     });

   // map data onto graph axes
   var reviewers = data.map((d) => { return d.reviewer; });

   y0.domain(reviewers);
   y1.domain(d3.keys(dimensions)).rangeRoundBands([0, y0.rangeBand()]);

   x.domain([0, d3.max(data, function(d) {
     return d.total;
   })]);
   // max number shown on x axis, divisible by 5
   x.domain([0, Math.ceil(maxNrComments/5) * 5]);

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
       return "translate(0," + y0(d.reviewer) + ")"; });

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
         .on("click", function(d, i) {
          // empty contents of div where the content of the review comments is shown
           $("#divIntroContentReviewComments").remove();
           $("#divReviewCommentsContent").empty();

           var dataToShow = [];
           // console.log("@@@@@@@@@@@@@@@@@@@@d.reviewer=" + d.reviewer + ", d.ORCiD=" + d.ORCiD);
           // var reviewerId = ((d.reviewer).toString()).split(" ").pop(); // does this change d.reviewer data?!
           // var resultsNoPrefixes = noPrefixesInVirtuosoResults();

           for (var i = 0; i < resultsToDisplay.length; i++) {
             // if (reviewer[reviewerId-1] == resultsNoPrefixes[i][0]) {
             if (d.ORCiD == resultsToDisplay[i][0]) {
               switch (d.row) {
                 case "part":
                  // the rectangle checked referres to the part of article targeted by the review comment
                  if (resultsToDisplay[i][2] == d.name) {
                    dataToShow.push(resultsToDisplay[i].slice());
                  }
                  break;
                case "aspect":
                  // the rectangle checked referres to the aspect of the review comment
                  if (resultsToDisplay[i][3] == d.name) {
                    dataToShow.push(resultsToDisplay[i].slice());
                  }
                  break;
                case "positivity_negativity":
                  // the rectangle checked referres to the positivity_negativity of the review comment
                  if (resultsToDisplay[i][4] == d.name) {
                    dataToShow.push(resultsToDisplay[i].slice());
                  }
                  break;
                case "impact":
                  // the rectangle checked referres to the impact of the review comment
                  if (("I" + resultsToDisplay[i][5]) == d.name) {
                    dataToShow.push(resultsToDisplay[i].slice());
                  }
                  break;
                case "action_needed":
                // the rectangle checked referres to the impact of the review comment
                  if (resultsToDisplay[i][6] == d.name) {
                    dataToShow.push(resultsToDisplay[i].slice());
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

$(":checkbox").change( () => {
  getReviewComments();
});

// sends a request to the server to draw the graph
function getReviewComments() {
  getDimensionsChecked();

  if (resultsNoPrefixes.length > 0) {
    $("#divReviewCommentsContent").empty();
    $("#divReviewCommentsContent").append("<div id='divIntroContentReviewComments' style='text-align:center; color: #0275d8; font-size: large; border: #0275d8;'> <br/> Click on a rectangle in the graph to show the content of the review comments here</div>");

    countsResults = initReviewersCounts(reviewers);
    calculateCountsReviewers(resultsNoPrefixes, reviewers, countsResults, resultsToDisplay);
    drawGraph(countsResults);

    // no results to display according to the selected criteria
    if (!resultsToDisplay.length) {
      $("#divReviewCommentsContent").empty();
      $("#divReviewCommentsContent").append("<div id='divError' style='text-align:center; color: red; font-size: large; border: #0275d8;'> <br/>No data to display. No entries match the chosen options. </div>");
    }
  } else { // no results retrieved from Virtuoso
    // remove the progress bar in case of error
    $("#divProgressBar").remove();
    $("#divIntroContentReviewComments").remove();
    $("#divReviewCommentsContent").empty();
    $("#divReviewCommentsContent").append("<div id='divError' style='text-align:center; color: red; font-size: large; border: #0275d8;'> <br/>No data was retrieved. If the problem persists, please write an email to c.i.bucur@vu.nl </div>");
  }
}

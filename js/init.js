var serverConnection1 = "http://localhost:8081/editors/csv";
var serverConnection2 = "http://localhost:8081/editors";

var serverConnection = "http://localhost:8081/sparql";

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

$("#btnShowReviewComments").click(getReviewComments);

// $("#tdReviewCommentsContent").text("hello world");
// $("#tdReviewCommentsContent").append("<div class='border border-dark rounded'>the new guy</div>");

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

// window.onload = function () {
//   console.log("=======IN WINDOW LOAD==============");
//     if (!("hasLoadedPageBefore" in localStorage)) {
//       console.log("=======not in local storage==============");
//       $.get(serverConnection1)
//       .done((dataEditors, status) => {
//         drawGraph(dataEditors);
//       })
//       .fail(function (jqXHR, textStatus, error) {
//             console.log("Get error: " + error);
//       });
//
//       localStorage.hasLoadedPageBefore = true;
//     }
// }

function getDimensionsChecked() {
  checkedDimensions.forEach((checked, dimension) => {
    var dimensionCamelCase = String(dimension).charAt(0).toUpperCase() + String(dimension).substr(1).toLowerCase();
    var checkboxDimension = "checkbox".concat(dimensionCamelCase);
    checkedDimensions[dimension] = $("#".concat(checkboxDimension)).is(":checked");
    console.log(dimension + ":" + checkedDimensions[dimension]);
    });
}

console.log(checkedDimensions);

getDimensionsChecked();
$.get(serverConnection, checkedDimensions)
.done((dataVirtuoso, status) => {
  console.log("data:" + dataVirtuoso);
  console.log("status:" + status);

  var results = preprocessVirtuosoResults(dataVirtuoso);
  drawGraph(results);

  var contentReviews = [];
  var stringContentReviews = "";
  var csvData = [];
  csvData = $.csv.toArrays(dataVirtuoso);

  for (i = 1; i < csvData.length; i++) {
    // console.log("**********************");
    // console.log(csvData[i]);
    // console.log("**********************");
    contentReviews.push(csvData[i][7]);
    // stringContentReviews = stringContentReviews.concat(`${csvData[i][7]}`);
    // $("#tdReviewCommentsContent").text("hello world");
    $("#divReviewCommentsContent").append("<div class='border border-dark rounded p-1'>" +
      "<span class='legendSmall' style='background: " + colors["paragraph"] + "; width:75px;'>paragraph</span> " +
      "<span class='legendSmall' style='background: " + colors["content"] + ";'>content</span> " +
      "<span class='legendSmall' style='background: " + colors["negative"] + ";'>negative</span> " +
      "<span class='legendImpactSmall' style='background: " + colors["I3"] + ";'>3</span> " +
      "<span class='legendSmall' style='background: " + colors["compulsory"] + "; width:83px;'>compulsory</span> <br/> " +
      csvData[i][7] + "</div> <br/>");
  }
  // $("#reviewCommentsContent").text(stringContentReviews);
})
.fail(function (jqXHR, textStatus, error) {
      console.log("Get error: " + error);
});

// Virtuoso results should be a CSV in the form of "reviewer","reviewComment","part","aspect","posNeg","impact","actionNeeded"
function preprocessVirtuosoResults(results) {
 	// first read CSV file with results
	  var csvData = [];
		csvData = $.csv.toArrays(results);

		var reviewer = [];

		// for graph generation data needs to be in the form of
		// Reviewer,article,section,paragraph,syntax,style,content,negative,neutral,positive,I1,I2,I3,I4,I5,compulsory,suggestion,no_action
		for (var i = 1; i < csvData.length; i++) {
			if (!reviewer.includes(csvData[i][0])) {
				reviewer.push(csvData[i][0]);
			}
		}

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
        if (patternArticle.test(csvData[i][2])) {
          reviewersCounts[indexOfReviewer].article =  reviewersCounts[indexOfReviewer].article + 1;
        }
        if (patternSection.test(csvData[i][2])) {
          reviewersCounts[indexOfReviewer].section = reviewersCounts[indexOfReviewer].section + 1;
        }
        if (patternParagraph.test(csvData[i][2])) {
          reviewersCounts[indexOfReviewer].paragraph = reviewersCounts[indexOfReviewer].paragraph + 1;
        }

        // check whether the aspect is syntax, style or content
        if (patternSyntax.test(csvData[i][3])){
          reviewersCounts[indexOfReviewer].syntax = reviewersCounts[indexOfReviewer].syntax + 1;
        }
        if (patternStyle.test(csvData[i][3])) {
          reviewersCounts[indexOfReviewer].style = reviewersCounts[indexOfReviewer].style + 1;
        }
        if (patternContent.test(csvData[i][3])) {
          reviewersCounts[indexOfReviewer].content = reviewersCounts[indexOfReviewer].content + 1;
        }

        // check whether the positivity/negativity dimension is negative, neutral or positive
        if (patternNegative.test(csvData[i][4])) {
          reviewersCounts[indexOfReviewer].negative = reviewersCounts[indexOfReviewer].negative + 1;
        }
        if (patternNeutral.test(csvData[i][4])) {
          reviewersCounts[indexOfReviewer].neutral = reviewersCounts[indexOfReviewer].neutral + 1;
        }
        if (patternPositive.test(csvData[i][4])) {
          reviewersCounts[indexOfReviewer].positive = reviewersCounts[indexOfReviewer].positive + 1;
        }

        // check whether the impact is 1, 2, 3, 4 or 5
        if (0 < csvData[i][5] < 6) {
          reviewersCounts[indexOfReviewer]["I" + csvData[i][5]] = reviewersCounts[indexOfReviewer]["I" + csvData[i][5]] + 1;
        }

        // check whether the action needed is compulsory, suggestion or no_action
        if (patternCompulsory.test(csvData[i][6])) {
          reviewersCounts[indexOfReviewer].compulsory = reviewersCounts[indexOfReviewer].compulsory + 1;
        }
        if (patternSuggestion.test(csvData[i][6])) {
          reviewersCounts[indexOfReviewer].suggestion = reviewersCounts[indexOfReviewer].suggestion + 1;
        }
        if (patternNoAction.test(csvData[i][6])) {
          reviewersCounts[indexOfReviewer].no_action = reviewersCounts[indexOfReviewer].no_action + 1;
        }
      }
    }

    return JSON.stringify(reviewersCounts);
}

// function that draws the graph
// dataEditors is the data in JSON format received after a GET request to the server
function drawGraph(dataEditors) {
  // remove the graph that was drawn before
  d3.select("#graphArea").selectAll("svg").remove();

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
  var svg = d3.select("#graphArea").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + (margin.bottom + 10));

  // added inner child to put label outside the graph
  var inner = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xBegin;

  // definition of dimensions used in the grouped stacked chart
  var dimensions = {
    "part" : ["article","section","paragraph"],
    "aspect" : ["syntax","style","content"],
    "positivity_negativity" : ["negative", "neutral", "positive"],
    "impact" : ["I1", "I2", "I3", "I4", "I5"],
    "action_needed" : ["compulsory", "suggestion", "no_action"]
  }

  console.log("DATA EDITORS:" + dataEditors);
  var data = JSON.parse(dataEditors);
  // d3.csv(dataEditors, (error, data) => {
    // d3.json(dataEditors, (error, data) => {
    // console.log("_____________________");
    // console.log("json data:");
    // console.log(data);
    // console.log("_____________________");

    var rowHeaders = d3.keys(data[0]).filter(function(key) { return key !== "Reviewer"; });

    console.log("###################rowHeaders:" + rowHeaders);
    console.log("###################rdata.length" + data.length);

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
         .on("click", function(d ,i) {
           var mouse = d3.mouse(this);
             // showReviewComments();
             // $("#reviewCommentsContent").text("graph clicked!!!");
             console.log("^^^^^^^^^^^^^^^^^^^^^^^^");
             console.log("d:" + d);
             console.log("d.Reviewer:" + d.reviewer);
             console.log("d.name:" + d.name);
             console.log("d.row:" + d.row);
             console.log("d.rowDetails:" + d.rowDetails);
             console.log("y0(d.Reviewer):" + d.y0);
             console.log("select:" + d3.select(this).attr("y0"));
              // console.log(x.rangeBand());return scope.onClick({item: d});});
              console.log("i:" + i);
              console.log("mouse[1]:" + mouse[1]);
                            console.log("mouse[0]:" + mouse[0]);
             // console.log(d3.select(this)[1]);
             console.log("^^^^^^^^^^^^^^^^^^^^^^^^");
         });

   // add text labels for each dimension on top of the graph
   grouped_stackedbar.selectAll("text")
     .data(function(d) { console.log(d.rowDetails); return d.rowDetails; })
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
  $.get(serverConnection, checkedDimensions)
  .done((dataVirtuoso, status) => {
	    console.log("data:" + dataVirtuoso);
	    console.log("status:" + status);

		var results = preprocessVirtuosoResults(dataVirtuoso);
    drawGraph(results);
  })
  // jqXHR is a JS XMLHTTPRequest object
  // textStatus is the error and
  // error is Internal Server Error
  .fail(function (jqXHR, textStatus, error) {
        console.log("Get error: " + error);
    });
}

  // d3.csv("data.csv", function(error, data) {
  // d3.json(dataEditors, function(error, data) {
  //   // get the reviewers
  //   var rowHeaders = d3.keys(data[0]).filter(function(key) { return key !== "Reviewer"; });
  //
  //   // set color range for the dimensions present in the data file
  //   var colorRange = [];
  //
  //   for (var i = 0; i < rowHeaders.length; i++) {
  //     colorRange[i] = colors[rowHeaders[i]];
  //   }
  //
  //   color.range(colorRange);
  //
  //   //map colors in the defined palette to the dimensions of the data in the csv
  //   color.domain(rowHeaders);
  //
  //   // get data for each dimension and
  //   // calculate the coordonates for the beginning and the end of each for the x axis
  //   data.forEach(function(d) {
  //     var xRow = new Array();
  //     d.rowDetails = rowHeaders.map(function(name) {
  //       for (ic in dimensions) {
  //         if($.inArray(name, dimensions[ic]) >= 0){
  //           if (!xRow[ic]){
  //             xRow[ic] = 0;
  //           }
  //           xBegin = xRow[ic];
  //           xRow[ic] += +d[name];
  //           return {name: name, row: ic, xBegin: xBegin, xEnd: +d[name] + xBegin,};
  //         }
  //       }
  //     });
  //     // get maximum number of review comments for each reviewer
  //     d.total = d3.max(d.rowDetails, function(d) {
  //       return d.xEnd;
  //     });
  //   });
  //
  //   // map data onto graph axes
  //   var reviewers = data.map(function(d) { return d.Reviewer; });
  //   y0.domain(reviewers);
  //   y1.domain(d3.keys(dimensions)).rangeRoundBands([0, y0.rangeBand()]);
  //
  //   x.domain([0, d3.max(data, function(d) {
  //     return d.total;
  //   })]);
  //
  //   // draw x axis
  //   inner.append("g")
  //     .attr("class", "x axis")
  //     .attr("transform", "translate(0," + height + ")")
  //     .style("opacity", "0")
  //     .call(xAxis) ;
  //
  //   // draw y axis
  //   inner.append("g")
  //       .attr("class", "y axis")
  //       .call(yAxis)
  //       .append("text")
  //         .attr("transform", "rotate(0)")
  //         .attr("y", 6)
  //         .attr("dy", ".20em")
  //         .style("text-anchor", "end")
  //         .text(""); // .text("reviewers");
  //
  //   inner.select('.x').transition().duration(500).delay(1300).style("opacity","1");
  //
  //   // add grouped stacked bar and add Reviewers
  //   var grouped_stackedbar = inner.selectAll(".grouped_stackedbar")
  //     .data(data)
  //   .enter().append("g")
  //     .attr("class", "g")
  //     .attr("transform", function(d) {
  //       return "translate(0," + y0(d.Reviewer) + ")"; });
  //
  //   // draw stacked bars for each dimension of each Reviewer
  //   grouped_stackedbar.selectAll("rect")
  //     .data(function(d) { return d.rowDetails; })
  //       .enter().append("rect")
  //         .attr("height", y1.rangeBand())
  //         .attr("y", function(d) {
  //           return y1(d.row);
  //         })
  //         .attr("x", function(d) {
  //           return x(d.xBegin);
  //         })
  //         .attr("width", function(d) {
  //           return x(d.xEnd) - x(d.xBegin);
  //         })
  //         .style("fill", function(d) { return color(d.name); })
  //         .on("mouseover", function(d) {
  //             d3.select(this).style("fill", d3.rgb(color(d.name)).darker(2));
  //         })
  //         .on("mouseout", function(d) {
  //             d3.select(this).style("fill", color(d.name))
  //         });
  //
  //   // add text labels for each dimension on top of the graph
  //   grouped_stackedbar.selectAll("text")
  //     .data(function(d) { console.log(d.rowDetails); return d.rowDetails; })
  //       .enter().append("text")
  //         .attr("x", function(d) {
  //           return x(d.xBegin) + (x(d.xEnd) - x(d.xBegin))/2;
  //         })
  //         .attr("y", function(d) {
  //           return y1(d.row);
  //         })
  //         .attr("dy", "1.2em")
  //         .style("font-size", "14px")
  //         .style("fill", function(d) {
  //           if (d.name == "I3" || d.name == "I4" || d.name == "I5")
  //             return "white";
  //           return "black";
  //         })
  //         .text(function(d,i) {
  //           return (d.xEnd-d.xBegin) !== 0 ? (d.xEnd-d.xBegin) : "";
  //         })
  //         .on("mouseover", function(d) {
  //             d3.select(this).style("fill", "white");
  //             d3.select(this).style("font-weight", "bold");
  //         })
  //         .on("mouseout", function(d) {
  //           d3.select(this).style("font-weight", "");
  //           d3.select(this).style("fill", function(d) {
  //             if (d.name == "I3" || d.name == "I4" || d.name == "I5")
  //               return "white";
  //             return "black";
  //           });
  //         });
  //       });
  //     });

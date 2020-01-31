var checkedDimensions = new Map([
  ["article": true],
  ["section": true],
  ["paragraph": true],
  ["syntax": true],
  ["style": true],
  ["content": true],
  ["negative": true],
  ["neutral": true],
  ["positive": true],
  ["I1": true],
  ["I2": true],
  ["I3": true],
  ["I4": true],
  ["I5": true],
  ["compulsory": true],
  ["suggestion": true],
  ["no_action": true]
]);


function checkAllCheckboxes() {
  $('input[type="checkbox"]').prop("checked", true);
}

checkAllCheckboxes();

$("#btnShowReviewComments").click(getReviewComments);

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

function getReviewComments() {
  checkedDimensions.forEach((k, v) => {
    console.log(`Key is ${k} and value is ${v}`));
  // $('input[type="checkbox"]').click(function(){
  //   var dimensionName = str.replace(/checkbox/i, "").toLowerCase();
      var dimension = ${k};
      var dimensionCamelCase = dimension.charAt(0).toUpperCase() + dimension.substr(1).toLowerCase()
      var checkboxDimension = "checkbox".concat();
      checkedDimensions[dimensionName] = $(checkboxDimension).is(":checked");
      console.log(dimensionName + " is checked:" + checkedDimensions[dimensionName]);
      // if($(this).is(":checked")){
      //     console.log($(this).prop('id') + " is checked.");
      // }
      // else if($(this).is(":not(:checked)")){
      //     console.log($(this).prop('id') + " is unchecked.");
      // }
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

// graph size
var margin = {top: 10, right: 100, bottom: 30, left: 100},
    width = 960 - margin.left - margin.right,
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
    .attr("height", height + margin.top + margin.bottom);

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

// reading the data from a csv file and mapping it on the dimensions defined above
// data.csv contains all data for all dimensions
// Qi.csv, where i = 1,..., 6 contains the data for question number i in the questionnaire
var serverConnection = "http://localhost:8081/editors/csv";

$.get(serverConnection, checkedDimensions)
  .done(function (dataEditors, status)  {
    console.log("data:" + dataEditors);
    console.log("status:" + status);

    var data = JSON.parse(dataEditors);
    console.log("_____________________");
    console.log("json data:");
    console.log(data);
    console.log("_____________________");

    // d3.json("data.json", function(error, dataJSON) {
    //   console.log("_____________________");
    //   console.log("json data:");
    //   console.log(dataJSON);
    //   console.log("_____________________");
    // });

    var rowHeaders = d3.keys(data[0]).filter(function(key) { return key !== "Reviewer"; });

     // set color range for the dimensions present in the data file
     var colorRange = [];

     for (var i = 0; i < rowHeaders.length; i++) {
       colorRange[i] = colors[rowHeaders[i]];
     }

     color.range(colorRange);

     //map colors in the defined palette to the dimensions of the data in the csv
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
             return {name: name, row: ic, xBegin: xBegin, xEnd: +d[name] + xBegin,};
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

     x.domain([0, d3.max(data, function(d) {
       return d.total;
     })]);

     // draw x axis
     inner.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .style("opacity", "0")
       .call(xAxis) ;

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
  })
  // jqXHR is a JS XMLHTTPRequest object
  // textStatus is the error and
  // error is Internal Server Error
  .fail(function (jqXHR, textStatus, error) {
        console.log("Get error: " + error);
    });

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

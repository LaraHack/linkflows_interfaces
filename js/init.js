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
d3.csv("data.csv", function(error, data) {
  // get the reviewers
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
        d3.select(this).style("fill", color(d.name));

    grouped_stackedbar.selectAll(".text")
        .data(function(d) { console.log(d.rowDetails); return d.rowDetails; })
      .enter().append("text")
        .attr("x", function(d) {
          return x(d.xBegin) + (x(d.xEnd) - x(d.xBegin))/2;
        })
        .attr("y", function(d) {
          return y1(d.row);
        })
        .attr("dy", "1.1em")
        // .style("text-anchor", "start")
        .style("font-size", "16px")
        .style("color", "white")
        .text(function(d,i) { console.log(d.xEnd-d.xBegin); return (d.xEnd-d.xBegin) !== 0 ? (d.xEnd-d.xBegin) : "" });

    })

    // svgContainer.selectAll(".text")
    // 	  .data(data)
    // 	  .enter()
    // 	  .append("text")
    // 	  .attr("class","label")
    // 	  .attr("x", (function(d) { return xScale(d.food) + xScale.rangeBand() / 2 ; }  ))
    // 	  .attr("y", function(d) { return yScale(d.quantity) + 1; })
    // 	  .attr("dy", ".75em")
    // 	  .text(function(d) { return d.quantity; });

    // .append("text")
    //   .attr("x", function(d) { return x(d.xBegin); })
    //   .attr("y", y1.rangeBand()/2)
    //   .attr("dy", "0.5em")
    //   .attr("dx", "0.5em")
    //   .style("font" ,"10px sans-serif")
    //   .style("color", "white")
    //   .style("text-anchor", "middle")
    //   .text(function(d) { console.log(d.xEnd-d.xBegin); return (d.xEnd-d.xBegin) !== 0 ? (d.xEnd-d.xBegin) : "" });


      // grouped_stackedbar.append("text")
      //    .attr("x", 200)
   	  // .attr("y",y0.rangeBand()/2 )
      //    .style("text-anchor", "end")
   	  // .style("font-size", "20px")
   	  // .style("color", "white")
   	  // .text(function(d,i) { return i+1; });

  // //add a value label to the right of each bar
  // grouped_stackedbar.append("text")
  //     .attr("class", "label")
  //     //y position of the label is halfway down the bar
  //     .attr("y", function (d) {
  //         return y(d.name) + y.rangeBand() / 2 + 4;
  //     })
  //     //x position is 3 pixels to the right of the bar
  //     .attr("x", function (d) {
  //         return x(d.value) + 3;
  //     })
  //     .text(function (d) {
  //         return d.value;
  //     });

// TODO: add legend outside graph
// TODO: in the legend make one column for each dimension

// var legend = inner.selectAll(".legend")
//     .data(columnHeaders.slice(0,5))
//   .enter().append("g")
//     .attr("class", "legend")
//     .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
//     // .attr("transform", position)
//
//     console.log("colHeaders:" + columnHeaders.slice());

  // function position(d,i) {
  //   var c = 3;   // number of columns
  //   var h = 20;  // height of each entry
  //   var w = 50; // width of each entry (so you can position the next column)
  //   var tx = 50; // tx/ty are essentially margin values
  //   var ty = 10;
  //   var x = i % c * w + tx;
  //   var y = Math.floor(i / c) * h + ty;
  //   return "translate(" + x + "," + y + ")";
  // }

// legend.append("rect")
//     .attr("x", width - 18)
//     .attr("width", 18)
//     .attr("height", 18)
//     .style("fill", color);
//
// legend.append("text")
//     .attr("x", width - 24)
//     .attr("y", 9)
//     .attr("dy", ".35em")
//     .style("text-anchor", "end")
//     .text(function(d) { return d; });

});

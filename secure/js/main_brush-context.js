

var data
var minDateFilter, maxDateFilter
// HELPERS
var parseDate = d3.time.format('%m/%d/%Y').parse;

var dateString = d3.time.format("%d %b %Y");


function fetchData(){
  d3.csv('data/data-rough.csv', function (rows) {
    data = rows;
    data.forEach(function(d) {
      d.start = parseDate(d.start);
      d.end = parseDate(d.end);
      d.budget = +d.budget;
    });
    buildGraph();

  });

}


function buildGraph(){

var minDate = d3.min(data, function(d) { return d.start });
var maxDate = d3.max(data, function(d) { return d.end });
graphData = d3.nest()
  .key(function(d) { return d; })
  .rollup(function() { return { totalprj: 0, totalbudget: 0 } })
  .entries(d3.time.day.range(minDate, maxDate, 1))
graphData.forEach(function(d){
  data.filter(function(prj){ return prj.start <= new Date(d.key) && prj.end > new Date(d.key); })
    .forEach(function(activeprj){
      d.values.totalbudget += activeprj.budget
      d.values.totalprj ++;
    })
});

var margin = {top: 10, right: 10, bottom: 100, left: 80},
    margin2 = {top: 430, right: 10, bottom: 20, left: 80},
    width = $('#timeline-graph').innerWidth() - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom, //390
    height2 = 500 - margin2.top - margin2.bottom; // 50

var x = d3.time.scale().range([0, width]),
    x2 = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([height, 0]),
    y2 = d3.scale.linear().range([height2, 0]);

var xAxis = d3.svg.axis().scale(x).orient("bottom"),
    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
    yAxis = d3.svg.axis().scale(y).orient("left");
var brush = d3.svg.brush()
    .x(x2)
    .on("brush", brushed);

var area = d3.svg.area()
    .interpolate("step")
    .x(function(d) { return x(new Date(d.key)); })
    .y0(height)
    .y1(function(d) { return y(d.values.totalbudget); });

var area2 = d3.svg.area()
    .interpolate("step")
    .x(function(d) { return x2(new Date(d.key)); })
    .y0(height2)
    .y1(function(d) { return y2(d.values.totalbudget); });

var svg = d3.select("#timeline-graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height);

var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

x.domain([minDate, maxDate]);
y.domain([0, d3.max(graphData, function(d) { return d.values.totalbudget; })]);
x2.domain(x.domain());
y2.domain(y.domain());

focus.append("path")
  .datum(graphData)
  .attr("class", "area")
  .attr("d", area);

focus.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

focus.append("g")
  .attr("class", "y axis")
  .call(yAxis);

context.append("path")
  .datum(graphData)
  .attr("class", "area")
  .attr("d", area2);

context.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height2 + ")")
  .call(xAxis2);

context.append("g")
  .attr("class", "x brush")
  .call(brush)
  .selectAll("rect")
  .attr("y", -6)
  .attr("height", height2 + 7);


function brushed() {
  // Use x.domain to filter the data, then find the max and min duration of this new set, then set y.domain to that
  x.domain(brush.empty() ? x2.domain() : brush.extent());
  var totalbudgetFiltered = graphData.filter(function(d, i) {
    if ( (new Date(d.key) >= x.domain()[0]) && (new Date(d.key) <= x.domain()[1]) ) {
      return d.values.totalbudget;
    }
  })
  y.domain([0, d3.max(totalbudgetFiltered.map(function(d) { return d.values.totalbudget; }))]);
  focus.select(".area").transition().duration(1500).ease("sin-in-out").attr("d", area);
  focus.select(".x.axis").call(xAxis);
  focus.select(".y.axis").transition().duration(1500).ease("sin-in-out").call(yAxis);
}

}


/// BAR CHART FROM EARLIER ATTEMPT

// var margin = {top: 20, right: 30, bottom: 30, left: 100},
//     width = $('#timeline-graph').innerWidth() - margin.left - margin.right,
//     height = 400 - margin.top - margin.bottom;
//
// var x = d3.time.scale()
//   .range([0, width])
//   .domain([minDate, maxDate]);
//
// var y = d3.scale.linear()
//   .range([height, 0])
//   .domain([0, d3.max(graphData, function(d) { return d.values.totalbudget; })]);
//
// var xAxis = d3.svg.axis()
//   .scale(x)
//   .orient("bottom");
//
// var yAxis = d3.svg.axis()
//   .scale(y)
//   .orient("left");
//
// var timelinegraph = d3.select('#timeline-graph').append('svg')
//     .attr('width', width + margin.left + margin.right)
//     .attr('height', height + margin.top + margin.bottom)
//   .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
// var barWidth = width / graphData.length;
//
// // timelinegraph.append("g")
// //       .attr("class", "x axis")
// //       .attr("transform", "translate(0," + height + ")")
// //       .call(xAxis);
//
//   timelinegraph.append("g")
//       .attr("class", "y axis")
//       .call(yAxis)
//     // .append("text")
//     //   .attr("transform", "rotate(-90)")
//     //   .attr("y", 6)
//     //   .attr("dy", ".71em")
//     //   .style("text-anchor", "end")
//     //   .text("Frequency");
//
//   timelinegraph.selectAll(".bar")
//       .data(graphData)
//     .enter().append("rect")
//       .attr("class", "bar")
//       .attr("x", function(d) { return x(new Date(d.key)); })
//       .attr("width", barWidth)
//       .attr("y", function(d) { return y(d.values.totalbudget); })
//       .attr("height", function(d) { return height - y(d.values.totalbudget); });




fetchData();

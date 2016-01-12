

var data
var minDateFilter, maxDateFilter
// HELPERS
var parseDate = d3.time.format('%m/%d/%Y').parse;
var dateString = d3.time.format("%d %b %Y");
var currency = d3.format("$,")

// we want donor color to consistent across elements
var donorColor = d3.scale.ordinal()
.range(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]);

// var businessColor = d3.scale.ordinal()
// .range(["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"]);

var businessColor = d3.scale.category20()
// Constructs a new ordinal scale with a range of twenty categorical colors
// https://github.com/mbostock/d3/wiki/Ordinal-Scales#category20


var activeFilters = []
function filterData(){
  activeFilters = []
  checkboxes = $("#filter-choices input[type=checkbox]");
    for (i=0; i<checkboxes.length; i++) {
      if(checkboxes[i].checked === true) {
        activeFilters.push({
          filterKey: checkboxes[i].name,
          filterValue: checkboxes[i].value
        })
      }
    }
var y = d3.nest().key(function(d){ return d.filterKey })
      .rollup(function(values){
        var valuesArray = [];
        values.forEach(function(d){
          valuesArray.push(d.filterValue);
        });
        return valuesArray;
      }).entries(activeFilters)
console.log(y)

}



function clearCheckboxes(el){
  $(el).parent().find("input:checkbox").prop('checked',false)
  filterData();
}


function resize() {
  // setDimensions();
  // d3.select('svg').remove();
  // setup(width,height);
  // drawGeoData(world);
  d3.select("#timeline-graph").select("svg").remove();
  d3.select('#donorStartPie').select("svg").remove();
  d3.select('#donorEndPie').select("svg").remove();
  d3.select('#businessStartPie').select("svg").remove();
  d3.select('#businessEndPie').select("svg").remove();
  buildTimeline();

}

function fetchData(){
  d3.csv('data/data-rough.csv', function (rows) {
    data = rows;
    data.forEach(function(d) {
      d.start = parseDate(d.start);
      d.end = parseDate(d.end);
      d.budget = +d.budget;
    });

    donorColor.domain(data.map(function(d) { return d.donor; }));
    businessColor.domain(data.map(function(d) { return d.businessunit; }))

    buildFilters();
  });
}

function buildFilters(){
  // # get the unique values from the data for all our filter fields
  var regionArray = [],
      countryArray = [],
      donorArray = [],
      sectorArray = [],
      businessunitArray = [];
  $.each(data, function(i,item){
    item.isdregion.split(",").forEach(function(d){
      if($.inArray(d, regionArray) === -1){ regionArray.push(d) }
    });
    item.countries.split(";").forEach(function(d){
      if($.inArray(d, countryArray) === -1){ countryArray.push(d) }
    });
    if($.inArray(item.donor, donorArray) === -1){ donorArray.push(item.donor) }
    item.sector.split("; ").forEach(function(d){
      if($.inArray(d, sectorArray) === -1){ sectorArray.push(d) }
    });
    if($.inArray(item.businessunit, businessunitArray) === -1){ businessunitArray.push(item.businessunit) }

  });
  // # alphabetize them arrays
  regionArray.sort(d3.ascending())
  countryArray.sort(d3.ascending())
  donorArray.sort(d3.ascending())
  sectorArray.sort(d3.ascending())
  businessunitArray.sort(d3.ascending())
  // # add the checkbox elements to each collapse well element
  d3.select('#collapse-filter-region .filter-checkboxes').selectAll('div').data(regionArray).enter()
    .append('div').attr('class', 'checkbox').html(function(d){
      // # "name" is the data key and "value" is the data value
      return '<label><input type="checkbox" name="isdregion" value="' + d + '" onchange="filterData();">' + d + '</label>'
    });
  d3.select('#collapse-filter-country .filter-checkboxes').selectAll('div').data(countryArray).enter()
    .append('div').attr('class', 'checkbox').html(function(d){
      return '<label><input type="checkbox" name="countries" value="' + d + '" onchange="filterData();">' + d + '</label>'
    });
  d3.select('#collapse-filter-donor .filter-checkboxes').selectAll('div').data(donorArray).enter()
    .append('div').attr('class', 'checkbox').html(function(d){
      return '<label><input type="checkbox" name="donor" value="' + d + '" onchange="filterData();">' + d + '</label>'
    });
  d3.select('#collapse-filter-sector .filter-checkboxes').selectAll('div').data(sectorArray).enter()
    .append('div').attr('class', 'checkbox').html(function(d){
      return '<label><input type="checkbox" name="sector" value="' + d + '" onchange="filterData();">' + d + '</label>'
    });
  d3.select('#collapse-filter-businessunit .filter-checkboxes').selectAll('div').data(businessunitArray).enter()
    .append('div').attr('class', 'checkbox').html(function(d){
      return '<label><input type="checkbox" name="businessunit" value="' + d + '" onchange="filterData();">' + d + '</label>'
    });
  // # only allow one well open at a time
  $('.collapse').on('show.bs.collapse', function(el){
    var triggeredId = ($(el.currentTarget).attr('id'));
    var allCollapse = $('.collapse');
    $.each(allCollapse, function(i, a){
      if($(a).attr('id') !== triggeredId){ $(a).collapse('hide'); }
    })
  })

  buildTimeline();
}


var brush

function buildTimeline(){

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

  var tlmargin = {top: 10, right: 20, bottom: 60, left: 80},
    tlmargin2 = {top: 370, right: 20, bottom: 20, left: 80},
    tlwidth = $('#timeline-graph').innerWidth() - tlmargin.left - tlmargin.right,
    tlheight = 400 - tlmargin.top - tlmargin.bottom, //390
    tlheight2 = 400 - tlmargin2.top - tlmargin2.bottom; // 50

  var x = d3.time.scale().range([0, tlwidth]),
      x2 = d3.time.scale().range([0, tlwidth]),
      y = d3.scale.linear().range([tlheight, 0]),
      yPrj = d3.scale.linear().range([tlheight, 0]),
      y2 = d3.scale.linear().range([tlheight2, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom"),
      xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
      yAxis = d3.svg.axis().scale(y).orient("left"),
      yAxisPrj = d3.svg.axis().scale(yPrj).orient("right");

  brush = d3.svg.brush()
      .x(x2)
      .on("brush", brushed);

  var linePrj = d3.svg.line()
      .x(function(d) { return x(new Date(d.key)); })
      .y(function(d) { return yPrj(d.values.totalprj); });

  var area = d3.svg.area()
      .interpolate("step")
      .x(function(d) { return x(new Date(d.key)); })
      .y0(tlheight)
      .y1(function(d) { return y(d.values.totalbudget); });

  var area2 = d3.svg.area()
      .interpolate("step")
      .x(function(d) { return x2(new Date(d.key)); })
      .y0(tlheight2)
      .y1(function(d) { return y2(d.values.totalbudget); });

  var svg = d3.select("#timeline-graph").append("svg")
      .attr("width", tlwidth + tlmargin.left + tlmargin.right)
      .attr("height", tlheight + tlmargin.top + tlmargin.bottom);
  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", tlwidth)
      .attr("height", tlheight);

  var focus = svg.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + tlmargin.left + "," + tlmargin.top + ")");

  var context = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + tlmargin2.left + "," + tlmargin2.top + ")");

  x.domain([minDate, maxDate]);
  y.domain([0, d3.max(graphData, function(d) { return d.values.totalbudget; })]);
  yPrj.domain([0, d3.max(graphData, function(d) { return d.values.totalprj; })]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  focus.append("path")
    .datum(graphData)
    .attr("class", "area")
    .attr("d", area);

  focus.append("path")
    .datum(graphData)
    .attr("class", "prj-line")
    .attr("d", linePrj);

  focus.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + tlheight + ")")
    .call(xAxis);

  focus.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  focus.append("g")
    .attr("class", "yPrj axis")
    .attr("transform", "translate(" + tlwidth + " ,0)")
    .call(yAxisPrj);

  context.append("path")
    .datum(graphData)
    .attr("class", "area")
    .attr("d", area2);

  context.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + tlheight2 + ")")
    .call(xAxis2);

  context.append("g")
    .attr("class", "x brush")
    .call(brush)
    .selectAll("rect")
    .attr("y", -6)
    .attr("height", tlheight2 + 7);

  function brushed() {
    // Use x.domain to filter the data, then find the max and min duration of this new set, then set y.domain to that
    x.domain(brush.empty() ? x2.domain() : brush.extent());
    var dataDateFiltered = graphData.filter(function(d, i) {
      return (new Date(d.key) >= x.domain()[0]) && (new Date(d.key) <= x.domain()[1]);
    })
    y.domain([0, d3.max(dataDateFiltered.map(function(d) { return d.values.totalbudget; }))]);
    yPrj.domain([0, d3.max(dataDateFiltered.map(function(d) { return d.values.totalprj; }))]);
    focus.select(".area").transition().duration(1500).ease("sin-in-out").attr("d", area);
    focus.select(".prj-line").transition().duration(1500).ease("sin-in-out").attr("d", linePrj);
    focus.select(".x.axis").call(xAxis);
    focus.select(".y.axis").transition().duration(1500).ease("sin-in-out").call(yAxis);
    focus.select(".yPrj.axis").transition().duration(1500).ease("sin-in-out").call(yAxisPrj);
    drawPies(x.domain());
  }

  buildPies();

}



var donorPieRadius, donorStartPie, donorStartPiePath, donorEndPie, donorEndPiePath;
var businessStartPie, businessStartPiePath, businessEndPie, businessEndPiePath;

function buildPies(){

  var width = $('#donorStartPie').innerWidth(),
      height = $('#donorStartPie').innerWidth();
  donorPieRadius = Math.min(width, height) / 2;

  donorStartPie = d3.select('#donorStartPie').append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  donorStartPiePath = donorStartPie.selectAll("path");

  donorEndPie = d3.select('#donorEndPie').append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  donorEndPiePath = donorEndPie.selectAll("path");

  businessStartPie = d3.select('#businessStartPie').append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  businessStartPiePath = businessStartPie.selectAll("path");

  businessEndPie = d3.select('#businessEndPie').append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  businessEndPiePath = businessEndPie.selectAll("path");


  var defaultDateRange = [new Date('1/1/2016'), new Date('12/31/2017')]
  d3.select("#timeline-graph").select('svg').select('.brush')
    .call(brush.extent(defaultDateRange))
  brush.extent(defaultDateRange)
  brush.event(d3.select(".brush").transition());
  // http://bl.ocks.org/timelyportfolio/5c136de85de1c2abb6fc

  drawPies(defaultDateRange);

}

function drawPies(dates){

  // brush handles may return in the middle of a day
  startDate =d3.time.day.floor(dates[0])
  endDate =d3.time.day.floor(dates[1])

  $('#startDateTxt span').html(dateString(startDate));
  $('#endDateTxt span').html(dateString(endDate));


  function findNeighborArc(i, data0, data1, key) {
    var d;
    return (d = findPreceding(i, data0, data1, key)) ? {startAngle: d.endAngle, endAngle: d.endAngle}
        : (d = findFollowing(i, data0, data1, key)) ? {startAngle: d.startAngle, endAngle: d.startAngle}
        : null;
  }

  // Find the element in data0 that joins the highest preceding element in data1.
  function findPreceding(i, data0, data1, key) {
    var m = data0.length;
    while (--i >= 0) {
      var k = key(data1[i]);
      for (var j = 0; j < m; ++j) {
        if (key(data0[j]) === k) return data0[j];
      }
    }
  }

  // Find the element in data0 that joins the lowest following element in data1.
  function findFollowing(i, data0, data1, key) {
    var n = data1.length, m = data0.length;
    while (++i < n) {
      var k = key(data1[i]);
      for (var j = 0; j < m; ++j) {
        if (key(data0[j]) === k) return data0[j];
      }
    }
  }

  function key(d) {
    return d.data.key;
  }

  var pie = d3.layout.pie().sort(null).value(function(d) { return d.values; });

////////////////
// DONOR PIES //
// ########## //
////////////////

var donorStartPieData = d3.nest()
  .key(function(d) { return d.donor; })
  .rollup(function(values){
    return d3.sum(values, function(d) {
      return d.budget;
    })
  })
  .entries(data.filter(function(d){ return (d.start <= startDate && d.end >= startDate); }))

var donorEndPieData = d3.nest()
  .key(function(d) { return d.donor; })
  .rollup(function(values){
    return d3.sum(values, function(d) {
      return d.budget;
    })
  })
  .entries(data.filter(function(d){ return (d.start <= endDate && d.end >= endDate); }))

  var startTotBudgets = d3.sum(donorStartPieData, function(d){ return d.values; } );
  var endTotBudgets = d3.sum(donorEndPieData, function(d){ return d.values; } );
  var largestBudgets = (startTotBudgets > endTotBudgets) ? startTotBudgets : endTotBudgets;

  var pieScale = d3.scale.sqrt()
    .range([0, donorPieRadius - 10])
    .domain([0, largestBudgets])

  var startArc = d3.svg.arc()
          .outerRadius(pieScale(startTotBudgets))
          .innerRadius(0);
  var endArc = d3.svg.arc()
          .outerRadius(pieScale(endTotBudgets))
          .innerRadius(0);
  function startArcTween(d) {
    var i = d3.interpolate(this._current, d);
    this._current = i(0);
    return function(t) { return startArc(i(t)); };
  }
  function endArcTween(d) {
    var i = d3.interpolate(this._current, d);
    this._current = i(0);
    return function(t) { return endArc(i(t)); };
  }
// DONOR START DATE PIE GRAPH
// ##########################
var donorStartData0 = donorStartPiePath.data(),
  donorStartData1 = pie(donorStartPieData);

donorStartPiePath = donorStartPiePath.data(donorStartData1, key);

donorStartPiePath.enter().append("path")
  .each(function(d, i) { this._current = findNeighborArc(i, donorStartData0, donorStartData1, key) || d; })
  .attr("fill", function(d) { return donorColor(d.data.key); })
.append("title")
  .text(function(d) { return d.data.key; });

donorStartPiePath.exit()
  .datum(function(d, i) { return findNeighborArc(i, donorStartData1, donorStartData0, key) || d; })
.transition()
  .duration(750)
  .attrTween("d", startArcTween)
  .remove();

donorStartPiePath.transition()
  .duration(750)
  .attrTween("d", startArcTween);

// Legend
var donorStartLegend = d3.select('#donorStartLegend').selectAll('div').data(donorStartPieData, function(d) { return d['key']; });
// UPDATE
donorStartLegend.html(function(d){
  return '<i class="fa fa-square" style="color:' + donorColor(d.key) + '"></i> &nbsp;' + d.key + '<br><small>' + currency(d.values) + '</small>';
})
// ENTER
donorStartLegend.enter().append('div')
.attr('class', "legend-item")
.html(function(d){
  return '<i class="fa fa-square" style="color:' + donorColor(d.key) + '"></i> &nbsp;' + d.key + '<br><small>' + currency(d.values) + '</small>';
})
// REMOVE
donorStartLegend.exit().remove();
// sort
donorStartLegend.sort(function(a, b) {
  return b.values - a.values;
})

// DONOR END DATE PIE GRAPH
// ##########################
var donorEndData0 = donorEndPiePath.data(),
  donorEndData1 = pie(donorEndPieData);

donorEndPiePath = donorEndPiePath.data(donorEndData1, key);

donorEndPiePath.enter().append("path")
  .each(function(d, i) { this._current = findNeighborArc(i, donorEndData0, donorEndData1, key) || d; })
  .attr("fill", function(d) { return donorColor(d.data.key); })
.append("title")
  .text(function(d) { return d.data.key; });

donorEndPiePath.exit()
  .datum(function(d, i) { return findNeighborArc(i, donorEndData1, donorEndData0, key) || d; })
.transition()
  .duration(750)
  .attrTween("d", endArcTween)
  .remove();

donorEndPiePath.transition()
  .duration(750)
  .attrTween("d", endArcTween);

// Legend
var donorEndLegend = d3.select('#donorEndLegend').selectAll('div').data(donorEndPieData, function(d) { return d['key']; });
// UPDATE
donorEndLegend.html(function(d){
  return '<i class="fa fa-square" style="color:' + donorColor(d.key) + '"></i> &nbsp;' + d.key + '<br><small>' + currency(d.values) + '</small>';
})
// ENTER
donorEndLegend.enter().append('div')
.attr('class', "legend-item")
.html(function(d){
  return '<i class="fa fa-square" style="color:' + donorColor(d.key) + '"></i> &nbsp;' + d.key + '<br><small>' + currency(d.values) + '</small>';
})
// REMOVE
donorEndLegend.exit().remove();
// sort
donorEndLegend.sort(function(a, b) {
  return b.values - a.values;
})

////////////////////////
// BUSINESS UNIT PIES //
// ################## //
////////////////////////

var businessStartPieData = d3.nest()
  .key(function(d) { return d.businessunit; })
  .rollup(function(values){
    return d3.sum(values, function(d) {
      return d.budget;
    })
  })
  .entries(data.filter(function(d){ return (d.start <= startDate && d.end >= startDate); }))

var businessEndPieData = d3.nest()
  .key(function(d) { return d.businessunit; })
  .rollup(function(values){
    return d3.sum(values, function(d) {
      return d.budget;
    })
  })
  .entries(data.filter(function(d){ return (d.start <= endDate && d.end >= endDate); }))

// ######## gonna re-use the startArc and endArc definitions since the total budgets should be the same

// BUS UNIT START DATE PIE GRAPH
// #############################
var businessStartData0 = businessStartPiePath.data(),
  businessStartData1 = pie(businessStartPieData);

businessStartPiePath = businessStartPiePath.data(businessStartData1, key);

businessStartPiePath.enter().append("path")
  .each(function(d, i) { this._current = findNeighborArc(i, businessStartData0, businessStartData1, key) || d; })
  .attr("fill", function(d) { return businessColor(d.data.key); })
.append("title")
  .text(function(d) { return d.data.key; });

businessStartPiePath.exit()
  .datum(function(d, i) { return findNeighborArc(i, businessStartData1, businessStartData0, key) || d; })
.transition()
  .duration(750)
  .attrTween("d", startArcTween)
  .remove();

businessStartPiePath.transition()
  .duration(750)
  .attrTween("d", startArcTween);

// Legend
var businessStartLegend = d3.select('#businessStartLegend').selectAll('div').data(businessStartPieData, function(d) { return d['key']; });
// UPDATE
businessStartLegend.html(function(d){
  return '<i class="fa fa-square" style="color:' + businessColor(d.key) + '"></i> &nbsp;' + d.key + '<br><small>' + currency(d.values) + '</small>';
})
// ENTER
businessStartLegend.enter().append('div')
.attr('class', "legend-item")
.html(function(d){
  return '<i class="fa fa-square" style="color:' + businessColor(d.key) + '"></i> &nbsp;' + d.key + '<br><small>' + currency(d.values) + '</small>';
})

// REMOVE
businessStartLegend.exit().remove();
// sort
businessStartLegend.sort(function(a, b) {
  return b.values - a.values;
})

// BUSINESS END DATE PIE GRAPH
// ##########################
var businessEndData0 = businessEndPiePath.data(),
  businessEndData1 = pie(businessEndPieData);

businessEndPiePath = businessEndPiePath.data(businessEndData1, key);

businessEndPiePath.enter().append("path")
  .each(function(d, i) { this._current = findNeighborArc(i, businessEndData0, businessEndData1, key) || d; })
  .attr("fill", function(d) { return businessColor(d.data.key); })
.append("title")
  .text(function(d) { return d.data.key; });

businessEndPiePath.exit()
  .datum(function(d, i) { return findNeighborArc(i, businessEndData1, businessEndData0, key) || d; })
.transition()
  .duration(750)
  .attrTween("d", endArcTween)
  .remove();

businessEndPiePath.transition()
  .duration(750)
  .attrTween("d", endArcTween);

// Legend
var businessEndLegend = d3.select('#businessEndLegend').selectAll('div').data(businessEndPieData, function(d) { return d['key']; });
// UPDATE
businessEndLegend.html(function(d){
  return '<i class="fa fa-square" style="color:' + businessColor(d.key) + '"></i> &nbsp;' + d.key + '<br><small>' + currency(d.values) + '</small>';
})
// ENTER
businessEndLegend.enter().append('div')
.attr('class', "legend-item")
.html(function(d){
  return '<i class="fa fa-square" style="color:' + businessColor(d.key) + '"></i> &nbsp;' + d.key + '<br><small>' + currency(d.values) + '</small>';
})
// REMOVE
businessEndLegend.exit().remove();
// sort
businessEndLegend.sort(function(a, b) {
  return b.values - a.values;
})

drawCalendar();

}

function drawCalendar(){


  d3.select('#calendar-graph').select('svg').remove();

  var calendarData = data.filter(function(d){
    return ((d.start < endDate && d.end >= endDate) || (d.start < startDate && d.end >= startDate) || (d.start <= startDate && d.end >= endDate) || (d.start >= startDate && d.end <= endDate));
  }).sort(function(a, b) {
    return b.budget - a.budget;
  })

  var margin = {top: 25, right: 10, bottom: 10, left: 10},
      width = $('#calendar-graph').innerWidth(),
      barheight = 20,
      calendarGraph = d3.select('#calendar-graph').append('svg');

  calendarGraph.attr("width", width + margin.left + margin.right)
    .attr("height", (barheight * calendarData.length) + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");;

  var x = d3.time.scale()
      .range([0, width - margin.left - margin.right])
      .domain([startDate, endDate]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("top");

  var bar = calendarGraph.selectAll('g')
    .data(calendarData).enter().append('g')
    .attr("transform", function(d, i) { return "translate(" + margin.left + "," + (i * barheight + margin.top) + ")"; })
  bar.append('rect')
    .attr("x", function(d) { return x(d.start); })
    .attr("width", function(d){ return x(d.end) - x(d.start) })
    .attr("height", barheight - 1)
    .attr("fill", function(d){ return donorColor(d.donor) })
    .on("mouseover", function(d){
        var tooltipText = '<small><u>' + d.name + ' </u></br>' +
        '<b>start:</b> ' + dateString(d.start) + ' <b>/ end:</b> ' + dateString(d.end) + '<br>' +
        '<b>donor:</b> ' + d.donor + '<br>' +
        '<b>budget:</b> ' + currency(d.budget) + '</small>';
        $('#tooltip').append(tooltipText);
      })
      .on("mouseout", function(d){
        $('#tooltip').empty();
      });
  bar.append('text')
    .attr("x", 10)
    .attr("y", barheight / 2)
    .attr("dy", ".35em")
    .text(function(d) { return d.name; });

  d3.select('#calendar-graph').select('svg').select('g').attr("class", "x axis")
      .call(xAxis)

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



// tooltip follows cursor
$(document).ready(function() {
    $('body').mouseover(function(e) {
        //Set the X and Y axis of the tooltip
        $('#tooltip').css('top', e.pageY + 10 );
        $('#tooltip').css('left', e.pageX + 20 );
    }).mousemove(function(e) {
        //Keep changing the X and Y axis for the tooltip, thus, the tooltip move along with the mouse
        $("#tooltip").css({top:(e.pageY+15)+"px",left:(e.pageX+20)+"px"});
    });
});


d3.select(window).on("resize", throttle);
var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
      resize();
    }, 200);
}

fetchData();

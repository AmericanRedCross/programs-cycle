// Names of Recovery Programs for custom filter
var nplRecoveryArray = [
  "Community Action for Disaster Response (CADRE) in Nepal",
  "Developing Community Resilience in Nepal - ON HOLD",
  "FY16 Targeted Research Learning Study in Nepal with Core 2106",
  "Nepal Early Recovery WASH Program (TT&WF Chao Foundation)",
  "Nepal Earthquake Emergency Response Program with OFDA",
  "Nepal Earthquake Immediate Response",
  "Nepal Earthquake Recovery Program - Utthan",
  "Nepal Program",
  "Nepal Winterization CTP Program"
];
var phlRecoveryArray = [
  "CRS Anibong Shelter & Settlements",
  "Early Recovery Assistance to Populations Affected by Typhoon Haiyan - GRC Leyte",
  "Early Recovery Assistance to Populations Affected by Typhoon Haiyan - GRC N.Cebu",
  "Integrated Recovery Intervention in Tolosa, Philippines with Spanish Red Cross",
  "Philippines Program",
  "RFA - Australian RC - Typhoon Haiyan Recovery Program",
  "RFA - Netherlands RC - Strengthening Community Resilience of Haiyan-affected Pop",
  "RFA - Norwegian RC - Typhoon Haiyan Recovery Program",
  "TTL - Yolanda Recovery Program in Leyte Province, Philippines 2014 - 2017"
];
var htiRecoveryArray = [
  "2017 Earthquake Recovery Learning Conference",
  "Canaan Social Engagement Program",
  "Canaan Upgrading and Community Development Program with USAID",
  "Caribbean Domestic Violence and Gender Equality Conference",
  "Cholera Prevention and Response in the North Departments through HRC",
  "Cholera Prevention and Response through FRC",
  "Cholera Prevention and Response through NRC",
  "Cholera Prevention and Response through SRC",
  "Cholera Treatment and Health Service Delivery through HOPE",
  "Community Support to Children Affected by HIV through MAEC (CIF)",
  "Direct Implementation (LAMIKA Pillar 1)",
  "Directly Implemented Gran No Pi Djanm",
  "Economic Development and Livelihoods through Mercy Corps (LAMIKA Pillar 2)",
  "Economic Strengthening and Livelihoods Improvement in NW Haiti through PADF",
  "Economic Strengthening and Livelihoods Improvement through CECI",
  "EkoLakay Social Business Pilot in Port-au-Prince through SOIL",
  "Empowering Young Women to Lead Transformative Change YWCA (CIF)",
  "Enhanced Health Service Delivery Program",
  "From Camp Transformation to Urban Revitalization (CATUR) though UN Habitat",
  "FY16 Targeted Research Learning Study in Haiti with Core 2106",
  "Gender-based Violence Prevention through IRC (Phase 1 and 2)",
  "Gran No Pi Djanm",
  "Haiti Measles and Rubella Initiative (MRI) through HRC",
  "Haitian Red Cross Asset Development Program",
  "Haitian Red Cross Post Construction with USAID (CUCD)",
  "Haitian Youth Development Program",
  "HRC Response to Migrant Deportation Š—– Phase I (QAF)",
  "Improving First Aid and Emergency Health Services in Canaan through HRC",
  "Institutional Change and Development Program with HRC",
  "IT Capacity Building in Port-au-Prince and Cit’© Soleil through HELP (CIF)",
  "LAMIKA Program",
  "Livelihood Opportunities for Youth through IDEJEN (YOUTH)",
  "North Community Based Watsan Project through Haiti Outreach",
  "Nou pap kanpe! - We do not stop! through AVSI (YOUTH)",
  "Operational Support for the National Blood Transfusion Service through HRC",
  "Participatory Urban Development and Livelihoods through USAID (CUCD)",
  "Physical Renewal Project through Global Communities (LAMIKA Pillar 3)",
  "PrevSIDA Program",
  "Project Agreement between ARC and HRC for Gran No Pi Djanm",
  "Restoring Family Links Services through HRC",
  "Salary Support Grant Letter for HRC",
  "Shelter Retrofit for Rental through CARE",
  "St. Michel Hospital Reconstruction in Jacmel through CRC",
  "Support to Livelihood Resilience (North and Northeast) through CECI",
  "Upgrading and Rehabilitation of Evacuation Shelters in the North through PADF"
];

var data, filteredData;
var sliderBudgetRange = document.getElementById('slider-budget-range');
// HELPERS
var parseDate = d3.time.format('%m/%d/%Y').parse;
var dateString = d3.time.format("%d %b %Y");
var currency = d3.format("$,");

// we want donor color to consistent across elements
var donorColor = d3.scale.ordinal()
.range(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]);

var businessColor = d3.scale.category20()
// Constructs a new ordinal scale with a range of twenty categorical colors
// https://github.com/mbostock/d3/wiki/Ordinal-Scales#category20


var activeFilters = []
function filter(){
  // # what's the budget minimum?
  var minBudget = parseInt(sliderBudgetRange.noUiSlider.get());
  // # any recovery programs filtered out?
  var filteredRecovery = [];
  if(d3.select('#filter-hti').classed('fa-toggle-off')){
    filteredRecovery = filteredRecovery.concat(htiRecoveryArray); }
  if(d3.select('#filter-phl').classed('fa-toggle-off')){
    filteredRecovery = filteredRecovery.concat(phlRecoveryArray); }
  if(d3.select('#filter-npl').classed('fa-toggle-off')){
    filteredRecovery = filteredRecovery.concat(nplRecoveryArray); }
  // # look at all the checkboxes and record whats checked
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
  // # reformat the data on checks to make it easier to work with
  // ? combine this into what's above
  filterData = d3.nest().key(function(d){ return d.filterKey })
    .rollup(function(values){
      var valuesArray = [];
      values.forEach(function(d){
        valuesArray.push(d.filterValue);
      });
      return valuesArray;
    }).entries(activeFilters)
  // # update the html on the page to let the user know what filters are active
  var keyGroups = [];
  $.each(filterData,function(i,filterKey){
    var keyGroupHtml = '(<b>' + filterKey.key + '</b> <small>=</small> ';
    var valueGroups = [];
    $.each(filterKey.values, function(j,filterValue){
      valueGroups.push('<b>' + filterValue + '</b>');
    })
    keyGroupHtml += valueGroups.join(" <small>OR</small> ") + ")"
    keyGroups.push(keyGroupHtml);
  });
  $('#filter-active-text').html(keyGroups.join(" <small>AND</small> "));
  // # filter the data
  var filterKeyCount = filterData.length;
  filteredData = data.filter(function(d){
    var passCount = 0;
    var project = d;
    if(d.budget >= minBudget && $.inArray(d.name, filteredRecovery) === -1){
    $.each(filterData,function(iKey, filterKey){
      var pass = false;
      var thisKey = filterKey.key;
      $.each(filterKey.values, function(iValue, filterValue){
        // # if any of the filter values for a given key are present, that filter key is passed
        if($.inArray(filterValue, project[thisKey]) !== -1){ pass = true; }
      });
      if(pass === true){ passCount ++; }
    });
    // # if all filter keys are passed, the project passes the filtering
    return passCount === filterKeyCount;
    }
  })

  drawTimeline()

}

function clearCheckboxes(el){
  $(el).parent().find("input:checkbox").prop('checked',false)
  filter();
}

function clearAllCheckboxes(){
  var allCheckboxes = $.find("input:checkbox");
  $.each(allCheckboxes, function(i, box){ $(box).prop('checked',false); });
  filter();
}

function toggleRecovery(el){
  var toggle = d3.select(el).select('i');
  if(toggle.classed('fa-recovery-toggle-master')){
    if(toggle.classed('fa-toggle-on')){
      toggle.classed({'fa-toggle-on':false, 'fa-toggle-off':true});
      d3.selectAll('.fa-recovery-toggle').classed({'fa-toggle-on':false, 'fa-toggle-off':true});
    } else {
      toggle.classed({'fa-toggle-on':true, 'fa-toggle-off':false});
      d3.selectAll('.fa-recovery-toggle').classed({'fa-toggle-on':true, 'fa-toggle-off':false})
    }
  } else {
    if(toggle.classed('fa-toggle-on')){
      toggle.classed({'fa-toggle-on':false, 'fa-toggle-off':true});
    } else {
      toggle.classed({'fa-toggle-on':true, 'fa-toggle-off':false});
    }
  }
  filter();

}

function resize() {
  d3.select("#timeline-graph").select("svg").remove();
  d3.select('#donorStartPie').select("svg").remove();
  d3.select('#donorEndPie').select("svg").remove();
  d3.select('#businessStartPie').select("svg").remove();
  d3.select('#businessEndPie').select("svg").remove();

  buildTimeline();
}

function donorShorten(donor){
  switch (donor) {
    case 'American Red Cross,Anne Ray Charitable Trust (ARCT)':
    case 'Anne Ray Charitable Trust (ARCT)':
      return 'ARCT';
      break;
    case 'American Red Cross,Office of U.S. Foreign Disaster Assistance (OFDA)':
    case 'Office of U.S. Foreign Disaster Assistance (OFDA)':
    case 'Office of U.S. Foreign Disaster Assistance (OFDA),American Red Cross':
      return 'OFDA';
      break;
    case 'American Red Cross':
      return 'ARC';
      break;
    case 'U.S. Department of State Bureau of Population, Refugees, and Migration (PRM)':
      return 'PRM';
      break;
    case 'video':
      return ;
      break;
    default:
      return donor;
      break;
  }
}

function fetchData(){
  d3.csv('data/data.csv', function (rows) {
    data = rows;
    data.forEach(function(d) {
      d.donor = donorShorten(d.donor);
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
  // # build a slider for budget range filter
  noUiSlider.create(sliderBudgetRange, {
    start: 0,
    connect: false,
    range: {
      'min': [ 0, 25000],
      '10%': [ 100000, 50000],
      '50%': [ 500000, 100000],
      'max': [ 1000000]
    }
  });

  sliderBudgetRange.noUiSlider.on('update',function(values, handle, unencoded){
    $('#slider-min-text').html(currency(values[handle]));
  });
  sliderBudgetRange.noUiSlider.on('set', function(values, handle, unencoded){
    $('#slider-min-text').html(currency(values[handle]));
    filter();
  });

  // modal to list recovery projects associated with each country
  var modalHtml = '<h4>Haiti recovery projects</h4><small>' +
    htiRecoveryArray.sort(d3.ascending).join("<br>") + '</small>' +
    '<h4>Philippines recovery projects</h4><small>' +
    phlRecoveryArray.sort(d3.ascending).join("<br>") + '</small>' +
    '<h4>Nepal recovery projects</h4><small>' +
    nplRecoveryArray.sort(d3.ascending).join("<br>") + '</small>';
  $('#info-modal .modal-body').html(modalHtml);

  // # get the unique values from the data for all our filter fields
  var regionArray = [],
      countryArray = [],
      donorArray = [],
      sectorArray = [],
      businessunitArray = [];
  $.each(data, function(i,item){
    item.isdregion = item.isdregion.split(",");
    item.isdregion.forEach(function(d){
      if($.inArray(d, regionArray) === -1){ regionArray.push(d) }
    });
    item.countries = item.countries.split(";");
    item.countries.forEach(function(d){
      if($.inArray(d, countryArray) === -1){ countryArray.push(d) }
    });
    if($.inArray(item.donor, donorArray) === -1){ donorArray.push(item.donor) }
    item.donor = [item.donor]; // # for the filter to work all the filtered data values need to be arrays even if all possibilities are just 1 value
    item.sector = item.sector.split("; ");
    item.sector.forEach(function(d){
      if($.inArray(d, sectorArray) === -1){ sectorArray.push(d) }
    });
    if($.inArray(item.businessunit, businessunitArray) === -1){ businessunitArray.push(item.businessunit) }
    item.businessunit = [item.businessunit] // # for the filter to work all the filtered data values need to be arrays even if all possibilities are just 1 value

  });
  // # alphabetize them arrays
  regionArray.sort(d3.ascending)
  countryArray.sort(d3.ascending)
  donorArray.sort(d3.ascending)
  sectorArray.sort(d3.ascending)
  businessunitArray.sort(d3.ascending)
  // # add the checkbox elements to each collapse well element
  d3.select('#collapse-filter-region .filter-checkboxes').selectAll('div').data(regionArray).enter()
    .append('div').attr('class', 'checkbox').html(function(d){
      // # "name" is the data key and "value" is the data value
      return '<label><input type="checkbox" name="isdregion" value="' + d + '" onchange="filter();">' + d + '</label>'
    });
  d3.select('#collapse-filter-country .filter-checkboxes').selectAll('div').data(countryArray).enter()
    .append('div').attr('class', 'checkbox').html(function(d){
      return '<label><input type="checkbox" name="countries" value="' + d + '" onchange="filter();">' + d + '</label>'
    });
  d3.select('#collapse-filter-donor .filter-checkboxes').selectAll('div').data(donorArray).enter()
    .append('div').attr('class', 'checkbox').html(function(d){
      return '<label><input type="checkbox" name="donor" value="' + d + '" onchange="filter();">' + d + '</label>'
    });
  d3.select('#collapse-filter-sector .filter-checkboxes').selectAll('div').data(sectorArray).enter()
    .append('div').attr('class', 'checkbox').html(function(d){
      return '<label><input type="checkbox" name="sector" value="' + d + '" onchange="filter();">' + d + '</label>'
    });
  d3.select('#collapse-filter-businessunit .filter-checkboxes').selectAll('div').data(businessunitArray).enter()
    .append('div').attr('class', 'checkbox').html(function(d){
      return '<label><input type="checkbox" name="businessunit" value="' + d + '" onchange="filter();">' + d + '</label>'
    });
  // # only allow one well open at a time
  $('.collapse').on('show.bs.collapse', function(el){
    var triggeredId = ($(el.currentTarget).attr('id'));
    var allCollapse = $('.collapse');
    $.each(allCollapse, function(i, a){
      if($(a).attr('id') !== triggeredId){ $(a).collapse('hide'); }
    })
  })

  filteredData = data;

  buildTimeline();
}



var minDate, maxDate, yearRange, brush, yTl, yPrjTl, y2Tl, yAxisTl, yAxisPrjTl, linePrjTl, areaTl, area2Tl, focusTl, contextTl, xTl, xAxisTl
function buildTimeline(){

  minDate = d3.time.week.floor(d3.min(data, function(d) { return d.start }));
  maxDate = d3.time.week.ceil(d3.max(data, function(d) { return d.end }));

  yearRange = d3.time.year.range(d3.time.year.floor(minDate), maxDate)
  yearRange.forEach(function(d){
    d.setMonth(6)
  });

  var tlmargin = {top: 10, right: 35, bottom: 60, left: 80},
    tlmargin2 = {top: 370, right: 35, bottom: 20, left: 80},
    tlwidth = $('#timeline-graph').innerWidth() - tlmargin.left - tlmargin.right,
    tlheight = 400 - tlmargin.top - tlmargin.bottom, //390
    tlheight2 = 400 - tlmargin2.top - tlmargin2.bottom; // 50

  xTl = d3.time.scale().range([0, tlwidth]);
  var x2 = d3.time.scale().range([0, tlwidth]);

  yTl = d3.scale.linear().range([tlheight, 0]);
  yPrjTl = d3.scale.linear().range([tlheight, 0]);
  y2Tl = d3.scale.linear().range([tlheight2, 0]);

  xAxisTl = d3.svg.axis().scale(xTl).orient("bottom");
  var xAxis2 = d3.svg.axis().scale(x2).orient("bottom")
    .tickValues(yearRange)
    .tickFormat(function(d){ return "FY" + (d.getFullYear() + 1).toString().slice(2); });
  yAxisTl = d3.svg.axis().scale(yTl).orient("left");
  yAxisPrjTl = d3.svg.axis().scale(yPrjTl).orient("right");

  brush = d3.svg.brush()
      .x(x2)
      .on("brush", brushed);

  linePrjTl = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return xTl(new Date(d.key)); })
      .y(function(d) { return yPrjTl(d.values.totalprj); });

  areaTl = d3.svg.area()
      .interpolate("basis")
      .x(function(d) { return xTl(new Date(d.key)); })
      .y0(tlheight)
      .y1(function(d) { return yTl(d.values.totalbudget); });

  area2Tl = d3.svg.area()
      .interpolate("basis")
      .x(function(d) { return x2(new Date(d.key)); })
      .y0(tlheight2)
      .y1(function(d) { return y2Tl(d.values.totalbudget); });

  var svg = d3.select("#timeline-graph").append("svg")
      .attr("width", tlwidth + tlmargin.left + tlmargin.right)
      .attr("height", tlheight + tlmargin.top + tlmargin.bottom);
  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", tlwidth)
      .attr("height", tlheight);

  focusTl = svg.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + tlmargin.left + "," + tlmargin.top + ")");

  contextTl = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + tlmargin2.left + "," + tlmargin2.top + ")");

  xTl.domain([minDate, maxDate]);
  x2.domain(xTl.domain());

  focusTl.append("path")
    .attr("class", "area");

  focusTl.append("path")
    .attr("class", "prj-line");

  focusTl.selectAll("line").data(yearRange).enter().append('line')
      .attr('class', 'fiscalMark-focus')
      .attr('x1', xTl)
      .attr('y1', 0)
      .attr('x2', xTl)
      .attr('y2', tlheight)
      .attr('stroke-dasharray', '3,5').style("stroke-width", 3).style("stroke", "rgba(159, 159, 163, 0.7)").style("fill", "none")

  focusTl.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + tlheight + ")");

  focusTl.append("g")
    .attr("class", "y axis");

  focusTl.append("g")
    .attr("class", "yPrj axis")
    .attr("transform", "translate(" + tlwidth + " ,0)");

  contextTl.append("path")
    .attr("class", "area");

  contextTl.selectAll("line").data(yearRange).enter().append('line')
      .attr('class', 'fiscalMark-context')
      .attr('x1', xTl)
      .attr('y1', 0)
      .attr('x2', function(d){ return xTl(d); })
      .attr('y2', tlheight2)
      .attr('stroke-dasharray', '1,1').style("stroke-width", 3).style("stroke", "#9f9fa3").style("fill", "none")

  contextTl.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + tlheight2 + ")")
    .call(xAxis2);

  contextTl.append("g")
    .attr("class", "x brush")
    .call(brush)
    .selectAll("rect")
    .attr("y", -6)
    .attr("height", tlheight2 + 7);

  function brushed() {
    xTl.domain(brush.empty() ? x2.domain() : brush.extent());
    drawTimeline();
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

}

function drawTimeline(){

    var graphData = d3.nest()
      .key(function(d) { return d; })
      .rollup(function() { return { totalprj: 0, totalbudget: 0 } })
      .entries(d3.time.week.range(minDate, maxDate, 1))
    graphData.forEach(function(d){
      filteredData.filter(function(prj){ return prj.start <= new Date(d.key) && prj.end > new Date(d.key); })
        .forEach(function(activeprj){
          d.values.totalbudget += activeprj.budget
          d.values.totalprj ++;
        })
    });

    // Use x.domain to filter the data, then find the max and min duration of this new set, then set y.domain to that
    var dataDateFiltered = graphData.filter(function(d, i) {
      return (new Date(d.key) >= xTl.domain()[0]) && (new Date(d.key) <= xTl.domain()[1]);
    })
    yTl.domain([0, d3.max(dataDateFiltered.map(function(d) { return d.values.totalbudget; }))]);
    y2Tl.domain(yTl.domain());
    yPrjTl.domain([0, d3.max(dataDateFiltered.map(function(d) { return d.values.totalprj; }))]);
    focusTl.select(".area").datum(graphData).transition().duration(1500).ease("sin-in-out").attr("d", areaTl);
    focusTl.select(".prj-line").datum(graphData).transition().duration(1500).ease("sin-in-out").attr("d", linePrjTl);
    focusTl.selectAll(".fiscalMark-focus").transition().duration(1500).ease("sin-in-out").attr('x1', xTl).attr('x2', xTl)
    focusTl.select(".x.axis").call(xAxisTl);
    focusTl.select(".y.axis").transition().duration(1500).ease("sin-in-out").call(yAxisTl);
    focusTl.select(".yPrj.axis").transition().duration(1500).ease("sin-in-out").call(yAxisPrjTl);
    contextTl.select(".area").datum(graphData).transition().duration(1500).ease("sin-in-out").attr("d", area2Tl);

    drawPies();
}

function drawPies(){
  var dates = xTl.domain();
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
  .key(function(d) { return d.donor[0]; })
  .rollup(function(values){
    return d3.sum(values, function(d) {
      return d.budget;
    })
  })
  .entries(filteredData.filter(function(d){ return (d.start <= startDate && d.end >= startDate); }))

var donorEndPieData = d3.nest()
  .key(function(d) { return d.donor[0]; })
  .rollup(function(values){
    return d3.sum(values, function(d) {
      return d.budget;
    })
  })
  .entries(filteredData.filter(function(d){ return (d.start <= endDate && d.end >= endDate); }))

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
  .key(function(d) { return d.businessunit[0]; })
  .rollup(function(values){
    return d3.sum(values, function(d) {
      return d.budget;
    })
  })
  .entries(filteredData.filter(function(d){ return (d.start <= startDate && d.end >= startDate); }))

var businessEndPieData = d3.nest()
  .key(function(d) { return d.businessunit[0]; })
  .rollup(function(values){
    return d3.sum(values, function(d) {
      return d.budget;
    })
  })
  .entries(filteredData.filter(function(d){ return (d.start <= endDate && d.end >= endDate); }))

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

  var calendarData = filteredData.filter(function(d){
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

  d3.select('#calendar-graph').select('svg').append('g').attr("class", "x axis")
      .attr("transform", "translate(0," + (margin.top - 2) + ")")
      .call(xAxis)

  var bar = calendarGraph.selectAll('.calendar-prj')
    .data(calendarData).enter().append('g')
    .attr("transform", function(d, i) { return "translate(" + 0 + "," + (i * barheight + margin.top) + ")"; })
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

    d3.select('#calendar-graph').select('svg').selectAll(".calendar-graph-fiscal-mark").data(yearRange).enter().append('line')
        .attr('class', 'calendar-graph-fiscal-mark')
        .attr('x1', x)
        .attr('y1', barheight)
        .attr('x2', x)
        .attr('y2', (barheight * calendarData.length) + margin.top + margin.bottom)
        .attr('stroke-dasharray', '3,5').style("stroke-width", 2).style("stroke", "rgba(159, 159, 163, 0.8)").style("fill", "none")



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

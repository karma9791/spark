/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global d3, formattedTimeTipStrings, formattedTimeToValues, hideBootstrapTooltip, maxMarginLeftForTimeline, showBootstrapTooltip, unitLabelYOffset */
// pre-define some colors for legends.
var colorPool = ["#F8C471", "#F39C12", "#B9770E", "#73C6B6", "#16A085", "#117A65", "#B2BABB", "#7F8C8D", "#616A6B"];

/* eslint-disable no-unused-vars */
function drawAreaStack(id, labels, values, minX, maxX, minY, maxY) {
  d3.select(d3.select(id).node().parentNode)
    .style("padding", "8px 0 8px 8px")
    .style("border-right", "0px solid white");

  // Setup svg using Bostock's margin convention
  var margin = {top: 20, right: 40, bottom: 30, left: maxMarginLeftForTimeline};
  var width = 850 - margin.left - margin.right;
  var height = 300 - margin.top - margin.bottom;

  var svg = d3.select(id)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var data = values;

  var parse = d3.timeParse("%H:%M:%S.%L");

  // Transpose the data into layers
  var dataset = d3.stack()(labels.map(function(fruit) {
    return data.map(function(d) {
      return {_x: d.x, x: parse(d.x), y: +d[fruit]};
    });
  }));

  // Set x, y and colors
  var x = d3.scaleOrdinal()
    .domain(dataset[0].map(function(d) { return d.x; }))
    .rangeRoundBands([10, width-10], 0.02);

  var y = d3.scaleLinear()
    .domain([0, d3.max(dataset, function(d) {  return d3.max(d, function(d) { return d.y0 + d.y; });  })])
    .range([height, 0]);

  var colors = colorPool.slice(0, labels.length);

  // Define and draw axes
  var yAxis = d3.axisLeft(y).ticks(7).tickFormat( function(d) { return d } );

  var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%H:%M:%S.%L"));

  // Only show the first and last time in the graph
  var xline = [];
  xline.push(x.domain()[0]);
  xline.push(x.domain()[x.domain().length - 1]);
  xAxis.tickValues(xline);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "translate(0," + unitLabelYOffset + ")")
    .text("ms");

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // Create groups for each series, rects for each segment
  var groups = svg.selectAll("g.cost")
    .data(dataset)
    .enter().append("g")
    .attr("class", "cost")
    .style("fill", function(d, i) { return colors[i]; });

  var rect = groups.selectAll("rect")
    .data(function(d) { return d; })
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d.x); })
    .attr("y", function(d) { return y(d.y0 + d.y); })
    .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
    .attr("width", x.rangeBand())
    .on('mouseover', function(d) {
      var tip = '';
      var idx = 0;
      var _values = formattedTimeToValues[d._x];
      _values.forEach(function (k) {
        tip += labels[idx] + ': ' + k + '   ';
        idx += 1;
      });
      tip += " at " + formattedTimeTipStrings[d._x];
      showBootstrapTooltip(d3.select(this).node(), tip);
    })
    .on('mouseout',  function() {
      hideBootstrapTooltip(d3.select(this).node());
    })
    .on("mousemove", (event, d) => {
      var xPosition = d3.pointer(event)[0] - 15;
      var yPosition = d3.pointer(event)[1] - 25;
      tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
      tooltip.select("text").text(d.y);
    });

  // Draw legend
  var legend = svg.selectAll(".legend")
    .data(colors)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) { return "translate(30," + i * 19 + ")"; });

  legend.append("rect")
    .attr("x", width - 20)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", function(d, i) {return colors.slice().reverse()[i];})
    .on('mouseover', function(d, i) {
      var len = labels.length;
      showBootstrapTooltip(d3.select(this).node(), labels[len - 1 - i]);
    })
    .on('mouseout',  function() {
      hideBootstrapTooltip(d3.select(this).node());
    })
    .on("mousemove", (event, d) => {
      var xPosition = d3.pointer(event)[0] - 15;
      var yPosition = d3.pointer(event)[1] - 25;
      tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
      tooltip.select("text").text(d.y);
    });

  // Prep the tooltip bits, initial display is hidden
  var tooltip = svg.append("g")
    .attr("class", "tooltip")
    .style("display", "none");

  tooltip.append("rect")
    .attr("width", 30)
    .attr("height", 20)
    .attr("fill", "white")
    .style("opacity", 0.5);

  tooltip.append("text")
    .attr("x", 15)
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold");
}
/* eslint-enable no-unused-vars */
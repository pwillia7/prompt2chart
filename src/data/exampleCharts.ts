import { VegaLiteSpec } from '../types'

export interface ChartExample {
  id: string
  title: string
  description: string
  chartType: string
  library: 'd3' | 'vega-lite'
  data: unknown[]
  d3Code?: string
  vegaSpec?: VegaLiteSpec
}

// ---------------------------------------------------------------------------
// 0. Scatter — Revenue vs Customer Satisfaction (D3)
// ---------------------------------------------------------------------------
const scatterData = [
  { company: 'Acme Corp', revenue: 2.4, satisfaction: 78, region: 'North America' },
  { company: 'Globex', revenue: 1.8, satisfaction: 85, region: 'Europe' },
  { company: 'Initech', revenue: 3.1, satisfaction: 69, region: 'North America' },
  { company: 'Umbrella', revenue: 4.2, satisfaction: 65, region: 'Asia Pacific' },
  { company: 'Wayne Ent', revenue: 5.8, satisfaction: 91, region: 'North America' },
  { company: 'Stark Ind', revenue: 7.2, satisfaction: 88, region: 'North America' },
  { company: 'Wonka Co', revenue: 1.2, satisfaction: 92, region: 'Europe' },
  { company: 'Oscorp', revenue: 3.8, satisfaction: 71, region: 'Asia Pacific' },
  { company: 'LexCorp', revenue: 6.1, satisfaction: 62, region: 'North America' },
  { company: 'Cyberdyne', revenue: 2.9, satisfaction: 79, region: 'Asia Pacific' },
  { company: 'Soylent', revenue: 0.9, satisfaction: 55, region: 'Europe' },
  { company: 'Aperture', revenue: 4.5, satisfaction: 83, region: 'North America' },
  { company: 'Tyrell', revenue: 5.2, satisfaction: 76, region: 'Europe' },
  { company: 'Weyland', revenue: 8.1, satisfaction: 70, region: 'Asia Pacific' },
  { company: 'Massive Dyn', revenue: 3.4, satisfaction: 87, region: 'Europe' },
  { company: 'Virtucon', revenue: 1.5, satisfaction: 58, region: 'Asia Pacific' },
  { company: 'Prestige', revenue: 2.1, satisfaction: 90, region: 'North America' },
  { company: 'Nakatomi', revenue: 4.8, satisfaction: 74, region: 'Asia Pacific' },
]

const scatterCode = `
var iw = width - margin.left - margin.right;
var ih = height - margin.top - margin.bottom;
var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var colorMap = { "North America": "#F97316", "Europe": "#94A3B8", "Asia Pacific": "#475569" };

var x = d3.scaleLinear().domain([0, 9]).range([0, iw]);
var y = d3.scaleLinear().domain([50, 100]).range([ih, 0]);

g.append("g").selectAll("line").data(y.ticks(5)).join("line")
  .attr("x1", 0).attr("x2", iw)
  .attr("y1", function(d) { return y(d); }).attr("y2", function(d) { return y(d); })
  .attr("stroke", "#f0f0f0");

g.append("g").attr("transform", "translate(0," + ih + ")")
  .call(d3.axisBottom(x).ticks(5).tickFormat(function(d) { return "$" + d + "M"; }));
g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(function(d) { return d + "%"; }));

svg.append("text").attr("x", width / 2).attr("y", height - 8)
  .attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "#888").text("Revenue ($M)");
svg.append("text").attr("transform", "rotate(-90)")
  .attr("x", -(height / 2)).attr("y", 16)
  .attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "#888").text("Customer Satisfaction (%)");
svg.append("text").attr("x", width / 2).attr("y", 22)
  .attr("text-anchor", "middle").attr("font-size", 14).attr("font-weight", "600").attr("fill", "#333")
  .text("Revenue vs Customer Satisfaction by Region");

var xMean = d3.mean(data, function(d) { return d.revenue; });
var yMean = d3.mean(data, function(d) { return d.satisfaction; });
var slope = d3.sum(data, function(d) { return (d.revenue - xMean) * (d.satisfaction - yMean); }) /
            d3.sum(data, function(d) { return (d.revenue - xMean) * (d.revenue - xMean); });
var intercept = yMean - slope * xMean;
g.append("line")
  .attr("x1", x(0.5)).attr("y1", y(intercept + slope * 0.5))
  .attr("x2", x(8.5)).attr("y2", y(intercept + slope * 8.5))
  .attr("stroke", "#ddd").attr("stroke-width", 1.5).attr("stroke-dasharray", "6,4");

var tooltip = container.append("div")
  .style("position", "absolute").style("display", "none")
  .style("background", "#fff").style("border", "1px solid #e5e5e5")
  .style("border-radius", "8px").style("padding", "8px 12px")
  .style("font-size", "12px").style("line-height", "1.5")
  .style("box-shadow", "0 4px 12px rgba(0,0,0,0.1)")
  .style("pointer-events", "none").style("z-index", "10");

g.selectAll("circle").data(data).join("circle")
  .attr("cx", function(d) { return x(d.revenue); })
  .attr("cy", function(d) { return y(d.satisfaction); })
  .attr("r", 6).attr("fill", function(d) { return colorMap[d.region]; })
  .attr("opacity", 0.85).attr("stroke", "#fff").attr("stroke-width", 1.5)
  .style("cursor", "pointer")
  .on("mouseenter", function(event, d) {
    d3.select(this).transition().duration(150).attr("r", 9).attr("opacity", 1);
    tooltip.style("display", "block")
      .html("<strong style=\\"color:#171717\\">" + d.company + "</strong><br/>"
        + "<span style=\\"color:#666\\">Revenue: $" + d.revenue + "M</span><br/>"
        + "<span style=\\"color:#666\\">Satisfaction: " + d.satisfaction + "%</span><br/>"
        + "<span style=\\"color:" + colorMap[d.region] + "\\">" + d.region + "</span>");
  }).on("mousemove", function(event) {
    var rect = event.currentTarget.closest("svg").parentElement.getBoundingClientRect();
    tooltip.style("left", (event.clientX - rect.left + 15) + "px")
      .style("top", (event.clientY - rect.top - 10) + "px");
  }).on("mouseleave", function() {
    d3.select(this).transition().duration(150).attr("r", 6).attr("opacity", 0.85);
    tooltip.style("display", "none");
  });

var legend = container.append("div")
  .style("display", "flex").style("justify-content", "center")
  .style("gap", "20px").style("padding", "10px 0 6px").style("font-size", "13px");
var regions = Object.keys(colorMap);
regions.forEach(function(region) {
  var item = legend.append("div").style("display", "flex").style("align-items", "center").style("gap", "6px");
  item.append("div").style("width", "10px").style("height", "10px")
    .style("border-radius", "50%").style("background", colorMap[region]);
  item.append("span").style("color", "#666").text(region);
});
`

// ---------------------------------------------------------------------------
// 1. Grouped Bar — Coffee Consumption (Vega-Lite)
// ---------------------------------------------------------------------------
const coffeeData = [
  { country: 'Italy', type: 'Espresso', cups: 4.2 },
  { country: 'Italy', type: 'Latte', cups: 1.1 },
  { country: 'Italy', type: 'Cold Brew', cups: 0.3 },
  { country: 'Italy', type: 'Drip', cups: 0.5 },
  { country: 'Brazil', type: 'Espresso', cups: 3.1 },
  { country: 'Brazil', type: 'Latte', cups: 1.8 },
  { country: 'Brazil', type: 'Cold Brew', cups: 0.9 },
  { country: 'Brazil', type: 'Drip', cups: 1.4 },
  { country: 'Ethiopia', type: 'Espresso', cups: 2.8 },
  { country: 'Ethiopia', type: 'Latte', cups: 0.6 },
  { country: 'Ethiopia', type: 'Cold Brew', cups: 0.2 },
  { country: 'Ethiopia', type: 'Drip', cups: 2.1 },
  { country: 'USA', type: 'Espresso', cups: 1.5 },
  { country: 'USA', type: 'Latte', cups: 2.9 },
  { country: 'USA', type: 'Cold Brew', cups: 2.2 },
  { country: 'USA', type: 'Drip', cups: 3.8 },
  { country: 'Japan', type: 'Espresso', cups: 1.9 },
  { country: 'Japan', type: 'Latte', cups: 2.4 },
  { country: 'Japan', type: 'Cold Brew', cups: 1.7 },
  { country: 'Japan', type: 'Drip', cups: 1.2 },
  { country: 'Colombia', type: 'Espresso', cups: 3.4 },
  { country: 'Colombia', type: 'Latte', cups: 1.3 },
  { country: 'Colombia', type: 'Cold Brew', cups: 0.5 },
  { country: 'Colombia', type: 'Drip', cups: 1.9 },
]

const coffeeSpec: VegaLiteSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  title: 'Daily Coffee Consumption by Country & Type',
  width: 500,
  height: 320,
  data: { values: coffeeData },
  mark: { type: 'bar', cornerRadiusTopLeft: 3, cornerRadiusTopRight: 3 },
  encoding: {
    x: { field: 'country', type: 'nominal', title: 'Country', axis: { labelAngle: 0 } },
    y: { field: 'cups', type: 'quantitative', title: 'Cups per Day' },
    color: {
      field: 'type', type: 'nominal', title: 'Type',
      scale: { range: ['#5B3A1A', '#8B5E3C', '#C9956B', '#E8D5B7'] },
    },
    xOffset: { field: 'type' },
    tooltip: [
      { field: 'country', title: 'Country' },
      { field: 'type', title: 'Type' },
      { field: 'cups', title: 'Cups/Day', format: '.1f' },
    ],
  },
}

// ---------------------------------------------------------------------------
// 2. Multi-line — City Temperatures (Vega-Lite)
// ---------------------------------------------------------------------------
const tempData = [
  { month: 'Jan', city: 'Miami', temp: 68 },
  { month: 'Feb', city: 'Miami', temp: 70 },
  { month: 'Mar', city: 'Miami', temp: 74 },
  { month: 'Apr', city: 'Miami', temp: 78 },
  { month: 'May', city: 'Miami', temp: 82 },
  { month: 'Jun', city: 'Miami', temp: 85 },
  { month: 'Jul', city: 'Miami', temp: 87 },
  { month: 'Aug', city: 'Miami', temp: 87 },
  { month: 'Sep', city: 'Miami', temp: 85 },
  { month: 'Oct', city: 'Miami', temp: 80 },
  { month: 'Nov', city: 'Miami', temp: 74 },
  { month: 'Dec', city: 'Miami', temp: 69 },
  { month: 'Jan', city: 'New York', temp: 33 },
  { month: 'Feb', city: 'New York', temp: 35 },
  { month: 'Mar', city: 'New York', temp: 44 },
  { month: 'Apr', city: 'New York', temp: 55 },
  { month: 'May', city: 'New York', temp: 65 },
  { month: 'Jun', city: 'New York', temp: 74 },
  { month: 'Jul', city: 'New York', temp: 80 },
  { month: 'Aug', city: 'New York', temp: 78 },
  { month: 'Sep', city: 'New York', temp: 71 },
  { month: 'Oct', city: 'New York', temp: 59 },
  { month: 'Nov', city: 'New York', temp: 48 },
  { month: 'Dec', city: 'New York', temp: 37 },
  { month: 'Jan', city: 'London', temp: 41 },
  { month: 'Feb', city: 'London', temp: 42 },
  { month: 'Mar', city: 'London', temp: 47 },
  { month: 'Apr', city: 'London', temp: 52 },
  { month: 'May', city: 'London', temp: 58 },
  { month: 'Jun', city: 'London', temp: 64 },
  { month: 'Jul', city: 'London', temp: 68 },
  { month: 'Aug', city: 'London', temp: 67 },
  { month: 'Sep', city: 'London', temp: 62 },
  { month: 'Oct', city: 'London', temp: 54 },
  { month: 'Nov', city: 'London', temp: 46 },
  { month: 'Dec', city: 'London', temp: 42 },
  { month: 'Jan', city: 'Tokyo', temp: 42 },
  { month: 'Feb', city: 'Tokyo', temp: 44 },
  { month: 'Mar', city: 'Tokyo', temp: 51 },
  { month: 'Apr', city: 'Tokyo', temp: 60 },
  { month: 'May', city: 'Tokyo', temp: 67 },
  { month: 'Jun', city: 'Tokyo', temp: 73 },
  { month: 'Jul', city: 'Tokyo', temp: 80 },
  { month: 'Aug', city: 'Tokyo', temp: 82 },
  { month: 'Sep', city: 'Tokyo', temp: 76 },
  { month: 'Oct', city: 'Tokyo', temp: 65 },
  { month: 'Nov', city: 'Tokyo', temp: 54 },
  { month: 'Dec', city: 'Tokyo', temp: 45 },
]

const tempSpec: VegaLiteSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  title: 'Monthly Average Temperatures',
  width: 540,
  height: 320,
  data: { values: tempData },
  mark: { type: 'line', point: { size: 40 }, strokeWidth: 2.5 },
  encoding: {
    x: {
      field: 'month', type: 'ordinal', title: 'Month',
      sort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    y: { field: 'temp', type: 'quantitative', title: 'Temperature (\u00B0F)' },
    color: {
      field: 'city', type: 'nominal', title: 'City',
      scale: { range: ['#DC2626', '#2563EB', '#6B7280', '#7C3AED'] },
    },
    tooltip: [
      { field: 'city', title: 'City' },
      { field: 'month', title: 'Month' },
      { field: 'temp', title: 'Temp (\u00B0F)' },
    ],
  },
}

// ---------------------------------------------------------------------------
// 3. Scatter + Regression — GDP vs Life Expectancy (Vega-Lite)
// ---------------------------------------------------------------------------
const gdpData = [
  { country: 'Norway', gdp: 82.7, lifeExpectancy: 82.8, population: 5.4, continent: 'Europe' },
  { country: 'Switzerland', gdp: 87.1, lifeExpectancy: 83.4, population: 8.7, continent: 'Europe' },
  { country: 'USA', gdp: 63.5, lifeExpectancy: 78.9, population: 331, continent: 'N. America' },
  { country: 'Japan', gdp: 39.3, lifeExpectancy: 84.6, population: 126, continent: 'Asia' },
  { country: 'Germany', gdp: 46.2, lifeExpectancy: 81.3, population: 83, continent: 'Europe' },
  { country: 'UK', gdp: 40.3, lifeExpectancy: 81.2, population: 67, continent: 'Europe' },
  { country: 'S. Korea', gdp: 31.5, lifeExpectancy: 83.5, population: 52, continent: 'Asia' },
  { country: 'Brazil', gdp: 8.9, lifeExpectancy: 75.9, population: 213, continent: 'S. America' },
  { country: 'China', gdp: 10.4, lifeExpectancy: 77.1, population: 1412, continent: 'Asia' },
  { country: 'India', gdp: 2.3, lifeExpectancy: 69.7, population: 1380, continent: 'Asia' },
  { country: 'Mexico', gdp: 10.0, lifeExpectancy: 75.1, population: 130, continent: 'N. America' },
  { country: 'Nigeria', gdp: 2.1, lifeExpectancy: 54.7, population: 206, continent: 'Africa' },
  { country: 'Australia', gdp: 51.8, lifeExpectancy: 83.2, population: 26, continent: 'Oceania' },
  { country: 'Canada', gdp: 43.3, lifeExpectancy: 82.4, population: 38, continent: 'N. America' },
  { country: 'France', gdp: 40.9, lifeExpectancy: 82.7, population: 67, continent: 'Europe' },
  { country: 'Russia', gdp: 11.6, lifeExpectancy: 73.2, population: 144, continent: 'Europe' },
  { country: 'Indonesia', gdp: 4.3, lifeExpectancy: 71.7, population: 274, continent: 'Asia' },
  { country: 'S. Africa', gdp: 6.0, lifeExpectancy: 64.1, population: 60, continent: 'Africa' },
  { country: 'Thailand', gdp: 7.2, lifeExpectancy: 77.2, population: 70, continent: 'Asia' },
  { country: 'Chile', gdp: 15.4, lifeExpectancy: 80.2, population: 19, continent: 'S. America' },
]

const gdpSpec: VegaLiteSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  title: 'GDP per Capita vs Life Expectancy',
  width: 540,
  height: 340,
  data: { values: gdpData },
  layer: [
    {
      mark: { type: 'circle', opacity: 0.75 },
      encoding: {
        x: { field: 'gdp', type: 'quantitative', title: 'GDP per Capita ($K)', scale: { zero: false } },
        y: { field: 'lifeExpectancy', type: 'quantitative', title: 'Life Expectancy (years)', scale: { domain: [50, 90] } },
        size: { field: 'population', type: 'quantitative', title: 'Population (M)', scale: { range: [30, 1200] } },
        color: { field: 'continent', type: 'nominal', title: 'Continent', scale: { scheme: 'tableau10' } },
        tooltip: [
          { field: 'country', title: 'Country' },
          { field: 'gdp', title: 'GDP ($K)', format: '.1f' },
          { field: 'lifeExpectancy', title: 'Life Exp.', format: '.1f' },
          { field: 'population', title: 'Pop. (M)', format: ',.0f' },
        ],
      },
    },
    {
      mark: { type: 'line', color: '#999', strokeDash: [6, 4], strokeWidth: 1.5 },
      transform: [{ regression: 'lifeExpectancy', on: 'gdp' }],
      encoding: {
        x: { field: 'gdp', type: 'quantitative' },
        y: { field: 'lifeExpectancy', type: 'quantitative' },
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// 4. Heatmap — Commit Activity (Vega-Lite)
// ---------------------------------------------------------------------------
function makeCommitData() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const result: { day: string; hour: number; commits: number }[] = []
  const base: Record<string, number[]> = {
    Mon: [0, 0, 0, 0, 0, 1, 2, 4, 12, 18, 15, 14, 8, 16, 17, 14, 10, 6, 3, 2, 1, 0, 0, 0],
    Tue: [0, 0, 0, 0, 0, 0, 3, 5, 14, 20, 18, 16, 9, 19, 22, 17, 12, 7, 4, 2, 1, 1, 0, 0],
    Wed: [0, 0, 0, 0, 1, 1, 2, 6, 15, 21, 19, 17, 10, 18, 20, 16, 11, 8, 3, 2, 1, 0, 0, 0],
    Thu: [0, 0, 0, 0, 0, 1, 3, 5, 13, 19, 16, 15, 7, 17, 18, 15, 10, 6, 4, 2, 1, 0, 0, 0],
    Fri: [0, 0, 0, 0, 0, 0, 2, 4, 11, 16, 14, 13, 6, 14, 15, 12, 8, 5, 2, 1, 0, 0, 0, 0],
    Sat: [0, 0, 0, 0, 0, 0, 0, 1, 2, 4, 5, 4, 3, 3, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0],
    Sun: [0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 4, 3, 2, 2, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0],
  }
  for (const day of days) {
    for (let h = 0; h < 24; h++) {
      result.push({ day, hour: h, commits: base[day][h] })
    }
  }
  return result
}
const commitData = makeCommitData()

const commitSpec: VegaLiteSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  title: 'Weekly Commit Activity',
  width: 540,
  height: 220,
  data: { values: commitData },
  mark: { type: 'rect', cornerRadius: 2 },
  encoding: {
    x: { field: 'hour', type: 'ordinal', title: 'Hour of Day' },
    y: {
      field: 'day', type: 'ordinal', title: null,
      sort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    color: {
      field: 'commits', type: 'quantitative', title: 'Commits',
      scale: { scheme: 'greens' },
    },
    tooltip: [
      { field: 'day', title: 'Day' },
      { field: 'hour', title: 'Hour' },
      { field: 'commits', title: 'Commits' },
    ],
  },
  config: { axis: { grid: false } },
}

// ---------------------------------------------------------------------------
// 5. Layered Area — Revenue by Product Line (Vega-Lite)
// ---------------------------------------------------------------------------
const revenueData = [
  { quarter: 'Q1 2022', product: 'SaaS', revenue: 12 },
  { quarter: 'Q2 2022', product: 'SaaS', revenue: 14 },
  { quarter: 'Q3 2022', product: 'SaaS', revenue: 16 },
  { quarter: 'Q4 2022', product: 'SaaS', revenue: 19 },
  { quarter: 'Q1 2023', product: 'SaaS', revenue: 22 },
  { quarter: 'Q2 2023', product: 'SaaS', revenue: 26 },
  { quarter: 'Q3 2023', product: 'SaaS', revenue: 30 },
  { quarter: 'Q4 2023', product: 'SaaS', revenue: 35 },
  { quarter: 'Q1 2024', product: 'SaaS', revenue: 39 },
  { quarter: 'Q2 2024', product: 'SaaS', revenue: 44 },
  { quarter: 'Q3 2024', product: 'SaaS', revenue: 48 },
  { quarter: 'Q4 2024', product: 'SaaS', revenue: 53 },
  { quarter: 'Q1 2022', product: 'Hardware', revenue: 20 },
  { quarter: 'Q2 2022', product: 'Hardware', revenue: 18 },
  { quarter: 'Q3 2022', product: 'Hardware', revenue: 22 },
  { quarter: 'Q4 2022', product: 'Hardware', revenue: 25 },
  { quarter: 'Q1 2023', product: 'Hardware', revenue: 21 },
  { quarter: 'Q2 2023', product: 'Hardware', revenue: 24 },
  { quarter: 'Q3 2023', product: 'Hardware', revenue: 23 },
  { quarter: 'Q4 2023', product: 'Hardware', revenue: 27 },
  { quarter: 'Q1 2024', product: 'Hardware', revenue: 25 },
  { quarter: 'Q2 2024', product: 'Hardware', revenue: 28 },
  { quarter: 'Q3 2024', product: 'Hardware', revenue: 26 },
  { quarter: 'Q4 2024', product: 'Hardware', revenue: 30 },
  { quarter: 'Q1 2022', product: 'Consulting', revenue: 8 },
  { quarter: 'Q2 2022', product: 'Consulting', revenue: 9 },
  { quarter: 'Q3 2022', product: 'Consulting', revenue: 10 },
  { quarter: 'Q4 2022', product: 'Consulting', revenue: 11 },
  { quarter: 'Q1 2023', product: 'Consulting', revenue: 12 },
  { quarter: 'Q2 2023', product: 'Consulting', revenue: 13 },
  { quarter: 'Q3 2023', product: 'Consulting', revenue: 14 },
  { quarter: 'Q4 2023', product: 'Consulting', revenue: 16 },
  { quarter: 'Q1 2024', product: 'Consulting', revenue: 17 },
  { quarter: 'Q2 2024', product: 'Consulting', revenue: 18 },
  { quarter: 'Q3 2024', product: 'Consulting', revenue: 19 },
  { quarter: 'Q4 2024', product: 'Consulting', revenue: 21 },
  { quarter: 'Q1 2022', product: 'Training', revenue: 4 },
  { quarter: 'Q2 2022', product: 'Training', revenue: 5 },
  { quarter: 'Q3 2022', product: 'Training', revenue: 5 },
  { quarter: 'Q4 2022', product: 'Training', revenue: 6 },
  { quarter: 'Q1 2023', product: 'Training', revenue: 7 },
  { quarter: 'Q2 2023', product: 'Training', revenue: 7 },
  { quarter: 'Q3 2023', product: 'Training', revenue: 8 },
  { quarter: 'Q4 2023', product: 'Training', revenue: 9 },
  { quarter: 'Q1 2024', product: 'Training', revenue: 10 },
  { quarter: 'Q2 2024', product: 'Training', revenue: 10 },
  { quarter: 'Q3 2024', product: 'Training', revenue: 11 },
  { quarter: 'Q4 2024', product: 'Training', revenue: 12 },
]

const revenueSpec: VegaLiteSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  title: 'Quarterly Revenue by Product Line',
  width: 540,
  height: 320,
  data: { values: revenueData },
  mark: { type: 'area', interpolate: 'monotone', opacity: 0.75, line: true },
  encoding: {
    x: { field: 'quarter', type: 'ordinal', title: 'Quarter', axis: { labelAngle: -45 } },
    y: { field: 'revenue', type: 'quantitative', title: 'Revenue ($M)', stack: true },
    color: {
      field: 'product', type: 'nominal', title: 'Product',
      scale: { range: ['#93C5FD', '#FCA5A5', '#86EFAC', '#FDE68A'] },
    },
    tooltip: [
      { field: 'product', title: 'Product' },
      { field: 'quarter', title: 'Quarter' },
      { field: 'revenue', title: 'Revenue ($M)' },
    ],
  },
}

// ---------------------------------------------------------------------------
// 6. Sankey Diagram — Energy Flow (D3)
// ---------------------------------------------------------------------------
const energyData = [
  { source: 'Coal', target: 'Electricity', value: 150 },
  { source: 'Natural Gas', target: 'Electricity', value: 100 },
  { source: 'Natural Gas', target: 'Industrial', value: 80 },
  { source: 'Natural Gas', target: 'Residential', value: 50 },
  { source: 'Nuclear', target: 'Electricity', value: 90 },
  { source: 'Solar', target: 'Electricity', value: 45 },
  { source: 'Wind', target: 'Electricity', value: 40 },
  { source: 'Hydro', target: 'Electricity', value: 55 },
  { source: 'Electricity', target: 'Lighting', value: 100 },
  { source: 'Electricity', target: 'Cooling', value: 85 },
  { source: 'Electricity', target: 'Electronics', value: 120 },
  { source: 'Electricity', target: 'Heating', value: 65 },
  { source: 'Electricity', target: 'Mechanical', value: 110 },
  { source: 'Industrial', target: 'Mechanical', value: 50 },
  { source: 'Industrial', target: 'Heating', value: 30 },
  { source: 'Residential', target: 'Heating', value: 30 },
  { source: 'Residential', target: 'Cooling', value: 20 },
]

const sankeyCode = `
var nodeNames = [];
data.forEach(function(d) {
  if (nodeNames.indexOf(d.source) === -1) nodeNames.push(d.source);
  if (nodeNames.indexOf(d.target) === -1) nodeNames.push(d.target);
});
var nodes = nodeNames.map(function(name) { return { name: name }; });
var links = data.map(function(d) {
  return { source: nodeNames.indexOf(d.source), target: nodeNames.indexOf(d.target), value: d.value };
});

var sankey = d3.sankey()
  .nodeWidth(20)
  .nodePadding(14)
  .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

var graph = sankey({ nodes: nodes, links: links });

var color = d3.scaleOrdinal()
  .domain(nodeNames)
  .range(["#4E79A7","#F28E2B","#E15759","#76B7B2","#59A14F","#EDC948","#B07AA1","#FF9DA7","#9C755F","#BAB0AC","#AF7AA1","#D4A6C8"]);

var defs = svg.append("defs");
graph.links.forEach(function(link, i) {
  var grad = defs.append("linearGradient")
    .attr("id", "sg" + i)
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", link.source.x1)
    .attr("x2", link.target.x0);
  grad.append("stop").attr("offset", "0%").attr("stop-color", color(link.source.name));
  grad.append("stop").attr("offset", "100%").attr("stop-color", color(link.target.name));
});

svg.append("g")
  .selectAll("path")
  .data(graph.links)
  .join("path")
  .attr("d", d3.sankeyLinkHorizontal())
  .attr("fill", "none")
  .attr("stroke", function(d, i) { return "url(#sg" + i + ")"; })
  .attr("stroke-width", function(d) { return Math.max(1, d.width); })
  .attr("opacity", 0.5)
  .on("mouseenter", function() { d3.select(this).attr("opacity", 0.8); })
  .on("mouseleave", function() { d3.select(this).attr("opacity", 0.5); });

svg.append("g")
  .selectAll("rect")
  .data(graph.nodes)
  .join("rect")
  .attr("x", function(d) { return d.x0; })
  .attr("y", function(d) { return d.y0; })
  .attr("width", function(d) { return d.x1 - d.x0; })
  .attr("height", function(d) { return Math.max(1, d.y1 - d.y0); })
  .attr("fill", function(d) { return color(d.name); })
  .attr("rx", 2);

svg.append("g")
  .selectAll("text")
  .data(graph.nodes)
  .join("text")
  .attr("x", function(d) { return d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6; })
  .attr("y", function(d) { return (d.y0 + d.y1) / 2; })
  .attr("dy", "0.35em")
  .attr("text-anchor", function(d) { return d.x0 < width / 2 ? "start" : "end"; })
  .attr("font-size", 11)
  .attr("fill", "#333")
  .text(function(d) { return d.name; });

svg.append("text")
  .attr("x", width / 2).attr("y", 20)
  .attr("text-anchor", "middle").attr("font-size", 14).attr("font-weight", "600").attr("fill", "#333")
  .text("Energy Flow: Sources to End Use");
`

// ---------------------------------------------------------------------------
// 7. Treemap — Smartphone Market Share (D3)
// ---------------------------------------------------------------------------
const smartphoneData = [
  { brand: 'Apple', model: 'iPhone 15', share: 15.2 },
  { brand: 'Apple', model: 'iPhone 14', share: 8.1 },
  { brand: 'Apple', model: 'iPhone SE', share: 3.4 },
  { brand: 'Samsung', model: 'Galaxy S24', share: 10.8 },
  { brand: 'Samsung', model: 'Galaxy A54', share: 7.2 },
  { brand: 'Samsung', model: 'Galaxy Z Flip', share: 2.8 },
  { brand: 'Xiaomi', model: 'Redmi Note 13', share: 6.5 },
  { brand: 'Xiaomi', model: 'Xiaomi 14', share: 4.2 },
  { brand: 'Xiaomi', model: 'Poco X6', share: 2.1 },
  { brand: 'Oppo', model: 'Find X7', share: 3.8 },
  { brand: 'Oppo', model: 'Reno 11', share: 5.1 },
  { brand: 'vivo', model: 'X100', share: 4.5 },
  { brand: 'vivo', model: 'V30', share: 3.2 },
  { brand: 'Others', model: 'Pixel 8', share: 2.8 },
  { brand: 'Others', model: 'OnePlus 12', share: 2.1 },
  { brand: 'Others', model: 'Motorola Edge', share: 1.8 },
]

const treemapCode = `
var brands = {};
data.forEach(function(d) {
  if (!brands[d.brand]) brands[d.brand] = [];
  brands[d.brand].push({ name: d.model, value: d.share });
});
var rootData = {
  name: "Smartphones",
  children: Object.keys(brands).map(function(b) {
    return { name: b, children: brands[b] };
  })
};

var root = d3.hierarchy(rootData)
  .sum(function(d) { return d.value || 0; })
  .sort(function(a, b) { return b.value - a.value; });

var treemap = d3.treemap()
  .size([width - 4, height - 40])
  .paddingOuter(4)
  .paddingTop(22)
  .paddingInner(2)
  .round(true);

treemap(root);

var brandColors = {
  "Apple": "#E8724A",
  "Samsung": "#D4A03E",
  "Xiaomi": "#C75D3A",
  "Oppo": "#B8862D",
  "vivo": "#A0522D",
  "Others": "#8B7355"
};

var g = svg.append("g").attr("transform", "translate(2, 28)");

// Brand groups
var brandGroup = g.selectAll("g")
  .data(root.children)
  .join("g");

brandGroup.append("rect")
  .attr("x", function(d) { return d.x0; })
  .attr("y", function(d) { return d.y0; })
  .attr("width", function(d) { return d.x1 - d.x0; })
  .attr("height", function(d) { return d.y1 - d.y0; })
  .attr("fill", function(d) { return brandColors[d.data.name] || "#999"; })
  .attr("opacity", 0.25)
  .attr("rx", 4);

brandGroup.append("text")
  .attr("x", function(d) { return d.x0 + 6; })
  .attr("y", function(d) { return d.y0 + 15; })
  .attr("font-size", 11)
  .attr("font-weight", "600")
  .attr("fill", "#333")
  .text(function(d) { return d.data.name; });

// Model cells
var leaf = g.selectAll("rect.leaf")
  .data(root.leaves())
  .join("rect")
  .attr("class", "leaf")
  .attr("x", function(d) { return d.x0; })
  .attr("y", function(d) { return d.y0; })
  .attr("width", function(d) { return d.x1 - d.x0; })
  .attr("height", function(d) { return d.y1 - d.y0; })
  .attr("fill", function(d) { return brandColors[d.parent.data.name] || "#999"; })
  .attr("opacity", 0.8)
  .attr("rx", 3)
  .style("cursor", "pointer");

// Model labels
g.selectAll("text.leaf")
  .data(root.leaves())
  .join("text")
  .attr("class", "leaf")
  .attr("x", function(d) { return d.x0 + 4; })
  .attr("y", function(d) { return d.y0 + (d.y1 - d.y0) / 2 + 4; })
  .attr("font-size", function(d) { return (d.x1 - d.x0) > 60 ? 10 : 8; })
  .attr("fill", "#fff")
  .attr("pointer-events", "none")
  .text(function(d) { return (d.x1 - d.x0) > 40 && (d.y1 - d.y0) > 20 ? d.data.name : ""; });

g.selectAll("text.val")
  .data(root.leaves())
  .join("text")
  .attr("class", "val")
  .attr("x", function(d) { return d.x0 + 4; })
  .attr("y", function(d) { return d.y0 + (d.y1 - d.y0) / 2 + 16; })
  .attr("font-size", 9)
  .attr("fill", "rgba(255,255,255,0.7)")
  .attr("pointer-events", "none")
  .text(function(d) { return (d.x1 - d.x0) > 40 && (d.y1 - d.y0) > 30 ? d.data.value + "%" : ""; });

// Tooltip
var tooltip = container.append("div")
  .style("position", "absolute").style("display", "none")
  .style("background", "#fff").style("border", "1px solid #e5e5e5")
  .style("border-radius", "8px").style("padding", "8px 12px")
  .style("font-size", "12px").style("box-shadow", "0 4px 12px rgba(0,0,0,0.1)")
  .style("pointer-events", "none").style("z-index", "10");

leaf.on("mouseenter", function(event, d) {
  d3.select(this).attr("opacity", 1).attr("stroke", "#333").attr("stroke-width", 1.5);
  tooltip.style("display", "block")
    .html("<strong>" + d.data.name + "</strong><br/>" + d.parent.data.name + " &middot; " + d.data.value + "% market share");
}).on("mousemove", function(event) {
  var rect = event.currentTarget.closest("svg").parentElement.getBoundingClientRect();
  tooltip.style("left", (event.clientX - rect.left + 12) + "px")
    .style("top", (event.clientY - rect.top - 10) + "px");
}).on("mouseleave", function() {
  d3.select(this).attr("opacity", 0.8).attr("stroke", "none");
  tooltip.style("display", "none");
});

svg.append("text")
  .attr("x", width / 2).attr("y", 18)
  .attr("text-anchor", "middle").attr("font-size", 14).attr("font-weight", "600").attr("fill", "#333")
  .text("Global Smartphone Market Share (%)");
`

// ---------------------------------------------------------------------------
// 8. Circle Packing — Software Project File Sizes (D3)
// ---------------------------------------------------------------------------
const fileData = [
  { name: 'Project', parent: '', value: 0 },
  { name: 'Frontend', parent: 'Project', value: 0 },
  { name: 'Components', parent: 'Frontend', value: 0 },
  { name: 'Header', parent: 'Components', value: 45 },
  { name: 'Sidebar', parent: 'Components', value: 35 },
  { name: 'Modal', parent: 'Components', value: 30 },
  { name: 'DataTable', parent: 'Components', value: 48 },
  { name: 'FormBuilder', parent: 'Components', value: 38 },
  { name: 'Pages', parent: 'Frontend', value: 0 },
  { name: 'HomePage', parent: 'Pages', value: 35 },
  { name: 'Dashboard', parent: 'Pages', value: 52 },
  { name: 'Settings', parent: 'Pages', value: 28 },
  { name: 'Profile', parent: 'Pages', value: 22 },
  { name: 'Hooks', parent: 'Frontend', value: 0 },
  { name: 'useAuth', parent: 'Hooks', value: 25 },
  { name: 'useApi', parent: 'Hooks', value: 32 },
  { name: 'useForm', parent: 'Hooks', value: 18 },
  { name: 'Backend', parent: 'Project', value: 0 },
  { name: 'Routes', parent: 'Backend', value: 0 },
  { name: 'AuthRoute', parent: 'Routes', value: 48 },
  { name: 'UserRoute', parent: 'Routes', value: 42 },
  { name: 'ApiRoute', parent: 'Routes', value: 38 },
  { name: 'Models', parent: 'Backend', value: 0 },
  { name: 'UserModel', parent: 'Models', value: 36 },
  { name: 'ProjectModel', parent: 'Models', value: 32 },
  { name: 'SessionModel', parent: 'Models', value: 30 },
  { name: 'Middleware', parent: 'Backend', value: 0 },
  { name: 'AuthMW', parent: 'Middleware', value: 34 },
  { name: 'Logger', parent: 'Middleware', value: 26 },
  { name: 'CorsHandler', parent: 'Middleware', value: 20 },
  { name: 'Tests', parent: 'Project', value: 0 },
  { name: 'UnitTests', parent: 'Tests', value: 0 },
  { name: 'AuthTest', parent: 'UnitTests', value: 44 },
  { name: 'UserTest', parent: 'UnitTests', value: 40 },
  { name: 'ApiTest', parent: 'UnitTests', value: 38 },
  { name: 'IntTests', parent: 'Tests', value: 0 },
  { name: 'LoginFlow', parent: 'IntTests', value: 42 },
  { name: 'E2EFlow', parent: 'IntTests', value: 46 },
  { name: 'Config', parent: 'Project', value: 0 },
  { name: 'Webpack', parent: 'Config', value: 22 },
  { name: 'TSConfig', parent: 'Config', value: 15 },
  { name: 'ESLint', parent: 'Config', value: 25 },
]

const circlePackCode = `
var stratify = d3.stratify()
  .id(function(d) { return d.name; })
  .parentId(function(d) { return d.parent || null; });

var root = stratify(data)
  .sum(function(d) { return d.value || 0; })
  .sort(function(a, b) { return b.value - a.value; });

var diameter = Math.min(width, height) - 10;
var pack = d3.pack()
  .size([diameter, diameter])
  .padding(4);

pack(root);

var depthColor = d3.scaleSequential(d3.interpolateBlues).domain([-1, 5]);
var offsetX = (width - diameter) / 2;
var offsetY = (height - diameter) / 2;

var focus = root;
var currentView = [root.x, root.y, root.r * 2];

var packG = svg.append("g");

var node = packG.selectAll("g")
  .data(root.descendants())
  .join("g")
  .style("cursor", function(d) { return d.children ? "pointer" : "default"; });

var circle = node.append("circle")
  .attr("fill", function(d) { return d.children ? depthColor(d.depth) : depthColor(d.depth + 0.5); })
  .attr("opacity", function(d) { return d.children ? 0.25 : 0.75; })
  .attr("stroke", function(d) { return d.children ? depthColor(d.depth + 1) : "none"; })
  .attr("stroke-width", 1);

var label = node.append("text")
  .attr("text-anchor", "middle")
  .attr("dy", "0.3em")
  .attr("fill", "#1e3a5f")
  .attr("pointer-events", "none")
  .style("font-weight", function(d) { return d.children ? "600" : "400"; });

function zoomTo(v) {
  var k = diameter / v[2];
  currentView = v;
  node.attr("transform", function(d) {
    return "translate(" + ((d.x - v[0]) * k + diameter / 2 + offsetX) + "," + ((d.y - v[1]) * k + diameter / 2 + offsetY) + ")";
  });
  circle.attr("r", function(d) { return d.r * k; });
  label.attr("font-size", function(d) { return Math.max(Math.min(d.r * k / 3, 12), 0); })
    .text(function(d) {
      var r = d.r * k;
      if (d.children) return r > 40 ? d.data.name : "";
      return r > 14 ? d.data.name : "";
    });
}

zoomTo([root.x, root.y, root.r * 2]);

circle.on("click", function(event, d) {
  if (d.children) {
    var target = focus === d ? root : d;
    focus = target;
    svg.transition().duration(750)
      .tween("zoom", function() {
        var i = d3.interpolateZoom(currentView, [target.x, target.y, target.r * 2]);
        return function(t) { zoomTo(i(t)); };
      });
    event.stopPropagation();
  }
});

svg.on("click", function() {
  focus = root;
  svg.transition().duration(750)
    .tween("zoom", function() {
      var i = d3.interpolateZoom(currentView, [root.x, root.y, root.r * 2]);
      return function(t) { zoomTo(i(t)); };
    });
});

svg.append("text")
  .attr("x", width / 2).attr("y", 18)
  .attr("text-anchor", "middle").attr("font-size", 14).attr("font-weight", "600").attr("fill", "#333")
  .text("Software Project File Sizes (click to zoom)");
`

// ---------------------------------------------------------------------------
// 9. Beeswarm — Salary Distribution (D3)
// ---------------------------------------------------------------------------
function makeSalaryData() {
  const depts = [
    { name: 'Engineering', base: 115, spread: 45 },
    { name: 'Design', base: 95, spread: 30 },
    { name: 'Marketing', base: 85, spread: 25 },
    { name: 'Sales', base: 80, spread: 40 },
    { name: 'Finance', base: 100, spread: 35 },
    { name: 'HR', base: 75, spread: 20 },
  ]
  const result: { department: string; salary: number }[] = []
  let seed = 42
  function rand() { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; }
  for (const dept of depts) {
    for (let i = 0; i < 12; i++) {
      result.push({
        department: dept.name,
        salary: Math.round(dept.base + (rand() - 0.5) * 2 * dept.spread),
      })
    }
  }
  return result
}
const salaryData = makeSalaryData()

const beeswarmCode = `
var departments = ["Engineering", "Design", "Marketing", "Sales", "Finance", "HR"];
var iw = width - margin.left - margin.right;
var ih = height - margin.top - margin.bottom;

var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleBand().domain(departments).range([0, iw]).padding(0.3);
var salaries = data.map(function(d) { return d.salary; });
var y = d3.scaleLinear().domain([d3.min(salaries) - 10, d3.max(salaries) + 10]).range([ih, 0]);
var color = d3.scaleOrdinal().domain(departments)
  .range(["#4E79A7", "#E15759", "#F28E2B", "#76B7B2", "#59A14F", "#EDC948"]);

data.forEach(function(d) {
  d.x = x(d.department) + x.bandwidth() / 2;
  d.y = y(d.salary);
});

var simulation = d3.forceSimulation(data)
  .force("x", d3.forceX(function(d) { return x(d.department) + x.bandwidth() / 2; }).strength(0.8))
  .force("y", d3.forceY(function(d) { return y(d.salary); }).strength(1))
  .force("collide", d3.forceCollide(5.5))
  .stop();

for (var i = 0; i < 150; i++) simulation.tick();

g.append("g").attr("transform", "translate(0," + ih + ")")
  .call(d3.axisBottom(x))
  .selectAll("text").attr("font-size", 11);

g.append("g").call(d3.axisLeft(y).ticks(8).tickFormat(function(d) { return "$" + d + "K"; }));

g.selectAll("line.grid")
  .data(y.ticks(8))
  .join("line")
  .attr("class", "grid")
  .attr("x1", 0).attr("x2", iw)
  .attr("y1", function(d) { return y(d); }).attr("y2", function(d) { return y(d); })
  .attr("stroke", "#f0f0f0");

var tooltip = container.append("div")
  .style("position", "absolute").style("display", "none")
  .style("background", "#fff").style("border", "1px solid #e5e5e5")
  .style("border-radius", "8px").style("padding", "6px 10px")
  .style("font-size", "12px").style("box-shadow", "0 4px 12px rgba(0,0,0,0.1)")
  .style("pointer-events", "none").style("z-index", "10");

g.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", function(d) { return d.x; })
  .attr("cy", function(d) { return d.y; })
  .attr("r", 4.5)
  .attr("fill", function(d) { return color(d.department); })
  .attr("opacity", 0.8)
  .attr("stroke", "#fff")
  .attr("stroke-width", 0.5)
  .style("cursor", "pointer")
  .on("mouseenter", function(event, d) {
    d3.select(this).transition().duration(100).attr("r", 7).attr("opacity", 1);
    tooltip.style("display", "block")
      .html("<strong>" + d.department + "</strong><br/>$" + d.salary + "K");
  }).on("mousemove", function(event) {
    var rect = event.currentTarget.closest("svg").parentElement.getBoundingClientRect();
    tooltip.style("left", (event.clientX - rect.left + 12) + "px")
      .style("top", (event.clientY - rect.top - 10) + "px");
  }).on("mouseleave", function() {
    d3.select(this).transition().duration(100).attr("r", 4.5).attr("opacity", 0.8);
    tooltip.style("display", "none");
  });

svg.append("text")
  .attr("x", width / 2).attr("y", 22)
  .attr("text-anchor", "middle").attr("font-size", 14).attr("font-weight", "600").attr("fill", "#333")
  .text("Salary Distribution by Department");

svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -(height / 2)).attr("y", 16)
  .attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "#888")
  .text("Annual Salary ($K)");
`

// ---------------------------------------------------------------------------
// 10. Phylogenetic Tree — Animal Classification (D3)
// ---------------------------------------------------------------------------
const animalData = [
  { name: 'Animals', parent: '' },
  { name: 'Mammals', parent: 'Animals' },
  { name: 'Primates', parent: 'Mammals' },
  { name: 'Human', parent: 'Primates' },
  { name: 'Chimpanzee', parent: 'Primates' },
  { name: 'Gorilla', parent: 'Primates' },
  { name: 'Carnivora', parent: 'Mammals' },
  { name: 'Lion', parent: 'Carnivora' },
  { name: 'Wolf', parent: 'Carnivora' },
  { name: 'Bear', parent: 'Carnivora' },
  { name: 'Cetacea', parent: 'Mammals' },
  { name: 'Dolphin', parent: 'Cetacea' },
  { name: 'Blue Whale', parent: 'Cetacea' },
  { name: 'Birds', parent: 'Animals' },
  { name: 'Passeriformes', parent: 'Birds' },
  { name: 'Robin', parent: 'Passeriformes' },
  { name: 'Sparrow', parent: 'Passeriformes' },
  { name: 'Crow', parent: 'Passeriformes' },
  { name: 'Accipitriformes', parent: 'Birds' },
  { name: 'Eagle', parent: 'Accipitriformes' },
  { name: 'Hawk', parent: 'Accipitriformes' },
  { name: 'Reptiles', parent: 'Animals' },
  { name: 'Squamata', parent: 'Reptiles' },
  { name: 'Cobra', parent: 'Squamata' },
  { name: 'Gecko', parent: 'Squamata' },
  { name: 'Iguana', parent: 'Squamata' },
  { name: 'Testudines', parent: 'Reptiles' },
  { name: 'Tortoise', parent: 'Testudines' },
  { name: 'Sea Turtle', parent: 'Testudines' },
]

const treeCode = `
var iw = width - margin.left - margin.right - 80;
var ih = height - margin.top - margin.bottom;

var stratify = d3.stratify()
  .id(function(d) { return d.name; })
  .parentId(function(d) { return d.parent || null; });

var root = stratify(data);
var treeLayout = d3.tree().size([ih, iw]);
treeLayout(root);

var g = svg.append("g").attr("transform", "translate(" + (margin.left + 40) + "," + margin.top + ")");

var depthColors = ["#374151", "#4E79A7", "#59A14F", "#E15759", "#F28E2B"];

g.selectAll("path.link")
  .data(root.links())
  .join("path")
  .attr("class", "link")
  .attr("d", d3.linkHorizontal().x(function(d) { return d.y; }).y(function(d) { return d.x; }))
  .attr("fill", "none")
  .attr("stroke", function(d) { return depthColors[d.source.depth] || "#ccc"; })
  .attr("stroke-width", 1.5)
  .attr("opacity", 0.6);

var node = g.selectAll("g.node")
  .data(root.descendants())
  .join("g")
  .attr("class", "node")
  .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

node.append("circle")
  .attr("r", function(d) { return d.children ? 5 : 4; })
  .attr("fill", function(d) { return depthColors[d.depth] || "#F28E2B"; })
  .attr("stroke", "#fff")
  .attr("stroke-width", 1.5);

node.append("text")
  .attr("dx", function(d) { return d.children ? -8 : 8; })
  .attr("dy", "0.32em")
  .attr("text-anchor", function(d) { return d.children ? "end" : "start"; })
  .attr("font-size", function(d) { return d.depth === 0 ? 13 : d.children ? 11 : 10; })
  .attr("font-weight", function(d) { return d.depth < 2 ? "600" : "400"; })
  .attr("fill", "#333")
  .text(function(d) { return d.data.name; });

svg.append("text")
  .attr("x", width / 2).attr("y", 22)
  .attr("text-anchor", "middle").attr("font-size", 14).attr("font-weight", "600").attr("fill", "#333")
  .text("Animal Classification Tree");
`

// ---------------------------------------------------------------------------
// 11. Streamgraph — Music Genre Popularity (D3)
// ---------------------------------------------------------------------------
const musicData = [
  { year: 1960, genre: 'Rock', listeners: 35 },
  { year: 1960, genre: 'Jazz', listeners: 40 },
  { year: 1960, genre: 'Country', listeners: 25 },
  { year: 1960, genre: 'R&B', listeners: 20 },
  { year: 1960, genre: 'Pop', listeners: 30 },
  { year: 1960, genre: 'Hip Hop', listeners: 0 },
  { year: 1960, genre: 'Electronic', listeners: 0 },
  { year: 1970, genre: 'Rock', listeners: 60 },
  { year: 1970, genre: 'Jazz', listeners: 30 },
  { year: 1970, genre: 'Country', listeners: 28 },
  { year: 1970, genre: 'R&B', listeners: 32 },
  { year: 1970, genre: 'Pop', listeners: 45 },
  { year: 1970, genre: 'Hip Hop', listeners: 2 },
  { year: 1970, genre: 'Electronic', listeners: 5 },
  { year: 1980, genre: 'Rock', listeners: 70 },
  { year: 1980, genre: 'Jazz', listeners: 18 },
  { year: 1980, genre: 'Country', listeners: 22 },
  { year: 1980, genre: 'R&B', listeners: 35 },
  { year: 1980, genre: 'Pop', listeners: 65 },
  { year: 1980, genre: 'Hip Hop', listeners: 15 },
  { year: 1980, genre: 'Electronic', listeners: 20 },
  { year: 1990, genre: 'Rock', listeners: 55 },
  { year: 1990, genre: 'Jazz', listeners: 12 },
  { year: 1990, genre: 'Country', listeners: 30 },
  { year: 1990, genre: 'R&B', listeners: 45 },
  { year: 1990, genre: 'Pop', listeners: 70 },
  { year: 1990, genre: 'Hip Hop', listeners: 40 },
  { year: 1990, genre: 'Electronic', listeners: 25 },
  { year: 2000, genre: 'Rock', listeners: 40 },
  { year: 2000, genre: 'Jazz', listeners: 10 },
  { year: 2000, genre: 'Country', listeners: 25 },
  { year: 2000, genre: 'R&B', listeners: 55 },
  { year: 2000, genre: 'Pop', listeners: 80 },
  { year: 2000, genre: 'Hip Hop', listeners: 60 },
  { year: 2000, genre: 'Electronic', listeners: 35 },
  { year: 2010, genre: 'Rock', listeners: 30 },
  { year: 2010, genre: 'Jazz', listeners: 8 },
  { year: 2010, genre: 'Country', listeners: 22 },
  { year: 2010, genre: 'R&B', listeners: 40 },
  { year: 2010, genre: 'Pop', listeners: 85 },
  { year: 2010, genre: 'Hip Hop', listeners: 70 },
  { year: 2010, genre: 'Electronic', listeners: 55 },
  { year: 2020, genre: 'Rock', listeners: 22 },
  { year: 2020, genre: 'Jazz', listeners: 6 },
  { year: 2020, genre: 'Country', listeners: 18 },
  { year: 2020, genre: 'R&B', listeners: 35 },
  { year: 2020, genre: 'Pop', listeners: 75 },
  { year: 2020, genre: 'Hip Hop', listeners: 85 },
  { year: 2020, genre: 'Electronic', listeners: 65 },
]

const streamgraphCode = `
var genres = ["Rock", "Jazz", "Country", "R&B", "Pop", "Hip Hop", "Electronic"];
var years = [1960, 1970, 1980, 1990, 2000, 2010, 2020];

var pivoted = years.map(function(year) {
  var row = { year: year };
  data.filter(function(d) { return d.year === year; }).forEach(function(d) {
    row[d.genre] = d.listeners;
  });
  return row;
});

var iw = width - margin.left - margin.right;
var ih = height - margin.top - margin.bottom;
var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var stack = d3.stack()
  .keys(genres)
  .offset(d3.stackOffsetWiggle)
  .order(d3.stackOrderInsideOut);

var series = stack(pivoted);

var x = d3.scaleLinear().domain([1960, 2020]).range([0, iw]);
var y = d3.scaleLinear()
  .domain([
    d3.min(series, function(s) { return d3.min(s, function(d) { return d[0]; }); }),
    d3.max(series, function(s) { return d3.max(s, function(d) { return d[1]; }); })
  ])
  .range([ih, 0]);

var color = d3.scaleOrdinal().domain(genres)
  .range(["#E15759", "#4E79A7", "#F28E2B", "#B07AA1", "#76B7B2", "#59A14F", "#EDC948"]);

var area = d3.area()
  .x(function(d) { return x(d.data.year); })
  .y0(function(d) { return y(d[0]); })
  .y1(function(d) { return y(d[1]); })
  .curve(d3.curveBasis);

var flatArea = d3.area()
  .x(function(d) { return x(d.data.year); })
  .y0(function() { return ih / 2; })
  .y1(function() { return ih / 2; })
  .curve(d3.curveBasis);

var paths = g.selectAll("path")
  .data(series)
  .join("path")
  .attr("d", flatArea)
  .attr("fill", function(d) { return color(d.key); })
  .attr("opacity", 0.85);

paths.transition()
  .duration(1200)
  .delay(function(d, i) { return i * 80; })
  .attr("d", area);

g.append("g")
  .attr("transform", "translate(0," + ih + ")")
  .call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format("d")));

// Legend
var legend = container.append("div")
  .style("display", "flex").style("justify-content", "center")
  .style("flex-wrap", "wrap").style("gap", "12px")
  .style("padding", "8px 0").style("font-size", "12px");

genres.forEach(function(genre) {
  var item = legend.append("div").style("display", "flex").style("align-items", "center").style("gap", "5px");
  item.append("div")
    .style("width", "12px").style("height", "12px")
    .style("border-radius", "2px").style("background", color(genre));
  item.append("span").style("color", "#666").text(genre);
});

svg.append("text")
  .attr("x", width / 2).attr("y", 22)
  .attr("text-anchor", "middle").attr("font-size", 14).attr("font-weight", "600").attr("fill", "#333")
  .text("Music Genre Popularity (1960 - 2020)");
`

// ---------------------------------------------------------------------------
// 12. Chord Diagram — Trade Flow Between Regions (D3)
// ---------------------------------------------------------------------------
const tradeData = [
  { source: 'N. America', target: 'Europe', value: 450 },
  { source: 'N. America', target: 'E. Asia', value: 380 },
  { source: 'N. America', target: 'S. America', value: 200 },
  { source: 'Europe', target: 'N. America', value: 400 },
  { source: 'Europe', target: 'E. Asia', value: 280 },
  { source: 'Europe', target: 'Africa', value: 150 },
  { source: 'Europe', target: 'Middle East', value: 130 },
  { source: 'E. Asia', target: 'N. America', value: 520 },
  { source: 'E. Asia', target: 'Europe', value: 350 },
  { source: 'E. Asia', target: 'SE Asia', value: 280 },
  { source: 'SE Asia', target: 'E. Asia', value: 180 },
  { source: 'SE Asia', target: 'Europe', value: 120 },
  { source: 'S. America', target: 'N. America', value: 180 },
  { source: 'S. America', target: 'Europe', value: 90 },
  { source: 'Africa', target: 'Europe', value: 100 },
  { source: 'Africa', target: 'E. Asia', value: 80 },
  { source: 'Middle East', target: 'E. Asia', value: 200 },
  { source: 'Middle East', target: 'Europe', value: 180 },
]

const chordCode = `
var regions = [];
data.forEach(function(d) {
  if (regions.indexOf(d.source) === -1) regions.push(d.source);
  if (regions.indexOf(d.target) === -1) regions.push(d.target);
});

var matrix = regions.map(function() { return regions.map(function() { return 0; }); });
data.forEach(function(d) {
  var i = regions.indexOf(d.source);
  var j = regions.indexOf(d.target);
  matrix[i][j] = d.value;
});

var outerRadius = Math.min(width, height) / 2 - 55;
var innerRadius = outerRadius - 22;

var g = svg.append("g").attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

var chord = d3.chord().padAngle(0.04).sortSubgroups(d3.descending);
var chords = chord(matrix);

var arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
var ribbon = d3.ribbon().radius(innerRadius);

var color = d3.scaleOrdinal()
  .domain(regions)
  .range(["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1"]);

var group = g.selectAll("g.group")
  .data(chords.groups)
  .join("g")
  .attr("class", "group");

group.append("path")
  .attr("d", arc)
  .attr("fill", function(d) { return color(regions[d.index]); })
  .attr("stroke", "#fff")
  .attr("stroke-width", 1);

var ribbons = g.selectAll("path.ribbon")
  .data(chords)
  .join("path")
  .attr("class", "ribbon")
  .attr("d", ribbon)
  .attr("fill", function(d) { return color(regions[d.source.index]); })
  .attr("opacity", 0.6)
  .attr("stroke", "none");

ribbons.on("mouseenter", function(event, d) {
  ribbons.attr("opacity", 0.15);
  d3.select(this).attr("opacity", 0.85);
}).on("mouseleave", function() {
  ribbons.attr("opacity", 0.6);
});

group.append("text")
  .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
  .attr("dy", "0.35em")
  .attr("transform", function(d) {
    return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
      + " translate(" + (outerRadius + 12) + ")"
      + (d.angle > Math.PI ? " rotate(180)" : "");
  })
  .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : "start"; })
  .attr("font-size", 11)
  .attr("fill", "#333")
  .text(function(d) { return regions[d.index]; });

svg.append("text")
  .attr("x", width / 2).attr("y", 22)
  .attr("text-anchor", "middle").attr("font-size", 14).attr("font-weight", "600").attr("fill", "#333")
  .text("International Trade Flows ($B)");
`

// ---------------------------------------------------------------------------
// Export all examples
// ---------------------------------------------------------------------------
export const exampleCharts: ChartExample[] = [
  {
    id: 'revenue-scatter',
    title: 'Revenue vs Customer Satisfaction',
    description: 'Create an interactive scatter plot of revenue vs customer satisfaction, colored by region, with a trend line and tooltips',
    chartType: 'Scatter',
    library: 'd3',
    data: scatterData,
    d3Code: scatterCode,
  },
  {
    id: 'coffee-bar',
    title: 'Coffee Consumption by Country',
    description: 'Show coffee consumption by type across countries as a grouped bar chart with warm brown tones',
    chartType: 'Grouped Bar',
    library: 'vega-lite',
    data: coffeeData,
    vegaSpec: coffeeSpec,
  },
  {
    id: 'temp-lines',
    title: 'Monthly City Temperatures',
    description: 'Plot monthly average temperatures for major cities with connected lines and data points',
    chartType: 'Multi-Line',
    library: 'vega-lite',
    data: tempData,
    vegaSpec: tempSpec,
  },
  {
    id: 'gdp-scatter',
    title: 'GDP vs Life Expectancy',
    description: 'Create a bubble chart of GDP vs life expectancy, sized by population, colored by continent, with a trend line',
    chartType: 'Scatter + Regression',
    library: 'vega-lite',
    data: gdpData,
    vegaSpec: gdpSpec,
  },
  {
    id: 'commit-heatmap',
    title: 'Weekly Commit Activity',
    description: 'Make a heatmap of GitHub commit activity by hour and day of week',
    chartType: 'Heatmap',
    library: 'vega-lite',
    data: commitData,
    vegaSpec: commitSpec,
  },
  {
    id: 'revenue-area',
    title: 'Revenue by Product Line',
    description: 'Show quarterly revenue trends by product line as stacked areas with soft pastel colors',
    chartType: 'Stacked Area',
    library: 'vega-lite',
    data: revenueData,
    vegaSpec: revenueSpec,
  },
  {
    id: 'energy-sankey',
    title: 'Energy Flow Diagram',
    description: 'Visualize energy flow from sources through sectors to end uses as a Sankey diagram',
    chartType: 'Sankey',
    library: 'd3',
    data: energyData,
    d3Code: sankeyCode,
  },
  {
    id: 'phone-treemap',
    title: 'Smartphone Market Share',
    description: 'Display global smartphone market share as a treemap with brand groupings',
    chartType: 'Treemap',
    library: 'd3',
    data: smartphoneData,
    d3Code: treemapCode,
  },
  {
    id: 'files-circles',
    title: 'Project File Sizes',
    description: 'Show software project file sizes as nested circles with click-to-zoom',
    chartType: 'Circle Packing',
    library: 'd3',
    data: fileData,
    d3Code: circlePackCode,
  },
  {
    id: 'salary-beeswarm',
    title: 'Salary Distribution',
    description: 'Plot salary distributions across departments as a beeswarm with tooltips',
    chartType: 'Beeswarm',
    library: 'd3',
    data: salaryData,
    d3Code: beeswarmCode,
  },
  {
    id: 'animal-tree',
    title: 'Animal Classification',
    description: 'Draw an animal classification tree diagram with horizontal branches',
    chartType: 'Tree',
    library: 'd3',
    data: animalData,
    d3Code: treeCode,
  },
  {
    id: 'music-stream',
    title: 'Music Genre Popularity',
    description: 'Create a streamgraph showing music genre popularity from 1960 to 2020',
    chartType: 'Streamgraph',
    library: 'd3',
    data: musicData,
    d3Code: streamgraphCode,
  },
  {
    id: 'trade-chord',
    title: 'International Trade Flows',
    description: 'Visualize international trade flows between regions as a chord diagram',
    chartType: 'Chord',
    library: 'd3',
    data: tradeData,
    d3Code: chordCode,
  },
]

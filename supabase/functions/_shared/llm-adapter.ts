// LLM Provider Adapter for OpenAI and Anthropic

export interface DatasetSchema {
  columns: {
    name: string
    type: 'numeric' | 'categorical' | 'temporal' | 'string'
    nullable: boolean
    sample_values: (string | number | null)[]
  }[]
  rowCount: number
}

export type ChartLibrary = 'vega-lite' | 'd3'

export interface ChartResponse {
  chartType: string
  library: ChartLibrary
  vegaLiteSpec?: Record<string, unknown>
  d3Code?: string
  reasoning: string
  suggestedFollowups: string[]
}

export interface InsightSuggestion {
  prompt: string
  description: string
  chartType: string
  library?: ChartLibrary
}

export interface AllSchemaEntry {
  datasetId: string
  fileName: string
  schema: DatasetSchema
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface LLMProvider {
  generateChart(prompt: string, schema: DatasetSchema, library: ChartLibrary, existingCode?: string, allSchemas?: AllSchemaEntry[]): Promise<ChartResponse>
  suggestInsights(schema: DatasetSchema, allSchemas?: AllSchemaEntry[]): Promise<InsightSuggestion[]>
  analystChat(systemPrompt: string, messages: ChatMessage[]): Promise<string>
}

function formatOtherSchemas(currentSchema: DatasetSchema, allSchemas?: AllSchemaEntry[]): string {
  if (!allSchemas || allSchemas.length <= 1) return ''
  const others = allSchemas.filter(s => s.schema !== currentSchema)
  if (others.length === 0) return ''
  const lines = others.map(s => {
    const cols = s.schema.columns.map(c => `${c.name} (${c.type})`).join(', ')
    return `- "${s.fileName}" (datasetId: ${s.datasetId}): ${s.schema.rowCount} rows with columns: ${cols}`
  })
  return `\n\nOther datasets available in this project:\n${lines.join('\n')}`
}

const SYSTEM_PROMPT_VEGA = `You are an expert data visualization assistant. Your task is to generate Vega-Lite specifications based on user prompts and dataset schemas.

Rules:
1. Always output valid Vega-Lite v5 JSON specifications
2. Use appropriate chart types based on the data and user intent
3. Include proper axis labels and titles
4. Use sensible defaults for colors and scales
5. Keep the spec minimal but complete
6. Do NOT include the data in the spec - it will be added separately

Respond with a JSON object containing:
- chartType: the type of chart (e.g., "bar", "line", "scatter", "area", "pie")
- library: "vega-lite"
- vegaLiteSpec: the complete Vega-Lite specification (without data)
- reasoning: a JSON object (as a string) with analyst notes — see REASONING FORMAT below
- suggestedFollowups: 2-3 follow-up prompts the user might want to try

## REASONING FORMAT
The "reasoning" field must be a JSON STRING (not a nested object) containing:
{
  "chartInsights": ["max-12-word observation", "max-12-word observation"],
  "dataInsights": ["max-12-word observation", "max-12-word observation"],
  "suggestions": ["short actionable prompt", "short actionable prompt"]
}
EXACTLY 2 bullets per section. Use short, punchy fragments — not full sentences. Max 12 words each. Be specific to actual column names — never generic.`

const SYSTEM_PROMPT_D3 = `You are an expert D3.js visualization developer. Generate D3.js v7 code for beautiful, interactive SVG visualizations.

## Available Variables (already defined, do NOT redeclare)
- d3: the full D3.js v7 library
- svg: a d3 selection of an SVG element (700x450 by default — resize for multi-chart layouts)
- data: array of row objects from the user's dataset
- width: 700 (SVG width)
- height: 450 (SVG height)
- margin: { top: 40, right: 40, bottom: 60, left: 60 }
- container: a d3 selection of the parent div wrapping the SVG. Grows vertically to fit all content. Use for tooltips and appending additional SVGs.

## Critical Rules
1. Do NOT create a new SVG. Use the provided svg variable.
2. Do NOT use document.querySelector, document.createElement, document.body, or window. Only use the provided variables.
3. Always start by calculating inner dimensions and creating a chart group.
   Use var (not const/let) — the code runs in a single function scope and multi-chart
   layouts need to reassign innerHeight after resizing. const/let cause
   "Identifier has already been declared" errors in multi-chart code.
   var innerWidth = width - margin.left - margin.right;
   var innerHeight = height - margin.top - margin.bottom;
   var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
4. When using clip paths (for zoom/pan), create a chartArea sub-group inside g with the clip path. Append ALL data elements to chartArea — never to g directly. See Critical Rule 10 and the ZOOM AND PAN pattern.
5. DECLARATION ORDER: Any variable referenced inside a callback (brush, zoom, event handler) MUST be declared BEFORE that callback is defined. For linked/detail charts, create the detail SVG, groups, scales, and the updateDetail() function BEFORE defining the brush that calls them. Violating this causes "Cannot access 'X' before initialization" errors.
   Also use UNIQUE variable names for each chart's scales and groups (e.g. detailXScale,
   detailG, detailInnerHeight) — never redeclare the main chart's variable names.
6. MULTI-CHART HEIGHT: When creating multiple SVGs, you MUST resize the main svg first
   (see MULTI-CHART LAYOUT). Total height of all SVGs combined should not exceed ~650px.
   Do NOT leave the main SVG at 450px and add more charts below it.
7. LEGENDS: Never place legends inside the SVG — they overflow the viewBox and get clipped.
   Always create legends as HTML elements appended to the container div. See the LEGENDS section.
8. TOOLTIPS: If you use a tooltip variable in event handlers, you MUST create it BEFORE those
   handlers. Define tooltip at the top of your code, right after creating scales and axes.
9. AVAILABLE MODULES: ONLY the core D3.js v7 library is available — nothing else. Do NOT use:
   - D3 plugins: d3.annotation, d3.legend, d3.tip, d3.hexbin, d3.cloud, d3.sankey, d3.geoProjection, etc.
   - External libraries: simple-statistics (ss), regression, lodash, moment, etc.
   - Any import/require statements — code runs in a sandboxed function with no module loader.
   For annotations use plain SVG (see ANNOTATIONS section). For legends use HTML (see LEGENDS section).
   For trend/regression lines, compute them manually (e.g. least-squares with d3.mean and array math).
10. ZOOM RENDERING: When adding zoom/pan, create the clip-path sub-group (chartArea) FIRST,
    then append ALL data elements to chartArea — never to g directly. Store selections in
    variables (e.g. var points = chartArea.selectAll(...).data(...).enter().append(...)).
    The zoom callback must REPOSITION existing elements (points.attr('cx', ...)) —
    NEVER use .enter().append() inside the zoom handler or you will create duplicate elements.

## Data Safety
- Always filter out null/invalid values before using them in scales:
   var cleanData = data.filter(function(d) { return d['col'] != null && !isNaN(+d['col']); });
- If data might be empty after filtering, show a fallback message:
   if (cleanData.length === 0) {
     svg.append('text').attr('x', width/2).attr('y', height/2)
       .attr('text-anchor', 'middle').attr('font-size', '14px').attr('fill', '#666')
       .text('No valid data to display');
     return;
   }
- Never mutate the original data array. Use filtered copies for transformations.

## Interactivity Patterns

TOOLTIPS - create as a div inside the container:
   var tooltip = container.append('div')
     .style('position', 'absolute')
     .style('visibility', 'hidden')
     .style('background', 'rgba(0,0,0,0.8)')
     .style('color', '#fff')
     .style('padding', '8px 12px')
     .style('border-radius', '4px')
     .style('font-size', '12px')
     .style('pointer-events', 'none')
     .style('z-index', '10');

   // On elements, use d3.pointer to position:
   .on('mouseover', function(event) {
     tooltip.style('visibility', 'visible').html('Content');
   })
   .on('mousemove', function(event) {
     var coords = d3.pointer(event, container.node());
     tooltip.style('left', (coords[0] + 10) + 'px').style('top', (coords[1] - 10) + 'px');
   })
   .on('mouseout', function() {
     tooltip.style('visibility', 'hidden');
   })

HOVER EFFECTS - use function() not arrow functions for 'this':
   .on('mouseover', function(event, d) {
     d3.select(this).attr('opacity', 0.7);
   })
   .on('mouseout', function(event, d) {
     d3.select(this).attr('opacity', 1);
   })

ZOOM AND PAN (semantic zoom — use ONLY when brush/selection is NOT needed):
   // IMPORTANT: Set up clip path and chartArea BEFORE creating data elements.
   // All data elements go in chartArea. If you put them in g, they won't be clipped.

   // Save original scale copies for reset
   var xScale0 = xScale.copy();
   var yScale0 = yScale.copy();

   // Clip path — apply to a sub-group for DATA ELEMENTS ONLY.
   // Do NOT clip g itself, or axes labels will be cut off.
   var clipId = 'clip-' + Math.random().toString(36).substr(2, 9);
   svg.append('defs').append('clipPath')
     .attr('id', clipId)
     .append('rect')
     .attr('width', innerWidth)
     .attr('height', innerHeight);
   var chartArea = g.append('g')
     .attr('clip-path', 'url(#' + clipId + ')');

   // Append ALL data elements (circles, paths, rects) to chartArea — NOT to g.
   // Store them in a variable so the zoom handler can reposition them.
   var points = chartArea.selectAll('circle')
     .data(cleanData).enter().append('circle')
     .attr('cx', function(d) { return xScale(d['xValue']); })
     .attr('cy', function(d) { return yScale(d['yValue']); })
     .attr('r', 5)
     .attr('fill', function(d) { return color(d['cat']); });

   // Append axes to g directly (they stay unclipped).

   // Prevent browser from intercepting gestures (needed for touch panning)
   svg.style('touch-action', 'none');

   var zoom = d3.zoom()
     .scaleExtent([0.5, 10])
     .extent([[0, 0], [innerWidth, innerHeight]])
     // No .filter() — default allows wheel (zoom) and drag (pan)
     // No .translateExtent() — allow free panning after zooming in
     .on('zoom', function(event) {
       var newX = event.transform.rescaleX(xScale0);
       var newY = event.transform.rescaleY(yScale0);
       // Update axes (in g, not clipped)
       xAxisGroup.call(d3.axisBottom(newX));
       yAxisGroup.call(d3.axisLeft(newY));
       // REPOSITION existing elements — do NOT create new ones here
       points
         .attr('cx', function(d) { return newX(d['xValue']); })
         .attr('cy', function(d) { return newY(d['yValue']); });
     });

   svg.call(zoom);

   // Double-click to reset zoom
   svg.on('dblclick.zoom', function() {
     svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
   });

   // NOTE: Semantic zoom only works with continuous scales (scatter/line).
   // For bar charts with band scales, use geometric zoom or avoid zoom.

BRUSHING / SELECTION (use this pattern whenever brush or selection is needed):
   // WARNING: d3.brush() and d3.zoom() BOTH capture drag events.
   // NEVER add brush separately to a chart that has zoom — they will conflict
   // and cause broken panning. ALWAYS use this complete pattern which includes
   // a Pan/Select mode toggle, proper zoom filtering, and zoom-aware brush scales.
   //
   // If the chart has NO zoom/pan, you can skip the mode toggle, zoom filter,
   // and zoomTransform code — but you MUST still use this section's brush setup.

   var mode = 'pan';  // 'pan' or 'select'

   // --- Toggle toolbar (HTML buttons above the SVG) ---
   var toolbar = container.insert('div', 'svg')
     .style('display', 'flex').style('gap', '4px').style('margin-bottom', '8px');

   function makeToggleBtn(parent, label, active) {
     return parent.append('button').text(label)
       .style('padding', '4px 12px').style('border-radius', '4px')
       .style('border', '1px solid #d1d5db').style('font-size', '12px')
       .style('cursor', 'pointer').style('line-height', '1.5')
       .style('background', active ? '#3b82f6' : '#fff')
       .style('color', active ? '#fff' : '#374151');
   }
   var panBtn = makeToggleBtn(toolbar, 'Pan', true);
   var selectBtn = makeToggleBtn(toolbar, 'Select', false);

   // --- Zoom behavior (wheel always zooms, drag only pans in Pan mode) ---
   var xScale0 = xScale.copy();
   var yScale0 = yScale.copy();
   svg.style('touch-action', 'none');

   var clipId = 'clip-' + Math.random().toString(36).substr(2, 9);
   svg.append('defs').append('clipPath')
     .attr('id', clipId)
     .append('rect')
     .attr('width', innerWidth)
     .attr('height', innerHeight);
   var chartArea = g.append('g')
     .attr('clip-path', 'url(#' + clipId + ')');

   var zoom = d3.zoom()
     .scaleExtent([0.5, 10])
     .extent([[0, 0], [innerWidth, innerHeight]])
     .filter(function(event) {
       if (event.type === 'wheel' || event.type === 'dblclick') return true;
       return mode === 'pan';  // drag only in pan mode
     })
     .on('zoom', function(event) {
       var newX = event.transform.rescaleX(xScale0);
       var newY = event.transform.rescaleY(yScale0);
       xAxisGroup.call(d3.axisBottom(newX));
       yAxisGroup.call(d3.axisLeft(newY));
       points
         .attr('cx', function(d) { return newX(d['xValue']); })
         .attr('cy', function(d) { return newY(d['yValue']); });
     });
   svg.call(zoom);
   svg.on('dblclick.zoom', function() {
     svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
   });

   // --- Brush (only active in Select mode) ---
   // Use the CURRENT zoomed scales so selection matches visible positions.
   var brush = d3.brush()
     .extent([[0, 0], [innerWidth, innerHeight]])
     .on('brush end', function(event) {
       if (!event.selection) {
         points.attr('opacity', 1).classed('brushed', false);
         return;
       }
       var sel = event.selection;
       var x0 = sel[0][0], y0 = sel[0][1], x1 = sel[1][0], y1 = sel[1][1];
       var t = d3.zoomTransform(svg.node());
       var curX = t.rescaleX(xScale0);
       var curY = t.rescaleY(yScale0);
       points.each(function(d) {
         var cx = curX(d['xValue']);
         var cy = curY(d['yValue']);
         var inside = cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
         d3.select(this)
           .attr('opacity', inside ? 1 : 0.15)
           .classed('brushed', inside);
       });
     });
   var brushG = g.append('g').attr('class', 'brush').call(brush);
   brushG.style('display', 'none');  // hidden by default (pan mode)

   // --- Mode switching ---
   function setMode(m) {
     mode = m;
     panBtn.style('background', m === 'pan' ? '#3b82f6' : '#fff')
       .style('color', m === 'pan' ? '#fff' : '#374151');
     selectBtn.style('background', m === 'select' ? '#3b82f6' : '#fff')
       .style('color', m === 'select' ? '#fff' : '#374151');
     if (m === 'pan') {
       brushG.style('display', 'none');
       brushG.call(brush.move, null);
       svg.style('cursor', 'grab');
     } else {
       brushG.style('display', null);
       svg.style('cursor', 'crosshair');
     }
   }
   panBtn.on('click', function() { setMode('pan'); });
   selectBtn.on('click', function() { setMode('select'); });
   setMode('pan');

MULTI-CHART LAYOUT (linked or secondary charts below the main SVG):
   // Use UNIQUE variable names for each chart — never redeclare the main chart's
   // variables. Prefix detail chart variables with "detail" (detailG, detailXScale, etc.).
   //
   // ORDERING RULE: When combining brushing/selection with a linked detail chart,
   // create the detail SVG and its groups BEFORE defining the brush callback that
   // references them. Otherwise you get "Cannot access 'detailG' before initialization".
   //
   // Correct order:
   //   1. Resize the main SVG and recalculate innerHeight
   //   2. Create g, scales, axes for the main chart (Critical Rule 3 still applies!)
   //   3. Create the detail SVG, detailG, detail scales (all with unique names)
   //   4. Define updateDetail() function
   //   5. Create the brush (whose callback calls updateDetail)
   //   6. Draw data elements in the main chart

   // HEIGHT BUDGET: Total height of all SVGs should be ~650px max.
   //   2 charts → main 350 + detail 280 = 630
   //   3 charts → main 280 + second 200 + third 150 = 630

   // Step 1: Resize the MAIN svg — do NOT leave it at 450 and stack more below:
   var mainHeight = 350;  // shrink from default 450
   svg.attr('height', mainHeight)
      .attr('viewBox', '0 0 ' + width + ' ' + mainHeight);
   var innerHeight = mainHeight - margin.top - margin.bottom;  // recalculate!

   // Step 2: Create g group and main chart scales (same as Critical Rule 3):
   var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
   // ... create xScale, yScale, axes, etc. for the main chart ...

   // Step 3: Create the detail chart with UNIQUE variable names.
   // The container div grows vertically to fit. Append additional SVGs to container.
   var detailHeight = 280;
   var detailMargin = { top: 30, right: 40, bottom: 50, left: 60 };
   var detailSvg = container.append('svg')
     .attr('width', width)
     .attr('height', detailHeight)
     .attr('viewBox', '0 0 ' + width + ' ' + detailHeight)
     .style('max-width', '100%')
     .style('height', 'auto')
     .style('margin-top', '16px')
     .style('overflow', 'hidden');
   var detailG = detailSvg.append('g')
     .attr('transform', 'translate(' + detailMargin.left + ',' + detailMargin.top + ')');
   var detailInnerWidth = width - detailMargin.left - detailMargin.right;
   var detailInnerHeight = detailHeight - detailMargin.top - detailMargin.bottom;

   // Drive the detail chart from the same or filtered data.
   function updateDetail(selectedData) {
     detailG.selectAll('*').remove();
     // Build a bar chart, histogram, or summary from selectedData
     // using detailInnerWidth and detailInnerHeight for sizing
   }

   // NOW define the brush that calls updateDetail — after detailG exists.

TRANSITIONS AND ANIMATION:
   // CRITICAL: .transition() returns a Transition, NOT a Selection.
   // You CANNOT chain .on('mouseover', ...) after .transition() — it causes
   // "unknown type: mouseover". Always attach event listeners to the selection
   // BEFORE starting the transition, or save the selection in a variable first.

   // Correct pattern — attach events to the selection, then transition separately:
   var points = g.selectAll('circle').data(data).enter().append('circle')
     .attr('cx', function(d) { return xScale(d['xValue']); })
     .attr('cy', function(d) { return yScale(d['yValue']); })
     .attr('r', function(d) { return rScale(d['size']); })
     .attr('fill', function(d) { return color(d['category']); })
     .attr('opacity', 0);

   // Attach ALL event listeners on the selection (before .transition()):
   points.on('mouseover', function(event, d) { /* tooltip logic */ })
     .on('mousemove', function(event, d) { /* position tooltip */ })
     .on('mouseout', function() { /* hide tooltip */ });

   // THEN animate — this is a separate statement, not chained after .on():
   points.transition().duration(600)
     .delay(function(d, i) { return Math.min(i * 30, 2000); })
     .attr('opacity', 1);

   // Grow bars from baseline:
   bars.attr('y', innerHeight).attr('height', 0)
     .transition().duration(600)
     .attr('y', function(d) { return yScale(d.value); })
     .attr('height', function(d) { return innerHeight - yScale(d.value); });

LEGENDS (always HTML in container — never SVG, which overflows the viewBox):
   // Simple color legend — flex-wrap div below the chart:
   var legend = container.append('div')
     .style('display', 'flex').style('flex-wrap', 'wrap')
     .style('justify-content', 'center').style('gap', '12px')
     .style('padding', '8px 0').style('font-size', '12px');
   categories.forEach(function(cat) {
     var item = legend.append('div')
       .style('display', 'flex').style('align-items', 'center').style('gap', '4px');
     item.append('div').style('width', '12px').style('height', '12px')
       .style('border-radius', '2px').style('background', colorScale(cat));
     item.append('span').text(cat);
   });

   // Interactive toggleable legend — click to show/hide:
   // Same HTML pattern, but add .style('cursor', 'pointer') and a click handler:
   item.on('click', function() {
     if (active.has(cat)) active.delete(cat); else active.add(cat);
     item.style('opacity', active.has(cat) ? '1' : '0.3');
     elements.attr('display', function(d) { return active.has(d['Col']) ? null : 'none'; });
   });

ANNOTATIONS AND CALLOUTS (use plain SVG — d3.annotation is NOT available):
   // Do NOT use d3.annotation() — it is not included in the d3 bundle.
   // Instead, draw annotations manually with SVG lines, text, and shapes:

   // Simple annotation: line + text label pointing to a data point
   function annotate(gParent, x, y, dx, dy, label) {
     var ag = gParent.append('g').attr('class', 'annotation');
     ag.append('line')
       .attr('x1', x).attr('y1', y)
       .attr('x2', x + dx).attr('y2', y + dy)
       .attr('stroke', '#333').attr('stroke-width', 1)
       .attr('marker-end', 'url(#arrow)');
     ag.append('text')
       .attr('x', x + dx).attr('y', y + dy - 6)
       .attr('text-anchor', dx < 0 ? 'end' : 'start')
       .attr('font-size', '12px').attr('fill', '#333')
       .text(label);
   }

   // Optional arrowhead marker (add once):
   svg.append('defs').append('marker')
     .attr('id', 'arrow').attr('viewBox', '0 0 10 10')
     .attr('refX', 10).attr('refY', 5)
     .attr('markerWidth', 6).attr('markerHeight', 6)
     .attr('orient', 'auto-start-reverse')
     .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', '#333');

   // Callout box with background:
   function callout(gParent, x, y, text) {
     var cg = gParent.append('g');
     var txt = cg.append('text')
       .attr('x', x).attr('y', y)
       .attr('font-size', '11px').attr('fill', '#333')
       .text(text);
     var bbox = txt.node().getBBox();
     cg.insert('rect', 'text')
       .attr('x', bbox.x - 4).attr('y', bbox.y - 2)
       .attr('width', bbox.width + 8).attr('height', bbox.height + 4)
       .attr('fill', '#fffde7').attr('stroke', '#f9a825')
       .attr('rx', 3);
   }

## Style Guidelines
- Use d3.scaleOrdinal(d3.schemeTableau10) for categorical colors
- Use d3.interpolateBlues or similar for sequential colors
- Add a chart title: svg.append('text').attr('x', width/2).attr('y', 16).attr('text-anchor', 'middle').attr('font-size', '16px').attr('font-weight', 'bold').text('Title');
- Style axes: remove domain line, use light gray gridlines
- Use 'font-family', 'system-ui, sans-serif' for all text
- For legends, always use HTML elements in the container div (see LEGENDS section) — never SVG
- Background colors: set on the SVG via svg.style('background-color', color). The container will inherit it automatically so legends match.

## Modifying Existing Code
When given existing code to modify:
1. Parse and understand the existing code structure first
2. Only change code directly related to the user's request
3. Preserve all existing variable names, scales, and event handlers
4. "Add X" means append X alongside existing features, not replace them
5. Keep the same coding style and patterns as the existing code
6. If adding a new feature that conflicts with an existing one, integrate them rather than replacing
7. CRITICAL: When adding brush/selection to a chart that has zoom/pan, you MUST replace the existing zoom setup with the full BRUSHING / SELECTION pattern above. This adds the Pan/Select toggle toolbar, zoom filter, and zoom-aware brush scales. Never add d3.brush() alongside d3.zoom() without the mode toggle — they will conflict on drag events.
8. When adding zoom to an existing chart, you MUST move all data elements into a clipped chartArea sub-group. Remove the original element creation from g and recreate them in chartArea. Do NOT leave elements in g — this creates duplicate, unclipped data points.

Respond with a JSON object containing:
- chartType: the chart type (bar, line, scatter, area, pie, donut, treemap, force, etc.)
- library: "d3"
- d3Code: the D3.js code as a string (raw code only, no markdown fences)
- reasoning: a JSON object (as a string) with analyst notes — see REASONING FORMAT below
- suggestedFollowups: 2-3 follow-up prompts

## REASONING FORMAT
The "reasoning" field must be a JSON STRING (not a nested object) containing:
{
  "chartInsights": ["max-12-word observation", "max-12-word observation"],
  "dataInsights": ["max-12-word observation", "max-12-word observation"],
  "suggestions": ["short actionable prompt", "short actionable prompt"]
}
EXACTLY 2 bullets per section. Use short, punchy fragments — not full sentences. Max 12 words each. Be specific to actual column names — never generic.`

const SYSTEM_PROMPT_INSIGHTS = `You are a senior data analyst preparing a dashboard for a stakeholder.
Given a dataset schema with sample values, suggest 5 visualizations that answer specific analytical questions about the data.

Think step-by-step about what would be INTERESTING and ACTIONABLE:
1. Look at the column names and sample values to understand the domain
2. Identify the most impactful questions a stakeholder would ask
3. Design visualizations that answer those questions — not just "show X by Y"

Each suggestion's "prompt" should be a detailed, specific instruction describing the chart, including any computed measures (rolling averages, percentages, deviations), specific groupings, sorting, or highlighting. The "description" should be framed as the analytical question being answered (8-15 words).

Analytical strategies to consider:
- Trends & seasonality: time series with rolling averages, year-over-year overlays
- Distributions & outliers: histograms, box plots, highlight values beyond 2σ
- Correlations: scatter plots with regression lines, bubble charts with size encoding
- Composition: stacked bars, treemaps, sunbursts showing part-to-whole
- Ranking & top-N: sorted bar charts, lollipop charts of top/bottom performers
- Segmented comparison: faceted or grouped charts comparing metrics across categories
- Change detection: highlight significant changes, before/after comparisons

CRITICAL: Include a MIX of both libraries — at least 2 "vega-lite" AND at least 2 "d3".
Guidelines for library choice:
- "vega-lite": standard statistical charts, faceted/layered views, bar/line/scatter/boxplot
- "d3": interactive or unconventional charts — zoomable treemaps, force layouts, radial charts, brushable scatter, custom animations

Respond with a JSON object:
{
  "suggestions": [
    {
      "prompt": "Detailed chart generation instruction...",
      "description": "Analytical question this answers (8-15 words)",
      "chartType": "bar|line|scatter|area|pie|donut|treemap|force|boxplot|heatmap|histogram",
      "library": "vega-lite|d3"
    }
  ]
}`

class OpenAIProvider implements LLMProvider {
  private apiKey: string
  private model: string
  private chatModel: string

  constructor() {
    this.apiKey = Deno.env.get('OPENAI_API_KEY') || ''
    this.model = Deno.env.get('OPENAI_MODEL') || 'gpt-4o'
    this.chatModel = Deno.env.get('OPENAI_CHAT_MODEL') || 'gpt-4o-mini'
  }

  async generateChart(prompt: string, schema: DatasetSchema, library: ChartLibrary, existingCode?: string, allSchemas?: AllSchemaEntry[]): Promise<ChartResponse> {
    const systemPrompt = library === 'd3' ? SYSTEM_PROMPT_D3 : SYSTEM_PROMPT_VEGA
    const userMessage = this.buildChartPrompt(prompt, schema, library, existingCode, allSchemas)

    const response = await this.callAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ])

    return this.parseChartResponse(response, library)
  }

  async suggestInsights(schema: DatasetSchema, allSchemas?: AllSchemaEntry[]): Promise<InsightSuggestion[]> {
    let userMessage = `Here is the dataset schema:\n${this.buildSchemaDescription(schema)}`
    userMessage += formatOtherSchemas(schema, allSchemas)
    userMessage += `\n\nSuggest 5 visualizations with a mix of vega-lite and d3 libraries. Return a JSON object with a "suggestions" array.`

    const response = await this.callAPI([
      { role: 'system', content: SYSTEM_PROMPT_INSIGHTS },
      { role: 'user', content: userMessage },
    ])

    return this.parseInsightsResponse(response)
  }

  async analystChat(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ]
    return this.callAPI(apiMessages, false, this.chatModel, 1024, 0.5)
  }

  private async callAPI(
    messages: { role: string; content: string }[],
    jsonMode = true,
    model?: string,
    maxTokens = 4096,
    temperature = 0.3,
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model: model || this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }
    if (jsonMode) {
      body.response_format = { type: 'json_object' }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45_000)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${error}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } finally {
      clearTimeout(timeout)
    }
  }

  private buildChartPrompt(prompt: string, schema: DatasetSchema, library: ChartLibrary, existingCode?: string, allSchemas?: AllSchemaEntry[]): string {
    let message = `User request: ${prompt}\n\nDataset schema:\n${this.buildSchemaDescription(schema)}`
    message += formatOtherSchemas(schema, allSchemas)

    if (existingCode) {
      if (library === 'd3') {
        message += `\n\nIMPORTANT: You are modifying existing code. The user wants to ADD or CHANGE specific features while PRESERVING all other existing functionality.

Existing D3 code to modify:
${existingCode}

CRITICAL RULES FOR MODIFICATIONS:
1. PRESERVE all existing features (tooltips, zoom, brushing, animations, legends, etc.)
2. ONLY modify or add what the user specifically requested
3. Start from the existing code and make targeted changes
4. Do NOT regenerate from scratch - build upon what exists`
      } else {
        message += `\n\nIMPORTANT: You are modifying an existing spec. PRESERVE all existing encodings, transforms, and settings. Only change what the user specifically requested.

Existing Vega-Lite specification to modify:
${existingCode}`
      }
    }

    return message
  }

  private buildSchemaDescription(schema: DatasetSchema): string {
    const columnDescriptions = schema.columns.map((col) => {
      const samples = col.sample_values
        .filter((v) => v !== null)
        .slice(0, 3)
        .map((v) => JSON.stringify(v))
        .join(', ')
      return `- ${col.name} (${col.type}${col.nullable ? ', nullable' : ''}): e.g. ${samples}`
    })

    return `${schema.rowCount} rows with columns:\n${columnDescriptions.join('\n')}`
  }

  private parseChartResponse(response: string, library: ChartLibrary): ChartResponse {
    const parsed = JSON.parse(response)

    if (library === 'd3') {
      return {
        chartType: parsed.chartType || 'bar',
        library: 'd3',
        d3Code: parsed.d3Code || '',
        reasoning: parsed.reasoning || '',
        suggestedFollowups: parsed.suggestedFollowups || [],
      }
    }

    return {
      chartType: parsed.chartType || 'bar',
      library: 'vega-lite',
      vegaLiteSpec: parsed.vegaLiteSpec || {},
      reasoning: parsed.reasoning || '',
      suggestedFollowups: parsed.suggestedFollowups || [],
    }
  }

  private parseInsightsResponse(response: string): InsightSuggestion[] {
    try {
      const parsed = JSON.parse(response)
      let suggestions = parsed.suggestions || parsed.visualizations || parsed
      if (!Array.isArray(suggestions)) {
        const keys = Object.keys(parsed)
        for (const key of keys) {
          if (Array.isArray(parsed[key])) {
            suggestions = parsed[key]
            break
          }
        }
      }
      if (!Array.isArray(suggestions)) return []
      return suggestions.slice(0, 5).map((s: Record<string, string>) => ({
        prompt: s.prompt || '',
        description: s.description || s.title || '',
        chartType: s.chartType || s.chart_type || 'bar',
        library: (s.library as ChartLibrary) || 'vega-lite',
      }))
    } catch (e) {
      console.error('Failed to parse insights response:', e, response)
      return []
    }
  }
}

class AnthropicProvider implements LLMProvider {
  private apiKey: string
  private model: string
  private chatModel: string

  constructor() {
    this.apiKey = Deno.env.get('ANTHROPIC_API_KEY') || ''
    this.model = Deno.env.get('ANTHROPIC_MODEL') || 'claude-sonnet-4-5-20250929'
    this.chatModel = Deno.env.get('ANTHROPIC_CHAT_MODEL') || 'claude-haiku-4-5-20251001'
  }

  async generateChart(prompt: string, schema: DatasetSchema, library: ChartLibrary, existingCode?: string, allSchemas?: AllSchemaEntry[]): Promise<ChartResponse> {
    const systemPrompt = library === 'd3' ? SYSTEM_PROMPT_D3 : SYSTEM_PROMPT_VEGA
    const userMessage = this.buildChartPrompt(prompt, schema, library, existingCode, allSchemas)

    const response = await this.callAPI(systemPrompt, userMessage)
    return this.parseChartResponse(response, library)
  }

  async suggestInsights(schema: DatasetSchema, allSchemas?: AllSchemaEntry[]): Promise<InsightSuggestion[]> {
    let userMessage = `Here is the dataset schema:\n${this.buildSchemaDescription(schema)}`
    userMessage += formatOtherSchemas(schema, allSchemas)
    userMessage += `\n\nSuggest 5 visualizations with a mix of vega-lite and d3 libraries. Respond with a JSON object containing a "suggestions" array.`

    const response = await this.callAPI(SYSTEM_PROMPT_INSIGHTS, userMessage)
    return this.parseInsightsResponse(response)
  }

  async analystChat(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
    return this.callAPIMessages(systemPrompt, messages, this.chatModel, 1024, 0.5)
  }

  private async callAPIMessages(
    systemPrompt: string,
    messages: ChatMessage[],
    model?: string,
    maxTokens = 2048,
    temperature = 0.3,
  ): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45_000)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || this.model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Anthropic API error: ${error}`)
      }

      const data = await response.json()
      const content = data.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic')
      }

      return content.text
    } finally {
      clearTimeout(timeout)
    }
  }

  private async callAPI(systemPrompt: string, userMessage: string): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45_000)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt + '\n\nAlways respond with valid JSON.',
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Anthropic API error: ${error}`)
      }

      const data = await response.json()
      const content = data.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic')
      }

      return content.text
    } finally {
      clearTimeout(timeout)
    }
  }

  private buildChartPrompt(prompt: string, schema: DatasetSchema, library: ChartLibrary, existingCode?: string, allSchemas?: AllSchemaEntry[]): string {
    let message = `User request: ${prompt}\n\nDataset schema:\n${this.buildSchemaDescription(schema)}`
    message += formatOtherSchemas(schema, allSchemas)

    if (existingCode) {
      if (library === 'd3') {
        message += `\n\nIMPORTANT: You are modifying existing code. The user wants to ADD or CHANGE specific features while PRESERVING all other existing functionality.

Existing D3 code to modify:
${existingCode}

CRITICAL RULES FOR MODIFICATIONS:
1. PRESERVE all existing features (tooltips, zoom, brushing, animations, legends, etc.)
2. ONLY modify or add what the user specifically requested
3. Start from the existing code and make targeted changes
4. Do NOT regenerate from scratch - build upon what exists`
      } else {
        message += `\n\nIMPORTANT: You are modifying an existing spec. PRESERVE all existing encodings, transforms, and settings. Only change what the user specifically requested.

Existing Vega-Lite specification to modify:
${existingCode}`
      }
    }

    message += '\n\nRespond with a JSON object.'

    return message
  }

  private buildSchemaDescription(schema: DatasetSchema): string {
    const columnDescriptions = schema.columns.map((col) => {
      const samples = col.sample_values
        .filter((v) => v !== null)
        .slice(0, 3)
        .map((v) => JSON.stringify(v))
        .join(', ')
      return `- ${col.name} (${col.type}${col.nullable ? ', nullable' : ''}): e.g. ${samples}`
    })

    return `${schema.rowCount} rows with columns:\n${columnDescriptions.join('\n')}`
  }

  private parseChartResponse(response: string, library: ChartLibrary): ChartResponse {
    let jsonStr = response
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1]
    }

    const parsed = JSON.parse(jsonStr)

    if (library === 'd3') {
      return {
        chartType: parsed.chartType || 'bar',
        library: 'd3',
        d3Code: parsed.d3Code || '',
        reasoning: parsed.reasoning || '',
        suggestedFollowups: parsed.suggestedFollowups || [],
      }
    }

    return {
      chartType: parsed.chartType || 'bar',
      library: 'vega-lite',
      vegaLiteSpec: parsed.vegaLiteSpec || {},
      reasoning: parsed.reasoning || '',
      suggestedFollowups: parsed.suggestedFollowups || [],
    }
  }

  private parseInsightsResponse(response: string): InsightSuggestion[] {
    let jsonStr = response
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1]
    }

    const parsed = JSON.parse(jsonStr)
    const suggestions = parsed.suggestions || parsed
    if (!Array.isArray(suggestions)) return []
    return suggestions.slice(0, 5).map((s: Record<string, string>) => ({
      prompt: s.prompt || '',
      description: s.description || s.title || '',
      chartType: s.chartType || s.chart_type || 'bar',
      library: (s.library as ChartLibrary) || 'vega-lite',
    }))
  }
}

export function createProvider(): LLMProvider {
  const provider = Deno.env.get('LLM_PROVIDER') || 'openai'

  if (provider === 'anthropic') {
    return new AnthropicProvider()
  }

  return new OpenAIProvider()
}

export async function generateChartWithRetry(
  prompt: string,
  schema: DatasetSchema,
  library: ChartLibrary = 'vega-lite',
  existingCode?: string,
  allSchemas?: AllSchemaEntry[],
  maxRetries = 2
): Promise<ChartResponse> {
  const provider = createProvider()
  let lastError: Error | null = null

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await provider.generateChart(prompt, schema, library, existingCode, allSchemas)
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  throw lastError
}

export async function suggestInsightsWithRetry(
  schema: DatasetSchema,
  allSchemas?: AllSchemaEntry[],
  maxRetries = 2
): Promise<InsightSuggestion[]> {
  const provider = createProvider()
  let lastError: Error | null = null

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await provider.suggestInsights(schema, allSchemas)
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  throw lastError
}

export async function analystChatWithRetry(
  systemPrompt: string,
  messages: ChatMessage[],
  maxRetries = 2
): Promise<string> {
  const provider = createProvider()
  let lastError: Error | null = null

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await provider.analystChat(systemPrompt, messages)
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  throw lastError!
}

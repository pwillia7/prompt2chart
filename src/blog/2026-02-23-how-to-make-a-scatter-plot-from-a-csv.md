# How to Make a Scatter Plot from a CSV File

A scatter plot is one of the most useful charts for exploring relationships between two numeric variables. If you have a CSV file with data and want to visualize it quickly, this guide walks you through your options — from manual tools to AI-powered generation.

## What is a Scatter Plot?

A scatter plot places each row of your data as a point on a two-dimensional grid. The position of each point is determined by two columns: one mapped to the X axis and one to the Y axis. When the points cluster or follow a pattern, it reveals a relationship between those two variables.

Common use cases include:

- **Correlation analysis** — does revenue go up as ad spend increases?
- **Outlier detection** — which data points fall far outside the norm?
- **Cluster identification** — do distinct groups appear naturally in the data?

## The Traditional Approach

Historically, making a scatter plot from a CSV required several steps:

1. Open the CSV in Excel or Google Sheets
2. Select the two columns you want to compare
3. Insert a chart and choose "Scatter"
4. Manually configure axes, labels, and colors

This works for a quick look, but the output is static — no tooltips, no zoom, no interactivity.

For a more polished result, developers typically reach for a library like D3.js or Chart.js. But that requires writing code, understanding the library's API, and debugging layout and scaling issues.

## Making a Scatter Plot with AI

Prompt2Chart takes a different approach. You upload your CSV, then describe the chart you want in plain English:

> "Create a scatter plot of revenue vs. customer satisfaction, colored by region, with a trend line and tooltips"

The AI generates interactive D3.js code and renders it immediately. No coding required.

The resulting chart supports:

- **Hover tooltips** — see exact values for any point
- **Zoom and pan** — explore dense clusters by scrolling in
- **Color encoding** — automatically assigns colors to categorical columns like region or category
- **Trend lines** — add a linear regression line with a phrase like "add a trend line"

## Customizing Your Scatter Plot

Once the initial chart is generated, you can refine it with follow-up prompts:

- "Change the color scheme to use blue tones"
- "Add axis labels and a chart title"
- "Make the points larger and semi-transparent so overlapping data is visible"
- "Highlight points where revenue is above 100,000"

Each follow-up sends the existing chart code back to the AI with your new instructions, so features are preserved rather than rebuilt from scratch.

## Exporting the Result

When you're happy with the scatter plot, Prompt2Chart lets you export it as:

- **PNG** — a flat image for presentations or reports
- **SVG** — a vector file that scales perfectly at any size
- **HTML** — a fully self-contained interactive file you can share or embed anywhere

Exports are always free and do not cost any credits.

## When to Use a Scatter Plot

Scatter plots work best when:

- Both variables are **numeric** (continuous or discrete)
- You have at least **20–30 data points** — fewer points are often better shown as a table or bar chart
- You want to see **distribution or correlation**, not just totals

If one of your variables is categorical (like city name or product type), consider a **strip plot** or **beeswarm** instead, which spreads points along a single axis grouped by category.

## Try It Free

Prompt2Chart includes 100 free credits when you sign up — enough to generate dozens of charts. Upload your CSV and describe your scatter plot to see it rendered in seconds.

import type { VegaLiteSpec } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadString(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  downloadBlob(blob, filename)
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

// ---------------------------------------------------------------------------
// D3 SVG → String (with inlined styles)
// ---------------------------------------------------------------------------

const INLINE_STYLE_PROPS = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-anchor',
  'dominant-baseline',
  'cursor',
  'visibility',
  'display',
] as const

function inlineStyles(el: Element) {
  const computed = getComputedStyle(el)
  for (const prop of INLINE_STYLE_PROPS) {
    const val = computed.getPropertyValue(prop)
    if (val) {
      ;(el as HTMLElement).style.setProperty(prop, val)
    }
  }
  for (const child of el.children) {
    inlineStyles(child)
  }
}

export function d3SvgToString(svgEl: SVGSVGElement): string {
  // Read the SVG's background color before cloning (CSS background-color
  // doesn't serialize into SVG markup, so we capture it as a rect fill).
  const bgColor = getComputedStyle(svgEl).backgroundColor || 'white'
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  inlineStyles(clone)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  // Add background rect as first child using the SVG's actual background color
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  bg.setAttribute('width', '100%')
  bg.setAttribute('height', '100%')
  bg.setAttribute('fill', bgColor === 'rgba(0, 0, 0, 0)' ? 'white' : bgColor)
  clone.insertBefore(bg, clone.firstChild)
  return new XMLSerializer().serializeToString(clone)
}

// ---------------------------------------------------------------------------
// D3 SVG → PNG
// ---------------------------------------------------------------------------

export function d3SvgToPng(svgEl: SVGSVGElement, scale = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const bgColor = getComputedStyle(svgEl).backgroundColor || 'white'
    const svgString = d3SvgToString(svgEl)
    const width = svgEl.viewBox.baseVal.width || svgEl.clientWidth || 700
    const height = svgEl.viewBox.baseVal.height || svgEl.clientHeight || 450

    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = bgColor === 'rgba(0, 0, 0, 0)' ? 'white' : bgColor
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create PNG blob'))
        },
        'image/png',
      )
    }
    img.onerror = () => reject(new Error('Failed to render SVG to image'))
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
  })
}

// ---------------------------------------------------------------------------
// Vega View → PNG / SVG
// ---------------------------------------------------------------------------

interface VegaView {
  toImageURL(type: string, scaleFactor?: number): Promise<string>
  toSVG(scaleFactor?: number): Promise<string>
}

export async function vegaToPng(view: VegaView): Promise<Blob> {
  const url = await view.toImageURL('png', 2)
  const res = await fetch(url)
  return res.blob()
}

export async function vegaToSvg(view: VegaView): Promise<string> {
  return view.toSVG()
}

// ---------------------------------------------------------------------------
// Download exports
// ---------------------------------------------------------------------------

export function downloadPng(blob: Blob, name = 'chart') {
  downloadBlob(blob, `${name}.png`)
}

export function downloadSvg(svgString: string, name = 'chart') {
  downloadString(svgString, `${name}.svg`, 'image/svg+xml')
}

// ---------------------------------------------------------------------------
// Standalone HTML builders
// ---------------------------------------------------------------------------

export function buildStandaloneHtmlD3(d3Code: string, data: unknown[]): string {
  const dataJson = JSON.stringify(data)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>D3 Chart</title>
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
<style>
  body { margin: 0; display: flex; justify-content: center; padding: 20px; font-family: sans-serif; background: white; }
  #container { position: relative; }
</style>
</head>
<body>
<div id="container"></div>
<script>
(function() {
  var data = ${dataJson};
  var container = d3.select('#container');
  var width = 700;
  var height = 450;
  var margin = { top: 40, right: 40, bottom: 60, left: 60 };
  var svg = container.append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', '0 0 ' + width + ' ' + height)
    .style('max-width', '100%')
    .style('height', 'auto')
    .style('overflow', 'visible')
    .style('touch-action', 'none');

  ${d3Code}

  // Propagate SVG background to container so HTML legends match
  var svgNode = container.select('svg').node();
  if (svgNode) {
    var bg = getComputedStyle(svgNode).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      container.style('background-color', bg);
      var m = bg.match(/\\d+/g);
      if (m) {
        var lum = (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255;
        if (lum < 0.5) container.style('color', '#e5e5e5');
      }
    }
  }
})();
</script>
</body>
</html>`
}

export function buildStandaloneHtmlVegaLite(spec: VegaLiteSpec): string {
  const specJson = JSON.stringify(spec, null, 2)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vega-Lite Chart</title>
<script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
<style>
  body { margin: 0; display: flex; justify-content: center; padding: 20px; font-family: sans-serif; background: white; }
</style>
</head>
<body>
<div id="vis"></div>
<script>
  var spec = ${specJson};
  vegaEmbed('#vis', spec, { renderer: 'canvas' });
</script>
</body>
</html>`
}

export function downloadHtml(html: string, name = 'chart') {
  downloadString(html, `${name}.html`, 'text/html')
}

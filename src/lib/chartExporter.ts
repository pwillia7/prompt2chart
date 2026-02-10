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

// ---------------------------------------------------------------------------
// HTML legend → SVG conversion for exports
// ---------------------------------------------------------------------------

/** Measure how much extra viewBox height HTML legends need below the SVG. */
function getHtmlLegendExtraHeight(
  containerEl: HTMLDivElement,
  svgEl: SVGSVGElement,
): number {
  const svgRect = svgEl.getBoundingClientRect()
  if (svgRect.height === 0) return 0
  const vb = svgEl.viewBox.baseVal
  const scaleY = vb.height / svgRect.height

  let maxBottom = vb.height
  for (const child of containerEl.children) {
    if (child === svgEl) continue
    const style = getComputedStyle(child as HTMLElement)
    if (style.position === 'absolute' || style.position === 'fixed' || style.display === 'none') continue
    const bottom = ((child as HTMLElement).getBoundingClientRect().bottom - svgRect.top) * scaleY
    if (bottom > maxBottom) maxBottom = bottom
  }
  return Math.max(0, Math.ceil(maxBottom - vb.height) + 8)
}

/** Convert HTML legend elements in the container to SVG and append to clone. */
function appendHtmlLegendsToSvg(
  clone: SVGSVGElement,
  containerEl: HTMLDivElement,
  svgEl: SVGSVGElement,
): void {
  const svgRect = svgEl.getBoundingClientRect()
  if (svgRect.width === 0 || svgRect.height === 0) return

  const vb = svgEl.viewBox.baseVal
  const scaleX = vb.width / svgRect.width
  const scaleY = vb.height / svgRect.height

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  function processEl(el: HTMLElement) {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return

    const x = (rect.left - svgRect.left) * scaleX
    const y = (rect.top - svgRect.top) * scaleY
    const w = rect.width * scaleX
    const h = rect.height * scaleY

    // Render background color (color swatches)
    const bg = style.backgroundColor
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      r.setAttribute('x', String(x))
      r.setAttribute('y', String(y))
      r.setAttribute('width', String(w))
      r.setAttribute('height', String(h))
      r.setAttribute('fill', bg)
      const br = parseFloat(style.borderRadius)
      if (br > 0) r.setAttribute('rx', String(br * scaleX))
      const op = parseFloat(style.opacity)
      if (op < 1) r.setAttribute('opacity', String(op))
      group.appendChild(r)
    }

    // Render text (leaf nodes only)
    if (el.childNodes.length > 0 && el.children.length === 0 && el.textContent?.trim()) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      t.setAttribute('x', String(x))
      t.setAttribute('y', String(y + h * 0.78))
      t.setAttribute('font-size', String(parseFloat(style.fontSize) * scaleX))
      t.setAttribute('fill', style.color || '#333')
      t.setAttribute('font-family', style.fontFamily || 'system-ui, sans-serif')
      if (style.fontWeight && style.fontWeight !== 'normal' && style.fontWeight !== '400') {
        t.setAttribute('font-weight', style.fontWeight)
      }
      const op = parseFloat(style.opacity)
      if (op < 1) t.setAttribute('opacity', String(op))
      t.textContent = el.textContent.trim()
      group.appendChild(t)
    }

    for (const child of el.children) {
      processEl(child as HTMLElement)
    }
  }

  for (const child of containerEl.children) {
    if (child === svgEl) continue
    const style = getComputedStyle(child as HTMLElement)
    if (style.position === 'absolute' || style.position === 'fixed' || style.display === 'none') continue
    processEl(child as HTMLElement)
  }

  if (group.children.length > 0) {
    clone.appendChild(group)
  }
}

export function d3SvgToString(svgEl: SVGSVGElement, containerEl?: HTMLDivElement): string {
  // Read the SVG's background color before cloning (CSS background-color
  // doesn't serialize into SVG markup, so we capture it as a rect fill).
  const bgColor = getComputedStyle(svgEl).backgroundColor || 'white'
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  inlineStyles(clone)

  // Expand viewBox to fit HTML legends
  if (containerEl) {
    const extra = getHtmlLegendExtraHeight(containerEl, svgEl)
    if (extra > 0) {
      const vb = svgEl.viewBox.baseVal
      clone.setAttribute('viewBox', `0 0 ${vb.width} ${vb.height + extra}`)
      clone.setAttribute('height', String(vb.height + extra))
    }
    appendHtmlLegendsToSvg(clone, containerEl, svgEl)
  }

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

export function d3SvgToPng(svgEl: SVGSVGElement, containerEl?: HTMLDivElement, scale = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const bgColor = getComputedStyle(svgEl).backgroundColor || 'white'
    const extra = containerEl ? getHtmlLegendExtraHeight(containerEl, svgEl) : 0
    const svgString = d3SvgToString(svgEl, containerEl)
    const width = svgEl.viewBox.baseVal.width || svgEl.clientWidth || 700
    const height = (svgEl.viewBox.baseVal.height || svgEl.clientHeight || 450) + extra

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

import { VegaLiteSpec } from '../types'
import * as vl from 'vega-lite'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateVegaLiteSpec(spec: VegaLiteSpec): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic structure validation
  if (!spec || typeof spec !== 'object') {
    errors.push('Spec must be a valid object')
    return { valid: false, errors, warnings }
  }

  // Check for required properties
  if (!spec.mark && !spec.layer && !spec.concat && !spec.hconcat && !spec.vconcat) {
    errors.push('Spec must have a "mark", "layer", or composition property')
  }

  // Try to compile the spec
  try {
    vl.compile(spec as vl.TopLevelSpec)
  } catch (error) {
    errors.push(`Compilation error: ${(error as Error).message}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function validateFieldsAgainstSchema(
  spec: VegaLiteSpec,
  schemaFields: string[]
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const usedFields = extractFieldsFromSpec(spec)

  for (const field of usedFields) {
    if (!schemaFields.includes(field)) {
      errors.push(`Field "${field}" not found in dataset schema`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

function extractFieldsFromSpec(spec: VegaLiteSpec): string[] {
  const fields: Set<string> = new Set()

  function extractFromEncoding(encoding: Record<string, unknown>) {
    for (const value of Object.values(encoding)) {
      if (value && typeof value === 'object') {
        const enc = value as Record<string, unknown>
        if (enc.field && typeof enc.field === 'string') {
          fields.add(enc.field)
        }
      }
    }
  }

  if (spec.encoding) {
    extractFromEncoding(spec.encoding as Record<string, unknown>)
  }

  if (spec.layer) {
    for (const layer of spec.layer) {
      if (layer.encoding) {
        extractFromEncoding(layer.encoding as Record<string, unknown>)
      }
    }
  }

  return Array.from(fields)
}

export function addDefaultsToSpec(spec: VegaLiteSpec): VegaLiteSpec {
  const existingConfig = spec.config && typeof spec.config === 'object' ? spec.config : {}

  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 600,
    height: 400,
    autosize: {
      type: 'fit',
      contains: 'padding',
    },
    ...spec,
    config: {
      view: { stroke: 'transparent' },
      axis: {
        labelFontSize: 12,
        titleFontSize: 14,
      },
      legend: {
        labelFontSize: 12,
        titleFontSize: 14,
      },
      ...(existingConfig as Record<string, unknown>),
    },
  }
}

export function compileToVega(spec: VegaLiteSpec): unknown {
  try {
    const compiled = vl.compile(spec as vl.TopLevelSpec)
    return compiled.spec
  } catch {
    return null
  }
}

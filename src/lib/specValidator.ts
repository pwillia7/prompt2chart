import { VegaLiteSpec, DatasetSchema } from '../types'
import { validateVegaLiteSpec, validateFieldsAgainstSchema } from './vegaHelpers'

export interface SpecValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  canRender: boolean
}

export function validateSpec(
  spec: VegaLiteSpec,
  schema?: DatasetSchema
): SpecValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  // Validate Vega-Lite spec structure
  const structureResult = validateVegaLiteSpec(spec)
  allErrors.push(...structureResult.errors)
  allWarnings.push(...structureResult.warnings)

  // Validate fields against schema if provided
  if (schema) {
    const schemaFields = schema.columns.map((c) => c.name)
    const fieldResult = validateFieldsAgainstSchema(spec, schemaFields)
    allErrors.push(...fieldResult.errors)
    allWarnings.push(...fieldResult.warnings)
  }

  // Determine if we can still attempt to render
  const canRender = structureResult.valid || allErrors.length === 0

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    canRender,
  }
}

export function attemptSpecRepair(spec: VegaLiteSpec): VegaLiteSpec {
  const repaired = { ...spec }

  // Add schema if missing
  if (!repaired.$schema) {
    repaired.$schema = 'https://vega.github.io/schema/vega-lite/v5.json'
  }

  // Ensure mark exists
  if (!repaired.mark && !repaired.layer) {
    repaired.mark = 'point'
  }

  return repaired
}

export function extractSpecFromResponse(text: string): VegaLiteSpec | null {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1])
    } catch {
      // Continue to other methods
    }
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {
      // Failed to parse
    }
  }

  return null
}

import { ColumnSchema, DatasetSchema } from '../types'

export function parseData(content: string, isJson: boolean): unknown[] {
  if (isJson) {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : [parsed]
  }

  // Parse CSV
  const lines = content.split('\n').filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const data: unknown[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue

    const row: Record<string, unknown> = {}
    headers.forEach((header, index) => {
      row[header] = parseValue(values[index])
    })
    data.push(row)
  }

  return data
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function parseValue(value: string): unknown {
  if (value === '' || value.toLowerCase() === 'null' || value.toLowerCase() === 'na') {
    return null
  }

  const num = Number(value)
  if (!isNaN(num) && value.trim() !== '') {
    return num
  }

  // Check if it's a date
  const date = new Date(value)
  if (!isNaN(date.getTime()) && value.includes('-') || value.includes('/')) {
    return value // Keep as string but mark as temporal
  }

  return value
}

export function generateSchema(data: unknown[]): DatasetSchema {
  if (data.length === 0) {
    return { columns: [], rowCount: 0 }
  }

  const firstRow = data[0] as Record<string, unknown>
  const columns: ColumnSchema[] = []

  for (const key of Object.keys(firstRow)) {
    const values = data.map((row) => (row as Record<string, unknown>)[key])
    columns.push({
      name: key,
      type: detectColumnType(values),
      nullable: values.some((v) => v === null || v === undefined),
      sample_values: values.slice(0, 5) as (string | number | null)[],
    })
  }

  return {
    columns,
    rowCount: data.length,
  }
}

function detectColumnType(values: unknown[]): ColumnSchema['type'] {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined)
  if (nonNullValues.length === 0) return 'string'

  const allNumbers = nonNullValues.every((v) => typeof v === 'number')
  if (allNumbers) return 'numeric'

  // Check for temporal data
  const temporalPattern = /^\d{4}[-/]\d{2}[-/]\d{2}|^\d{2}[-/]\d{2}[-/]\d{4}/
  const allTemporal = nonNullValues.every((v) => {
    if (typeof v !== 'string') return false
    return temporalPattern.test(v) || !isNaN(Date.parse(v))
  })
  if (allTemporal) return 'temporal'

  // Check for categorical (limited unique values)
  const uniqueValues = new Set(nonNullValues.map(String))
  const uniqueRatio = uniqueValues.size / nonNullValues.length
  if (uniqueRatio < 0.5 && uniqueValues.size < 50) return 'categorical'

  return 'string'
}

export function formatSchemaForPrompt(schema: DatasetSchema): string {
  const columnDescriptions = schema.columns.map((col) => {
    const samples = col.sample_values
      .filter((v) => v !== null)
      .slice(0, 3)
      .map((v) => JSON.stringify(v))
      .join(', ')
    return `- ${col.name} (${col.type}${col.nullable ? ', nullable' : ''}): e.g. ${samples}`
  })

  return `Dataset with ${schema.rowCount} rows:\n${columnDescriptions.join('\n')}`
}

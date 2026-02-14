import { DatasetSchema } from '../../types'

interface DataPreviewProps {
  data: unknown[]
  schema: DatasetSchema
  maxRows?: number
}

export function DataPreview({ data, schema, maxRows = 10 }: DataPreviewProps) {
  const previewData = data.slice(0, maxRows)
  const columns = schema.columns.map((c) => c.name)

  return (
    <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--text)]">
          Data Preview
        </h3>
        <p className="text-sm text-[var(--text-subtle)] mt-1">
          Showing {Math.min(maxRows, data.length)} of {data.length.toLocaleString()} rows
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, idx) => (
              <tr key={idx} className={`border-b border-[var(--border)] ${idx % 2 === 1 ? 'bg-[var(--text)]/[0.03]' : ''} hover:bg-[var(--text)]/[0.05] transition-colors`}>
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 text-sm text-[var(--text-muted)] whitespace-nowrap font-mono text-xs">
                    {formatCellValue((row as Record<string, unknown>)[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '\u2014'
  }
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}

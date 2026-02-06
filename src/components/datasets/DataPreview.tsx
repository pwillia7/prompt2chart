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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">
          Data Preview
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Showing {Math.min(maxRows, data.length)} of {data.length.toLocaleString()} rows
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {previewData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
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
    return '—'
  }
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}

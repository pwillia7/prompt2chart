import { DatasetSchema } from '../../types'

interface SchemaDisplayProps {
  schema: DatasetSchema
}

export function SchemaDisplay({ schema }: SchemaDisplayProps) {
  const typeColors: Record<string, string> = {
    numeric: 'bg-blue-100 text-blue-800',
    categorical: 'bg-green-100 text-green-800',
    temporal: 'bg-purple-100 text-purple-800',
    string: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">
          Dataset Schema
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {schema.rowCount.toLocaleString()} rows, {schema.columns.length} columns
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {schema.columns.map((column) => (
          <div key={column.name} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{column.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[column.type]}`}>
                  {column.type}
                </span>
                {column.nullable && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    nullable
                  </span>
                )}
              </div>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              <span className="text-gray-400">Sample: </span>
              {column.sample_values
                .filter((v) => v !== null)
                .slice(0, 3)
                .map((v) => JSON.stringify(v))
                .join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

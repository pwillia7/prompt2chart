import { DatasetSchema } from '../../types'

interface SchemaDisplayProps {
  schema: DatasetSchema
}

export function SchemaDisplay({ schema }: SchemaDisplayProps) {
  const typeColors: Record<string, string> = {
    numeric: 'bg-[var(--surface-3)] text-[var(--text-muted)]',
    categorical: 'bg-[var(--surface-3)] text-[var(--text-muted)]',
    temporal: 'bg-[var(--surface-3)] text-[var(--text-muted)]',
    string: 'bg-[var(--surface-3)] text-[var(--text-muted)]',
  }

  return (
    <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--text)]">
          Dataset Schema
        </h3>
        <p className="text-sm text-[var(--text-subtle)] mt-1">
          {schema.rowCount.toLocaleString()} rows, {schema.columns.length} columns
        </p>
      </div>

      <div>
        {schema.columns.map((column, idx) => (
          <div key={column.name} className={`px-4 py-3 ${idx < schema.columns.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text)] font-mono text-sm">{column.name}</span>
                <span className={`px-2 py-0.5 rounded-pill text-xs font-medium ${typeColors[column.type]}`}>
                  {column.type}
                </span>
                {column.nullable && (
                  <span className="px-2 py-0.5 rounded-pill text-xs font-medium bg-[var(--warning)]/15 text-[var(--warning)]">
                    nullable
                  </span>
                )}
              </div>
            </div>
            <div className="mt-1 text-sm text-[var(--text-subtle)]">
              <span className="text-[var(--text-subtle)] opacity-60">Sample: </span>
              <span className="font-mono text-xs">
                {column.sample_values
                  .filter((v) => v !== null)
                  .slice(0, 3)
                  .map((v) => JSON.stringify(v))
                  .join(', ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

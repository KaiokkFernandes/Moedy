import { useState, type DragEvent } from 'react'
import clsx from 'clsx'
import { FileText, Upload, X } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'

interface FileDropzoneProps {
  file: File | null
  onSelect: (file: File | null) => void
  error?: string
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Área para arrastar e soltar o extrato, que também abre o seletor de arquivos ao clicar. */
export function FileDropzone({ file, onSelect, error }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false)

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files[0]
    if (dropped) onSelect(dropped)
  }

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-emerald-600',
          dragging
            ? 'border-emerald-500 bg-emerald-50'
            : error
              ? 'border-red-300 bg-red-50/50'
              : 'border-slate-300 bg-white hover:border-slate-400',
        )}
      >
        <input
          type="file"
          accept=".ofx,.csv"
          aria-label="Arquivo do extrato"
          className="sr-only"
          onChange={(event) => {
            onSelect(event.target.files?.[0] ?? null)
            // Permite escolher o mesmo arquivo de novo
            event.target.value = ''
          }}
        />
        <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Upload className="size-6" aria-hidden />
        </span>
        <span className="mt-4 text-sm font-medium text-slate-900">
          Arraste o extrato aqui ou <span className="text-emerald-700 underline">clique para escolher</span>
        </span>
        <span className="mt-1 text-xs text-slate-500">Arquivos .ofx ou .csv, até 5 MB</span>
      </label>

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 ring-1 ring-slate-200">
          <FileText className="size-5 shrink-0 text-slate-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
          </div>
          <IconButton label="Remover arquivo" onClick={() => onSelect(null)}>
            <X className="size-4" />
          </IconButton>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

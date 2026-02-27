import { useEffect, useRef, useState } from 'react'
import type { Chart } from '../../types'
import { Modal } from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { track } from '../../lib/analytics'
import { copyToClipboard } from '../../lib/chartExporter'

const MAX_SHARE_ROWS = 2000

interface ShareModalProps {
  chart: Chart
  data: unknown[] | null
  onClose: () => void
  /** Dataset filename shown on the share page */
  datasetName?: string
  /** Optional: async fn that resolves to a chart PNG blob for the OG image */
  generateImage?: () => Promise<Blob | null>
}

export function ShareModal({ chart, data, onClose, datasetName, generateImage }: ShareModalProps) {
  const [status, setStatus] = useState<'creating' | 'ready' | 'error'>('creating')
  const [shareUrl, setShareUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const createdRef = useRef(false)

  useEffect(() => {
    if (createdRef.current) return
    createdRef.current = true

    async function createShare() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErrorMsg('You must be logged in to share a chart.')
        setStatus('error')
        return
      }

      const snapshot = data ? data.slice(0, MAX_SHARE_ROWS) : null

      const { data: row, error } = await supabase
        .from('shared_charts')
        .insert({
          chart_id: chart.id,
          created_by: user.id,
          prompt: chart.prompt,
          chart_library: chart.chart_library,
          d3_code: chart.d3_code ?? null,
          vega_spec_json: chart.vega_spec_json ?? null,
          explanation: chart.explanation ?? null,
          data_snapshot: snapshot,
          dataset_name: datasetName ?? null,
        })
        .select('id')
        .single()

      if (error || !row) {
        setErrorMsg(error?.message ?? 'Failed to create share link.')
        setStatus('error')
        return
      }

      const shareId = row.id
      const url = `${window.location.origin}/share/${shareId}`
      setShareUrl(url)
      setStatus('ready')
      track('share-created', { library: chart.chart_library })

      // Upload chart PNG as OG image in the background (best-effort)
      if (generateImage) {
        generateImage().then(async (blob) => {
          if (!blob) return
          const path = `${shareId}.png`
          const { error: uploadErr } = await supabase.storage
            .from('share-images')
            .upload(path, blob, { contentType: 'image/png', upsert: true })
          if (uploadErr) return
          const { data: { publicUrl } } = supabase.storage
            .from('share-images')
            .getPublicUrl(path)
          await supabase
            .from('shared_charts')
            .update({ og_image_url: publicUrl })
            .eq('id', shareId)
        }).catch(() => { /* best-effort, never block the share link */ })
      }
    }

    createShare()
  }, [])

  async function handleCopy() {
    if (!shareUrl) return
    try {
      await copyToClipboard(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
    inputRef.current?.select()
  }

  return (
    <Modal isOpen title="Share chart" onClose={onClose} size="sm">
      {status === 'creating' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <svg className="w-6 h-6 animate-spin text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">Creating shareable link…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <p className="text-sm text-red-400">{errorMsg}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium rounded-card bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface-3)] transition-colors duration-fast"
          >
            Close
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Anyone with this link can view your chart.
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              readOnly
              value={shareUrl}
              onClick={() => inputRef.current?.select()}
              className="flex-1 px-3 py-2 text-sm rounded-card border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-sm font-medium rounded-card bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors duration-fast whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

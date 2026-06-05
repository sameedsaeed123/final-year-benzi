import { useRef, useState, useEffect } from 'react'
import { Send, Paperclip, Mic, X } from 'lucide-react'
import VoiceRecorderPanel from './VoiceRecorderPanel.jsx'

const ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,video/webm,audio/webm,audio/mpeg,audio/ogg'

export default function ChatComposer({
  value,
  onChange,
  onSend,
  onSendFile,
  onSendVoice,
  allowAttachments = false,
  placeholder = 'Type a message…',
  disabled = false,
  uploading = false,
  uploadError = '',
  editing = false,
  onCancelEdit,
}) {
  const fileInputRef = useRef(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [pendingPreview, setPendingPreview] = useState('')
  const [recordingOpen, setRecordingOpen] = useState(false)

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    }
  }, [pendingPreview])

  const clearPendingFile = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingFile(null)
    setPendingPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendClick()
    }
  }

  const handleFilePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    clearPendingFile()
    setPendingFile(file)
    if (file.type.startsWith('image/')) {
      setPendingPreview(URL.createObjectURL(file))
    }
  }

  const handleSendClick = () => {
    if (disabled || uploading || recordingOpen) return
    if (pendingFile) {
      onSendFile?.(pendingFile, String(value || '').trim())
      clearPendingFile()
      return
    }
    if (String(value).trim()) onSend?.()
  }

  const canSend =
    !disabled &&
    !uploading &&
    !recordingOpen &&
    (String(value).trim() || (allowAttachments && pendingFile && !editing))

  const showAttachments = allowAttachments && (onSendFile || onSendVoice)

  const inputClass =
    'flex-1 rounded-full border border-black/10 bg-[#f5f9f5] px-5 py-2.5 text-[13px] text-[#1a2e22] outline-none focus:border-[#0f4e34] focus:ring-2 focus:ring-[#0f4e34]/15 transition disabled:opacity-60'

  return (
    <div className="flex-shrink-0 px-4 pt-3 pb-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white border-t border-black/8 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      {editing && (
        <div className="flex items-center justify-between mb-2 px-1 py-1.5 rounded-lg bg-[#f0f7f2] border border-[#0f4e34]/15">
          <span className="text-[12px] font-medium text-[#0f4e34]">Editing message</span>
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-[12px] text-[#7d8b7d] hover:text-[#1a2e22] flex items-center gap-1"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      )}

      {uploadError && (
        <p className="text-[12px] text-red-600 mb-2 px-1" role="alert">
          {uploadError}
        </p>
      )}

      {showAttachments && pendingFile && !recordingOpen && (
        <div className="flex items-center gap-2 mb-2 px-1">
          {pendingPreview ? (
            <img src={pendingPreview} alt="" className="h-14 w-14 rounded-lg object-cover border border-black/10" />
          ) : (
            <span className="text-[12px] text-[#4a5c4a] truncate max-w-[220px]">{pendingFile.name}</span>
          )}
          <button
            type="button"
            onClick={clearPendingFile}
            className="h-7 w-7 rounded-full bg-black/5 flex items-center justify-center text-[#555] hover:bg-black/10"
            aria-label="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {showAttachments && recordingOpen ? (
        <VoiceRecorderPanel
          onComplete={(file) => {
            setRecordingOpen(false)
            if (file) onSendVoice?.(file)
          }}
          onCancel={() => setRecordingOpen(false)}
        />
      ) : (
        <div className="flex items-end gap-2">
          {showAttachments && !editing && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={handleFilePick}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="h-10 w-10 rounded-full border border-black/10 text-[#1f5f4a] flex items-center justify-center hover:bg-[#f0f7f2] transition disabled:opacity-40 flex-shrink-0"
                aria-label="Attach file"
              >
                <Paperclip size={16} />
              </button>
              <button
                type="button"
                onClick={() => setRecordingOpen(true)}
                disabled={disabled || uploading || !!pendingFile}
                className="h-10 w-10 rounded-full border border-black/10 text-[#1f5f4a] flex items-center justify-center hover:bg-[#f0f7f2] transition disabled:opacity-40 flex-shrink-0"
                aria-label="Record voice message"
              >
                <Mic size={16} />
              </button>
            </>
          )}

          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? 'Sending…' : editing ? 'Edit message…' : placeholder}
            disabled={disabled || uploading}
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleSendClick}
            disabled={editing ? !String(value).trim() || disabled || uploading : !canSend}
            className="h-10 w-10 rounded-full bg-[#0f4e34] text-white flex items-center justify-center shadow-sm hover:bg-[#0d4530] transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            aria-label={editing ? 'Save edit' : 'Send message'}
          >
            <Send size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

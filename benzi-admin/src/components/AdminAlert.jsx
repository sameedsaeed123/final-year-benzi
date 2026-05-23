export function AdminAlert({ type = 'error', message, onDismiss }) {
  if (!message) return null
  const styles =
    type === 'success'
      ? 'bg-[#e7f4ee] text-[#1f5f4a] border-[#1f5f4a]/20'
      : type === 'info'
        ? 'bg-[#eff6ff] text-[#1e40af] border-[#1e40af]/20'
        : 'bg-[#fde8e5] text-[#b42318] border-[#b42318]/20'

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-3 ${styles}`}>
      <span>{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-[12px] font-semibold opacity-70 hover:opacity-100">
          Dismiss
        </button>
      )}
    </div>
  )
}

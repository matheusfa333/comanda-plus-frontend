'use client'

import { todayISO, daysAgoISO } from '@/lib/utils/format'

interface DateRangeFilterProps {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
}

const SHORTCUTS = [
  { label: 'Hoje', range: () => ({ from: todayISO(), to: todayISO() }) },
  { label: 'Ontem', range: () => ({ from: daysAgoISO(1), to: daysAgoISO(1) }) },
  { label: '7 dias', range: () => ({ from: daysAgoISO(6), to: todayISO() }) },
  { label: '30 dias', range: () => ({ from: daysAgoISO(29), to: todayISO() }) },
]

export default function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const input = 'w-full px-3 py-2 rounded-lg border text-sm bg-white'
  return (
    <div className="flex flex-wrap items-end gap-3 w-full sm:w-auto">
      <div className="flex-1 min-w-[130px] sm:flex-none">
        <label className="block text-xs font-medium mb-1" style={{ color: '#7a6650' }}>De</label>
        <input type="date" value={from} max={to} onChange={(e) => e.target.value && onChange({ from: e.target.value, to })} className={input} style={{ borderColor: '#d9cfc2' }} />
      </div>
      <div className="flex-1 min-w-[130px] sm:flex-none">
        <label className="block text-xs font-medium mb-1" style={{ color: '#7a6650' }}>Até</label>
        <input type="date" value={to} min={from} max={todayISO()} onChange={(e) => e.target.value && onChange({ from, to: e.target.value })} className={input} style={{ borderColor: '#d9cfc2' }} />
      </div>
      <div className="flex w-full sm:w-auto gap-1 p-1 rounded-xl" style={{ background: '#f0e8de' }}>
        {SHORTCUTS.map((s) => {
          const r = s.range()
          const active = r.from === from && r.to === to
          return (
            <button key={s.label} onClick={() => onChange(r)} className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap" style={{ background: active ? '#fff9f2' : 'transparent', color: active ? '#2a1f14' : '#7a6650' }}>
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from 'react'

export default function Collapsible({ title, defaultOpen = true, children, className = '' }: { title: string; defaultOpen?: boolean; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(defaultOpen)
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>(open ? 'auto' : 0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) {
      const h = el.scrollHeight
      setHeight(h)
      const id = window.setTimeout(() => setHeight('auto'), 200)
      return () => window.clearTimeout(id)
    } else {
      setHeight(el.scrollHeight)
      requestAnimationFrame(() => setHeight(0))
    }
  }, [open])

  return (
    <div className={className}>
      <button type="button" className="btn btn-ghost w-full justify-between" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      <div style={{ maxHeight: height === 'auto' ? undefined : height, overflow: 'hidden' }} className="transition-[max-height] duration-200">
        <div ref={ref} className="pt-3">{children}</div>
      </div>
    </div>
  )
}

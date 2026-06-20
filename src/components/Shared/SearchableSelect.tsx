'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';

type Option = { value: string; label: string };

export default function SearchableSelect({ value, options, onChange, placeholder, searchPlaceholder, minWidth = 150 }: {
  value: string; options: Option[]; onChange: (value: string) => void;
  placeholder: string; searchPlaceholder?: string; minWidth?: number;
}) {
  const C = useThemePalette();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? options.filter((option) => option.label.toLowerCase().includes(term)) : options;
  }, [options, query]);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) { setOpen(false); setQuery(''); }
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, []);

  useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 0); }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative', minWidth }}>
      <button type="button" onClick={() => { setOpen((current) => !current); setQuery(''); }} aria-expanded={open}
        style={{ width: '100%', padding: '9px 11px', borderRadius: 10, border: `1px solid ${value ? C.red : C.border}`, background: C.bg, color: C.text, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={15} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      {open && <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 'max(100%, 240px)', zIndex: 1200, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: '0 16px 40px rgba(15,23,42,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: 9, borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 20, top: 20, color: C.muted }} />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder ?? `Search ${placeholder.toLowerCase()}...`}
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px 9px 34px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, outline: 'none', fontSize: 13 }} />
        </div>
        <div style={{ maxHeight: 240, overflowY: 'auto', padding: 5 }}>
          {filtered.length ? filtered.map((option) => <button key={option.value || '__all'} type="button"
            onClick={() => { onChange(option.value); setOpen(false); setQuery(''); }}
            style={{ width: '100%', padding: '9px 10px', border: 0, borderRadius: 8, background: option.value === value ? C.accentSoft : 'transparent', color: option.value === value ? C.accentText : C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', fontSize: 13 }}>
            <span>{option.label}</span>{option.value === value ? <Check size={15} /> : null}
          </button>) : <div style={{ padding: 14, textAlign: 'center', color: C.muted, fontSize: 12 }}>No matching option</div>}
        </div>
      </div>}
    </div>
  );
}

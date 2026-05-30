'use client';

export type ListViewMode = 'grid' | 'table';

type ViewModeToggleProps = {
  value: ListViewMode;
  onChange: (mode: ListViewMode) => void;
  accent?: string;
  border?: string;
  activeBg?: string;
  inactiveBg?: string;
  muted?: string;
};

export function ViewModeToggle({
  value,
  onChange,
  accent = '#DC2626',
  border = '#E5E7EB',
  activeBg = '#FFF0F0',
  inactiveBg = '#FFFFFF',
  muted = '#64748B',
}: ViewModeToggleProps) {
  return (
    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      {(['grid', 'table'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: `1.5px solid ${value === mode ? accent : border}`,
            background: value === mode ? activeBg : inactiveBg,
            color: value === mode ? accent : muted,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {mode === 'grid' ? '⊞ Grid' : '☰ Table'}
        </button>
      ))}
    </div>
  );
}

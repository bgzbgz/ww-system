const STEPS = ['Upload', 'Review', 'Generate', 'Preview', 'Send', 'Status'];

const F = {
  plaak: "'Plaak', Impact, sans-serif",
  riforma: "'Riforma', Arial, sans-serif",
};

export default function StepNav({ current }: { current: number }) {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 48, background: '#000', borderBottom: '1px solid #1a1a1a',
      display: 'flex', alignItems: 'center', padding: '0 40px', gap: 0,
    }}>
      <span style={{
        fontFamily: F.plaak, fontWeight: 700, fontSize: 12,
        letterSpacing: '0.18em', color: '#fff', textTransform: 'uppercase',
        flexShrink: 0, marginRight: 36,
      }}>
        Fast Track
      </span>

      <div style={{ width: 1, height: 14, background: '#222', marginRight: 36, flexShrink: 0 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflow: 'hidden' }}>
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <div style={{ width: 20, height: 1, background: '#1a1a1a', margin: '0 12px', flexShrink: 0 }} />
              )}
              <span style={{
                fontFamily: F.riforma, fontSize: 11, letterSpacing: '0.1em',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
                color: '#fff',
                opacity: active ? 1 : done ? 0.5 : 0.3,
                fontWeight: active ? 500 : 400,
                paddingBottom: active ? 2 : 0,
                borderBottom: active ? '1px solid #fff469' : 'none',
              }}>
                {String(i + 1).padStart(2, '0')} {label}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

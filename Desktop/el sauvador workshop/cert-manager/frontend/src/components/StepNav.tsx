const STEPS = ['Upload', 'Review', 'Editor', 'Generate', 'Schedule', 'Status'];

export default function StepNav({ current }: { current: number }) {
  return (
    <nav style={{ display: 'flex', gap: 8, padding: '12px 20px', background: '#0f172a', alignItems: 'center' }}>
      <span style={{ color: '#f8fafc', fontWeight: 700, marginRight: 16 }}>Fast Track</span>
      {STEPS.map((label, i) => (
        <span key={i} style={{
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 12,
          background: i < current ? '#059669' : i === current ? '#1d4ed8' : '#1e293b',
          color: i <= current ? '#fff' : '#64748b',
        }}>
          {i < current ? `✓ ${label}` : `${i + 1} ${label}`}
        </span>
      ))}
    </nav>
  );
}

export default function Loading() {
  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="skeleton mx-auto" style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem' }} />
        <div className="skeleton mx-auto" style={{ height: '30px', width: '220px', marginBottom: '0.5rem' }} />
        <div className="skeleton mx-auto" style={{ height: '16px', width: '160px', marginBottom: '2.5rem' }} />

        <div className="grid md:grid-cols-2 gap-4">
          {[
            ['full', 260], ['full', 240],
            ['half', 100], ['half', 100],
            ['half', 100], ['half', 100],
            ['half', 100], ['half', 100],
            ['full', 120], ['full', 200],
          ].map(([size, pw], i) => (
            <div key={i} style={{ gridColumn: size === 'full' ? 'span 2' : 'span 1' }}>
              <div className="skeleton" style={{ height: '14px', width: `${pw}px`, marginBottom: '0.5rem' }} />
              <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', border: '1px dashed var(--border)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
          <div className="skeleton mx-auto" style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '0.75rem' }} />
          <div className="skeleton mx-auto" style={{ height: '16px', width: '140px' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <div className="skeleton" style={{ height: '48px', flex: 1, borderRadius: '12px' }} />
        </div>
      </div>
    </div>
  );
}

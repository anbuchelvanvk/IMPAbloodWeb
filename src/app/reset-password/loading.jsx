export default function Loading() {
  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="skeleton mx-auto" style={{ height: '36px', width: '200px', marginBottom: '2rem' }} />

        <div style={{ marginBottom: '1.5rem' }}>
          <div className="skeleton" style={{ height: '14px', width: '160px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '14px', width: '80%', marginTop: '0.5rem' }} />
        </div>

        <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px', marginTop: '1rem', marginBottom: '1.5rem' }} />

        <div style={{ textAlign: 'center' }}>
          <div className="skeleton mx-auto" style={{ height: '16px', width: '100px' }} />
        </div>
      </div>
    </div>
  );
}

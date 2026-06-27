export default function Loading() {
  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="skeleton mx-auto" style={{ height: '36px', width: '180px', marginBottom: '2rem' }} />

        <div style={{ marginBottom: '1.5rem' }}>
          <div className="skeleton" style={{ height: '14px', width: '110px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div className="skeleton" style={{ height: '14px', width: '80px' }} />
            <div className="skeleton" style={{ height: '14px', width: '100px' }} />
          </div>
          <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />
        </div>

        <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px', marginTop: '1rem', marginBottom: '1.5rem' }} />

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="skeleton mx-auto" style={{ height: '16px', width: '30px' }} />
        </div>

        <div className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '12px' }} />

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <div className="skeleton mx-auto" style={{ height: '16px', width: '200px' }} />
        </div>
      </div>
    </div>
  );
}

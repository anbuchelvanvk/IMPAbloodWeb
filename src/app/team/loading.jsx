export default function Loading() {
  return (
    <div className="container" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div className="text-center mb-10">
        <div className="skeleton mx-auto" style={{ height: '44px', width: '320px', marginBottom: '1rem' }} />
        <div className="skeleton mx-auto" style={{ height: '16px', width: '70%', marginBottom: '0.5rem' }} />
        <div className="skeleton mx-auto" style={{ height: '16px', width: '55%', marginBottom: '0.5rem' }} />
        <div className="skeleton mx-auto" style={{ height: '16px', width: '60%' }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card text-center" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '150px', height: '150px', borderRadius: '8px', marginBottom: '1.5rem' }} />
            <div className="skeleton" style={{ height: '24px', width: '70%', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ height: '18px', width: '50%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

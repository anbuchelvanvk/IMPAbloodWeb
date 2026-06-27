export default function Loading() {
  return (
    <div style={{ width: '100%', height: '3px', background: 'var(--border)', overflow: 'hidden', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <div style={{
        height: '100%',
        width: '40%',
        background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
        animation: 'shimmerBar 1.2s ease-in-out infinite'
      }} />
      <style>{`@keyframes shimmerBar { 0% { transform: translateX(-200%) } 100% { transform: translateX(400%) } }`}</style>
    </div>
  );
}

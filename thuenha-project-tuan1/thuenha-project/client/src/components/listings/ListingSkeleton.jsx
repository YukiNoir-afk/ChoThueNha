export default function ListingSkeleton() {
  return (
    <div className="listing-card" style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 16 }}>
      <div className="skeleton skeleton-img" style={{ marginBottom: 12 }}></div>
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <div className="skeleton" style={{ height: 24, width: 60, borderRadius: 12 }}></div>
        <div className="skeleton" style={{ height: 24, width: 60, borderRadius: 12 }}></div>
      </div>
    </div>
  );
}

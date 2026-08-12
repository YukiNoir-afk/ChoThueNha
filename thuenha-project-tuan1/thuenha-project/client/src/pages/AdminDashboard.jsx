import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      // In a real app, this might be a specific admin endpoint to get all including drafts.
      // For now we use the public one but we could update backend if needed.
      return await api.get('/listings', { params: { pageSize: 100 } });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
    },
  });

  const handleDelete = (id, title) => {
    if (window.confirm(`Bạn có chắc muốn xoá tin: ${title}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const listings = data?.data || [];

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Quản lý tin đăng</h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Xin chào, {user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={logout}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#fee2e2', color: '#b91c1c', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Đăng xuất
          </button>
          <Link 
            to="/admin/listings/new" 
            style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', fontWeight: 600 }}
          >
            + Đăng tin mới
          </Link>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--color-border)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-section)' }}>
              <th style={{ padding: '16px', fontWeight: 600 }}>ID</th>
              <th style={{ padding: '16px', fontWeight: 600 }}>Tiêu đề</th>
              <th style={{ padding: '16px', fontWeight: 600 }}>Giá (VND)</th>
              <th style={{ padding: '16px', fontWeight: 600 }}>Trạng thái</th>
              <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px' }}><div className="skeleton" style={{ height: 20, width: 40 }}></div></td>
                    <td style={{ padding: '16px' }}>
                      <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 8 }}></div>
                      <div className="skeleton" style={{ height: 14, width: '50%' }}></div>
                    </td>
                    <td style={{ padding: '16px' }}><div className="skeleton" style={{ height: 20, width: 80 }}></div></td>
                    <td style={{ padding: '16px' }}><div className="skeleton" style={{ height: 24, width: 80, borderRadius: 12 }}></div></td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <div className="skeleton" style={{ height: 32, width: 60, borderRadius: 6 }}></div>
                        <div className="skeleton" style={{ height: 32, width: 60, borderRadius: 6 }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
            {!isLoading && listings.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: 32, textAlign: 'center' }}>Chưa có tin đăng nào.</td>
              </tr>
            )}
            {listings.map(listing => (
              <tr key={listing.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px' }}>#{listing.id}</td>
                <td style={{ padding: '16px', maxWidth: 300 }}>
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {listing.titleVi}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{listing.address}</div>
                </td>
                <td style={{ padding: '16px' }}>{listing.price.toLocaleString()}</td>
                <td style={{ padding: '16px' }}>
                  {listing.isPublished ? (
                    <span style={{ padding: '4px 8px', background: '#dcfce7', color: '#166534', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>Đã xuất bản</span>
                  ) : (
                    <span style={{ padding: '4px 8px', background: '#f3f4f6', color: '#374151', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>Bản nháp</span>
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <Link 
                    to={`/admin/listings/${listing.id}/edit`}
                    style={{ padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 6, marginRight: 8, fontSize: 13, fontWeight: 600 }}
                  >
                    ✏️ Sửa
                  </Link>
                  <button 
                    onClick={() => handleDelete(listing.id, listing.titleVi)}
                    disabled={deleteMutation.isPending}
                    style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    🗑️ Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

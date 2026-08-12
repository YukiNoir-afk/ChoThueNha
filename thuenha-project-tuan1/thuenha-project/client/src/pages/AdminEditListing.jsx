import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import ListingForm from '../components/admin/ListingForm';

export default function AdminEditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['admin-listing', id],
    queryFn: async () => await api.get(`/listings/${id}`),
  });

  const updateMutation = useMutation({
    mutationFn: async (formData) => {
      await api.put(`/listings/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listing', id] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] }); // Invalidate public query too
      alert('Cập nhật tin thành công!');
      navigate('/admin');
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || 'Lỗi khi cập nhật tin');
    }
  });

  if (isLoading) return <div className="container" style={{ padding: 64, textAlign: 'center' }}>Đang tải...</div>;
  if (isError || !listing) return <div className="container" style={{ padding: 64, textAlign: 'center' }}>Lỗi khi tải dữ liệu.</div>;

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/admin" style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>← Quay lại Dashboard</Link>
      </div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Sửa tin đăng #{id}</h1>
      <ListingForm 
        initialData={listing} 
        onSubmit={(formData) => updateMutation.mutate(formData)}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}

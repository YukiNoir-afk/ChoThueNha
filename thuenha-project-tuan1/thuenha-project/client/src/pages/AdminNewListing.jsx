import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import ListingForm from '../components/admin/ListingForm';

export default function AdminNewListing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (formData) => {
      await api.post('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      alert('Đăng tin thành công!');
      navigate('/admin');
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || 'Lỗi khi đăng tin');
    }
  });

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/admin" style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>← Quay lại Dashboard</Link>
      </div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Đăng tin mới</h1>
      <ListingForm 
        onSubmit={(formData) => createMutation.mutate(formData)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { listingCreateSchema, listingTypeValues } from '../../lib/validation';

// Component để click trên bản đồ chọn vị trí
function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  const customIcon = L.divIcon({
    html: `<div style="font-size: 24px; text-align: center; line-height: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">📍</div>`,
    className: 'custom-leaflet-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  return position ? (
    <Marker 
      position={position} 
      icon={customIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        },
      }}
    />
  ) : null;
}

export default function ListingForm({ initialData, onSubmit, isLoading }) {
  const isEdit = !!initialData;
  const [position, setPosition] = useState(
    initialData?.lat ? [initialData.lat, initialData.lng] : [21.0285, 105.8542] // Mặc định Hà Nội
  );
  
  const [previewImages, setPreviewImages] = useState(initialData?.images || []);
  const [newImages, setNewImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);

  // Chuyển mảng string thành chuỗi có phẩy cho form text
  const initialAmenities = initialData?.amenities 
    ? (typeof initialData.amenities === 'string' ? JSON.parse(initialData.amenities) : initialData.amenities).join(', ')
    : '';

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(listingCreateSchema),
    defaultValues: {
      titleVi: initialData?.titleVi || '',
      titleEn: initialData?.titleEn || '',
      descVi: initialData?.descVi || '',
      descEn: initialData?.descEn || '',
      price: initialData?.price || '',
      area: initialData?.area || '',
      bedrooms: initialData?.bedrooms || 0,
      type: initialData?.type || 'room',
      address: initialData?.address || '',
      amenities: initialAmenities,
      isPublished: initialData?.isPublished ?? true,
      lat: position[0],
      lng: position[1],
    },
  });

  useEffect(() => {
    setValue('lat', position[0]);
    setValue('lng', position[1]);
  }, [position, setValue]);

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const totalImages = previewImages.length + filesArray.length - deletedImageIds.length;
      if (totalImages > 7) {
        alert('Tối đa 7 ảnh');
        return;
      }
      setNewImages(prev => [...prev, ...filesArray]);
    }
  };

  const handleRemoveExistingImage = (id) => {
    setDeletedImageIds(prev => [...prev, id]);
    setPreviewImages(prev => prev.filter(img => img.id !== id));
  };

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const submitForm = (data) => {
    const formData = new FormData();
    // Append JSON data
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    
    // Append new images
    newImages.forEach(file => {
      formData.append('images', file);
    });

    // Append deleted image ids if editing
    if (isEdit && deletedImageIds.length > 0) {
      formData.append('deleteImageIds', deletedImageIds.join(','));
    }

    onSubmit(formData);
  };

  // Helper cho field errors
  const ErrorMsg = ({ name }) => errors[name] && <span style={{ color: 'red', fontSize: 13, marginTop: 4, display: 'block' }}>{errors[name].message}</span>;

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, marginTop: 6 };
  const labelStyle = { display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 4 };

  return (
    <form onSubmit={handleSubmit(submitForm)} style={{ background: '#fff', padding: 32, borderRadius: 16, border: '1px solid var(--color-border)' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Tiêu đề (Tiếng Việt)</label>
          <input {...register('titleVi')} style={inputStyle} />
          <ErrorMsg name="titleVi" />
        </div>
        <div>
          <label style={labelStyle}>Tiêu đề (Tiếng Anh)</label>
          <input {...register('titleEn')} style={inputStyle} />
          <ErrorMsg name="titleEn" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Mô tả (Tiếng Việt)</label>
          <textarea {...register('descVi')} rows={5} style={inputStyle} />
          <ErrorMsg name="descVi" />
        </div>
        <div>
          <label style={labelStyle}>Mô tả (Tiếng Anh)</label>
          <textarea {...register('descEn')} rows={5} style={inputStyle} />
          <ErrorMsg name="descEn" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Giá (VND)</label>
          <input type="number" {...register('price')} style={inputStyle} />
          <ErrorMsg name="price" />
        </div>
        <div>
          <label style={labelStyle}>Diện tích (m2)</label>
          <input type="number" step="0.1" {...register('area')} style={inputStyle} />
          <ErrorMsg name="area" />
        </div>
        <div>
          <label style={labelStyle}>Số phòng ngủ</label>
          <input type="number" {...register('bedrooms')} style={inputStyle} />
          <ErrorMsg name="bedrooms" />
        </div>
        <div>
          <label style={labelStyle}>Loại hình</label>
          <select {...register('type')} style={inputStyle}>
            {listingTypeValues.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ErrorMsg name="type" />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Tiện ích (cách nhau bởi dấu phẩy)</label>
        <input {...register('amenities')} placeholder="Wifi, Điều hoà, Chỗ để xe..." style={inputStyle} />
        <ErrorMsg name="amenities" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Địa chỉ</label>
        <input {...register('address')} style={inputStyle} />
        <ErrorMsg name="address" />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Vị trí Bản đồ (Kéo chấm đỏ hoặc click để chọn)</label>
        <div style={{ height: 300, borderRadius: 8, overflow: 'hidden', marginTop: 8, border: '1px solid var(--color-border)' }}>
          <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationPicker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>Lat: {position[0]}, Lng: {position[1]}</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Hình ảnh (Tối đa 7 ảnh, mỗi ảnh &lt; 5MB)</label>
        <input type="file" multiple accept="image/jpeg, image/png, image/webp" onChange={handleImageChange} style={{ marginTop: 8 }} />
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          {/* Render ảnh cũ */}
          {previewImages.map(img => (
            <div key={img.id} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden' }}>
              <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" onClick={() => handleRemoveExistingImage(img.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>x</button>
            </div>
          ))}
          
          {/* Render ảnh mới */}
          {newImages.map((file, i) => (
            <div key={i} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '2px dashed var(--color-primary)' }}>
              <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" onClick={() => handleRemoveNewImage(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>x</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
          <input type="checkbox" {...register('isPublished')} style={{ width: 18, height: 18 }} />
          Xuất bản ngay
        </label>
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        style={{ 
          background: 'var(--color-primary)', color: 'white', border: 'none', padding: '12px 24px', 
          borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: isLoading ? 'wait' : 'pointer' 
        }}
      >
        {isLoading ? 'Đang lưu...' : (isEdit ? 'Cập nhật tin' : 'Đăng tin mới')}
      </button>

    </form>
  );
}

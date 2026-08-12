import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import api from '../lib/api';
import MapComponent from '../components/map/MapComponent';

// Helper function from ListingCard
function formatPrice(price, lang) {
  if (lang === 'vi') {
    if (price >= 1_000_000) {
      const millions = price / 1_000_000;
      const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1);
      return `${formatted} triệu`;
    }
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  }
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1);
    return `${formatted}M VND`;
  }
  return new Intl.NumberFormat('en-US').format(price) + ' VND';
}

const typeLabelsVi = {
  room: 'Phòng trọ',
  apartment: 'Căn hộ',
  house: 'Nhà nguyên căn',
  studio: 'Studio',
};

const typeLabelsEn = {
  room: 'Room',
  apartment: 'Apartment',
  house: 'House',
  studio: 'Studio',
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      return await api.get(`/listings/${id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="skeleton skeleton-text" style={{ width: 100, marginBottom: 16 }}></div>
        <div className="skeleton skeleton-title" style={{ width: '60%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 24 }}></div>
        <div className="skeleton" style={{ height: 400, borderRadius: 16, marginBottom: 32 }}></div>
        <div className="detail-layout">
          <div>
            <div className="skeleton" style={{ height: 200, borderRadius: 12, marginBottom: 24 }}></div>
            <div className="skeleton" style={{ height: 200, borderRadius: 12 }}></div>
          </div>
          <div>
            <div className="skeleton" style={{ height: 300, borderRadius: 16 }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏡</div>
        <h2 style={{ marginBottom: 12 }}>Không tìm thấy tin đăng</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Tin đăng này có thể đã bị xóa hoặc không tồn tại.</p>
        <Link to="/" style={{ padding: '10px 24px', background: 'var(--color-primary)', color: '#fff', borderRadius: 8, fontWeight: 600 }}>
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  const title = lang === 'vi' ? listing.titleVi : listing.titleEn;
  const desc = lang === 'vi' ? listing.descVi : listing.descEn;
  const typeLabel = lang === 'vi' ? typeLabelsVi[listing.type] : typeLabelsEn[listing.type];
  
  // Sắp xếp ảnh theo sortOrder
  const images = listing.images?.sort((a, b) => a.sortOrder - b.sortOrder) || [];
  const slides = images.map(img => ({ src: img.url }));

  // Giả lập SĐT
  const contactPhone = "0987654321";

  // Parse amenities nếu nó là string JSON
  let amenitiesList = [];
  try {
    amenitiesList = typeof listing.amenities === 'string' 
      ? JSON.parse(listing.amenities) 
      : (listing.amenities || []);
  } catch(e) {}

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* Breadcrumb / Nút quay lại */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          ← {t('header.home')}
        </Link>
      </div>

      <div className="listing-detail-header">
        <h1 className="listing-detail-title">{title}</h1>
        <div className="listing-detail-address">
          📍 {listing.address}
        </div>
      </div>

      {/* Image Gallery */}
      <div className="image-gallery">
        {images.length > 0 ? (
          <div className="image-gallery-grid">
            {images.slice(0, 5).map((img, index) => (
              <div 
                key={img.id} 
                className={`gallery-img-wrapper ${index === 0 ? 'gallery-img-large' : 'gallery-img-small'}`}
                onClick={() => {
                  setPhotoIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <img src={img.url} alt={`Ảnh ${index + 1}`} />
                {index === 4 && images.length > 5 && (
                  <div className="gallery-show-all-btn">
                    📷 Xem tất cả {images.length} ảnh
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ width: '100%', height: 400, background: 'var(--color-bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Không có ảnh
          </div>
        )}
      </div>

      <div className="detail-layout">
        {/* Cột trái: Thông tin chi tiết */}
        <div className="detail-main">
          
          <div className="detail-section">
            <div className="detail-features">
              <div className="feature-item">
                <span className="feature-icon">📏</span>
                <span>{listing.area} m²</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🛏️</span>
                <span>{listing.bedrooms} phòng ngủ</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🏠</span>
                <span>{typeLabel}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h2>Đặc điểm nổi bật</h2>
            <div className="desc-text">{desc}</div>
          </div>

          {amenitiesList && amenitiesList.length > 0 && (
            <div className="detail-section">
              <h2>Tiện ích</h2>
              <div className="amenities-grid">
                {amenitiesList.map((item, idx) => (
                  <div key={idx} className="amenity-item">
                    ✅ {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h2>Vị trí trên bản đồ</h2>
            <div style={{ height: 350, borderRadius: 12, overflow: 'hidden' }}>
              <MapComponent 
                listings={[listing]} 
                center={[listing.lat, listing.lng]} 
                zoom={15} 
              />
            </div>
          </div>

        </div>

        {/* Cột phải: Contact Sticky Box */}
        <div className="detail-sidebar">
          <div className="contact-box-container">
            <div className="contact-box">
              <div className="contact-price">
                {formatPrice(listing.price, lang)} <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--color-text-muted)' }}>/ tháng</span>
              </div>
              
              <a href={`tel:${contactPhone}`} className="contact-btn btn-primary">
                📞 Gọi điện: {contactPhone}
              </a>
              <a href={`https://zalo.me/${contactPhone}`} target="_blank" rel="noreferrer" className="contact-btn btn-zalo">
                💬 Nhắn Zalo
              </a>
              <a href={`mailto:contact@thuenha.com?subject=Hỏi về tin: ${title}`} className="contact-btn btn-outline">
                ✉️ Gửi email
              </a>
            </div>
          </div>
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={photoIndex}
        slides={slides}
      />
    </div>
  );
}

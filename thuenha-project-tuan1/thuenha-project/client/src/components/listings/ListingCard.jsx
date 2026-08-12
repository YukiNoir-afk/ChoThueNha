import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

/**
 * Format giá VND — dùng hệ Việt Nam (triệu = millions)
 * Ví dụ: 8500000 → "8.5 triệu" (vi) hoặc "8.5M VND" (en)
 */
function formatPrice(price, lang) {
  if (lang === 'vi') {
    if (price >= 1_000_000) {
      const millions = price / 1_000_000;
      // Nếu là số tròn triệu thì không cần dấu phẩy
      const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1);
      return `${formatted} triệu`;
    }
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  }
  // English
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

/**
 * ListingCard — component hiển thị 1 tin cho thuê.
 * React.memo vì list có thể dài, tránh re-render không cần thiết.
 */
const ListingCard = memo(function ListingCard({
  id,
  titleVi,
  titleEn,
  address,
  price,
  area,
  bedrooms,
  type,
  thumbnail,
  distanceKm,
  onMouseEnter,
  onMouseLeave,
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const title = lang === 'vi' ? titleVi : titleEn;
  const typeLabel = lang === 'vi' ? typeLabelsVi[type] : typeLabelsEn[type];

  // Placeholder ảnh dùng gradient nếu chưa có thumbnail
  const imgStyle = thumbnail
    ? {}
    : {
        background: 'linear-gradient(135deg, #fecdd3 0%, #fca5a5 50%, #fde68a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
      };

  const typeIcons = {
    room: '🏠',
    apartment: '🏢',
    house: '🏡',
    studio: '🎨',
  };

  return (
    <Link 
      to={`/listing/${id}`} 
      className="listing-card" 
      id={`listing-card-${id}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Ảnh */}
      <div className="listing-card__image-wrapper">
        {thumbnail ? (
          <img src={thumbnail} alt={title} loading="lazy" />
        ) : (
          <div style={{ ...imgStyle, width: '100%', height: '100%' }}>
            {typeIcons[type] || '🏠'}
          </div>
        )}

        {/* Badge loại hình */}
        <span className="listing-card__type-badge">{typeLabel}</span>

        {/* Nút yêu thích */}
        <button
          className="listing-card__favorite-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // TODO: tuần 9-10 — favorites
          }}
          aria-label="Favorite"
          id={`favorite-btn-${id}`}
        >
          ♡
        </button>
      </div>

      {/* Body */}
      <div className="listing-card__body">
        <h3 className="listing-card__title line-clamp-2">{title}</h3>

        <p className="listing-card__address">
          📍 {address}
        </p>

        <div className="listing-card__meta">
          <span>📐 {area} m²</span>
          {bedrooms > 0 && (
            <span>🛏️ {t('listing.bedroom', { count: bedrooms })}</span>
          )}
          {distanceKm !== undefined && (
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              📍 {distanceKm.toFixed(1)} km
            </span>
          )}
        </div>

        <p className="listing-card__price">
          {formatPrice(price, lang)}
          <span className="listing-card__price-suffix"> {t('listing.perMonth')}</span>
        </p>
      </div>
    </Link>
  );
});

export default ListingCard;

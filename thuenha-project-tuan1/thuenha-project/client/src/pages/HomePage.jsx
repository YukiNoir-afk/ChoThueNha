import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import SearchFilters from '../components/search/SearchFilters';
import ListingGrid from '../components/listings/ListingGrid';
import ListingSkeleton from '../components/listings/ListingSkeleton';
import MapComponent from '../components/map/MapComponent';
import api from '../lib/api';

export default function HomePage() {
  const { t } = useTranslation();
  
  const [filters, setFilters] = useState({});
  const [boundingBox, setBoundingBox] = useState(null);
  const [nearLocation, setNearLocation] = useState(null); // { nearLat, nearLng, radiusKm: 5 }
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Gộp tất cả param tìm kiếm
  const queryParams = {
    ...filters,
    ...boundingBox,
    ...nearLocation,
    page: 1,
    pageSize: 50, // Lấy nhiều hơn 1 chút để hiển thị trên bản đồ
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', queryParams],
    queryFn: async () => {
      // Dọn các param undefined/null
      const cleanedParams = Object.fromEntries(
        Object.entries(queryParams).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const res = await api.get('/listings', { params: cleanedParams });
      return res;
    },
    placeholderData: (previousData) => previousData, // keep previous data while fetching
  });

  const listings = data?.data || [];

  const handleSearch = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleNearMeClick = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ Geolocation.');
      return;
    }
    
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoadingLocation(false);
        setNearLocation({
          nearLat: position.coords.latitude,
          nearLng: position.coords.longitude,
          radiusKm: 5, // Mặc định 5km
        });
      },
      (error) => {
        setIsLoadingLocation(false);
        alert('Không thể lấy vị trí của bạn. Vui lòng cấp quyền vị trí.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <section className="hero-section" id="hero-section" style={{ padding: '24px 0', flexShrink: 0 }}>
        <div className="container">
          <h1 className="hero-section__title" style={{ fontSize: 24, marginBottom: 8 }}>{t('hero.title')}</h1>
          <p className="hero-section__subtitle" style={{ marginBottom: 20 }}>{t('hero.subtitle')}</p>
          <SearchFilters 
            onSearch={handleSearch} 
            onNearMeClick={handleNearMeClick}
            isLoadingLocation={isLoadingLocation}
          />
        </div>
      </section>

      <section className="home-layout-section" style={{ flexGrow: 1, overflow: 'hidden' }}>
        <div className="home-layout-container">
          {/* Cột trái: Danh sách */}
          <div className="home-layout-listings">
            <div className="section-header" style={{ marginBottom: 16 }}>
              <h2 className="section-header__title" style={{ fontSize: 18 }}>
                {nearLocation ? t('search.nearMeResults', { count: listings.length }) : t('listing.popular')}
              </h2>
              {nearLocation && (
                <button 
                  onClick={() => setNearLocation(null)}
                  style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {t('search.nearMeActive')}
                </button>
              )}
            </div>

            {isLoading && !data ? (
              <div className="listing-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ListingSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>⚠️</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: 'red', marginBottom: 8 }}>
                  {t('search.errorLoading', 'Đã xảy ra lỗi khi tải dữ liệu')}
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {t('search.retry', 'Thử lại')}
                </button>
              </div>
            ) : listings.length > 0 ? (
              <ListingGrid 
                listings={listings} 
                setHoveredListingId={setHoveredListingId}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>🔍</p>
                <p style={{ fontSize: 18, fontWeight: 600 }}>
                  {t('search.noResults')}
                </p>
                <p style={{ color: 'var(--color-text-muted)' }}>
                  {t('search.noResultsDesc')}
                </p>
              </div>
            )}
          </div>

          {/* Cột phải: Bản đồ */}
          <div className="home-layout-map">
            <MapComponent 
              listings={listings}
              hoveredListingId={hoveredListingId}
              setBoundingBox={setBoundingBox}
              center={nearLocation ? [nearLocation.nearLat, nearLocation.nearLng] : [21.0285, 105.8542]}
              zoom={nearLocation ? 14 : 13}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

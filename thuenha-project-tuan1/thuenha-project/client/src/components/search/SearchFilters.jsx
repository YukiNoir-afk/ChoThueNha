import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';

export default function SearchFilters({ onSearch, onNearMeClick, isLoadingLocation }) {
  const { t } = useTranslation();
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      q: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      minArea: '',
      maxArea: '',
      bedrooms: '',
    },
  });

  const formValues = useWatch({ control });
  const [debouncedValues] = useDebounce(formValues, 500);

  useEffect(() => {
    if (onSearch) {
      const cleaned = Object.fromEntries(
        Object.entries(debouncedValues).filter(([, v]) => v !== '' && v !== undefined),
      );
      onSearch(cleaned);
    }
  }, [debouncedValues, onSearch]);

  const onSubmit = (data) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined),
    );
    if (onSearch) onSearch(cleaned);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit(onSubmit)} id="search-form">
      {/* Keyword */}
      <div className="search-bar__segment">
        <label className="search-bar__label" htmlFor="search-keyword">
          {t('search.keyword')}
        </label>
        <input
          className="search-bar__input"
          id="search-keyword"
          type="text"
          placeholder={t('search.keywordPlaceholder')}
          {...register('q')}
        />
      </div>

      {/* Loại hình */}
      <div className="search-bar__segment">
        <label className="search-bar__label" htmlFor="search-type">
          {t('search.type')}
        </label>
        <select
          className="search-bar__select"
          id="search-type"
          {...register('type')}
        >
          <option value="">{t('search.typePlaceholder')}</option>
          <option value="room">{t('search.typeRoom')}</option>
          <option value="apartment">{t('search.typeApartment')}</option>
          <option value="house">{t('search.typeHouse')}</option>
          <option value="studio">{t('search.typeStudio')}</option>
        </select>
      </div>

      {/* Khoảng giá */}
      <div className="search-bar__segment">
        <label className="search-bar__label">
          {t('search.price')}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="search-bar__input"
            type="number"
            placeholder={t('search.priceMin')}
            id="search-price-min"
            {...register('minPrice')}
          />
          <span style={{ color: 'var(--color-text-muted)', lineHeight: '32px' }}>–</span>
          <input
            className="search-bar__input"
            type="number"
            placeholder={t('search.priceMax')}
            id="search-price-max"
            {...register('maxPrice')}
          />
        </div>
      </div>

      {/* Diện tích */}
      <div className="search-bar__segment">
        <label className="search-bar__label">
          {t('search.area')}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="search-bar__input"
            type="number"
            placeholder={t('search.areaMin')}
            id="search-area-min"
            {...register('minArea')}
          />
          <span style={{ color: 'var(--color-text-muted)', lineHeight: '32px' }}>–</span>
          <input
            className="search-bar__input"
            type="number"
            placeholder={t('search.areaMax')}
            id="search-area-max"
            {...register('maxArea')}
          />
        </div>
      </div>

      {/* Phòng ngủ */}
      <div className="search-bar__segment" style={{ maxWidth: 120, minWidth: 100 }}>
        <label className="search-bar__label" htmlFor="search-bedrooms">
          {t('search.bedrooms')}
        </label>
        <input
          className="search-bar__input"
          id="search-bedrooms"
          type="number"
          min="0"
          placeholder={t('search.bedroomsPlaceholder')}
          {...register('bedrooms')}
        />
      </div>

      {/* Nút tìm kiếm & Gần tôi */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className="search-bar__btn"
          style={{ 
            background: 'var(--color-bg-section)', 
            color: 'var(--color-text)', 
            border: '1px solid var(--color-border)',
            width: 'auto',
            padding: '0 16px',
            fontSize: '14px',
            fontWeight: '600'
          }}
          onClick={onNearMeClick}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? '⏳' : t('search.nearMeBtn')}
        </button>
        <button type="submit" className="search-bar__btn" id="search-submit-btn" aria-label={t('search.searchBtn')}>
          🔍
        </button>
      </div>
    </form>
  );
}

import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLang = () => {
    const next = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(next);
    localStorage.setItem('thuenha_lang', next);
  };

  const navItems = [
    { to: '/?type=apartment', label: t('header.apartment'), icon: '🏢' },
    { to: '/?type=room', label: t('header.room'), icon: '🏠' },
    { to: '/?type=house', label: t('header.house'), icon: '🏡' },
    { to: '/?type=studio', label: t('header.studio'), icon: '🎨' },
  ];

  return (
    <header className="site-header" id="site-header">
      <div className="site-header__inner">
        {/* Logo */}
        <Link to="/" className="site-header__logo" id="logo-link">
          <span className="site-header__logo-icon">🏘️</span>
          ThuêNhà
        </Link>

        {/* Nav — ẩn trên mobile, hiện khi mobileOpen */}
        <nav
          className={`site-header__nav ${mobileOpen ? 'site-header__nav--open' : ''}`}
          id="main-nav"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="site-header__nav-link"
              onClick={() => setMobileOpen(false)}
            >
              <span style={{ marginRight: 4 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="site-header__actions">
          <button
            className="site-header__lang-btn"
            onClick={toggleLang}
            id="lang-switch-btn"
            aria-label="Switch language"
          >
            {t('header.langSwitch')}
          </button>

          <Link
            to="/admin/login"
            className="site-header__nav-link"
            id="admin-login-link"
          >
            {t('header.login')}
          </Link>

          {/* Hamburger — chỉ hiện trên mobile */}
          <button
            className="site-header__mobile-btn"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
            id="mobile-menu-btn"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  );
}

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" id="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          {/* Cột 1: Hỗ trợ */}
          <div>
            <h3 className="site-footer__col-title">{t('footer.support')}</h3>
            <ul className="site-footer__col-links">
              <li><Link to="/faq">{t('footer.faq')}</Link></li>
              <li><Link to="/contact">{t('footer.contact')}</Link></li>
              <li><Link to="/terms">{t('footer.terms')}</Link></li>
              <li><Link to="/privacy">{t('footer.privacy')}</Link></li>
            </ul>
          </div>

          {/* Cột 2: Về chúng tôi */}
          <div>
            <h3 className="site-footer__col-title">{t('footer.about')}</h3>
            <ul className="site-footer__col-links">
              <li><Link to="/about">{t('footer.aboutDesc')}</Link></li>
              <li><Link to="/careers">{t('footer.careers')}</Link></li>
              <li><Link to="/blog">{t('footer.blog')}</Link></li>
            </ul>
          </div>

          {/* Cột 3: Dành cho chủ nhà */}
          <div>
            <h3 className="site-footer__col-title">{t('footer.forLandlords')}</h3>
            <ul className="site-footer__col-links">
              <li><Link to="/admin/listings/new">{t('footer.postListing')}</Link></li>
              <li><Link to="/pricing">{t('footer.pricingPlans')}</Link></li>
              <li><Link to="/guide">{t('footer.landlordGuide')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span className="site-footer__copyright">
            {t('footer.copyright', { year })}
          </span>
          <div className="site-footer__socials">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__social-link"
              aria-label="Facebook"
            >
              f
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__social-link"
              aria-label="YouTube"
            >
              ▶
            </a>
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__social-link"
              aria-label="Zalo"
            >
              Z
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

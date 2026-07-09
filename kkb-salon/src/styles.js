import T from "./tokens.js";

// ── STYLES ────────────────────────────────────────────────
// All CSS lives here. Tokens are imported from tokens.js.
// To change colors: edit tokens.js
// To change layout/spacing/typography: edit this file

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Jost:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  body {
    background: ${T.cream};
    color: ${T.black};
    font-family: 'Jost', sans-serif;
    font-size: 15px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }

  /* ── NAV ── */
  /* Nav, mobile menu & buttons migrated to Tailwind (Nav component + index.css) */

  .page { padding-top: 72px; min-height: 100vh; }

  /* ── BUTTONS — migrated to Tailwind @layer components (index.css) ── */

  /* ── SECTION LABEL ── */
  /* .eyebrow and .display-title migrated to Tailwind @layer components (index.css) */

  .body-text { font-size: 15px; font-weight: 300; color: ${T.warm}; line-height: 1.8; }

  /* ── HOME HERO + INTRO BAND — redesigned in Tailwind (HomePage) ── */

  /* ── Home services section + carousel fully migrated to Tailwind ── */

  /* ── HOME ABOUT + PACKAGES SECTIONS — redesigned in Tailwind (HomePage) ──
        pkg-* below are shared with the Packages page and stay for now. */

  .pkg-tag {
    font-size: 10px; letter-spacing: 2.5px;
    text-transform: uppercase; color: ${T.accent};
    margin-bottom: 20px; display: block;
  }

  .pkg-tag-light { color: ${T.blush}; }

  .pkg-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; font-weight: 400;
    color: ${T.black}; margin-bottom: 6px; line-height: 1.1;
  }

  .pkg-name-light { color: ${T.cream}; }

  .pkg-tagline {
    font-size: 13px; font-weight: 300; font-style: italic;
    color: ${T.muted}; margin-bottom: 28px;
  }

  .pkg-tagline-light { color: rgba(253,250,247,0.5); }

  .pkg-includes { list-style: none; margin-bottom: 32px; display: grid; gap: 10px; }

  .pkg-includes li {
    font-size: 13px; font-weight: 300; color: ${T.warm};
    display: flex; align-items: flex-start; gap: 12px; line-height: 1.4;
  }

  .pkg-includes-light li { color: rgba(253,250,247,0.6); }

  .pkg-includes li::before { content: '—'; color: ${T.accent}; flex-shrink: 0; }

  .pkg-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 52px; font-weight: 400; font-style: italic;
    color: ${T.black}; line-height: 1; margin-bottom: 4px;
  }

  .pkg-price-light { color: ${T.cream}; }

  .pkg-original { font-size: 14px; color: ${T.muted}; text-decoration: line-through; margin-bottom: 4px; }
  .pkg-save { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: ${T.accent}; margin-bottom: 28px; }

  /* ── CTA SECTION — redesigned in Tailwind (HomePage) ── */

  /* ── PAGE HERO ── */
  /* ── Shared page-hero → Tailwind @apply (index.css);
        Services page list → redesigned in Tailwind (ServicesPage) ── */

  /* ── PACKAGES PAGE ── */
  .packages-page { padding: 64px 56px; background: ${T.cream}; }

  .packages-grid-page {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: ${T.border};
    border: 1px solid ${T.border}; margin-bottom: 24px;
  }

  .package-card-page {
    padding: 48px 36px; background: ${T.cream};
    cursor: pointer; transition: background 0.3s;
  }

  .package-card-page:hover { background: ${T.blush}; }
  .package-card-page.featured { background: ${T.dark}; }
  .package-card-page.featured:hover { background: #4a3840; }

  .builder-box {
    background: ${T.blush}; border: 1px solid ${T.border};
    padding: 52px 48px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 24px; flex-wrap: wrap;
    cursor: pointer; transition: background 0.25s; margin-top: 24px;
  }

  .builder-box:hover { background: ${T.blush2}; }

  .builder-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 30px; font-weight: 400; font-style: italic;
    color: ${T.black}; margin-bottom: 6px;
  }

  .builder-sub { font-size: 13px; font-weight: 300; color: ${T.muted}; }

  /* ── BOOKING PAGE ── */
  .booking-layout {
    display: grid; grid-template-columns: 1fr 360px;
    min-height: calc(100vh - 72px);
  }

  .booking-form-section {
    padding: 64px 56px; background: ${T.cream};
    border-right: 1px solid ${T.border};
  }

  .booking-sidebar {
    padding: 64px 40px; background: ${T.blush};
    position: sticky; top: 72px;
    height: calc(100vh - 72px); overflow-y: auto;
  }

  .form-group { margin-bottom: 28px; }

  .form-label {
    display: block; font-size: 10px; font-weight: 500;
    letter-spacing: 2.5px; text-transform: uppercase;
    color: ${T.muted}; margin-bottom: 10px;
  }

  .form-input {
    width: 100%; background: ${T.white};
    border: 1px solid ${T.border}; color: ${T.black};
    padding: 13px 16px; font-family: 'Jost', sans-serif;
    font-size: 14px; font-weight: 300; outline: none;
    transition: border-color 0.2s; -webkit-appearance: none;
  }

  .form-input:focus { border-color: ${T.accent}; }

  .form-select {
    width: 100%; background: ${T.white};
    border: 1px solid ${T.border}; color: ${T.black};
    padding: 13px 16px; font-family: 'Jost', sans-serif;
    font-size: 14px; font-weight: 300; outline: none;
    cursor: pointer; appearance: none; transition: border-color 0.2s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23A08890' stroke-width='1' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 16px center;
  }

  .form-select:focus { border-color: ${T.accent}; }

  .time-slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

  .time-slot {
    background: ${T.white}; border: 1px solid ${T.border};
    color: ${T.warm}; padding: 10px 8px;
    font-size: 12px; font-weight: 400; text-align: center;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px;
  }

  .time-slot:hover { border-color: ${T.accent}; color: ${T.black}; }
  .time-slot.selected { background: ${T.dark}; border-color: ${T.dark}; color: ${T.cream}; }
  .time-slot.past {
    background: ${T.cream}; color: ${T.border2};
    border-color: ${T.border}; cursor: not-allowed;
    text-decoration: line-through; opacity: 0.5;
  }
  .time-slot.past:hover { border-color: ${T.border}; color: ${T.border2}; }

  .sidebar-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px; font-weight: 400; font-style: italic;
    color: ${T.dark}; margin-bottom: 28px;
    padding-bottom: 20px; border-bottom: 1px solid ${T.border2};
  }

  .sidebar-row {
    display: flex; justify-content: space-between;
    align-items: flex-start; padding: 13px 0;
    border-bottom: 1px solid ${T.border};
    font-size: 13px; gap: 16px;
  }

  .sidebar-label { color: ${T.muted}; flex-shrink: 0; font-weight: 300; }
  .sidebar-value { color: ${T.dark}; text-align: right; font-weight: 400; }

  .sidebar-total {
    display: flex; justify-content: space-between;
    align-items: baseline; padding: 24px 0 0; margin-top: 8px;
  }

  .sidebar-total-label {
    font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: ${T.muted};
  }

  .sidebar-total-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 48px; font-weight: 400; font-style: italic;
    color: ${T.dark}; line-height: 1;
  }

  /* ── STYLISTS PAGE ── */
  .stylists-section {
    padding: 80px 56px;
    background: ${T.cream};
    display: flex; flex-direction: column; align-items: center;
  }

  .stylist-card-wrap {
    width: 100%; max-width: 720px; margin-top: 56px;
    border: 1px solid ${T.border}; overflow: hidden;
    display: grid; grid-template-columns: 280px 1fr;
    transition: box-shadow 0.3s;
  }

  .stylist-card-wrap:hover {
    box-shadow: 0 8px 40px rgba(58,40,48,0.10);
  }

  .stylist-avatar {
    background: ${T.blush2};
    display: flex; align-items: center; justify-content: center;
    min-height: 360px; border-right: 1px solid ${T.border};
    position: relative; overflow: hidden;
  }

  .stylist-avatar-bg {
    position: absolute;
    font-family: 'Cormorant Garamond', serif;
    font-size: 160px; font-weight: 300; font-style: italic;
    color: rgba(196,116,138,0.1);
    bottom: -20px; right: -10px; line-height: 1; user-select: none;
  }

  .stylist-avatar-emoji { position: relative; z-index: 1; font-size: 80px; }

  .stylist-info {
    padding: 48px 44px;
    display: flex; flex-direction: column; justify-content: center;
    background: ${T.cream};
  }

  .stylist-role {
    font-size: 10px; letter-spacing: 3px;
    text-transform: uppercase; color: ${T.accent}; margin-bottom: 12px;
  }

  .stylist-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 44px; font-weight: 400; font-style: italic;
    color: ${T.black}; line-height: 1;
    letter-spacing: -0.5px; margin-bottom: 20px;
  }

  .stylist-divider {
    width: 40px; height: 1px;
    background: ${T.accent}; margin-bottom: 20px;
  }

  .stylist-bio {
    font-size: 14px; font-weight: 300;
    color: ${T.warm}; line-height: 1.8; margin-bottom: 28px;
  }

  .stylist-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 36px; }

  .tag {
    font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
    padding: 5px 12px; border: 1px solid ${T.border};
    color: ${T.muted}; background: ${T.cream}; transition: all 0.2s;
  }

  .tag:hover { border-color: ${T.accent}; color: ${T.accent}; }

  /* ── GALLERY PAGE ── */
  .gallery-nav {
    display: flex; gap: 0; padding: 36px 56px 0;
    border-bottom: 1px solid ${T.border}; background: ${T.cream};
  }

  .gallery-btn {
    background: transparent; border: none;
    border-bottom: 1.5px solid transparent;
    color: ${T.muted}; padding: 10px 20px 12px;
    font-family: 'Jost', sans-serif;
    font-size: 11px; letter-spacing: 2px;
    text-transform: uppercase; cursor: pointer;
    transition: all 0.2s; margin-bottom: -1px;
  }

  .gallery-btn:hover { color: ${T.black}; }
  .gallery-btn.active { color: ${T.black}; border-bottom-color: ${T.accent}; }

  .gallery-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: ${T.border};
    margin: 32px 56px 64px; padding: 1px;
  }

  .gallery-item {
    background: ${T.blush}; aspect-ratio: 3/4;
    display: flex; align-items: center; justify-content: center;
    font-size: 48px; cursor: pointer;
    position: relative; overflow: hidden;
  }

  .gallery-item:nth-child(even) { background: ${T.blush2}; }

  .gallery-item:hover .gallery-overlay { opacity: 1; }

  .gallery-overlay {
    position: absolute; inset: 0;
    background: rgba(58,40,48,0.88);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.25s;
    flex-direction: column; gap: 16px;
  }

  .gallery-overlay-label {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 400; font-style: italic;
    color: ${T.cream};
  }

  /* ── ABOUT PAGE ── */
  .about-page-hero {
    display: grid; grid-template-columns: 1fr 1fr;
    min-height: 560px; border-bottom: 1px solid ${T.border};
  }

  .about-page-left {
    padding: 80px 56px; background: ${T.cream};
    border-right: 1px solid ${T.border};
    display: flex; flex-direction: column; justify-content: center;
  }

  .about-page-right {
    background: ${T.dark};
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }

  .about-page-right-watermark {
    position: absolute; font-family: 'Cormorant Garamond', serif;
    font-size: 200px; font-weight: 300; font-style: italic;
    color: rgba(253,250,247,0.03); line-height: 1;
    right: -20px; bottom: -30px; user-select: none;
  }

  .about-page-right-inner {
    position: relative; z-index: 1; padding: 60px;
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(22px, 2.5vw, 32px); font-weight: 300; font-style: italic;
    color: rgba(253,250,247,0.7); line-height: 1.5; text-align: center;
  }

  .values-area { padding: 80px 56px; background: ${T.blush}; }

  .values-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: ${T.border};
    border: 1px solid ${T.border}; margin-top: 48px;
  }

  .value-card { padding: 48px 36px; background: ${T.blush}; }

  .value-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 64px; font-weight: 300; font-style: italic;
    color: ${T.border2}; line-height: 1; margin-bottom: 20px;
  }

  .value-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px; font-weight: 400;
    color: ${T.black}; margin-bottom: 10px;
  }

  .value-desc { font-size: 13px; font-weight: 300; color: ${T.warm}; line-height: 1.75; }

  /* ── CONTACT PAGE ── */
  .contact-layout {
    display: grid; grid-template-columns: 1fr 1fr;
    min-height: calc(100vh - 260px);
    background: ${T.cream};
  }

  .contact-left { padding: 64px 56px; border-right: 1px solid ${T.border}; }

  .contact-right {
    background: ${T.blush};
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 16px; padding: 64px 56px;
  }

  .contact-block { margin-bottom: 32px; }

  .contact-block-label {
    font-size: 10px; font-weight: 500;
    letter-spacing: 2.5px; text-transform: uppercase;
    color: ${T.accent}; margin-bottom: 8px;
  }

  .contact-block-value { font-size: 15px; font-weight: 300; color: ${T.dark}; line-height: 1.75; }

  .contact-form-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 400; font-style: italic;
    color: ${T.black}; margin-bottom: 24px;
  }

  /* ── FOOTER ── */
  /* Footer migrated to Tailwind (Footer component) */

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .services-grid { grid-template-columns: 1fr; }
    .stylists-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 768px) {
    .packages-page { padding: 40px 24px; }
    .packages-grid-page { grid-template-columns: 1fr; }
    .booking-layout { grid-template-columns: 1fr; }
    .booking-form-section { padding: 40px 24px; }
    .booking-sidebar { position: static; height: auto; }
    .stylists-section { padding: 48px 24px; }
    .stylist-card-wrap { grid-template-columns: 1fr; }
    .stylist-avatar { min-height: 240px; border-right: none; border-bottom: 1px solid ${T.border}; }
    .stylist-info { padding: 32px 24px; }
    .gallery-nav { padding: 28px 24px 0; }
    .gallery-grid { grid-template-columns: repeat(2, 1fr); margin: 24px; }
    .about-page-hero { grid-template-columns: 1fr; }
    .about-page-right { display: none; }
    .about-page-left { padding: 56px 24px; }
    .values-area { padding: 56px 24px; }
    .values-grid { grid-template-columns: 1fr; }
    .contact-layout { grid-template-columns: 1fr; }
    .contact-left { padding: 40px 24px; }
    .contact-right { min-height: 200px; }
    .time-slots { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 400px) {
    .display-title { font-size: 32px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; }
  /* ══════════════════════════════════════════════════════
     ADMIN PANEL
     ══════════════════════════════════════════════════════ */

  .admin-layout {
    display: grid;
    grid-template-columns: 220px 1fr;
    min-height: 100vh;
    font-family: 'Jost', sans-serif;
    background: #0f0f0f;
    color: #e0e0e0;
  }

  /* ── Sidebar ── */
  .admin-sidebar {
    background: #141414;
    border-right: 1px solid #222;
    padding: 0;
    display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh;
    overflow-y: auto;
  }

  .admin-logo {
    padding: 24px 20px;
    border-bottom: 1px solid #222;
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px; font-weight: 500; font-style: italic;
    color: #fff; letter-spacing: 0.5px;
  }

  .admin-logo span { color: #C4748A; font-style: normal; }

  .admin-logo-sub {
    font-family: 'Jost', sans-serif;
    font-size: 9px; letter-spacing: 2px;
    text-transform: uppercase; color: #555;
    margin-top: 4px; font-style: normal;
  }

  .admin-nav { padding: 16px 0; flex: 1; }

  .admin-nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 20px; cursor: pointer;
    font-size: 12px; font-weight: 400;
    letter-spacing: 1px; color: #666;
    transition: all 0.2s; border-left: 2px solid transparent;
    text-transform: uppercase;
  }

  .admin-nav-item:hover { color: #ccc; background: rgba(255,255,255,0.03); }
  .admin-nav-item.active { color: #fff; border-left-color: #C4748A; background: rgba(196,116,138,0.06); }
  .admin-nav-item .nav-icon { font-size: 14px; width: 16px; text-align: center; }

  .admin-nav-badge {
    margin-left: auto; background: #C4748A;
    color: #fff; font-size: 10px; font-weight: 600;
    padding: 2px 7px; border-radius: 10px; letter-spacing: 0;
  }

  .admin-back {
    padding: 16px 20px; border-top: 1px solid #222;
    font-size: 11px; letter-spacing: 1.5px;
    text-transform: uppercase; color: #444;
    cursor: pointer; transition: color 0.2s;
  }

  .admin-back:hover { color: #888; }

  /* ── Main content ── */
  .admin-main { padding: 40px 48px; overflow-y: auto; }

  .admin-page-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px; font-weight: 400; font-style: italic;
    color: #fff; margin-bottom: 4px;
  }

  .admin-page-sub {
    font-size: 12px; color: #555; letter-spacing: 1px;
    text-transform: uppercase; margin-bottom: 36px;
  }

  /* ── Dashboard cards ── */
  .admin-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 16px; margin-bottom: 48px;
  }

  .admin-stat-card {
    background: #1a1a1a; border: 1px solid #222;
    padding: 24px; transition: border-color 0.2s;
  }

  .admin-stat-card:hover { border-color: #333; }

  .admin-stat-label {
    font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: #555; margin-bottom: 12px;
  }

  .admin-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 48px; font-weight: 400; font-style: italic;
    color: #fff; line-height: 1;
  }

  .admin-stat-num.accent { color: #C4748A; }
  .admin-stat-num.warn   { color: #e8a838; }
  .admin-stat-num.green  { color: #4caf7d; }

  /* ── Table ── */
  .admin-table-wrap {
    background: #1a1a1a; border: 1px solid #222; overflow: hidden;
    margin-bottom: 32px;
  }

  .admin-table-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid #222;
  }

  .admin-table-title {
    font-size: 11px; letter-spacing: 2px;
    text-transform: uppercase; color: #888; font-weight: 500;
  }

  .admin-table { width: 100%; border-collapse: collapse; }

  .admin-table th {
    text-align: left; padding: 12px 16px;
    font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: #444;
    border-bottom: 1px solid #222; font-weight: 500;
    background: #141414;
  }

  .admin-table td {
    padding: 14px 16px; border-bottom: 1px solid #1e1e1e;
    font-size: 13px; color: #ccc; vertical-align: middle;
  }

  .admin-table tr:last-child td { border-bottom: none; }
  .admin-table tr:hover td { background: rgba(255,255,255,0.02); }

  /* ── Status badges ── */
  .status-badge {
    display: inline-block; padding: 3px 10px;
    font-size: 10px; font-weight: 500;
    letter-spacing: 1.5px; text-transform: uppercase; border-radius: 2px;
  }

  .status-pending   { background: rgba(232,168,56,0.15);  color: #e8a838; }
  .status-confirmed { background: rgba(76,175,125,0.15);  color: #4caf7d; }
  .status-cancelled { background: rgba(255,80,80,0.12);   color: #ff6b6b; }
  .status-completed { background: rgba(100,100,255,0.12); color: #8888ff; }
  .status-unread    { background: rgba(196,116,138,0.15); color: #C4748A; }
  .status-read      { background: rgba(100,100,100,0.15); color: #888;    }
  .status-replied   { background: rgba(76,175,125,0.15);  color: #4caf7d; }

  /* ── Action buttons ── */
  .admin-actions { display: flex; gap: 6px; flex-wrap: wrap; }

  .admin-btn {
    font-size: 10px; font-weight: 500;
    letter-spacing: 1.5px; text-transform: uppercase;
    padding: 5px 12px; border: 1px solid #333;
    background: transparent; color: #888;
    cursor: pointer; transition: all 0.2s;
  }

  .admin-btn:hover    { border-color: #555; color: #ccc; }
  .admin-btn.confirm  { border-color: rgba(76,175,125,0.4);  color: #4caf7d; }
  .admin-btn.confirm:hover  { background: rgba(76,175,125,0.1); }
  .admin-btn.cancel   { border-color: rgba(255,107,107,0.4); color: #ff6b6b; }
  .admin-btn.cancel:hover   { background: rgba(255,107,107,0.1); }
  .admin-btn.complete { border-color: rgba(136,136,255,0.4); color: #8888ff; }
  .admin-btn.complete:hover { background: rgba(136,136,255,0.1); }
  .admin-btn.delete   { border-color: rgba(255,80,80,0.3);   color: #ff5050; }
  .admin-btn.delete:hover   { background: rgba(255,80,80,0.1); }
  .admin-btn.accent   { border-color: rgba(196,116,138,0.4); color: #C4748A; }
  .admin-btn.accent:hover   { background: rgba(196,116,138,0.1); }

  /* ── Filter bar ── */
  .admin-filters {
    display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;
  }

  .admin-filter-btn {
    font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
    padding: 7px 16px; border: 1px solid #222;
    background: transparent; color: #555; cursor: pointer; transition: all 0.2s;
  }

  .admin-filter-btn:hover { border-color: #444; color: #aaa; }
  .admin-filter-btn.active { border-color: #C4748A; color: #C4748A; background: rgba(196,116,138,0.06); }

  /* ── Empty state ── */
  .admin-empty {
    text-align: center; padding: 60px 20px;
    font-size: 13px; color: #444; letter-spacing: 1px;
  }

  /* ── Edit modal ── */
  .admin-modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.8);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }

  .admin-modal {
    background: #1a1a1a; border: 1px solid #333;
    width: 100%; max-width: 560px;
    max-height: 90vh; overflow-y: auto;
    padding: 36px;
  }

  .admin-modal-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px; font-weight: 400; font-style: italic;
    color: #fff; margin-bottom: 28px;
    padding-bottom: 16px; border-bottom: 1px solid #222;
  }

  .admin-form-group { margin-bottom: 20px; }

  .admin-form-label {
    display: block; font-size: 10px; font-weight: 500;
    letter-spacing: 2px; text-transform: uppercase;
    color: #555; margin-bottom: 8px;
  }

  .admin-form-input {
    width: 100%; background: #111; border: 1px solid #2a2a2a;
    color: #ccc; padding: 11px 14px;
    font-family: 'Jost', sans-serif; font-size: 13px;
    outline: none; transition: border-color 0.2s;
  }

  .admin-form-input:focus { border-color: #C4748A; }

  .admin-modal-actions {
    display: flex; gap: 10px; margin-top: 28px;
    padding-top: 20px; border-top: 1px solid #222;
  }

  /* ── Toast notification ── */
  .admin-toast {
    position: fixed; bottom: 28px; right: 28px; z-index: 300;
    background: #1a1a1a; border: 1px solid #333;
    border-left: 3px solid #4caf7d;
    padding: 14px 20px; font-size: 13px; color: #ccc;
    animation: toast-in 0.3s ease;
    max-width: 320px;
  }

  .admin-toast.error { border-left-color: #ff6b6b; }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Message detail ── */
  .admin-message-body {
    background: #111; border: 1px solid #222;
    padding: 16px; font-size: 13px; color: #aaa;
    line-height: 1.7; margin-top: 8px; font-style: italic;
  }

  @media (max-width: 768px) {
    .admin-layout { grid-template-columns: 1fr; }
    .admin-sidebar { position: static; height: auto; }
    .admin-main { padding: 24px 16px; }
    .admin-stats { grid-template-columns: repeat(2, 1fr); }
    .admin-table-wrap { overflow-x: auto; }
  }
`;

export default styles;

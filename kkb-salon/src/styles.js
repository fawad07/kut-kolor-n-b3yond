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

  /* .body-text migrated to Tailwind @layer components (index.css) */

  /* ── HOME HERO + INTRO BAND — redesigned in Tailwind (HomePage) ── */

  /* ── Home services section + carousel fully migrated to Tailwind ── */

  /* ── HOME ABOUT + PACKAGES SECTIONS — redesigned in Tailwind (HomePage) ──
        Home about/packages/CTA + Packages page all redesigned in Tailwind. */

  /* ── PAGE HERO ── */
  /* ── Shared page-hero → Tailwind @apply (index.css);
        Services & Packages pages → redesigned in Tailwind ── */

  /* ── BOOKING PAGE — redesigned in Tailwind (BookingPage);
        form-* + time-slot shared classes → @apply in index.css ── */

  /* ── STYLISTS PAGE — redesigned in Tailwind (StylistsPage) ── */

  /* ── GALLERY PAGE ── */
  /* ── GALLERY PAGE — redesigned in Tailwind (GalleryPage) ── */

  /* ── ABOUT PAGE ── */
  /* ── ABOUT PAGE — redesigned in Tailwind (AboutPage) ── */

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
  }

  @media (max-width: 768px) {
    .contact-layout { grid-template-columns: 1fr; }
    .contact-left { padding: 40px 24px; }
    .contact-right { min-height: 200px; }
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

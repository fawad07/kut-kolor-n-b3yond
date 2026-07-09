import { useState, useEffect } from "react";
import T from "./tokens.js";
import styles from "./styles.js";
import "./admin.css";

// ── DATA ──────────────────────────────────────────────────
const SERVICES = [
  { category:"Cuts", items:[
    { name:"Women's Cut & Style", duration:"60 min", price:"$65" },
    { name:"Men's Cut & Style",   duration:"45 min", price:"$45" },
    { name:"Kids Cut (under 12)", duration:"30 min", price:"$30" },
    { name:"Bang Trim",           duration:"15 min", price:"$15" },
    { name:"Shampoo & Blow-dry",  duration:"45 min", price:"$40" },
  ]},
  { category:"Color", items:[
    { name:"Full Color",           duration:"90 min",  price:"$95"       },
    { name:"Highlights — Partial", duration:"75 min",  price:"$110"      },
    { name:"Highlights — Full",    duration:"120 min", price:"$150"      },
    { name:"Balayage",             duration:"150 min", price:"$185"      },
    { name:"Color Correction",     duration:"180 min", price:"From $200" },
    { name:"Toner / Gloss",        duration:"30 min",  price:"$45"       },
  ]},
  { category:"Treatments", items:[
    { name:"Keratin Treatment", duration:"120 min", price:"$175" },
    { name:"Deep Conditioning", duration:"30 min",  price:"$35"  },
    { name:"Scalp Treatment",   duration:"45 min",  price:"$50"  },
    { name:"Brazilian Blowout", duration:"150 min", price:"$200" },
  ]},
];

const PACKAGES = [
  { name:"Fresh Start",  tagline:"The essentials, beautifully done",   includes:["Women's Cut & Style","Shampoo & Blow-dry","Scalp Treatment"],                        price:"$120", original:"$140", save:"Save $20", featured:false },
  { name:"Kut + Kolor",  tagline:"Our most requested combination",      includes:["Women's Cut & Style","Full Color","Toner / Gloss","Blow-dry & Style"],             price:"$175", original:"$215", save:"Save $40", featured:true  },
  { name:"B3yond",       tagline:"The complete transformation",         includes:["Balayage","Cut & Style","Keratin Treatment","Deep Conditioning","Scalp Massage"],   price:"$340", original:"$420", save:"Save $80", featured:false },
];

const STYLISTS = [
  { emoji:"💇‍♀️", name:"Samina Aleem", title:"Master Stylist", bio:"12 years specializing in precision cuts and lived-in color. Renowned for her balayage work.", tags:["Balayage","Precision Cuts","Color"] },
];

const GALLERY_ITEMS = [
  { emoji:"💇‍♀️", label:"Balayage",        category:"Color"      },
  { emoji:"✂️",   label:"Precision Cut",   category:"Cuts"       },
  { emoji:"🌈",   label:"Full Color",       category:"Color"      },
  { emoji:"💈",   label:"Men's Cut",        category:"Cuts"       },
  { emoji:"✨",   label:"Highlights",       category:"Color"      },
  { emoji:"💁‍♀️", label:"Blowout",          category:"Style"      },
  { emoji:"🎨",   label:"Color Correction", category:"Color"      },
  { emoji:"💆‍♀️", label:"Treatment",        category:"Treatments" },
  { emoji:"🌟",   label:"Keratin",          category:"Treatments" },
];

const NAV_ITEMS  = ["Home","Services","Packages","Booking","Stylists","Gallery","About","Contact"];
const TIME_SLOTS = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM"];

// ── SHARED ────────────────────────────────────────────────
function Nav({ current, navigate, menuOpen, setMenuOpen }) {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] h-[72px] flex items-center justify-between px-6 md:px-14 bg-cream border-b border-line">
        <div className="font-serif text-[20px] font-medium tracking-[1px] text-ink cursor-pointer select-none" onClick={() => navigate("Home")}>
          Kut, Kolor <em className="italic text-accent">N B3yond</em>
        </div>
        <ul className="hidden md:flex items-center gap-9 list-none">
          {NAV_ITEMS.map(p => (
            <li key={p}
              className={`text-[11px] font-medium tracking-[2.5px] uppercase cursor-pointer transition-colors ${current === p ? "text-ink" : "text-warm hover:text-ink"}`}
              onClick={() => navigate(p)}>{p}</li>
          ))}
        </ul>
        <button className="hidden md:inline-block bg-transparent text-ink border border-ink px-7 py-2.5 font-sans text-[11px] font-medium tracking-[2.5px] uppercase cursor-pointer transition-all hover:bg-ink hover:text-cream" onClick={() => navigate("Booking")}>Book Now</button>
        <button className="flex md:hidden flex-col gap-[5px] cursor-pointer p-1 bg-transparent border-0" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className="block w-[22px] h-px bg-ink" /><span className="block w-[22px] h-px bg-ink" /><span className="block w-[22px] h-px bg-ink" />
        </button>
      </nav>
      <ul className={`fixed inset-0 z-[99] bg-cream flex flex-col items-center justify-center gap-3 px-8 transition-opacity md:hidden ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {NAV_ITEMS.map(p => (
          <li key={p} className="font-serif text-[40px] font-normal italic text-ink list-none cursor-pointer transition-colors leading-[1.3] hover:text-accent"
            onClick={() => { navigate(p); setMenuOpen(false); }}>{p}</li>
        ))}
      </ul>
    </>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="bg-dark px-6 pt-12 pb-8 md:px-14 md:pt-[72px] md:pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-[60px] pb-14 border-b border-white/[0.06] mb-9">
        <div>
          <div className="font-serif text-[22px] font-normal italic text-cream mb-4">Kut, Kolor <em className="not-italic text-blush2">N B3yond</em></div>
          <p className="text-[13px] font-light text-cream/35 leading-[1.7] max-w-[240px]">Your transformation starts here. Premium hair services for every age, every style, every story.</p>
        </div>
        <div>
          <div className="text-[10px] font-medium tracking-[2.5px] uppercase text-cream/30 mb-5">Services</div>
          <ul className="list-none grid gap-3">
            {["Cuts","Color","Treatments","Packages"].map(s => (
              <li key={s} className="text-[13px] font-light text-cream/45 cursor-pointer transition-colors hover:text-cream" onClick={() => navigate("Services")}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] font-medium tracking-[2.5px] uppercase text-cream/30 mb-5">Salon</div>
          <ul className="list-none grid gap-3">
            {[["Stylists","Stylists"],["Gallery","Gallery"],["About","About"],["Contact","Contact"]].map(([label,page]) => (
              <li key={label} className="text-[13px] font-light text-cream/45 cursor-pointer transition-colors hover:text-cream" onClick={() => navigate(page)}>{label}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] font-medium tracking-[2.5px] uppercase text-cream/30 mb-5">Hours</div>
          <ul className="list-none grid gap-3 text-[13px] font-light text-cream/45">
            <li>Mon – Fri: 9am – 7pm</li>
            <li>Saturday: 9am – 6pm</li>
            <li>Sunday: 10am – 4pm</li>
          </ul>
        </div>
      </div>
      <div className="flex justify-between items-center flex-wrap gap-3 text-[11px] tracking-[0.5px] text-cream/20">
        <span>© 2026 Kut, Kolor N B3yond</span>
        <span>
          <span onClick={() => navigate("Privacy")} className="cursor-pointer hover:text-cream/50">Privacy</span>
          {" · "}
          <span onClick={() => navigate("Terms")} className="cursor-pointer hover:text-cream/50">Terms</span>
        </span>
      </div>
    </footer>
  );
}

// ── Legal pages ───────────────────────────────────────────
const LEGAL_UPDATED = "June 27, 2026";

const LH = ({ children }) => (
  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
    fontSize: "26px", color: "#3A2830", margin: "36px 0 12px", fontWeight: 400 }}>
    {children}
  </h2>
);
const LP = ({ children }) => (
  <p style={{ marginBottom: "14px" }}>{children}</p>
);
const LLink = ({ to, navigate, children }) => (
  <span onClick={() => navigate(to)}
    style={{ color: "#C4748A", textDecoration: "underline", cursor: "pointer" }}>
    {children}
  </span>
);

function LegalLayout({ navigate, title, children }) {
  return (
    <>
      <div style={{ background: "#FDFAF7", padding: "140px 24px 90px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: "clamp(34px, 6vw, 54px)", color: "#3A2830", marginBottom: "8px",
            fontWeight: 400, lineHeight: 1.05 }}>
            {title}
          </h1>
          <p style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase",
            color: "#A08890", marginBottom: "40px" }}>
            Last updated {LEGAL_UPDATED}
          </p>
          <div style={{ fontSize: "15px", lineHeight: 1.8, color: "#5C4951" }}>
            {children}
          </div>
        </div>
      </div>
      <Footer navigate={navigate} />
    </>
  );
}

function PrivacyPage({ navigate }) {
  return (
    <LegalLayout navigate={navigate} title="Privacy Policy">
      <LP>
        This Privacy Policy explains how <strong>[LEGAL BUSINESS NAME]</strong> (“we,” “us,”
        or “our”), operating the Kut, Kolor N B3yond salon and this website, collects, uses,
        and protects your information when you use our website and booking services.
      </LP>

      <LH>Information we collect</LH>
      <LP>
        <strong>Information you provide:</strong> your name, email address, phone number,
        appointment details (service, stylist, date, time), any notes you add, and any
        messages you send through our contact form.
      </LP>
      <LP>
        <strong>Payment information:</strong> when you save a card for a booking, your card
        details are collected and processed directly by our payment processor, Stripe. We do
        not store your full card number — we retain only limited details such as the card
        brand and last four digits for reference.
      </LP>
      <LP>
        <strong>Automatically collected:</strong> basic technical data such as your IP address
        and request information, recorded in our server logs for security and troubleshooting.
      </LP>

      <LH>How we use your information</LH>
      <LP>
        We use your information to schedule, confirm, and manage your appointments; to contact
        you about your bookings or inquiries; to process cancellation or no-show fees in
        accordance with our <LLink to="Terms" navigate={navigate}>Terms of Service</LLink> where
        you have authorized a card on file; to keep our website secure; and to comply with
        legal obligations.
      </LP>

      <LH>Payment processing</LH>
      <LP>
        Card payments and card storage are handled by Stripe, Inc. Your card data is
        transmitted directly to Stripe and is subject to Stripe’s privacy policy. We never see
        or store your complete card number.
      </LP>

      <LH>Email</LH>
      <LP>
        We use Resend to send transactional emails such as booking confirmations and fee
        receipts. We do not send marketing email unless you have asked us to.
      </LP>

      <LH>Cookies</LH>
      <LP>
        Our public website does not use third-party advertising or tracking cookies. The
        staff admin area uses a single essential, first-party cookie to keep authorized salon
        staff securely logged in.
      </LP>

      <LH>How we share information</LH>
      <LP>
        We do not sell your personal information. We share it only with service providers who
        help us operate (such as Stripe for payments and Resend for email), or when required
        by law.
      </LP>

      <LH>Data retention &amp; security</LH>
      <LP>
        We keep your information only as long as needed to provide our services and to meet
        legal, accounting, or reporting requirements. We use reasonable safeguards — including
        encrypted connections (HTTPS), hashed admin credentials, and access controls — to
        protect it. No method of transmission or storage is completely secure.
      </LP>

      <LH>Your California privacy rights</LH>
      <LP>
        If you are a California resident, you may have the right to request access to,
        correction of, or deletion of the personal information we hold about you, and the right
        not to have your personal information sold (we do not sell it). To exercise these
        rights, contact us at <strong>[CONTACT EMAIL]</strong>.
      </LP>

      <LH>Children’s privacy</LH>
      <LP>
        Our services are intended for adults. When a minor receives services, a parent or
        guardian provides and is responsible for the booking information. We do not knowingly
        collect information directly from children under 13.
      </LP>

      <LH>Changes to this policy</LH>
      <LP>
        We may update this policy from time to time. The “Last updated” date above reflects the
        most recent revision.
      </LP>

      <LH>Contact us</LH>
      <LP>
        Questions about this policy? Contact us at <strong>[CONTACT EMAIL]</strong> or{" "}
        <strong>[PHONE NUMBER]</strong>.
      </LP>
    </LegalLayout>
  );
}

function TermsPage({ navigate }) {
  return (
    <LegalLayout navigate={navigate} title="Terms of Service">
      <LP>
        By using this website and our booking services, you agree to these Terms of Service.
        If you do not agree, please do not use the site. These Terms are offered by{" "}
        <strong>[LEGAL BUSINESS NAME]</strong>, operating as Kut, Kolor N B3yond.
      </LP>

      <LH>Appointments &amp; booking</LH>
      <LP>
        Submitting the booking form is a request for an appointment. We will confirm
        availability and may contact you to adjust the time. We reserve the right to decline or
        reschedule appointments.
      </LP>

      <LH>Cancellation, no-show &amp; late-cancellation fees</LH>
      <LP>
        We ask for at least <strong>24 hours’</strong> notice to cancel or reschedule an
        appointment. When you book, you may be asked to keep a payment card on file. By saving
        a card and agreeing to these Terms, you authorize us to charge that card for:
      </LP>
      <LP>
        • a <strong>late-cancellation fee</strong> if you cancel within 24 hours of your
        appointment; and<br />
        • a <strong>no-show fee</strong> if you do not attend and do not notify us.
      </LP>
      <LP>
        The fee amount is set by the salon, will be communicated to you, and will not exceed
        the full price of the booked service. Fees are processed through Stripe. The salon may,
        at its discretion, waive a fee. Your card is not charged at the time of booking.
      </LP>

      <LH>Payment authorization</LH>
      <LP>
        By providing a card and agreeing to these Terms (including at the time of booking), you
        authorize <strong>[LEGAL BUSINESS NAME]</strong> to charge that card for the applicable
        fees described above. Card storage and charges are handled by Stripe.
      </LP>

      <LH>Pricing</LH>
      <LP>
        Listed prices are estimates and may vary based on hair length, condition, and service
        complexity. Final pricing is confirmed at the salon before service.
      </LP>

      <LH>Service disclaimer</LH>
      <LP>
        Hair and beauty results vary by individual, and we do not guarantee specific results.
        Please inform your stylist of any allergies, sensitivities, or prior chemical
        treatments before service; a patch test may be recommended for color services.
      </LP>

      <LH>Right to refuse service</LH>
      <LP>
        We reserve the right to refuse or discontinue service for any lawful reason, including
        inappropriate or unsafe conduct.
      </LP>

      <LH>Limitation of liability</LH>
      <LP>
        To the fullest extent permitted by law, <strong>[LEGAL BUSINESS NAME]</strong> is not
        liable for any indirect, incidental, or consequential damages arising from your use of
        this website or our services. Our total liability for any claim relating to a service
        will not exceed the amount you paid for that service.
      </LP>

      <LH>Indemnification</LH>
      <LP>
        You agree to indemnify and hold harmless <strong>[LEGAL BUSINESS NAME]</strong> from
        any claims arising out of your misuse of the site or violation of these Terms.
      </LP>

      <LH>Website content</LH>
      <LP>
        All content on this site — text, images, and branding — is the property of{" "}
        <strong>[LEGAL BUSINESS NAME]</strong> and may not be reused without permission.
      </LP>

      <LH>Governing law</LH>
      <LP>
        These Terms are governed by the laws of the State of California, without regard to its
        conflict-of-law principles. Any disputes will be resolved in the state or federal
        courts located in California.
      </LP>

      <LH>Changes to these terms</LH>
      <LP>
        We may update these Terms at any time. Continued use of the site after changes
        constitutes acceptance of the revised Terms.
      </LP>

      <LH>Contact us</LH>
      <LP>
        Questions about these Terms? Contact us at <strong>[CONTACT EMAIL]</strong> or{" "}
        <strong>[PHONE NUMBER]</strong>. See also our{" "}
        <LLink to="Privacy" navigate={navigate}>Privacy Policy</LLink>.
      </LP>
    </LegalLayout>
  );
}

// ── PAGES ─────────────────────────────────────────────────
const SERVICE_CARDS = [
  {
    n:"01", name:"Cuts",
    desc:"Precision cuts tailored to your face shape, texture, and lifestyle. From timeless classics to creative modern styles.",
    price:"From $30", tag:"Hair Cutting", page:"Services",
  },
  {
    n:"02", name:"Color",
    desc:"Full color, highlights, balayage — vibrant or natural, always intentional and always stunning on every hair type.",
    price:"From $45", tag:"Hair Color", page:"Services",
  },
  {
    n:"03", name:"Treatments",
    desc:"Keratin, deep conditioning, scalp care. Restore, repair, and strengthen your hair from root to tip.",
    price:"From $35", tag:"Hair Care", page:"Services",
  },
  {
    n:"04", name:"Packages",
    desc:"Curated service bundles at better prices, or build your own fully custom package tailored to exactly what you need.",
    price:"From $120", tag:"Bundles", page:"Packages",
  },
];

function ServicesCarousel({ navigate }) {
  const [index,   setIndex]   = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= 768
  );

  const total    = SERVICE_CARDS.length;
  const visible  = isMobile ? 1 : 2;          // cards visible at once
  const stepPct  = isMobile ? 85 : 50;        // matches .service-card min-width in CSS
  const maxIndex = total - visible;
  const INTERVAL = 3000; // ms between slides

  // Track viewport size so step/visible count stay in sync with CSS breakpoint
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Clamp index if maxIndex shrinks (e.g. resizing from desktop to mobile)
  useEffect(() => {
    setIndex(i => Math.min(i, maxIndex));
  }, [maxIndex]);

  // Auto-advance — loops back to 0 when it hits the end
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex(i => (i >= maxIndex ? 0 : i + 1));
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [paused, maxIndex]);

  const prev = () => { setPaused(true); setIndex(i => (i <= 0 ? maxIndex : i - 1)); };
  const next = () => { setPaused(true); setIndex(i => (i >= maxIndex ? 0 : i + 1)); };

  return (
    <div
      className="carousel-wrapper"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="carousel-track-outer">
        <div
          className="carousel-track"
          style={{ transform: `translateX(calc(-${index * stepPct}% - ${index}px))` }}
        >
          {SERVICE_CARDS.map(s => (
            <div
              className="service-card"
              key={s.name}
              onClick={() => navigate(s.page)}
            >
              {/* Header bar */}
              <div className="service-card-header">
                <div className="service-card-header-left">
                  <span className="service-card-num">{s.n}</span>
                  <span className="service-card-name">{s.name}</span>
                </div>
                <span className="service-card-header-arrow">→</span>
              </div>

              {/* Body */}
              <div className="service-card-body">
                <p className="service-card-desc">{s.desc}</p>
                <div className="service-card-footer">
                  <div className="service-card-price">{s.price}</div>
                  <div className="service-card-tag">{s.tag}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-controls">
        <button className="carousel-btn" onClick={prev} disabled={index === 0}>←</button>
        <button className="carousel-btn" onClick={next} disabled={index === maxIndex}>→</button>

        <div className="carousel-dots">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <div
              key={i}
              className={`carousel-dot ${i === index ? "active" : ""}`}
              onClick={() => { setPaused(true); setIndex(i); }}
            />
          ))}
        </div>

        <div className="carousel-progress">
          <em>{index + 1}</em> / {maxIndex + 1}
        </div>
      </div>

      {/* Auto-play progress bar */}
      <div className="carousel-progress-bar">
        <div className={`carousel-progress-fill ${paused ? "paused" : ""}`} key={index} />
      </div>
    </div>
  );
}

function HomePage({ navigate }) {
  return (
    <div className="page">
      {/* ── HERO ── */}
      <section className="relative flex items-center overflow-hidden min-h-[calc(100vh-72px)]">
        {/* Full-bleed background image — swap src when you have your own photo */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover object-[center_top]"
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=85"
            alt="Inside Kut, Kolor N B3yond salon"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a0e]/90 via-[#1a0a0e]/70 to-[#1a0a0e]/25" />
        </div>

        <div className="relative z-[1] w-full max-w-[680px] flex flex-col gap-8 px-6 md:px-14 py-24 md:py-[120px]">
          <div className="flex items-center gap-4">
            <span className="w-10 h-px bg-blush2/60" />
            <span className="text-[11px] font-normal tracking-[3px] uppercase text-blush2">Premium Hair Studio — Est. 2024</span>
          </div>
          <h1 className="font-serif font-normal text-cream text-[clamp(56px,8vw,104px)] leading-[0.92] tracking-[-2px]">
            Kut,<br />Kolor<br /><em className="italic text-blush2">N B3yond</em>
          </h1>
          <div>
            <p className="text-[15px] font-light text-cream/70 max-w-[440px] leading-[1.85] mb-9">
              Precision cuts, transformative color, and treatments that go beyond the chair. For every age, every texture, every vision.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button className="btn-primary" onClick={() => navigate("Booking")}>Book an Appointment</button>
              <button className="btn-ghost text-cream hover:text-cream/70" onClick={() => navigate("Services")}>View Services →</button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-6 md:left-14 z-[1] hidden sm:flex items-center gap-3 text-cream/50 text-[10px] tracking-[2px] uppercase">
          <span className="w-8 h-px bg-cream/40" /> Scroll
        </div>
      </section>

      {/* ── INTRO BAND ── */}
      <section className="bg-blush border-y border-line px-6 md:px-14 py-14 md:py-20 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12">
        <p className="font-serif italic text-dark text-[clamp(22px,2.5vw,32px)] leading-[1.4] max-w-[560px]">
          &ldquo;More than a salon — a place where every client leaves feeling seen, cared for, and beautifully themselves.&rdquo;
        </p>
        <div className="flex shrink-0 divide-x divide-line2">
          {[{n:"12+",l:"Years of craft"},{n:"1",l:"Expert stylist"},{n:"500+",l:"Happy clients"}].map(s => (
            <div className="text-center px-6 md:px-8 first:pl-0 last:pr-0" key={s.l}>
              <div className="font-serif italic text-accent text-[44px] leading-none">{s.n}</div>
              <div className="text-[10px] tracking-[2px] uppercase text-muted mt-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="services-section">
        <div className="services-header">
          <div>
            <div className="eyebrow">What we offer</div>
            <h2 className="display-title">Services for<br /><em>every look</em></h2>
          </div>
          <button className="btn-ghost" onClick={() => navigate("Services")}>Full menu →</button>
        </div>
        <ServicesCarousel navigate={navigate} />
      </div>

      <div className="about-section">
        <div className="about-image-side">
          <div className="about-image-text">✂</div>
          ✂️
        </div>
        <div className="about-content">
          <div className="eyebrow">Our story</div>
          <h2 className="display-title">More than<br /><em>just hair.</em></h2>
          <div className="about-body">
            <p>Kut, Kolor N B3yond was built on one belief: every person deserves to walk out of a salon feeling like the best version of themselves — regardless of age, texture, or budget.</p>
            <p>From the grandmother celebrating her birthday to the teenager finding her style, we're here for everyone. Our team of specialists brings decades of experience and genuine passion to every chair.</p>
          </div>
          <button className="btn-outline" onClick={() => navigate("About")}>Our Story</button>
        </div>
      </div>

      <div className="packages-section-home">
        <div className="eyebrow">Save more</div>
        <h2 className="display-title">Our <em>Packages</em></h2>
        <div className="packages-grid-home">
          {PACKAGES.map(pkg => (
            <div className={`package-card-home ${pkg.featured ? "featured" : ""}`} key={pkg.name}>
              <span className={`pkg-tag ${pkg.featured ? "pkg-tag-light" : ""}`}>{pkg.featured ? "Most Requested" : "Package"}</span>
              <div className={`pkg-name ${pkg.featured ? "pkg-name-light" : ""}`}>{pkg.name}</div>
              <div className={`pkg-tagline ${pkg.featured ? "pkg-tagline-light" : ""}`}>{pkg.tagline}</div>
              <ul className={`pkg-includes ${pkg.featured ? "pkg-includes-light" : ""}`}>
                {pkg.includes.map(i => <li key={i}>{i}</li>)}
              </ul>
              <div className={`pkg-price ${pkg.featured ? "pkg-price-light" : ""}`}>{pkg.price}</div>
              <div className="pkg-original">{pkg.original}</div>
              <div className="pkg-save">{pkg.save}</div>
              <button
                className={pkg.featured ? "btn-cream-cta" : "btn-outline"}
                style={{marginTop:"20px", width:"100%", padding:"13px 20px"}}
                onClick={() => navigate("Booking")}
              >
                Book This Package
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="cta-section">
        <div className="eyebrow" style={{color:"rgba(253,250,247,0.4)"}}>Ready to begin</div>
        <h2 className="cta-title">Your best hair<br />is <em>waiting</em> for you.</h2>
        <p className="cta-sub">Book online in minutes. Choose your stylist, pick your time, and we'll take care of the rest.</p>
        <button className="btn-cream-cta" onClick={() => navigate("Booking")}>Book an Appointment</button>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}

function ServicesPage({ navigate }) {
  return (
    <div className="page">
      <div className="page-hero">
        <div className="page-hero-inner">
          <h1 className="page-hero-title">Our<br /><em>Services</em></h1>
          <p className="page-hero-sub">Every service performed by a trained specialist. Prices may vary based on hair length and complexity. Consultations are always complimentary.</p>
        </div>
      </div>
      <div className="services-full">
        {SERVICES.map(cat => (
          <div className="service-category" key={cat.category}>
            <div className="category-header">
              <div className="category-name">{cat.category}</div>
              <div className="category-count">{cat.items.length} services</div>
            </div>
            <div className="category-line" />
            <div>
              {cat.items.map(item => (
                <div className="service-row" key={item.name} onClick={() => navigate("Booking")}>
                  <div className="service-row-left">
                    <div className="service-row-name">{item.name}</div>
                    <div className="service-row-duration">{item.duration}</div>
                  </div>
                  <div className="service-row-price">{item.price}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-center text-[14px] italic text-warm mt-10 leading-[1.7] font-serif">
          * Prices are a starting guide and may change depending on hair length,
          thickness, and condition. Your final price is always confirmed at your
          complimentary consultation.
        </p>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

function PackagesPage({ navigate }) {
  return (
    <div className="page">
      <div className="page-hero">
        <div className="page-hero-inner">
          <h1 className="page-hero-title">Packages<br /><em>& Bundles</em></h1>
          <p className="page-hero-sub">Save when you bundle. Every package is crafted to deliver a complete experience. Or design your own from scratch — we'll price it on the spot.</p>
        </div>
      </div>
      <div className="packages-page">
        <div style={{marginBottom:"48px"}}>
          <div className="eyebrow">Curated packages</div>
          <h2 className="display-title">Pick Your <em>Package</em></h2>
        </div>
        <div className="packages-grid-page">
          {PACKAGES.map(pkg => (
            <div className={`package-card-page ${pkg.featured ? "featured" : ""}`} key={pkg.name}>
              <span className={`pkg-tag ${pkg.featured ? "pkg-tag-light" : ""}`}>{pkg.featured ? "Most Requested" : "Package"}</span>
              <div className={`pkg-name ${pkg.featured ? "pkg-name-light" : ""}`}>{pkg.name}</div>
              <div className={`pkg-tagline ${pkg.featured ? "pkg-tagline-light" : ""}`}>{pkg.tagline}</div>
              <ul className={`pkg-includes ${pkg.featured ? "pkg-includes-light" : ""}`}>
                {pkg.includes.map(i => <li key={i}>{i}</li>)}
              </ul>
              <div className={`pkg-price ${pkg.featured ? "pkg-price-light" : ""}`}>{pkg.price}</div>
              <div className="pkg-original">{pkg.original}</div>
              <div className="pkg-save">{pkg.save}</div>
              <button
                className={pkg.featured ? "btn-light" : "btn-primary"}
                style={{marginTop:"24px", width:"100%"}}
                onClick={() => navigate("Booking")}
              >
                Book This Package
              </button>
            </div>
          ))}
        </div>
        <div className="builder-box" onClick={() => navigate("Booking")}>
          <div>
            <div className="builder-title">Build Your Own Package</div>
            <div className="builder-sub">Mix and match any services — we'll calculate your custom price instantly.</div>
          </div>
          <button className="btn-primary">Start Building →</button>
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

function BookingPage({ navigate }) {
  // ── Form state ──────────────────────────────────────────
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    service: "", stylist: "Any available",
    preferred_date: "", preferred_time: "", notes: "",
  });

  // ── UI state ────────────────────────────────────────────
  const [agreed,     setAgreed]     = useState(false);
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [apiError,   setApiError]   = useState("");
  const [booking,    setBooking]    = useState(null);
  const [serverDown, setServerDown] = useState(false);

  // ── Stripe state ─────────────────────────────────────────
  // stripeLoaded → the js.stripe.com script is ready (constructor available)
  // stripe       → a Stripe *instance* (created per booking, used to confirm)
  const [stripeLoaded,   setStripeLoaded]   = useState(false);
  const [stripe,         setStripe]         = useState(null);
  const [stripeElements, setStripeElements] = useState(null);
  const [cardElement,    setCardElement]    = useState(null);
  const [setupIntent,    setSetupIntent]    = useState(null); // { client_secret, customer_id }
  const [cardReady,      setCardReady]      = useState(false);
  const [cardError,      setCardError]      = useState("");

  const found           = SERVICES.flatMap(c => c.items).find(i => i.name === form.service);
  const selectedPrice    = found?.price    || "—";
  const selectedDuration = found?.duration || "—";

  // Today's date as YYYY-MM-DD for the min attribute on the date input
  const today = new Date().toISOString().split("T")[0];

  // ── Load Stripe.js once ──────────────────────────────────
  useEffect(() => {
    if (window.Stripe) { setStripeLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = () => setStripeLoaded(true);
    document.head.appendChild(script);
  }, []);

  // ── Mount card element when email is filled + Stripe loaded ─
  useEffect(() => {
    if (!stripeLoaded || !window.Stripe || !form.email || !form.email.includes("@")) return;
    if (cardElement) return; // already mounted

    // Get SetupIntent client_secret from backend
    // Silent fail — if Stripe keys not configured, booking still works without card
    fetch(`${API}/payments/setup-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    })
      .then(r => {
        if (!r.ok) return null; // Stripe not configured — skip silently
        return r.json();
      })
      .then(data => {
        if (!data || !data.client_secret) return; // No Stripe — skip card element
        setSetupIntent(data);

        // window.Stripe is always the constructor; the per-booking instance is
        // kept in `stripe` state for confirmCardSetup() at submit time.
        const stripeInstance = window.Stripe(data.publishable_key);
        const elements = stripeInstance.elements();
        const card = elements.create("card", {
          style: {
            base: {
              fontFamily: "'Jost', sans-serif",
              fontSize: "14px",
              color: T.black,
              "::placeholder": { color: T.muted },
            },
            invalid: { color: T.accent },
          },
        });
        card.mount("#stripe-card-element");
        card.on("change", e => setCardError(e.error ? e.error.message : ""));
        card.on("ready", () => setCardReady(true));
        setStripeElements(elements);
        setCardElement(card);
        setStripe(stripeInstance);
      })
      .catch(() => {}); // silent — Stripe is optional if keys not configured
  }, [stripeLoaded, form.email]);

  // Field updater — phone gets auto-formatted as user types
  const set = (field) => (e) => {
    let value = e.target.value;

    if (field === "phone") {
      // Strip everything except digits
      const digits = value.replace(/\D/g, "").slice(0, 10);
      // Format as (XXX) XXX-XXXX progressively
      if (digits.length <= 3)
        value = digits;
      else if (digits.length <= 6)
        value = `(${digits.slice(0,3)}) ${digits.slice(3)}`;
      else
        value = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }

    setForm(f => ({ ...f, [field]: value }));
    setErrors(err => ({ ...err, [field]: "" }));
    setApiError("");
  };

  // ── Validation ───────────────────────────────────────────
  function validate() {
    const e = {};

    if (!form.full_name.trim())
      e.full_name = "Full name is required";

    // Email — stricter RFC-like pattern
    if (!form.email.trim())
      e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      e.email = "Enter a valid email address";

    // Phone — US 10 digits, flexible formatting
    const digitsOnly = form.phone.replace(/\D/g, "");
    if (!form.phone.trim())
      e.phone = "Phone number is required";
    else if (digitsOnly.length !== 10)
      e.phone = "Enter a valid 10-digit US phone number";
    else if (/[a-zA-Z]/.test(form.phone))
      e.phone = "Phone number cannot contain letters";

    if (!form.service)
      e.service = "Please select a service";
    if (!form.preferred_date)
      e.preferred_date = "Please choose a date";
    if (!form.preferred_time)
      e.preferred_time = "Please select a time";
    if (!agreed)
      e.agreed = "Please agree to the Terms and Cancellation Policy to continue";

    return e;
  }

  // ── Submit ───────────────────────────────────────────────
  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    setApiError("");
    try {
      // Step 1 — Create the booking
      const result = await fetch(`${API}/bookings/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, agreed }),
      });
      const data = await result.json();

      if (result.status === 409) {
        setApiError(data.detail);
        setErrors(err => ({ ...err, preferred_time: "This slot is unavailable" }));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      } else if (!result.ok) {
        const msg = Array.isArray(data.detail)
          ? data.detail.map(d => d.msg).join(", ")
          : data.detail || "Booking failed. Please try again.";
        setApiError(msg);
        return;
      }

      const createdBooking = data;

      // Step 2 — Confirm the SetupIntent (saves card via Stripe)
      if (setupIntent && cardElement && stripe) {
        const { setupIntent: confirmedIntent, error: stripeError } =
          await stripe.confirmCardSetup(setupIntent.client_secret, {
            payment_method: { card: cardElement },
          });

        if (stripeError) {
          setCardError(stripeError.message);
          // Booking was created — show confirmation but note card issue
          setBooking(createdBooking);
          setSubmitted(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        // Step 3 — Save card details to booking record
        if (confirmedIntent?.payment_method) {
          await fetch(
            `${API}/payments/save-card/${createdBooking.id}`,
            {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                payment_method_id: confirmedIntent.payment_method,
                customer_id:       setupIntent.customer_id,
              }),
            }
          );
        }
      }

      setBooking(createdBooking);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      // Only show server down popup for genuine network failures
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setServerDown(true);
      } else {
        setApiError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Confirmation screen ──────────────────────────────────
  if (submitted && booking) {
    return (
      <div className="page">
        <div style={{
          minHeight: "calc(100vh - 72px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "60px 24px", background: T.cream,
        }}>
          <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "52px", marginBottom: "24px" }}>✓</div>
            <div className="eyebrow" style={{ justifyContent: "center" }}>Booking received</div>
            <h1 className="display-title" style={{ marginBottom: "16px" }}>
              You're <em>all set!</em>
            </h1>
            <p className="body-text" style={{ marginBottom: "40px" }}>
              Thanks, <strong>{booking.full_name}</strong>. We've received your booking request
              and will confirm within a few hours. Check your inbox at{" "}
              <strong>{booking.email}</strong>.
            </p>
            <div style={{
              background: T.blush, border: `1px solid ${T.border}`,
              padding: "28px 32px", marginBottom: "36px", textAlign: "left",
            }}>
              {[
                ["Service",  booking.service],
                ["Stylist",  booking.stylist || "Any available"],
                ["Date",     booking.preferred_date],
                ["Time",     booking.preferred_time],
                ["Ref #",    `KKB-${String(booking.id).padStart(4, "0")}`],
                ["Status",   booking.status.toUpperCase()],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: `1px solid ${T.border}`,
                  fontSize: "14px",
                }}>
                  <span style={{ color: T.muted, fontWeight: 300 }}>{label}</span>
                  <span style={{ color: T.dark,  fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={() => {
              setSubmitted(false);
              setForm({
                full_name: "", email: "", phone: "",
                service: "", stylist: "Any available",
                preferred_date: "", preferred_time: "", notes: "",
              });
              // Reset Stripe state — a SetupIntent's client_secret is single-use,
              // so a second booking must mount a fresh card element / SetupIntent.
              // The card-mount effect re-runs once email is re-entered.
              if (cardElement) { try { cardElement.destroy(); } catch {} }
              setCardElement(null);
              setSetupIntent(null);
              setStripeElements(null);
              setStripe(null);
              setCardReady(false);
              setCardError("");
            }}>
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────
  const ErrMsg = ({ field }) => errors[field]
    ? <p style={{ color: T.accent, fontSize: "12px", marginTop: "6px" }}>{errors[field]}</p>
    : null;

  return (
    <div className="page">

      {/* ── Server down popup ── */}
      {serverDown && (
        <div style={{
          position:"fixed", inset:0, zIndex:200,
          background:"rgba(58,40,48,0.55)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"24px",
        }}>
          <div style={{
            background:T.cream, border:`1px solid ${T.border}`,
            maxWidth:"460px", width:"100%",
            padding:"48px 40px", textAlign:"center",
            boxShadow:"0 16px 48px rgba(58,40,48,0.15)",
          }}>
            <div style={{fontSize:"36px", marginBottom:"20px"}}>⚠️</div>
            <div style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:"28px", fontWeight:400, fontStyle:"italic",
              color:T.dark, marginBottom:"12px",
            }}>
              Something went wrong
            </div>
            <p style={{
              fontSize:"14px", fontWeight:300, color:T.warm,
              lineHeight:1.75, marginBottom:"32px",
            }}>
              We're having trouble processing your booking right now.
              Please try again in a moment — or give us a call and
              we'll get you booked in directly.
            </p>
            <div style={{
              background:T.blush, border:`1px solid ${T.border}`,
              padding:"16px 24px", marginBottom:"28px",
            }}>
              <div style={{
                fontSize:"10px", letterSpacing:"2.5px",
                textTransform:"uppercase", color:T.accent,
                marginBottom:"8px",
              }}>
                Call us directly
              </div>
              <div style={{
                fontFamily:"'Cormorant Garamond', serif",
                fontSize:"32px", fontWeight:500,
                color:T.dark, letterSpacing:"-0.5px",
              }}>
                (555) 123-4567
              </div>
            </div>
            <div style={{display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap"}}>
              <button className="btn-primary" onClick={() => {
                setServerDown(false);
                setLoading(false);
              }}>
                Try Again
              </button>
              <button className="btn-outline" onClick={() => setServerDown(false)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="booking-layout">
        <div className="booking-form-section">
          <div style={{ marginBottom: "48px" }}>
            <div className="eyebrow">Online booking</div>
            <h1 className="display-title" style={{ fontSize: "clamp(36px,4vw,56px)" }}>
              Book Your<br /><em>Appointment</em>
            </h1>
            <p style={{ fontSize: "14px", color: T.muted, marginTop: "12px", fontWeight: "300" }}>
              We'll confirm your appointment within a few hours.
            </p>
          </div>

          {/* API error banner */}
          {apiError && (
            <div style={{
              background: "#fff0f0",
              border: `1px solid ${T.accent}`,
              borderLeft: `4px solid ${T.accent}`,
              padding: "16px 18px",
              marginBottom: "28px",
              fontSize: "14px",
              color: T.accentD,
              lineHeight: "1.6",
            }}>
              <strong style={{ display: "block", marginBottom: "4px", fontSize: "12px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Booking Unavailable
              </strong>
              {apiError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" type="text" placeholder="Your full name"
              value={form.full_name} onChange={set("full_name")}
              style={errors.full_name ? { borderColor: T.accent } : {}} />
            <ErrMsg field="full_name" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" placeholder="you@email.com"
                value={form.email} onChange={set("email")}
                style={errors.email ? { borderColor: T.accent } : {}} />
              <ErrMsg field="email" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-input" type="tel" placeholder="(555) 123-4567"
                value={form.phone} onChange={set("phone")}
                style={errors.phone ? { borderColor: T.accent } : {}} />
              <ErrMsg field="phone" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Service *</label>
            <select className="form-select" value={form.service} onChange={set("service")}
              style={errors.service ? { borderColor: T.accent } : {}}>
              <option value="">Select a service…</option>
              {SERVICES.flatMap(cat => cat.items.map(i => (
                <option key={i.name} value={i.name}>{i.name} — {i.price}</option>
              )))}
            </select>
            <ErrMsg field="service" />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Stylist</label>
            <select className="form-select" value={form.stylist} onChange={set("stylist")}>
              <option value="Any available">No preference — any available stylist</option>
              {STYLISTS.map(s => (
                <option key={s.name} value={s.name}>{s.name} — {s.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Date *</label>
            <input className="form-input" type="date" min={today}
              value={form.preferred_date} onChange={set("preferred_date")}
              style={errors.preferred_date ? { borderColor: T.accent } : {}} />
            <ErrMsg field="preferred_date" />
          </div>

          <div className="form-group">
            <label className="form-label">Select a Time *</label>
            <div className="time-slots">
              {TIME_SLOTS.map(slot => {
                // Check if this slot is in the past for today's date
                const isPast = (() => {
                  if (!form.preferred_date || form.preferred_date !== today) return false;
                  try {
                    const [time, meridiem] = slot.split(" ");
                    const [hours, minutes] = time.split(":").map(Number);
                    let h = hours;
                    if (meridiem === "PM" && hours !== 12) h += 12;
                    if (meridiem === "AM" && hours === 12) h = 0;
                    const slotDate = new Date();
                    slotDate.setHours(h, minutes, 0, 0);
                    return slotDate <= new Date();
                  } catch { return false; }
                })();

                return (
                  <div key={slot}
                    className={`time-slot ${form.preferred_time === slot ? "selected" : ""} ${isPast ? "past" : ""}`}
                    onClick={() => {
                      if (isPast) return;
                      setForm(f => ({ ...f, preferred_time: slot }));
                      setErrors(e => ({ ...e, preferred_time: "" }));
                    }}
                    title={isPast ? "This time has already passed" : ""}
                    style={{ cursor: isPast ? "not-allowed" : "pointer" }}
                  >
                    {slot}
                  </div>
                );
              })}
            </div>
            {form.preferred_date === today && (
              <p style={{ fontSize: "12px", color: T.muted, marginTop: "8px", fontStyle: "italic" }}>
                Greyed out times have already passed for today.
              </p>
            )}
            <ErrMsg field="preferred_time" />
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" rows={3}
              placeholder="Special requests, hair concerns, or anything we should know…"
              style={{ resize: "vertical" }}
              value={form.notes} onChange={set("notes")} />
          </div>

          {/* ── Stripe card section — rendered once Stripe.js loads so the
                 mount target exists; stays empty if backend has no Stripe keys ── */}
          {stripeLoaded && (
          <div className="form-group">
            <label className="form-label">Card Details</label>
            <div style={{
              background: T.white, border: `1px solid ${cardError ? T.accent : T.border}`,
              padding: "13px 16px", transition: "border-color 0.2s",
            }}>
              <div id="stripe-card-element" />
            </div>
            {cardError && (
              <p style={{ color: T.accent, fontSize: "12px", marginTop: "6px" }}>{cardError}</p>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              marginTop: "10px",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p style={{ fontSize: "12px", color: T.muted, fontWeight: 300, lineHeight: 1.5 }}>
                Your card will <strong>not</strong> be charged today. It is saved only in case of
                a no-show or cancellation within 24 hours of your appointment.
              </p>
            </div>
            {!setupIntent && form.email && form.email.includes("@") && (
              <p style={{ fontSize: "12px", color: T.muted, marginTop: "6px", fontStyle: "italic" }}>
                Loading secure card form…
              </p>
            )}
          </div>
          )}

          {/* ── Consent / fine print ── */}
          <div style={{ marginTop: "20px", marginBottom: "16px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => { setAgreed(e.target.checked); setErrors(err => ({ ...err, agreed: "" })); }}
                style={{ marginTop: "3px", flexShrink: 0, accentColor: T.accent }}
              />
              <span style={{ fontSize: "12px", color: T.warm, lineHeight: 1.6 }}>
                I have read and agree to the{" "}
                <span onClick={(e) => { e.preventDefault(); navigate("Terms"); }}
                  style={{ color: T.accent, textDecoration: "underline", cursor: "pointer" }}>
                  Terms &amp; Cancellation Policy
                </span>{" "}and{" "}
                <span onClick={(e) => { e.preventDefault(); navigate("Privacy"); }}
                  style={{ color: T.accent, textDecoration: "underline", cursor: "pointer" }}>
                  Privacy Policy
                </span>. I understand that if I save a card, I authorize it to be charged
                a cancellation or no-show fee as described in those terms.
              </span>
            </label>
            {errors.agreed && (
              <p style={{ fontSize: "12px", color: T.accent, marginTop: "6px", marginLeft: "24px" }}>
                {errors.agreed}
              </p>
            )}
          </div>

          <button
            className="btn-primary"
            style={{ width: "100%", padding: "17px", fontSize: "11px", letterSpacing: "2.5px", opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting…" : "Confirm Booking"}
          </button>
        </div>

        {/* Sidebar summary */}
        <div className="booking-sidebar">
          <div className="sidebar-title">Your Summary</div>
          <div className="sidebar-row"><span className="sidebar-label">Service</span><span className="sidebar-value">{form.service || "—"}</span></div>
          <div className="sidebar-row"><span className="sidebar-label">Duration</span><span className="sidebar-value">{selectedDuration}</span></div>
          <div className="sidebar-row"><span className="sidebar-label">Stylist</span><span className="sidebar-value">{form.stylist}</span></div>
          <div className="sidebar-row"><span className="sidebar-label">Date</span><span className="sidebar-value">{form.preferred_date || "—"}</span></div>
          <div className="sidebar-row"><span className="sidebar-label">Time</span><span className="sidebar-value">{form.preferred_time || "—"}</span></div>
          <div className="sidebar-total">
            <span className="sidebar-total-label">Total</span>
            <div className="sidebar-total-price">{selectedPrice}</div>
          </div>
          <p style={{ fontSize: "12px", color: T.muted, marginTop: "24px", lineHeight: "1.7", fontWeight: "300" }}>
            Starting rates shown. Final price confirmed at appointment.
          </p>
        </div>
      </div>
    </div>
  );
}

function StylistsPage({ navigate }) {
  const s = STYLISTS[0];
  return (
    <div className="page">
      <div className="page-hero">
        <div className="page-hero-inner">
          <h1 className="page-hero-title">Meet<br /><em>the Stylist</em></h1>
          <p className="page-hero-sub">Our specialist is dedicated to one standard — excellence on every client, every time.</p>
        </div>
      </div>

      <div className="stylists-section">
        <div className="eyebrow">Your stylist</div>

        <div className="stylist-card-wrap">
          {/* Left — avatar panel */}
          <div className="stylist-avatar">
            <div className="stylist-avatar-bg">✦</div>
            <div className="stylist-avatar-emoji">{s.emoji}</div>
          </div>

          {/* Right — info panel */}
          <div className="stylist-info">
            <div className="stylist-role">{s.title}</div>
            <div className="stylist-name">{s.name}</div>
            <div className="stylist-divider" />
            <p className="stylist-bio">{s.bio}</p>
            <div className="stylist-tags">
              {s.tags.map(t => <span className="tag" key={t}>{t}</span>)}
            </div>
            <button
              className="btn-primary"
              style={{ alignSelf: "flex-start" }}
              onClick={() => navigate("Booking")}
            >
              Book with {s.name.split(" ")[0]} →
            </button>
          </div>
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  );
}

function GalleryPage({ navigate }) {
  const categories = ["All","Cuts","Color","Style","Treatments"];
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? GALLERY_ITEMS : GALLERY_ITEMS.filter(i => i.category === active);
  return (
    <div className="page">
      <div className="page-hero">
        <div className="page-hero-inner">
          <h1 className="page-hero-title">Our<br /><em>Gallery</em></h1>
          <p className="page-hero-sub">Work from our chairs — real clients, real results. See something you love? Book that look directly.</p>
        </div>
      </div>
      <div className="gallery-nav">
        {categories.map(c => (
          <button key={c} className={`gallery-btn ${active === c ? "active" : ""}`} onClick={() => setActive(c)}>{c}</button>
        ))}
      </div>
      <div className="gallery-grid">
        {filtered.map((item, i) => (
          <div className="gallery-item" key={i}>
            {item.emoji}
            <div className="gallery-overlay">
              <div className="gallery-overlay-label">{item.label}</div>
              <button className="btn-outline" style={{color:T.cream,borderColor:"rgba(253,250,247,0.3)",padding:"10px 28px"}} onClick={() => navigate("Booking")}>
                Book This Look
              </button>
            </div>
          </div>
        ))}
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

function AboutPage({ navigate }) {
  return (
    <div className="page">
      <div className="about-page-hero">
        <div className="about-page-left">
          <div className="eyebrow">Our story</div>
          <h1 className="display-title" style={{marginBottom:"24px"}}>More than<br /><em>just hair.</em></h1>
          <div className="about-body" style={{marginBottom:"36px"}}>
            <p>Kut, Kolor N B3yond was born from one belief: every person deserves to walk out of a salon feeling like the best version of themselves — regardless of age, texture, or budget.</p>
            <p>We built this salon for the community. For the grandmother celebrating her birthday, the teenager finding her style, the professional who needs to look sharp, and the artist ready to go bold.</p>
            <p>Our team brings decades of combined experience and genuine passion to every single appointment.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate("Stylists")}>Meet the Team →</button>
        </div>
        <div className="about-page-right">
          <div className="about-page-right-watermark">KKB</div>
          <div className="about-page-right-inner">
            "We don't just do hair — we help people feel like themselves again."
          </div>
        </div>
      </div>
      <div className="values-area">
        <div className="eyebrow">What we stand for</div>
        <h2 className="display-title">Our <em>Values</em></h2>
        <div className="values-grid">
          {[
            { n:"01", title:"Craft First",      desc:"Every cut, every color is a deliberate act of craft. No shortcuts, no compromises, no bad days in our chairs." },
            { n:"02", title:"Everyone Welcome", desc:"Young, old, all textures, all budgets. This is a salon built for real people living real and beautiful lives." },
            { n:"03", title:"Beyond the Chair", desc:"We build long-term relationships, not just appointments. Your hair journey is something we're genuinely part of." },
          ].map(v => (
            <div className="value-card" key={v.n}>
              <div className="value-num">{v.n}</div>
              <div className="value-title">{v.title}</div>
              <p className="value-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  );
}

function ContactPage() {
  const [form,      setForm]      = useState({ name: "", email: "", message: "" });
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError,  setApiError]  = useState("");

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: "" }));
    setApiError("");
  };

  function validate() {
    const e = {};
    if (!form.name.trim())    e.name    = "Name is required";
    if (!form.email.trim())   e.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.message.trim()) e.message = "Message is required";
    else if (form.message.trim().length < 10)  e.message = "Message must be at least 10 characters";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    setApiError("");
    try {
      const result = await fetch(`${API}/contact/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await result.json();
      if (!result.ok) {
        const msg = Array.isArray(data.detail)
          ? data.detail.map(d => d.msg).join(", ")
          : data.detail || "Failed to send message. Please try again.";
        setApiError(msg);
      } else {
        setSubmitted(true);
      }
    } catch {
      setApiError("We're having trouble sending your message. Please call us directly at (555) 123-4567 or try again later.");
    } finally {
      setLoading(false);
    }
  }

  const ErrMsg = ({ field }) => errors[field]
    ? <p style={{ color: T.accent, fontSize: "12px", marginTop: "6px" }}>{errors[field]}</p>
    : null;

  return (
    <div className="page">
      <div className="page-hero">
        <div className="page-hero-inner">
          <h1 className="page-hero-title">Get in<br /><em>Touch</em></h1>
          <p className="page-hero-sub">Questions before you book? Thinking through a big color change? We're here and happy to help.</p>
        </div>
      </div>
      <div className="contact-layout">
        <div className="contact-left">
          {[
            { label: "Address", value: "123 Style Avenue\nYour City, ST 00000" },
            { label: "Phone",   value: "(555) 123-4567"                        },
            { label: "Email",   value: "hello@kutkolor.com"                    },
            { label: "Hours",   value: "Mon – Fri: 9am – 7pm\nSaturday: 9am – 6pm\nSunday: 10am – 4pm" },
          ].map(b => (
            <div className="contact-block" key={b.label}>
              <div className="contact-block-label">{b.label}</div>
              <div className="contact-block-value" style={{ whiteSpace: "pre-line" }}>{b.value}</div>
            </div>
          ))}

          <div style={{ marginTop: "40px", paddingTop: "40px", borderTop: `1px solid ${T.border}` }}>
            <div className="contact-form-title">Send a Message</div>

            {/* Success state */}
            {submitted ? (
              <div style={{
                background: T.blush, border: `1px solid ${T.border}`,
                padding: "28px 24px", textAlign: "center",
              }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontStyle: "italic", color: T.dark, marginBottom: "8px" }}>
                  Message received!
                </p>
                <p style={{ fontSize: "13px", color: T.warm, fontWeight: 300 }}>
                  Thanks, {form.name}. We'll be in touch at {form.email} shortly.
                </p>
                <button
                  className="btn-outline"
                  style={{ marginTop: "20px" }}
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", message: "" }); }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                {apiError && (
                  <div style={{
                    background: "#fff0f0", border: `1px solid ${T.accent}`,
                    padding: "12px 16px", marginBottom: "20px",
                    fontSize: "13px", color: T.accentD,
                  }}>
                    {apiError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" type="text" placeholder="Your name"
                    value={form.name} onChange={set("name")}
                    style={errors.name ? { borderColor: T.accent } : {}} />
                  <ErrMsg field="name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" placeholder="you@email.com"
                    value={form.email} onChange={set("email")}
                    style={errors.email ? { borderColor: T.accent } : {}} />
                  <ErrMsg field="email" />
                </div>
                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea className="form-input" rows={4} placeholder="How can we help?"
                    style={{ resize: "vertical", ...(errors.message ? { borderColor: T.accent } : {}) }}
                    value={form.message} onChange={set("message")} />
                  <ErrMsg field="message" />
                </div>
                <button
                  className="btn-primary"
                  style={{ opacity: loading ? 0.7 : 1 }}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Sending…" : "Send Message"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="contact-right">
          <span style={{ fontSize: "48px" }}>📍</span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontStyle: "italic", color: T.warm }}>
            Find us here
          </span>
          <span style={{ fontSize: "14px", color: T.muted, fontWeight: "300" }}>123 Style Avenue, Your City</span>
          <p style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: T.border2, marginTop: "8px" }}>
            Map integration coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────
// ── ADMIN PANEL ───────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * adminFetch — wraps fetch() and always sends the session cookie.
 * Use for every admin API call so the JWT cookie is included.
 */
function adminFetch(path, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
  });
}

/**
 * Turn a FastAPI error `detail` into a readable string.
 * Validation errors (422) arrive as an array of objects — rendering that
 * directly in React crashes the page, so always normalise to a string.
 */
function errorMessage(detail, fallback = "Something went wrong. Please try again.") {
  if (Array.isArray(detail)) {
    return detail.map(d => (d && d.msg) ? d.msg : "Invalid value").join(", ") || fallback;
  }
  if (typeof detail === "string" && detail.trim()) return detail;
  return fallback;
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => {
    // Safety net — never hand React an object/array to render as a child.
    const text = typeof msg === "string" ? msg : errorMessage(msg);
    setToast({ msg: text, type });
    setTimeout(() => setToast(null), 3000);
  };
  return [toast, show];
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`admin-toast ${toast.type === "error" ? "error" : ""}`}>
      {toast.msg}
    </div>
  );
}

// ── Dashboard tab ─────────────────────────────────────────
function AdminDashboard({ bookings, messages }) {
  const pending    = bookings.filter(b => b.status === "pending").length;
  const confirmed  = bookings.filter(b => b.status === "confirmed").length;
  const unread     = messages.filter(m => m.status === "unread").length;
  const today      = new Date().toISOString().split("T")[0];
  const todayCount = bookings.filter(b => b.preferred_date === today).length;

  // Sort by date asc, then time asc — today first
  const sorted = [...bookings].sort((a, b) => {
    if (a.preferred_date !== b.preferred_date)
      return a.preferred_date.localeCompare(b.preferred_date);
    return a.preferred_time.localeCompare(b.preferred_time);
  });

  // Format date label — "Today", "Tomorrow", or "Mon Jun 12"
  function dateLabel(dateStr) {
    const today     = new Date(); today.setHours(0,0,0,0);
    const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const d         = new Date(dateStr + "T00:00:00");
    if (d.getTime() === today.getTime())    return "Today";
    if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
    return d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
  }

  // Group bookings by date
  const grouped = sorted.reduce((acc, b) => {
    const key = b.preferred_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <>
      <div className="admin-stats">
        {[
          { label:"Pending Bookings",  num:pending,          cls:"warn"   },
          { label:"Appointments Today",num:todayCount,       cls:"green"  },
          { label:"Total Bookings",    num:bookings.length,  cls:""       },
          { label:"Unread Messages",   num:unread,           cls:"accent" },
        ].map(s => (
          <div className="admin-stat-card" key={s.label}>
            <div className="admin-stat-label">{s.label}</div>
            <div className={`admin-stat-num ${s.cls}`}>{s.num}</div>
          </div>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">Upcoming Appointments</div>
        </div>

        {sorted.length === 0 ? (
          <div className="admin-empty">No bookings yet</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ref</th><th>Client</th><th>Service</th>
                <th>Time</th><th>Stylist</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([date, items]) => (
                <>
                  {/* Date group header row */}
                  <tr key={`group-${date}`}>
                    <td colSpan={6} style={{
                      background:"#F9EEF0",
                      padding:"8px 16px",
                      fontSize:"10px",
                      letterSpacing:"2.5px",
                      textTransform:"uppercase",
                      color:"#C4748A",
                      fontWeight:"500",
                      borderBottom:"1px solid #E8D8DC",
                      borderTop:"1px solid #E8D8DC",
                    }}>
                      {dateLabel(date)}
                      <span style={{color:"#A08890",marginLeft:"12px",fontWeight:400}}>
                        {items.length} appointment{items.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                  </tr>
                  {items.map(b => (
                    <tr key={b.id}>
                      <td style={{color:"#C4748A",fontSize:"11px"}}>
                        KKB-{String(b.id).padStart(4,"0")}
                      </td>
                      <td style={{fontWeight:500,color:"#3A2830"}}>{b.full_name}</td>
                      <td style={{color:"#7A5C64"}}>{b.service}</td>
                      <td style={{color:"#3A2830",fontWeight:500}}>{b.preferred_time}</td>
                      <td style={{color:"#A08890",fontSize:"12px"}}>{b.stylist}</td>
                      <td>
                        <span className={`status-badge status-${b.status}`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ── Edit booking modal ────────────────────────────────────
function EditBookingModal({ booking, onClose, onSave }) {
  const [form, setForm] = useState({
    full_name:      booking.full_name,
    email:          booking.email,
    phone:          booking.phone,
    service:        booking.service,
    stylist:        booking.stylist || "Any available",
    preferred_date: booking.preferred_date,
    preferred_time: booking.preferred_time,
    notes:          booking.notes || "",
  });

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-title">
          Edit Booking — KKB-{String(booking.id).padStart(4, "0")}
        </div>
        {[
          { label: "Full Name",  field: "full_name",      type: "text"   },
          { label: "Email",      field: "email",          type: "email"  },
          { label: "Phone",      field: "phone",          type: "tel"    },
          { label: "Date",       field: "preferred_date", type: "date"   },
          { label: "Time",       field: "preferred_time", type: "text"   },
          { label: "Notes",      field: "notes",          type: "text"   },
        ].map(f => (
          <div className="admin-form-group" key={f.field}>
            <label className="admin-form-label">{f.label}</label>
            <input className="admin-form-input" type={f.type}
              value={form[f.field]} onChange={set(f.field)} />
          </div>
        ))}
        <div className="admin-form-group">
          <label className="admin-form-label">Service</label>
          <select className="admin-form-input" value={form.service} onChange={set("service")}>
            {SERVICES.flatMap(c => c.items.map(i => (
              <option key={i.name} value={i.name}>{i.name}</option>
            )))}
          </select>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">Stylist</label>
          <select className="admin-form-input" value={form.stylist} onChange={set("stylist")}>
            <option value="Any available">Any available</option>
            {STYLISTS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div className="admin-modal-actions">
          <button className="admin-btn accent" onClick={() => onSave(form)}>Save Changes</button>
          <button className="admin-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Bookings tab ──────────────────────────────────────────
function AdminBookings({ bookings, onRefresh, showToast }) {
  const [filter,        setFilter]        = useState("all");
  const [editBooking,   setEditBooking]   = useState(null);
  const [search,        setSearch]        = useState("");
  const [cancelBooking, setCancelBooking] = useState(null); // booking being cancelled
  const [feeAmount,     setFeeAmount]     = useState("");
  const [waiveFee,      setWaiveFee]      = useState(false);
  const [chargeReason,  setChargeReason]  = useState("cancellation");
  const [chargeLoading, setChargeLoading] = useState(false);

  // Apply status filter first, then search across name, phone, email, ref
  const filtered = bookings
    .filter(b => filter === "all" || b.status === filter)
    .filter(b => {
      if (!search.trim()) return true;
      const q       = search.trim().toLowerCase();
      const qDigits = q.replace(/\D/g, "");
      const ref     = `kkb-${String(b.id).padStart(4, "0")}`;

      // Phone match — only run if query contains at least 3 digits
      const phoneMatch = qDigits.length >= 3 &&
        b.phone?.replace(/\D/g, "").includes(qDigits);

      // Ref match — only run if query looks like a ref number
      const refMatch = ref.includes(q) ||
        (qDigits.length >= 1 && ref.replace(/\D/g, "").includes(qDigits));

      return (
        b.full_name?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q)     ||
        b.service?.toLowerCase().includes(q)   ||
        phoneMatch ||
        refMatch
      );
    });

  async function updateStatus(id, status) {
    try {
      await adminFetch(`/bookings/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
      });
      showToast(`Booking updated to ${status}`);
      onRefresh();
    } catch {
      showToast("Failed to update booking", "error");
    }
  }

  // ── CSV Export ────────────────────────────────────────────
  function exportToCSV() {
    const headers = [
      "Ref", "Full Name", "Email", "Phone", "Service", "Stylist",
      "Date", "Time", "Status", "Card Brand", "Card Last4",
      "Payment Status", "Fee Amount", "Fee Reason", "Fee Charged At",
      "Notes", "Created At",
    ];

    const rows = filtered.map(b => [
      `KKB-${String(b.id).padStart(4, "0")}`,
      b.full_name,
      b.email,
      b.phone,
      b.service,
      b.stylist || "Any available",
      b.preferred_date,
      b.preferred_time,
      b.status,
      b.card_brand || "",
      b.card_last4 ? `****${b.card_last4}` : "",
      b.payment_status || "none",
      b.fee_amount ? `$${parseFloat(b.fee_amount).toFixed(2)}` : "",
      b.charge_reason || "",
      b.fee_charged_at ? new Date(b.fee_charged_at).toLocaleString() : "",
      (b.notes || "").replace(/[\n\r,]/g, " "),
      new Date(b.created_at).toLocaleString(),
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    const filterLabel = filter === "all" ? "all" : filter;
    link.href     = url;
    link.download = `kkb-bookings-${filterLabel}-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filtered.length} booking${filtered.length !== 1 ? "s" : ""} to CSV`);
  }


  function openCancelModal(booking) {
    // Auto-detect if within 24 hours
    try {
      const apptStr = `${booking.preferred_date} ${booking.preferred_time}`;
      const apptDt  = new Date(apptStr);
      const diffHrs = (apptDt - new Date()) / 3600000;
      setChargeReason(diffHrs >= 0 && diffHrs <= 24 ? "late_cancellation" : "cancellation");
    } catch {
      setChargeReason("cancellation");
    }
    setFeeAmount("");
    // Default to waiving — opening this modal should never pre-arm a charge.
    // The admin opts into charging by selecting "Charge cancellation fee".
    setWaiveFee(true);
    setCancelBooking(booking);
  }

  async function handleCancelConfirm() {
    if (!cancelBooking) return;
    setChargeLoading(true);

    try {
      const res  = await adminFetch(`/payments/charge-fee/${cancelBooking.id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          amount: waiveFee ? 0 : parseFloat(feeAmount) || 0,
          reason: chargeReason,
          waive:  waiveFee || !feeAmount,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(errorMessage(data.detail, "Action failed"), "error");
        return;
      }

      showToast(waiveFee || !feeAmount
        ? "Booking cancelled — no fee charged"
        : `Booking cancelled — $${feeAmount} charged`
      );
      setCancelBooking(null);
      onRefresh();
    } catch {
      showToast("Could not reach the server", "error");
    } finally {
      setChargeLoading(false);
    }
  }

  async function deleteBooking(id) {
    if (!window.confirm("Delete this booking permanently?")) return;
    try {
      await adminFetch(`/bookings/${id}`, { method: "DELETE" });
      showToast("Booking deleted");
      onRefresh();
    } catch {
      showToast("Failed to delete booking", "error");
    }
  }

  async function saveEdit(id, form) {
    try {
      const res = await adminFetch(`/bookings/${id}/admin`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(errorMessage(data.detail, "Failed to save changes"), "error");
        return;
      }
      setEditBooking(null);
      showToast("Booking updated successfully");
      onRefresh();
    } catch {
      showToast("Could not reach the server", "error");
    }
  }

  return (
    <>
      {editBooking && (
        <EditBookingModal
          booking={editBooking}
          onClose={() => setEditBooking(null)}
          onSave={(form) => saveEdit(editBooking.id, form)}
        />
      )}

      {/* ── Cancel / Charge Fee Modal ── */}
      {cancelBooking && (
        <div className="admin-modal-overlay" onClick={() => setCancelBooking(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-title">
              Cancel Booking — KKB-{String(cancelBooking.id).padStart(4, "0")}
            </div>

            {/* Booking summary */}
            <div style={{ marginBottom:"20px", padding:"12px 16px", background:"#F9EEF0", border:"1px solid #E8D8DC" }}>
              <div style={{ fontSize:"13px", color:"#3A2830", fontWeight:500, marginBottom:"4px" }}>
                {cancelBooking.full_name}
              </div>
              <div style={{ fontSize:"12px", color:"#A08890" }}>
                {cancelBooking.service} · {cancelBooking.preferred_date} at {cancelBooking.preferred_time}
              </div>
              {cancelBooking.card_last4 && (
                <div style={{ fontSize:"12px", color:"#C4748A", marginTop:"6px" }}>
                  {cancelBooking.card_brand} ****{cancelBooking.card_last4} on file
                </div>
              )}
              {!cancelBooking.card_last4 && (
                <div style={{ fontSize:"12px", color:"#A08890", marginTop:"6px", fontStyle:"italic" }}>
                  No card on file
                </div>
              )}
              {chargeReason === "late_cancellation" && (
                <div style={{ fontSize:"11px", color:"#C4748A", marginTop:"6px", fontWeight:500, letterSpacing:"1px", textTransform:"uppercase" }}>
                  ⚠ Within 24 hours of appointment
                </div>
              )}
            </div>

            {/* Waive or charge choice */}
            <div className="admin-form-group">
              <label className="admin-form-label">Cancellation type</label>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <label style={{ display:"flex", alignItems:"flex-start", gap:"10px", cursor:"pointer" }}>
                  <input type="radio" name="waive" checked={waiveFee}
                    onChange={() => setWaiveFee(true)}
                    style={{ marginTop:"2px" }} />
                  <div>
                    <div style={{ fontSize:"13px", color:"#1C1C1C", fontWeight:500 }}>Waive fee — cancel at no charge</div>
                    <div style={{ fontSize:"12px", color:"#A08890" }}>Emergency, goodwill, or admin error</div>
                  </div>
                </label>
                <label style={{ display:"flex", alignItems:"flex-start", gap:"10px", cursor: cancelBooking.card_last4 ? "pointer" : "not-allowed", opacity: cancelBooking.card_last4 ? 1 : 0.4 }}>
                  <input type="radio" name="waive" checked={!waiveFee}
                    disabled={!cancelBooking.card_last4}
                    onChange={() => setWaiveFee(false)}
                    style={{ marginTop:"2px" }} />
                  <div>
                    <div style={{ fontSize:"13px", color:"#1C1C1C", fontWeight:500 }}>Charge cancellation fee</div>
                    <div style={{ fontSize:"12px", color:"#A08890" }}>
                      {cancelBooking.card_last4
                        ? `Charged to ${cancelBooking.card_brand} ****${cancelBooking.card_last4}`
                        : "No card on file — cannot charge"}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Fee amount — only shown if charging */}
            {!waiveFee && cancelBooking.card_last4 && (
              <>
                <div className="admin-form-group">
                  <label className="admin-form-label">Fee amount ($)</label>
                  <input
                    className="admin-form-input"
                    type="number" min="0" step="0.01"
                    placeholder="e.g. 25.00"
                    value={feeAmount}
                    onChange={e => setFeeAmount(e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Reason</label>
                  <select className="admin-form-input" value={chargeReason}
                    onChange={e => setChargeReason(e.target.value)}>
                    <option value="cancellation">Cancellation</option>
                    <option value="late_cancellation">Late cancellation (within 24 hrs)</option>
                    <option value="no_show">No show</option>
                  </select>
                </div>
              </>
            )}

            <div className="admin-modal-actions">
              <button
                className="admin-btn accent"
                onClick={handleCancelConfirm}
                disabled={chargeLoading || (!waiveFee && cancelBooking.card_last4 && !feeAmount)}
                style={{ opacity: chargeLoading ? 0.7 : 1 }}
              >
                {chargeLoading ? "Processing…" : (waiveFee || !cancelBooking.card_last4)
                  ? "Cancel Booking — No Fee"
                  : `Charge $${feeAmount || "0.00"} & Cancel Booking`}
              </button>
              <button className="admin-btn" onClick={() => setCancelBooking(null)}>Back</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search bar ── */}
      <div style={{
        display:"flex", gap:"10px", marginBottom:"12px",
        alignItems:"center", flexWrap:"wrap",
      }}>
        <div style={{ position:"relative", flex:"1 1 280px", maxWidth:"420px" }}>
          <input
            type="text"
            placeholder="Search by name, phone, email, service or ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width:"100%",
              background:"#fff",
              border:"1px solid #E8D8DC",
              color:"#1C1C1C",
              padding:"10px 40px 10px 14px",
              fontFamily:"'Jost', sans-serif",
              fontSize:"13px",
              outline:"none",
              transition:"border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "#C4748A"}
            onBlur={e  => e.target.style.borderColor = "#E8D8DC"}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position:"absolute", right:"10px", top:"50%",
                transform:"translateY(-50%)",
                background:"none", border:"none",
                color:"#A08890", cursor:"pointer",
                fontSize:"16px", lineHeight:1, padding:"0 4px",
              }}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        {search && (
          <span style={{
            fontSize:"12px", color:"#C4748A",
            fontFamily:"'Jost', sans-serif",
          }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
          </span>
        )}
      </div>

      {/* ── Status filters ── */}
      <div className="admin-filters">
        {["all","pending","confirmed","cancelled","completed"].map(f => (
          <button
            key={f}
            className={`admin-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === "pending" && bookings.filter(b => b.status === "pending").length > 0 &&
              <span style={{ marginLeft: "6px", color: "#e8a838" }}>
                ({bookings.filter(b => b.status === "pending").length})
              </span>
            }
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">
            {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
            {filter !== "all" && ` — ${filter}`}
          </div>
          {filtered.length > 0 && (
            <button
              className="admin-btn accent"
              onClick={exportToCSV}
              style={{ display:"flex", alignItems:"center", gap:"6px" }}
            >
              ↓ Export CSV
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty">No bookings match this filter</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ref</th><th>Client</th><th>Service</th>
                <th>When</th><th>Card</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ color:"#C4748A", fontSize:"11px", whiteSpace:"nowrap" }}>
                    KKB-{String(b.id).padStart(4, "0")}
                  </td>
                  {/* Client — name, email, phone stacked */}
                  <td>
                    <div style={{ fontWeight:500, color:"#3A2830" }}>
                      {search && b.full_name?.toLowerCase().includes(search.toLowerCase())
                        ? <span dangerouslySetInnerHTML={{__html: b.full_name.replace(
                            new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "gi"),
                            "<mark style='background:rgba(196,116,138,0.2);color:#3A2830;padding:0 2px'>$1</mark>"
                          )}} />
                        : b.full_name
                      }
                    </div>
                    <div style={{ color:"#7A5C64", fontSize:"12px", marginTop:"3px" }}>{b.email}</div>
                    <div style={{ color:"#A08890", fontSize:"12px" }}>
                      {search && search.replace(/\D/g,"").length >= 3 && b.phone?.replace(/\D/g,"").includes(search.replace(/\D/g,""))
                        ? <span style={{color:"#C4748A", fontWeight:500}}>{b.phone}</span>
                        : b.phone
                      }
                    </div>
                  </td>
                  {/* Service + stylist stacked */}
                  <td style={{ color:"#3A2830", fontSize:"13px" }}>
                    {b.service}
                    <div style={{ color:"#A08890", fontSize:"12px", marginTop:"3px" }}>{b.stylist}</div>
                  </td>
                  {/* When — date + time stacked */}
                  <td style={{ whiteSpace:"nowrap" }}>
                    {b.preferred_date}
                    <div style={{ color:"#A08890", fontSize:"12px", marginTop:"3px" }}>{b.preferred_time}</div>
                  </td>
                  <td style={{ fontSize:"12px", whiteSpace:"nowrap" }}>
                    {b.card_last4
                      ? <span style={{ color:"#C4748A" }}>{b.card_brand} ****{b.card_last4}</span>
                      : <span style={{ color:"#A08890", fontStyle:"italic" }}>None</span>
                    }
                  </td>
                  <td><span className={`status-badge status-${b.status}`}>{b.status}</span></td>
                  <td>
                    <div className="admin-actions">
                      {b.status === "pending" && (
                        <button className="admin-btn confirm"
                          onClick={() => updateStatus(b.id, "confirmed")}>Confirm</button>
                      )}
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <button className="admin-btn cancel"
                          onClick={() => openCancelModal(b)}>Cancel</button>
                      )}
                      {b.status === "confirmed" && (
                        <button className="admin-btn complete"
                          onClick={() => updateStatus(b.id, "completed")}>Complete</button>
                      )}
                      <button className="admin-btn accent"
                        onClick={() => setEditBooking(b)}>Edit</button>
                      <button className="admin-btn delete"
                        onClick={() => deleteBooking(b.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ── Messages tab ──────────────────────────────────────────
function AdminMessages({ messages, onRefresh, showToast }) {
  const [filter,   setFilter]   = useState("all");
  const [expanded, setExpanded] = useState(null);

  const filtered = filter === "all"
    ? messages
    : messages.filter(m => m.status === filter);

  async function updateStatus(id, status) {
    try {
      await adminFetch(`/contact/${id}?new_status=${status}`, { method: "PATCH" });
      showToast(`Message marked as ${status}`);
      onRefresh();
    } catch {
      showToast("Failed to update message", "error");
    }
  }

  async function deleteMessage(id) {
    if (!window.confirm("Delete this message permanently?")) return;
    try {
      await adminFetch(`/contact/${id}`, { method: "DELETE" });
      showToast("Message deleted");
      onRefresh();
    } catch {
      showToast("Failed to delete message", "error");
    }
  }

  return (
    <>
      <div className="admin-filters">
        {["all", "unread", "read", "replied"].map(f => (
          <button
            key={f}
            className={`admin-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === "unread" && messages.filter(m => m.status === "unread").length > 0 &&
              <span style={{ marginLeft: "6px", color: "#C4748A" }}>
                ({messages.filter(m => m.status === "unread").length})
              </span>
            }
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div className="admin-table-title">
            {filtered.length} message{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty">No messages match this filter</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Email</th>
                <th>Message</th><th>Received</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <>
                  <tr key={m.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                  >
                    <td style={{ color: "#555", fontSize: "11px" }}>{m.id}</td>
                    <td style={{ fontWeight: 500, color: "#ddd" }}>{m.name}</td>
                    <td style={{ color: "#777", fontSize: "12px" }}>{m.email}</td>
                    <td style={{ color: "#666", fontSize: "12px", maxWidth: "200px" }}>
                      {m.message.length > 60 ? m.message.slice(0, 60) + "…" : m.message}
                    </td>
                    <td style={{ color: "#555", fontSize: "12px" }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td><span className={`status-badge status-${m.status}`}>{m.status}</span></td>
                    <td>
                      <div className="admin-actions" onClick={e => e.stopPropagation()}>
                        {m.status === "unread" && (
                          <button className="admin-btn accent"
                            onClick={() => updateStatus(m.id, "read")}>Mark Read</button>
                        )}
                        {m.status !== "replied" && (
                          <button className="admin-btn confirm"
                            onClick={() => updateStatus(m.id, "replied")}>Replied</button>
                        )}
                        <button className="admin-btn delete"
                          onClick={() => deleteMessage(m.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                  {expanded === m.id && (
                    <tr key={`${m.id}-expanded`}>
                      <td colSpan={7} style={{ padding: "0 16px 16px" }}>
                        <div className="admin-message-body">{m.message}</div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ── Logs tab ──────────────────────────────────────────────
function AdminLogs() {
  const [filter,   setFilter]   = useState("all");
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const FILTERS = [
    { id: "all",      label: "All",      endpoint: "/logs/recent?limit=100"          },
    { id: "booking",  label: "Bookings", endpoint: "/logs/bookings?limit=100"        },
    { id: "admin",    label: "Admin",    endpoint: "/logs/admin?limit=100"           },
    { id: "contact",  label: "Contact",  endpoint: "/logs/recent?limit=100&category=contact" },
    { id: "payment",  label: "Payments", endpoint: "/logs/recent?limit=100&category=payment" },
    { id: "request",  label: "Requests", endpoint: "/logs/recent?limit=200&category=request" },
    { id: "error",    label: "Errors",   endpoint: "/logs/errors?limit=100"          },
  ];

  async function fetchLogs(f = filter) {
    setLoading(true);
    try {
      const endpoint = FILTERS.find(x => x.id === f)?.endpoint || "/logs/recent?limit=100";
      const res  = await adminFetch(`${endpoint}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
      setLastFetch(new Date());
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh logs every 15 seconds
  useEffect(() => {
    fetchLogs(filter);
    const interval = setInterval(() => fetchLogs(filter), 15000);
    return () => clearInterval(interval);
  }, [filter]);

  function formatTime(ts) {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
    } catch { return ts; }
  }

  function getDetail(entry) {
    const skip = new Set(["timestamp","level","logger","message","category","action"]);
    const parts = Object.entries(entry)
      .filter(([k]) => !skip.has(k))
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
    return parts.join("  ·  ");
  }

  function getLevelClass(level) {
    if (!level) return "log-level-INFO";
    if (level === "WARNING") return "log-level-WARNING";
    if (level === "ERROR")   return "log-level-ERROR";
    return "log-level-INFO";
  }

  return (
    <>
      <div className="log-filters">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`admin-filter-btn ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <button className="admin-filter-btn" onClick={() => fetchLogs(filter)}>
          ↻ Refresh
        </button>
        {lastFetch && (
          <span style={{
            fontSize:"11px", color:"#A08890",
            alignSelf:"center", marginLeft:"8px",
          }}>
            Last updated {lastFetch.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"})}
          </span>
        )}
      </div>

      <div className="log-wrap">
        <div className="log-header">
          <div className="log-header-title">
            <span className="log-live-dot" />
            {entries.length} {filter === "all" ? "recent entries" : filter + " entries"} — newest first
          </div>
          <span style={{fontSize:"11px", color:"#A08890"}}>Auto-refreshes every 15s</span>
        </div>

        {loading ? (
          <div className="admin-empty">Loading logs…</div>
        ) : entries.length === 0 ? (
          <div className="admin-empty">No log entries found</div>
        ) : (
          entries.map((entry, i) => (
            <div className="log-entry" key={i}>
              <div className="log-timestamp">{formatTime(entry.timestamp)}</div>
              <div className={`log-level ${getLevelClass(entry.level)}`}>
                {entry.level || "INFO"}
              </div>
              <div className="log-category">
                {entry.category || entry.logger?.split(".").pop() || "app"}
              </div>
              <div>
                <div className="log-message">{entry.message}</div>
                {getDetail(entry) && (
                  <div className="log-message-detail">{getDetail(entry)}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ── Admin Login ───────────────────────────────────────────
function AdminLogin({ onLoginSuccess }) {
  const [view,     setView]     = useState("login"); // login | forgot | resetSent | reset
  const [password, setPassword] = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [token,    setToken]    = useState(""); // from URL ?reset_token=xxx

  // Check URL for reset token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("reset_token");
    if (t) {
      setToken(t);
      setView("reset");
      // Clean token from URL without reload
      window.history.replaceState({}, "", "/admin");
    }
  }, []);

  // ── Login ──
  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await adminFetch("/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(errorMessage(data.detail, "Incorrect password")); return; }
      onLoginSuccess();
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally { setLoading(false); }
  }

  // ── Forgot password — send reset link ──
  async function handleForgot(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await adminFetch("/auth/forgot-password", { method: "POST" });
      setView("resetSent");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally { setLoading(false); }
  }

  // ── Reset password ──
  async function handleReset(e) {
    e.preventDefault();
    setError("");
    if (newPass.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPass !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res  = await adminFetch("/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, new_password: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(errorMessage(data.detail, "Reset failed. The link may have expired.")); return; }
      // Backend logs us in automatically — go straight to panel
      onLoginSuccess();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally { setLoading(false); }
  }

  // ── Shared card wrapper ──
  const Card = ({ children }) => (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#FDFAF7", fontFamily: "'Jost', sans-serif", padding: "24px",
    }}>
      <div style={{
        width: "100%", maxWidth: "380px",
        background: "#FAF8F5", border: "1px solid #E8D8DC",
        padding: "48px 40px", textAlign: "center",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "22px", fontWeight: 500, fontStyle: "italic",
          color: "#1C1C1C", marginBottom: "4px",
        }}>
          Kut, Kolor <span style={{color:"#C4748A", fontStyle:"normal"}}>N B3yond</span>
        </div>
        <div style={{
          fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase",
          color: "#A08890", marginBottom: "36px",
        }}>
          Admin Panel
        </div>
        {children}
      </div>
    </div>
  );

  const inputStyle = (hasError) => ({
    width: "100%", background: "#fff",
    border: `1px solid ${hasError ? "#C4748A" : "#E8D8DC"}`,
    color: "#1C1C1C", padding: "13px 16px",
    fontFamily: "'Jost', sans-serif", fontSize: "14px",
    outline: "none", marginBottom: "12px",
    textAlign: "center", letterSpacing: "2px",
  });

  const btnStyle = (disabled) => ({
    width: "100%", background: "#1C1C1C", color: "#FDFAF7",
    border: "none", padding: "14px", fontSize: "11px",
    fontWeight: 500, letterSpacing: "2.5px", textTransform: "uppercase",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1, transition: "opacity 0.2s",
    marginTop: "4px",
  });

  const linkStyle = {
    background: "none", border: "none",
    color: "#C4748A", fontSize: "12px",
    cursor: "pointer", textDecoration: "underline",
    fontFamily: "'Jost', sans-serif", padding: 0,
  };

  const ErrorMsg = () => error ? (
    <div style={{ fontSize:"12px", color:"#C4748A", marginBottom:"12px", lineHeight:"1.6" }}>
      {error}
    </div>
  ) : null;

  // ── Login view ──
  if (view === "login") return (
    <Card>
      <form onSubmit={handleLogin}>
        <input type="password" placeholder="Enter admin password"
          value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
          autoFocus style={inputStyle(!!error)} />
        <ErrorMsg />
        <button type="submit" disabled={loading || !password} style={btnStyle(loading || !password)}>
          {loading ? "Checking…" : "Log In"}
        </button>
        <div style={{ marginTop: "20px" }}>
          <button type="button" style={linkStyle} onClick={() => { setView("forgot"); setError(""); }}>
            Forgot password?
          </button>
        </div>
      </form>
    </Card>
  );

  // ── Forgot password view ──
  if (view === "forgot") return (
    <Card>
      <div style={{ fontSize:"14px", color:"#7A5C64", lineHeight:"1.75", marginBottom:"24px" }}>
        We'll send a reset link to the salon's recovery email address.
      </div>
      <form onSubmit={handleForgot}>
        <ErrorMsg />
        <button type="submit" disabled={loading} style={btnStyle(loading)}>
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
        <div style={{ marginTop: "16px" }}>
          <button type="button" style={linkStyle} onClick={() => { setView("login"); setError(""); }}>
            ← Back to login
          </button>
        </div>
      </form>
    </Card>
  );

  // ── Reset link sent view ──
  if (view === "resetSent") return (
    <Card>
      <div style={{ fontSize:"32px", marginBottom:"16px" }}>✉️</div>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "22px", fontStyle: "italic",
        color: "#3A2830", marginBottom: "12px",
      }}>
        Check your email
      </div>
      <div style={{ fontSize:"14px", color:"#7A5C64", lineHeight:"1.75", marginBottom:"24px" }}>
        A reset link has been sent to the salon's recovery email.
        The link expires in 15 minutes.
      </div>
      <button style={linkStyle} onClick={() => { setView("login"); setError(""); }}>
        ← Back to login
      </button>
    </Card>
  );

  // ── Reset password view (arrived via email link) ──
  if (view === "reset") return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"#FDFAF7", fontFamily:"'Jost', sans-serif", padding:"24px",
    }}>
      <div style={{
        width:"100%", maxWidth:"380px", background:"#FAF8F5",
        border:"1px solid #E8D8DC", padding:"48px 40px", textAlign:"center",
      }}>
        <div style={{
          fontFamily:"'Cormorant Garamond', serif", fontSize:"22px",
          fontWeight:500, fontStyle:"italic", color:"#1C1C1C", marginBottom:"4px",
        }}>
          Kut, Kolor <span style={{color:"#C4748A", fontStyle:"normal"}}>N B3yond</span>
        </div>
        <div style={{
          fontSize:"10px", letterSpacing:"3px", textTransform:"uppercase",
          color:"#A08890", marginBottom:"36px",
        }}>
          Admin Panel
        </div>
        <div style={{fontSize:"14px", color:"#7A5C64", lineHeight:"1.75", marginBottom:"24px"}}>
          Enter your new admin password. Minimum 8 characters.
        </div>
        <form onSubmit={handleReset}>
          <input
            type="password"
            placeholder="New password"
            value={newPass}
            onChange={e => { setNewPass(e.target.value); setError(""); }}
            style={{
              width:"100%", background:"#fff",
              border:`1px solid ${error ? "#C4748A" : "#E8D8DC"}`,
              color:"#1C1C1C", padding:"13px 16px",
              fontFamily:"'Jost', sans-serif", fontSize:"14px",
              outline:"none", marginBottom:"12px",
              textAlign:"center", letterSpacing:"2px",
            }}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(""); }}
            style={{
              width:"100%", background:"#fff",
              border:`1px solid ${error ? "#C4748A" : "#E8D8DC"}`,
              color:"#1C1C1C", padding:"13px 16px",
              fontFamily:"'Jost', sans-serif", fontSize:"14px",
              outline:"none", marginBottom:"12px",
              textAlign:"center", letterSpacing:"2px",
            }}
          />
          {error && (
            <div style={{fontSize:"12px", color:"#C4748A", marginBottom:"12px", lineHeight:"1.6"}}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !newPass || !confirm}
            style={{
              width:"100%", background:"#1C1C1C", color:"#FDFAF7",
              border:"none", padding:"14px", fontSize:"11px",
              fontWeight:500, letterSpacing:"2.5px", textTransform:"uppercase",
              cursor: loading || !newPass || !confirm ? "default" : "pointer",
              opacity: loading || !newPass || !confirm ? 0.5 : 1,
              transition:"opacity 0.2s", marginTop:"4px",
            }}
          >
            {loading ? "Updating…" : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );

  return null;
}

// ── Admin Gate — session check + inactivity timeout ───────
// Wraps AdminPage. Shows login screen until authenticated.
// Logs out automatically after 10 minutes of no user activity.
function AdminGate({ onExit }) {
  const [authState, setAuthState] = useState("checking"); // checking | loggedIn | loggedOut

  // ── Check session on mount ──
  async function checkSession() {
    try {
      const res = await adminFetch("/auth/check");
      setAuthState(res.ok ? "loggedIn" : "loggedOut");
    } catch {
      setAuthState("loggedOut");
    }
  }

  useEffect(() => { checkSession(); }, []);

  // ── Inactivity timer — calls /auth/check on activity, logs out after 10 min idle ──
  useEffect(() => {
    if (authState !== "loggedIn") return;

    let idleTimer;
    const IDLE_LIMIT = 10 * 60 * 1000; // 10 minutes

    function resetIdleTimer() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // Log the idle logout before clearing session
        adminFetch("/auth/logout?reason=idle", { method: "POST" }).catch(() => {});
        setAuthState("loggedOut");
      }, IDLE_LIMIT);
    }

    // Refresh the session token (sliding expiry) — throttled to once per minute
    let lastRefresh = Date.now();
    function onActivity() {
      resetIdleTimer();
      const now = Date.now();
      if (now - lastRefresh > 60000) {
        lastRefresh = now;
        adminFetch("/auth/check").catch(() => {});
      }
    }

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, onActivity));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(e => window.removeEventListener(e, onActivity));
    };
  }, [authState]);

  async function handleLogout() {
    try { await adminFetch("/auth/logout", { method: "POST" }); } catch {}
    setAuthState("loggedOut");
  }

  if (authState === "checking") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#FDFAF7", color: "#A08890",
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "20px", fontStyle: "italic",
      }}>
        Checking session…
      </div>
    );
  }

  if (authState === "loggedOut") {
    return <AdminLogin onLoginSuccess={() => setAuthState("loggedIn")} />;
  }

  return <AdminPage onExit={onExit} onLogout={handleLogout} />;
}

// ── Main AdminPage ────────────────────────────────────────
// ── Guided tour steps — each highlights a sidebar item ────
const TOUR_STEPS = [
  { tab: "dashboard", title: "Welcome to your dashboard", body: "This is where you see today's appointments and any bookings waiting for your attention. The pink number shows how many are pending." },
  { tab: "bookings",  title: "Manage bookings",           body: "Click Bookings in the sidebar to see all appointments. You can confirm, cancel, edit or search — and the badge shows how many need action." },
  { tab: "messages",  title: "Read messages",             body: "Customers who contact you through the website appear here. Unread messages show a count badge so nothing gets missed." },
  { tab: "logs",      title: "Check the activity log",    body: "Every action — bookings, logins, emails, fee charges — is recorded here in real time. Use it to see what happened and when." },
  { tab: null,        title: "You're all set",            body: "Open the Training tab anytime to revisit these steps. The guided tour can be replayed as many times as you need." },
];

// ── Help tab content — plain-language steps for the owner ─
const TRAINING_SECTIONS = [
  {
    icon: "✦", title: "Getting started",
    steps: [
      "Go to your website address followed by <strong>/admin</strong> — this is your private admin page",
      "Enter your <strong>admin password</strong> and click Log In",
      "You are <strong>logged out automatically</strong> after 10 minutes of no activity",
      "Use the <strong>sidebar</strong> on the left to move between Dashboard, Bookings, Messages, and Logs",
    ],
  },
  {
    icon: "◷", title: "Managing bookings",
    steps: [
      "Click <strong>Bookings</strong> in the sidebar — new bookings show as <strong>Pending</strong>",
      "Click <strong>Confirm</strong> to approve a booking — the customer gets an email automatically",
      "Click <strong>Cancel</strong> to cancel — you can choose to charge a fee or waive it",
      "Click <strong>Edit</strong> to change any booking detail — date, time, service, or client info",
    ],
  },
  {
    icon: "◇", title: "Cancellation fees",
    steps: [
      "Click <strong>Cancel</strong> on any booking — a window opens",
      "Choose <strong>Waive fee</strong> to cancel at no charge (goodwill, emergency)",
      "Choose <strong>Charge fee</strong>, enter an amount, and pick the reason (no-show, late cancel)",
      "The card saved at booking is charged — the client gets a fee receipt by email",
    ],
  },
  {
    icon: "◉", title: "Handling messages",
    steps: [
      "Click <strong>Messages</strong> — new ones show as <strong>Unread</strong> with a pink badge count",
      "Click any row to <strong>expand the full message</strong> — click again to collapse",
      "Click <strong>Mark Read</strong> after reading, <strong>Replied</strong> once you respond to the customer",
    ],
  },
  {
    icon: "△", title: "Troubleshooting",
    steps: [
      "If a <strong>pink Connection Lost banner</strong> appears — wait 30 seconds or click Retry Now",
      "If the panel won't load at all — make sure the website is online and try refreshing",
      "If you're <strong>locked out</strong> — use Forgot Password on the login screen",
    ],
  },
];

function AdminTraining({ onStartTour }) {
  const [openIndex, setOpenIndex] = useState(0); // first section open by default

  return (
    <>
      <div className="training-replay" onClick={onStartTour}>
        <span style={{ fontSize: "12px" }}>▶</span> Replay guided tour
      </div>

      <div className="training-sections">
        {TRAINING_SECTIONS.map((s, i) => {
          const open = openIndex === i;
          return (
            <div className="training-section" key={i}>
              <div
                className="training-section-header"
                onClick={() => setOpenIndex(open ? -1 : i)}
              >
                <div className="training-section-left">
                  <span className="training-section-icon">{s.icon}</span>
                  <span className="training-section-title">{s.title}</span>
                </div>
                <span className="training-chevron">{open ? "▾" : "▸"}</span>
              </div>
              {open && (
                <div className="training-section-body">
                  {s.steps.map((text, j) => (
                    <div className="training-step" key={j}>
                      <div className="training-step-num">{j + 1}</div>
                      <div
                        className="training-step-text"
                        dangerouslySetInnerHTML={{ __html: text }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="training-support">
        <span style={{ fontSize: "15px", color: "#C4748A" }}>☎</span>
        Still stuck? Call your developer for support.
      </div>
    </>
  );
}

function AdminPage({ onExit, onLogout }) {
  const [tab,      setTab]      = useState("dashboard");
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast, showToast]      = useToast();

  const [lastSync,     setLastSync]     = useState(null);
  const [connLost,     setConnLost]     = useState(false);
  const [failCount,    setFailCount]    = useState(0);

  // ── Guided tour ──────────────────────────────────────────
  const [tourStep, setTourStep] = useState(null); // null = inactive

  function startTour() {
    setTab("dashboard");
    setTourStep(0);
  }

  function endTour() {
    setTourStep(null);
    try { localStorage.setItem("kkb_tour_seen", "1"); } catch {}
  }

  function nextTour() {
    const next = (tourStep ?? 0) + 1;
    if (next >= TOUR_STEPS.length) { endTour(); return; }
    if (TOUR_STEPS[next].tab) setTab(TOUR_STEPS[next].tab);
    setTourStep(next);
  }

  // Show the tour automatically on first login, once.
  useEffect(() => {
    let seen = true;
    try { seen = localStorage.getItem("kkb_tour_seen") === "1"; } catch {}
    if (!seen) startTour();
  }, []);

  async function fetchAll() {
    try {
      const [bRes, mRes] = await Promise.all([
        adminFetch(`/bookings/`),
        adminFetch(`/contact/`),
      ]);

      // Session expired mid-use — bounce to login
      if (bRes.status === 401 || mRes.status === 401) {
        if (onLogout) onLogout();
        return;
      }

      const [b, m] = await Promise.all([bRes.json(), mRes.json()]);
      setBookings(Array.isArray(b) ? b : []);
      setMessages(Array.isArray(m) ? m : []);
      setLastSync(new Date());
      setConnLost(false);
      setFailCount(0);
    } catch {
      setFailCount(c => {
        const next = c + 1;
        if (next >= 2) setConnLost(true); // show banner after 2 failures
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch + auto-refresh every 30 seconds
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount  = messages.filter(m => m.status === "unread").length;
  const pendingCount = bookings.filter(b => b.status === "pending").length;

  const TABS = [
    { id: "dashboard", icon: "◈", label: "Dashboard"  },
    { id: "bookings",  icon: "◷", label: "Bookings",  badge: pendingCount },
    { id: "messages",  icon: "◉", label: "Messages",  badge: unreadCount  },
    { id: "logs",      icon: "◎", label: "Logs"                           },
    { id: "training",  icon: "?", label: "Training"                       },
  ];

  return (
    <>
      <div className="admin-layout">

      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-logo">
          Kut, Kolor <span>N B3yond</span>
          <div className="admin-logo-sub">Admin Panel</div>
        </div>
        <nav className="admin-nav">
          {TABS.map(t => (
            <div
              key={t.id}
              className={`admin-nav-item ${tab === t.id ? "active" : ""} ${
                tourStep !== null && TOUR_STEPS[tourStep].tab === t.id ? "tour-highlight" : ""
              }`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              {t.label}
              {t.badge > 0 && <span className="admin-nav-badge">{t.badge}</span>}
            </div>
          ))}
          <div className="admin-nav-item" onClick={fetchAll}>
            <span className="nav-icon">↻</span>
            <span>
              Refresh
              {lastSync && (
                <span style={{
                  display:"block", fontSize:"9px",
                  letterSpacing:"1px", color:"rgba(242,196,206,0.3)",
                  marginTop:"2px", textTransform:"none",
                }}>
                  {lastSync.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}
                </span>
              )}
            </span>
          </div>
        </nav>
        <div className="admin-back" onClick={onLogout} style={{borderBottom:"1px solid rgba(242,196,206,0.1)"}}>
          ⎋ Log Out
        </div>
        <div className="admin-back" onClick={onExit}>← Back to Site</div>
      </div>

      {/* ── Connection lost banner ── */}
      {connLost && (
        <div className="admin-conn-banner" style={{
          position:"fixed", top:0, right:0, zIndex:150,
          background:"#C4748A", padding:"12px 24px",
          display:"flex", alignItems:"center",
          justifyContent:"space-between", gap:"16px",
        }}>
          <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
            <span style={{fontSize:"16px"}}>⚠</span>
            <div>
              <span style={{
                fontSize:"11px", fontWeight:600,
                letterSpacing:"2px", textTransform:"uppercase",
                color:"#fff",
              }}>
                Connection Lost
              </span>
              <span style={{
                fontSize:"12px", color:"rgba(255,255,255,0.75)",
                marginLeft:"12px",
              }}>
                Attempting to reconnect every 30 seconds…
              </span>
            </div>
          </div>
          <button
            onClick={fetchAll}
            style={{
              background:"rgba(255,255,255,0.2)",
              border:"1px solid rgba(255,255,255,0.4)",
              color:"#fff", padding:"6px 16px",
              fontSize:"10px", letterSpacing:"2px",
              textTransform:"uppercase", cursor:"pointer",
              fontFamily:"'Jost', sans-serif", whiteSpace:"nowrap",
            }}
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Main content — push down if banner showing */}
      <div className="admin-main" style={connLost ? {paddingTop:"88px"} : {}}>
        <div className="admin-page-title">
          {tab === "dashboard" ? "Dashboard"        :
           tab === "bookings"  ? "Bookings"         :
           tab === "messages"  ? "Messages"         :
           tab === "training"  ? "Training & Help"  : "System Logs"}
        </div>
        <div className="admin-page-sub">
          {tab === "dashboard" ? "Overview of salon activity"          :
           tab === "bookings"  ? "Manage all appointment requests"     :
           tab === "messages"  ? "Manage contact messages"             :
           tab === "training"  ? "Everything you need to manage the salon" :
           "Real-time log entries — bookings, admin actions & errors"}
        </div>

        {loading ? (
          <div className="admin-empty">Loading…</div>
        ) : (
          <>
            {tab === "dashboard" && <AdminDashboard bookings={bookings} messages={messages} />}
            {tab === "bookings"  && <AdminBookings  bookings={bookings} onRefresh={fetchAll} showToast={showToast} />}
            {tab === "messages"  && <AdminMessages  messages={messages} onRefresh={fetchAll} showToast={showToast} />}
            {tab === "logs"      && <AdminLogs />}
            {tab === "training"  && <AdminTraining onStartTour={startTour} />}
          </>
        )}
      </div>

      {/* ── Guided tour overlay ── */}
      {tourStep !== null && (
        <div className="tour-overlay">
          <div className="tour-card">
            <div className="tour-card-title">{TOUR_STEPS[tourStep].title}</div>
            <div className="tour-card-body">{TOUR_STEPS[tourStep].body}</div>
            <div className="tour-card-footer">
              <span className="tour-step-info">
                Step {tourStep + 1} of {TOUR_STEPS.length}
              </span>
              <div className="tour-actions">
                <button className="tour-btn" onClick={endTour}>Skip</button>
                <button className="tour-btn primary" onClick={nextTour}>
                  {tourStep < TOUR_STEPS.length - 1 ? "Next →" : "Done ✓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
    </>
  );
}

export default function App() {
  const [page, setPage]         = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if the URL path is /admin on first load
  const [isAdmin, setIsAdmin]   = useState(
    window.location.pathname === "/admin"
  );

  const navigate = (p) => {
    setPage(p); setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (isAdmin) {
      document.title = "KKB Admin Panel";
    } else {
      document.title = `Kut, Kolor N B3yond — ${page}`;
    }
  }, [page, isAdmin]);

  // Admin panel — full screen, no nav, protected by login
  if (isAdmin) {
    return <AdminGate onExit={() => {
      setIsAdmin(false);
      window.history.pushState({}, "", "/");
      document.body.style.background = "";
      document.body.style.color = "";
    }} />;
  }

  const PAGES = {
    Home: HomePage, Services: ServicesPage, Packages: PackagesPage,
    Booking: BookingPage, Stylists: StylistsPage, Gallery: GalleryPage,
    About: AboutPage, Contact: ContactPage,
    Privacy: PrivacyPage, Terms: TermsPage,
  };

  const PageComponent = PAGES[page] || HomePage;

  return (
    <>
      <style>{styles}</style>
      <Nav current={page} navigate={navigate} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <PageComponent navigate={navigate} />
    </>
  );
}

import React, { useEffect, useRef, useState } from "react";
import "./kontak.css";

const Kontak: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [hv, setHv] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setHv(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (headerRef.current) obs.observe(headerRef.current);
    return () => obs.disconnect();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const contactItems = [
    {
      key: "email",
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M2 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      ),
      label: "Email",
      value: "polman@bandung.com",
      href: "mailto:polman@bandung.com",
      copyable: true,
    },
    {
      key: "address",
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 2C7.686 2 5 4.686 5 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6Z" stroke="currentColor" strokeWidth="1.6"/>
          <circle cx="11" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
        </svg>
      ),
      label: "Alamat",
      value: "Jl. Kanayakan No.21, Dago, Coblong, Kota Bandung, Jawa Barat 40135",
      href: "https://maps.google.com/?q=Polman+Bandung+Jl+Kanayakan+21",
      copyable: true,
    },
    {
      key: "instagram",
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="2" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6"/>
          <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.6"/>
          <circle cx="16.5" cy="5.5" r="1.2" fill="currentColor"/>
        </svg>
      ),
      label: "Instagram",
      value: "@polman_bandung",
      href: "https://instagram.com/polman_bandung",
      copyable: false,
    },
    {
      key: "youtube",
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="5" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M9 8.5l5 2.5-5 2.5V8.5Z" fill="currentColor" opacity="0.7"/>
        </svg>
      ),
      label: "YouTube",
      value: "@polman_bandung",
      href: "https://youtube.com/@polman_bandung",
      copyable: false,
    },
  ];

  return (
    <section className="kontak" id="kontak">
      {/* Background */}
      <div className="kontak__bg" aria-hidden="true">
        <div className="kb-noise" />
        <div className="kb-gradient" />
        <div className="kb-lines" />
      </div>

      <div className="kontak__inner">
        {/* Header */}
        <div className={`kontak__header ${hv ? "kontak__header--visible" : ""}`} ref={headerRef}>
          <div className="kontak__eyebrow">
            <span className="ke-num">09</span>
            <span className="ke-line" />
            <span className="ke-label">Kontak & Lokasi</span>
          </div>
          <h2 className="kontak__title">
            Mari Berkolaborasi<br />
            <em>Bersama Kami</em>
          </h2>
          <p className="kontak__subtitle">
            Tertarik bergabung, beriset, atau bermitra? Hubungi tim kami.
          </p>
        </div>

        {/* Main grid */}
        <div className="kontak__grid">

          {/* LEFT — Contact cards */}
          <div className="kontak__left">
            <div className="contact-cards">
              {contactItems.map((item, i) => (
                <div
                  key={item.key}
                  className="ccard"
                  style={{ "--cc-delay": `${i * 0.08}s`, "--cc-i": i } as React.CSSProperties}
                >
                  <div className="ccard__icon">{item.icon}</div>
                  <div className="ccard__body">
                    <span className="ccard__label">{item.label}</span>
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="ccard__value"
                    >
                      {item.value}
                    </a>
                  </div>
                  {item.copyable && (
                    <button
                      className={`ccard__copy ${copied === item.key ? "ccard__copy--done" : ""}`}
                      onClick={() => copyToClipboard(item.value, item.key)}
                      aria-label={`Salin ${item.label}`}
                    >
                      {copied === item.key ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <rect x="5" y="1" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M1 5v7a1.5 1.5 0 001.5 1.5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Form hint */}
            <div className="kontak__cta-box">
              <div className="ctab__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M8 9h8M8 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="ctab__title">Kirim Pesan Langsung</p>
                <p className="ctab__desc">Kami merespons dalam 1×24 jam kerja</p>
              </div>
              <a href={`mailto:polman@bandung.com?subject=Kolaborasi%20Drone%20Technology%20Center`} className="ctab__btn">
                Email Kami
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>

          {/* RIGHT — Map embed */}
          <div className="kontak__right">
            <div className="map-wrapper">
              <div className="map-header">
                <span className="map-label">Lokasi Kampus</span>
                <a
                  href="https://maps.google.com/?q=Politeknik+Manufaktur+Bandung+Jl+Kanayakan+21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-open"
                >
                  Buka di Maps
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 10L10 2M4 2h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>

              <div className="map-frame-wrap">
                <iframe
                  title="Lokasi POLMAN Bandung"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.8326012700247!2d107.6097!3d-6.8854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e6c6a77b56f9%3A0x9b8f10b02d9c9c8!2sPoliteknik+Manufaktur+Bandung!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="map-overlay-corners" aria-hidden="true">
                  <span className="moc moc--tl" />
                  <span className="moc moc--tr" />
                  <span className="moc moc--bl" />
                  <span className="moc moc--br" />
                </div>
              </div>

              <div className="map-address">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1C4.79 1 3 2.79 3 5c0 2.8 4 8 4 8s4-5.2 4-8c0-2.21-1.79-4-4-4Z" stroke="currentColor" strokeWidth="1.4"/>
                  <circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
                Jl. Kanayakan No.21, Dago, Coblong, Bandung 40135
              </div>
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <div className="kontak__footer">
          <span className="kf-copy">© 2024 Drone Technology Center · POLMAN Bandung</span>
          <div className="kf-socials">
            <a href="https://instagram.com/polman_bandung" target="_blank" rel="noopener noreferrer" className="kf-social" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="2" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6"/>
                <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.6"/>
                <circle cx="16.5" cy="5.5" r="1.2" fill="currentColor"/>
              </svg>
            </a>
            <a href="https://youtube.com/@polman_bandung" target="_blank" rel="noopener noreferrer" className="kf-social" aria-label="YouTube">
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="5" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M9 8.5l5 2.5-5 2.5V8.5Z" fill="currentColor" opacity="0.8"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Kontak;
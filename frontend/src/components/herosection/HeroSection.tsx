import React, { useEffect, useRef } from "react";
import "./herosection.css";

const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY, currentTarget } = e;
      const { width, height } = (currentTarget as HTMLElement).getBoundingClientRect();
      const x = (clientX / width - 0.5) * 20;
      const y = (clientY / height - 0.5) * 20;
      hero.style.setProperty("--tilt-x", `${-y}deg`);
      hero.style.setProperty("--tilt-y", `${x}deg`);
    };

    hero.addEventListener("mousemove", handleMouseMove);
    return () => hero.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      {/* Animated background grid */}
      <div className="hero__grid" aria-hidden="true" />

      {/* Drone SVG silhouettes floating */}
      <div className="hero__drones" aria-hidden="true">
        <div className="drone drone--1">
          <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="65" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="15" cy="30" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="65" cy="30" r="6" stroke="currentColor" strokeWidth="1.5" />
            <rect x="25" y="15" width="30" height="10" rx="4" stroke="currentColor" strokeWidth="1.5" />
            <line x1="21" y1="10" x2="25" y2="18" stroke="currentColor" strokeWidth="1.5" />
            <line x1="59" y1="10" x2="55" y2="18" stroke="currentColor" strokeWidth="1.5" />
            <line x1="21" y1="30" x2="25" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <line x1="59" y1="30" x2="55" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="40" cy="20" r="3" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
        <div className="drone drone--2">
          <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="65" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="15" cy="30" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="65" cy="30" r="6" stroke="currentColor" strokeWidth="1.5" />
            <rect x="25" y="15" width="30" height="10" rx="4" stroke="currentColor" strokeWidth="1.5" />
            <line x1="21" y1="10" x2="25" y2="18" stroke="currentColor" strokeWidth="1.5" />
            <line x1="59" y1="10" x2="55" y2="18" stroke="currentColor" strokeWidth="1.5" />
            <line x1="21" y1="30" x2="25" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <line x1="59" y1="30" x2="55" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="40" cy="20" r="3" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
        <div className="drone drone--3">
          <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="65" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="15" cy="30" r="6" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="65" cy="30" r="6" stroke="currentColor" strokeWidth="1.5" />
            <rect x="25" y="15" width="30" height="10" rx="4" stroke="currentColor" strokeWidth="1.5" />
            <line x1="21" y1="10" x2="25" y2="18" stroke="currentColor" strokeWidth="1.5" />
            <line x1="59" y1="10" x2="55" y2="18" stroke="currentColor" strokeWidth="1.5" />
            <line x1="21" y1="30" x2="25" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <line x1="59" y1="30" x2="55" y2="22" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="40" cy="20" r="3" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* Radar scan ring */}
      <div className="hero__radar" aria-hidden="true">
        <div className="radar__ring radar__ring--1" />
        <div className="radar__ring radar__ring--2" />
        <div className="radar__ring radar__ring--3" />
        <div className="radar__sweep" />
      </div>

      {/* Content */}
      <div className="hero__content">
        <div className="hero__badge">
          <span className="badge__dot" />
          UAV Research &amp; Innovation
        </div>

        <h1 className="hero__title">
          <span className="title__line title__line--1">Drone Technology</span>
          <span className="title__line title__line--2">Center</span>
          <span className="title__line title__line--3">POLMAN BANDUNG</span>
        </h1>

        <p className="hero__subtitle">
          Inovasi Teknologi UAV untuk Riset, Industri,
          <br />
          dan Pengembangan Mahasiswa
        </p>

        <div className="hero__cta">
          <a href="#koleksi" className="btn btn--primary">
            <span className="btn__text">Lihat Koleksi Drone</span>
            <span className="btn__icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </a>
          <a href="#kontak" className="btn btn--secondary">
            <span className="btn__text">Hubungi Kami</span>
          </a>
        </div>

        {/* Stats bar */}
        <div className="hero__stats">
          <div className="stat">
            <span className="stat__value">50+</span>
            <span className="stat__label">Unit Drone</span>
          </div>
          <div className="stat__divider" />
          <div className="stat">
            <span className="stat__value">12</span>
            <span className="stat__label">Proyek Riset</span>
          </div>
          <div className="stat__divider" />
          <div className="stat">
            <span className="stat__value">200+</span>
            <span className="stat__label">Mahasiswa</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero__scroll" aria-label="Scroll down">
        <div className="scroll__line" />
        <span className="scroll__text">SCROLL</span>
      </div>
    </section>
  );
};

export default HeroSection;
import React, { useEffect, useRef, useState } from "react";
import "./tentang.css";

interface FocusItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
}

const focusItems: FocusItem[] = [
  {
    id: "agri",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 6C14 6 6 18 6 28c0 4 2 8 6 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M24 6c10 0 18 12 18 22c0 4-2 8-6 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M24 6v36" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M12 22c4-2 8-2 12 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M24 22c4-2 8-2 12 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="24" cy="38" r="3" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
    title: "Precision Agriculture",
    description: "Pemantauan lahan pertanian secara real-time, analisis NDVI, dan pengendalian hama dengan presisi tinggi menggunakan UAV multi-spektral.",
    tag: "AGR-01",
  },
  {
    id: "map",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M8 20h32M8 32h32M20 8v32M32 8v32" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3"/>
        <circle cx="26" cy="26" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M26 14v4M26 30v4M14 26h4M30 26h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    title: "Mapping & Survey",
    description: "Pemetaan topografi dan fotogrametri udara dengan resolusi tinggi untuk keperluan perencanaan infrastruktur dan survei wilayah.",
    tag: "MAP-02",
  },
  {
    id: "env",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M24 8C24 8 16 16 16 24s8 16 8 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M8 24h32" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M10 17h28M10 31h28" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2"/>
      </svg>
    ),
    title: "Monitoring Lingkungan",
    description: "Pengawasan kualitas udara, deteksi deforestasi, pemantauan bencana alam, dan analisis perubahan ekosistem secara berkelanjutan.",
    tag: "ENV-03",
  },
  {
    id: "uav",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="36" cy="12" r="5" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="12" cy="36" r="5" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="36" cy="36" r="5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="18" y="18" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <line x1="17" y1="12" x2="18" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="31" y1="12" x2="30" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="17" y1="36" x2="18" y2="29" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="31" y1="36" x2="30" y2="29" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    title: "Research & Development UAV",
    description: "Pengembangan prototipe drone generasi berikutnya, pengujian sistem avionik, dan integrasi teknologi terkini dalam platform UAV.",
    tag: "R&D-04",
  },
  {
    id: "ai",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="16" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="18" cy="26" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M26 22h6M26 26h6M26 30h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M16 16V12M24 16V10M32 16V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="16" cy="10" r="2" fill="currentColor" opacity="0.6"/>
        <circle cx="24" cy="8" r="2" fill="currentColor" opacity="0.6"/>
        <circle cx="32" cy="10" r="2" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
    title: "AI & Computer Vision",
    description: "Implementasi deep learning untuk object detection, autonomous navigation, semantic segmentation, dan analisis citra udara secara real-time.",
    tag: "AI-05",
  },
];

const useIntersectionObserver = (options = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

const Tentang: React.FC = () => {
  const { ref: sectionRef, isVisible } = useIntersectionObserver();
  const [activeItem, setActiveItem] = useState<string>("agri");

  const active = focusItems.find((f) => f.id === activeItem) || focusItems[0];

  return (
    <section
      className={`tentang ${isVisible ? "tentang--visible" : ""}`}
      ref={sectionRef}
      id="tentang"
    >
      {/* Decorative line left */}
      <div className="tentang__line-left" aria-hidden="true" />

      <div className="tentang__container">

        {/* ── LEFT: Text column ── */}
        <div className="tentang__left">
          <div className="tentang__eyebrow">
            <span className="eyebrow__number">02</span>
            <span className="eyebrow__divider" />
            <span className="eyebrow__label">Tentang Program</span>
          </div>

          <h2 className="tentang__heading">
            Membangun<br />
            <em>Ekosistem UAV</em><br />
            Terdepan
          </h2>

          <p className="tentang__desc tentang__desc--lead">
            Drone Technology Center POLMAN Bandung adalah pusat unggulan yang mendedikasikan diri pada riset, pengembangan, dan edukasi teknologi Unmanned Aerial Vehicle (UAV) di tingkat nasional.
          </p>

          <p className="tentang__desc">
            Berdiri sebagai jembatan antara dunia akademik dan industri, kami memberdayakan mahasiswa, peneliti, dan mitra industri untuk menciptakan solusi nyata melalui teknologi drone yang inovatif dan berkelanjutan.
          </p>

          {/* Tujuan */}
          <div className="tentang__goals">
            <h3 className="goals__heading">Tujuan Pengembangan</h3>
            <ul className="goals__list">
              {[
                "Mendorong riset teknologi drone yang aplikatif dan berdampak",
                "Mencetak tenaga ahli UAV berdaya saing industri",
                "Membangun kemitraan strategis dengan industri dan pemerintah",
                "Mengakselerasi adopsi drone untuk sektor prioritas nasional",
              ].map((goal, i) => (
                <li className="goals__item" key={i} style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
                  <span className="goals__bullet" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── RIGHT: Focus area interactive panel ── */}
        <div className="tentang__right">
          <div className="focus__header">
            <span className="focus__label">Fokus Riset &amp; Aplikasi</span>
            <span className="focus__count">{focusItems.indexOf(active) + 1} / {focusItems.length}</span>
          </div>

          {/* Tab nav */}
          <nav className="focus__nav" aria-label="Fokus riset">
            {focusItems.map((item) => (
              <button
                key={item.id}
                className={`focus__tab ${activeItem === item.id ? "focus__tab--active" : ""}`}
                onClick={() => setActiveItem(item.id)}
                aria-selected={activeItem === item.id}
              >
                <span className="tab__tag">{item.tag}</span>
                <span className="tab__title">{item.title}</span>
              </button>
            ))}
          </nav>

          {/* Active panel */}
          <div className="focus__panel" key={activeItem}>
            <div className="panel__icon">{active.icon}</div>
            <div className="panel__body">
              <h4 className="panel__title">{active.title}</h4>
              <p className="panel__desc">{active.description}</p>
              <div className="panel__tag">{active.tag}</div>
            </div>
          </div>

          {/* Decorative corner marks */}
          <span className="corner corner--tl" aria-hidden="true" />
          <span className="corner corner--br" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

export default Tentang;
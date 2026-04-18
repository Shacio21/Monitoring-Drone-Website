import React, { useEffect, useRef, useState } from "react";
import "./teknologi.css";

interface TechItem {
  id: string;
  icon: React.ReactNode;
  nama: string;
  deskripsi: string;
  tag: string;
  color: string;
}

const techData: TechItem[] = [
  {
    id: "autopilot",
    tag: "Flight Control",
    nama: "Autonomous Flight",
    deskripsi: "Sistem autopilot berbasis PX4 untuk navigasi mandiri, perencanaan misi, dan penerbangan otomatis dengan presisi tinggi.",
    color: "#00c8ff",
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
        <circle cx="24" cy="8" r="2" fill="currentColor" opacity="0.5"/>
        <path d="M24 10v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
      </svg>
    ),
  },
  {
    id: "iot",
    tag: "Communication",
    nama: "IoT Communication",
    deskripsi: "Komunikasi real-time menggunakan protokol MQTT untuk pengiriman data telemetry drone dengan latensi rendah.",
    color: "#22c55e",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.5"/>
        <path d="M14 14a14.14 14.14 0 000 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M34 14a14.14 14.14 0 010 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M9 9a21 21 0 000 30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.45"/>
        <path d="M39 9a21 21 0 010 30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.45"/>
        <circle cx="24" cy="24" r="2" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "ros",
    tag: "Robotics",
    nama: "Robotics Middleware",
    deskripsi: "Arsitektur robotik modular dan scalable menggunakan ROS 2 untuk komunikasi antar-node dan manajemen sensor.",
    color: "#a855f7",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="40" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="8" cy="36" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="40" cy="36" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <line x1="12" y1="14" x2="18" y2="19" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="36" y1="14" x2="30" y2="19" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="12" y1="34" x2="18" y2="29" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="36" y1="34" x2="30" y2="29" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="24" cy="24" r="2.5" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
  },
  {
    id: "web",
    tag: "Web Stack",
    nama: "Web Monitoring",
    deskripsi: "Dashboard real-time berbasis React dan FastAPI untuk visualisasi data penerbangan, status drone, dan kontrol misi.",
    color: "#f59e0b",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="40" height="28" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <line x1="4" y1="16" x2="44" y2="16" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="9" cy="12" r="1.5" fill="currentColor" opacity="0.5"/>
        <circle cx="14" cy="12" r="1.5" fill="currentColor" opacity="0.5"/>
        <circle cx="19" cy="12" r="1.5" fill="currentColor" opacity="0.5"/>
        <path d="M10 26l4-5 5 6 4-4 5 5 4-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="18" y1="36" x2="30" y2="36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="36" x2="24" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18" y1="42" x2="30" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "cloud",
    tag: "Infrastructure",
    nama: "Cloud Infrastructure",
    deskripsi: "Deploy dan penyimpanan data penerbangan menggunakan Amazon Web Services untuk skalabilitas dan keandalan tinggi.",
    color: "#ef4444",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M36 30a8 8 0 000-16 7.9 7.9 0 00-1 .07A10 10 0 106 30h30z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M20 36v-6M24 36v-9M28 36v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M16 36h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "analytics",
    tag: "Data Science",
    nama: "Data Analytics",
    deskripsi: "Visualisasi dan analisis data penerbangan menggunakan Python & Pandas untuk monitoring performa dan prediksi pemeliharaan.",
    color: "#06b6d4",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="30" width="7" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="17" y="22" width="7" height="20" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="28" y="14" width="7" height="28" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="39" y="6" width="1" height="36" rx="0.5" fill="currentColor" opacity="0.2"/>
        <rect x="6" y="42" width="36" height="1" rx="0.5" fill="currentColor" opacity="0.2"/>
        <path d="M9.5 24l11-8 11 4 9-14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9.5" cy="24" r="2" fill="currentColor"/>
        <circle cx="20.5" cy="16" r="2" fill="currentColor"/>
        <circle cx="31.5" cy="20" r="2" fill="currentColor"/>
        <circle cx="40.5" cy="6" r="2" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "cv",
    tag: "AI / Vision",
    nama: "Computer Vision",
    deskripsi: "Deteksi dan pengenalan objek real-time menggunakan YOLOv8 dan TensorFlow yang dijalankan langsung di edge device.",
    color: "#ec4899",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 18V10a2 2 0 012-2h8M36 8h6a2 2 0 012 2v8M40 30v8a2 2 0 01-2 2h-8M12 40H6a2 2 0 01-2-2v-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.4"/>
        <circle cx="24" cy="24" r="1.2" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "sim",
    tag: "Simulation",
    nama: "Flight Simulation",
    deskripsi: "Pengujian algoritma dan misi secara virtual menggunakan Gazebo & SITL sebelum implementasi di drone fisik.",
    color: "#84cc16",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M16 32v6M32 32v6M12 38h24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M24 14c-2 0-5 3-5 8s3 8 5 8 5-3 5-8-3-8-5-8z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M14 20h6M28 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M19 14l-4-3M29 14l4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const useVisible = (threshold = 0.12) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
};

const TechCard = ({ item, index }: { item: TechItem; index: number }) => {
  const { ref, visible } = useVisible();
  return (
    <div
      ref={ref}
      className={`tech-card ${visible ? "tech-card--visible" : ""}`}
      style={{
        "--tc-color": item.color,
        "--tc-delay": `${index * 0.07}s`,
      } as React.CSSProperties}
    >
      <div className="tc-glow" aria-hidden="true" />
      <div className="tc-header">
        <div className="tc-icon">{item.icon}</div>
        <span className="tc-tag">{item.tag}</span>
      </div>
      <h3 className="tc-nama">{item.nama}</h3>
      <p className="tc-desc">{item.deskripsi}</p>
      <div className="tc-bar" aria-hidden="true" />
    </div>
  );
};

const Teknologi: React.FC = () => {
  const { ref: headerRef, visible: hv } = useVisible(0.2);

  return (
    <section className="teknologi" id="teknologi">
      <div className="teknologi__bg" aria-hidden="true">
        <div className="tbg-mesh" />
        <div className="tbg-glow tbg-glow--1" />
        <div className="tbg-glow tbg-glow--2" />
      </div>

      <div className="teknologi__inner">
        {/* Header */}
        <div
          className={`teknologi__header ${hv ? "teknologi__header--visible" : ""}`}
          ref={headerRef}
        >
          <div className="teknologi__eyebrow">
            <span className="te-num">05</span>
            <span className="te-line" />
            <span className="te-label">Stack Teknologi</span>
          </div>
          <h2 className="teknologi__title">
            Teknologi yang<br />
            <em>Kami Gunakan</em>
          </h2>
          <p className="teknologi__subtitle">
            Menggunakan sistem modern untuk mendukung pengembangan<br />
            dan monitoring drone secara real-time.
          </p>
        </div>

        {/* Grid */}
        <div className="teknologi__grid">
          {techData.map((item, i) => (
            <TechCard key={item.id} item={item} index={i} />
          ))}
        </div>

        {/* Bottom strip */}
        <div className="teknologi__strip">
          {["PX4 Autopilot", "ROS 2", "MQTT", "React", "FastAPI", "AWS", "YOLOv8", "TensorFlow", "Gazebo", "MAVLink", "ArduPilot", "Python"].map((t) => (
            <span key={t} className="strip-item">{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Teknologi;
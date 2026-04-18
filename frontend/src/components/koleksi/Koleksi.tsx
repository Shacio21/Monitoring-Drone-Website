import React, { useEffect, useRef, useState } from "react";
import "./koleksi.css";

/* ── Types ── */
interface DroneSpec {
  label: string;
  value: string;
}

interface Drone {
  id: string;
  name: string;
  subtitle: string;
  kategori: "Flora" | "Mediterania" | "Signorina" | "Sterna" | "Fixed Wing";
  deskripsi: string;
  spesifikasi: DroneSpec[];
  kegunaan: string[];
  tahun: number;
  status: "Aktif" | "Riset" | "Arsip";
  color: string; // accent color per card
}

/* ── Data ── */
const droneData: Drone[] = [
  {
    id: "flora-01",
    name: "Flora MK-I",
    subtitle: "Agricultural Multirotor",
    kategori: "Flora",
    deskripsi:
      "Drone multirotor presisi tinggi dirancang khusus untuk keperluan pertanian. Dilengkapi sensor multispektral dan sistem spraying otomatis.",
    spesifikasi: [
      { label: "Berat", value: "4.2 kg" },
      { label: "Lama Terbang", value: "38 menit" },
      { label: "Jangkauan", value: "5 km" },
      { label: "Payload", value: "2.5 kg" },
      { label: "Kamera", value: "Multispektral 5-band" },
    ],
    kegunaan: ["Precision Agriculture", "Penyemprotan Pestisida", "NDVI Analysis"],
    tahun: 2022,
    status: "Aktif",
    color: "#22c55e",
  },
  {
    id: "flora-02",
    name: "Flora MK-II",
    subtitle: "Agri Surveillance Pro",
    kategori: "Flora",
    deskripsi:
      "Generasi kedua seri Flora dengan peningkatan daya terbang dan sensor termal untuk pemantauan kondisi tanaman secara mendalam.",
    spesifikasi: [
      { label: "Berat", value: "4.8 kg" },
      { label: "Lama Terbang", value: "45 menit" },
      { label: "Jangkauan", value: "7 km" },
      { label: "Payload", value: "3.2 kg" },
      { label: "Kamera", value: "Termal + RGB" },
    ],
    kegunaan: ["Thermal Imaging", "Crop Monitoring", "Soil Mapping"],
    tahun: 2023,
    status: "Aktif",
    color: "#22c55e",
  },
  {
    id: "mediterania-01",
    name: "Mediterania Alpha",
    subtitle: "Coastal Survey Drone",
    kategori: "Mediterania",
    deskripsi:
      "Dirancang untuk survei wilayah pesisir dan perairan. Tahan air dan angin dengan sistem navigasi GPS dual-frequency.",
    spesifikasi: [
      { label: "Berat", value: "3.6 kg" },
      { label: "Lama Terbang", value: "50 menit" },
      { label: "Jangkauan", value: "10 km" },
      { label: "Wind Resistance", value: "Beaufort 6" },
      { label: "IP Rating", value: "IP54" },
    ],
    kegunaan: ["Coastal Mapping", "Marine Survey", "Environmental Monitoring"],
    tahun: 2022,
    status: "Aktif",
    color: "#0ea5e9",
  },
  {
    id: "mediterania-02",
    name: "Mediterania Beta",
    subtitle: "Maritime Research UAV",
    kategori: "Mediterania",
    deskripsi:
      "Platform riset maritim dengan kemampuan terbang di atas perairan terbuka. Dilengkapi sensor salinitas dan monitoring kualitas air.",
    spesifikasi: [
      { label: "Berat", value: "5.1 kg" },
      { label: "Lama Terbang", value: "55 menit" },
      { label: "Jangkauan", value: "12 km" },
      { label: "Wind Resistance", value: "Beaufort 7" },
      { label: "Sensor", value: "LiDAR + Hiperspektral" },
    ],
    kegunaan: ["Ocean Monitoring", "Flood Assessment", "Bathymetric Survey"],
    tahun: 2023,
    status: "Riset",
    color: "#0ea5e9",
  },
  {
    id: "signorina-01",
    name: "Signorina S1",
    subtitle: "Compact Surveillance UAV",
    kategori: "Signorina",
    deskripsi:
      "Drone kompak berdesain aerodinamis untuk pengawasan area perkotaan. Senyap dan lincah, ideal untuk monitoring infrastruktur.",
    spesifikasi: [
      { label: "Berat", value: "1.8 kg" },
      { label: "Lama Terbang", value: "35 menit" },
      { label: "Jangkauan", value: "4 km" },
      { label: "Kecepatan Max", value: "72 km/h" },
      { label: "Kamera", value: "4K 60fps + Zoom 30x" },
    ],
    kegunaan: ["Urban Surveillance", "Infrastructure Inspection", "Event Coverage"],
    tahun: 2021,
    status: "Aktif",
    color: "#f59e0b",
  },
  {
    id: "signorina-02",
    name: "Signorina S2 Night",
    subtitle: "Night-ops Tactical UAV",
    kategori: "Signorina",
    deskripsi:
      "Varian malam dari seri Signorina. Dilengkapi kamera termal generasi ketiga dan lampu strobe stealth untuk operasi nocturnal.",
    spesifikasi: [
      { label: "Berat", value: "2.1 kg" },
      { label: "Lama Terbang", value: "40 menit" },
      { label: "Jangkauan", value: "5 km" },
      { label: "Kamera Termal", value: "640×512 px" },
      { label: "Night Vision", value: "Gen-3 FLIR" },
    ],
    kegunaan: ["Night Surveillance", "Search & Rescue", "Thermal Patrol"],
    tahun: 2023,
    status: "Riset",
    color: "#f59e0b",
  },
  {
    id: "sterna-01",
    name: "Sterna V1",
    subtitle: "High-altitude Mapper",
    kategori: "Sterna",
    deskripsi:
      "Platform pemetaan ketinggian tinggi dengan kamera fotogrametri resolusi 61 MP. Mampu memetakan ribuan hektar dalam satu penerbangan.",
    spesifikasi: [
      { label: "Berat", value: "6.4 kg" },
      { label: "Lama Terbang", value: "70 menit" },
      { label: "Ketinggian Max", value: "4000 m AMSL" },
      { label: "Coverage", value: "500 ha/flight" },
      { label: "Kamera", value: "61 MP Full-frame" },
    ],
    kegunaan: ["Topographic Survey", "3D Modeling", "GIS Data Capture"],
    tahun: 2022,
    status: "Aktif",
    color: "#8b5cf6",
  },
  {
    id: "sterna-02",
    name: "Sterna V2 LiDAR",
    subtitle: "LiDAR Survey Platform",
    kategori: "Sterna",
    deskripsi:
      "Versi terbaru Sterna yang dilengkapi sistem LiDAR 360° untuk pembuatan point cloud berkerapatan tinggi dan pemodelan 3D presisi.",
    spesifikasi: [
      { label: "Berat", value: "7.2 kg" },
      { label: "Lama Terbang", value: "65 menit" },
      { label: "LiDAR Points", value: "1.4M pts/det" },
      { label: "Akurasi", value: "±2 cm" },
      { label: "Sensor", value: "LiDAR 128-channel" },
    ],
    kegunaan: ["Point Cloud", "Digital Elevation Model", "Forest Canopy Analysis"],
    tahun: 2024,
    status: "Riset",
    color: "#8b5cf6",
  },
  {
    id: "fixedwing-01",
    name: "Albatros FW-X",
    subtitle: "Long-endurance Fixed Wing",
    kategori: "Fixed Wing",
    deskripsi:
      "Platform sayap tetap berdaya tahan tinggi untuk misi jarak jauh. Ideal untuk patroli batas wilayah dan survei koridor jalan raya.",
    spesifikasi: [
      { label: "Wingspan", value: "2.4 m" },
      { label: "Lama Terbang", value: "3.5 jam" },
      { label: "Jangkauan", value: "80 km" },
      { label: "Kecepatan Jelajah", value: "95 km/h" },
      { label: "Payload", value: "1.8 kg" },
    ],
    kegunaan: ["Long-range Patrol", "Pipeline Inspection", "Corridor Mapping"],
    tahun: 2021,
    status: "Aktif",
    color: "#ef4444",
  },
  {
    id: "fixedwing-02",
    name: "Petrel FW-S",
    subtitle: "VTOL Hybrid UAV",
    kategori: "Fixed Wing",
    deskripsi:
      "Drone VTOL hybrid yang menggabungkan kemudahan lepas landas multirotor dengan efisiensi jelajah sayap tetap. Fleksibel di berbagai medan.",
    spesifikasi: [
      { label: "Wingspan", value: "1.8 m" },
      { label: "Lama Terbang", value: "2.5 jam" },
      { label: "Jangkauan", value: "60 km" },
      { label: "VTOL Mode", value: "6 rotor" },
      { label: "Cruise Mode", value: "Fixed wing" },
    ],
    kegunaan: ["VTOL Flexibility", "Hybrid Mission", "Remote Area Access"],
    tahun: 2023,
    status: "Aktif",
    color: "#ef4444",
  },
];

const kategoriList = ["Semua", "Flora", "Mediterania", "Signorina", "Sterna", "Fixed Wing"] as const;

/* ── Drone SVG Illustration ── */
const DroneIllustration: React.FC<{ color: string; kategori: string }> = ({ color, kategori }) => {
  if (kategori === "Fixed Wing") {
    return (
      <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drone-svg">
        <ellipse cx="80" cy="52" rx="28" ry="8" stroke={color} strokeWidth="1.8" />
        <path d="M52 52 L10 45 L10 58 L52 55Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
        <path d="M108 52 L150 45 L150 58 L108 55Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08" />
        <path d="M65 52 L55 38 L85 38 L95 52" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.06" />
        <ellipse cx="80" cy="52" rx="8" ry="5" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.2" />
        <circle cx="80" cy="52" r="2.5" fill={color} />
        <line x1="80" y1="52" x2="80" y2="62" stroke={color} strokeWidth="1.5" />
        <line x1="74" y1="62" x2="86" y2="62" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {/* Propeller */}
        <circle cx="150" cy="52" r="12" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
        <line x1="150" y1="40" x2="150" y2="64" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // Multirotor / quadcopter
  const arms =
    kategori === "Sterna"
      ? [[-30, -30], [30, -30], [30, 30], [-30, 30], [-22, 0], [22, 0], [0, -22], [0, 22]].slice(0, 4)
      : [[-32, -32], [32, -32], [32, 32], [-32, 32]];

  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="drone-svg">
      {/* Arms */}
      {arms.map(([dx, dy], i) => (
        <line
          key={i}
          x1="80"
          y1="60"
          x2={80 + dx}
          y2={60 + dy}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ))}
      {/* Motor mounts */}
      {arms.map(([dx, dy], i) => (
        <circle
          key={`m${i}`}
          cx={80 + dx}
          cy={60 + dy}
          r="5"
          stroke={color}
          strokeWidth="1.8"
          fill={color}
          fillOpacity="0.15"
        />
      ))}
      {/* Propeller circles */}
      {arms.map(([dx, dy], i) => (
        <circle
          key={`p${i}`}
          cx={80 + dx}
          cy={60 + dy}
          r="14"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="5 3"
          opacity="0.35"
        />
      ))}
      {/* Body */}
      <rect
        x="67"
        y="47"
        width="26"
        height="26"
        rx="6"
        stroke={color}
        strokeWidth="2"
        fill={color}
        fillOpacity="0.12"
      />
      {/* Camera gimbal */}
      <circle cx="80" cy="68" r="5" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.2" />
      <circle cx="80" cy="68" r="2" fill={color} opacity="0.6" />
      {/* LED */}
      <circle cx="80" cy="52" r="2" fill={color} />
      {/* Status light pulse — handled in CSS */}
      <circle cx="80" cy="52" r="2" fill={color} className="drone-led" />
    </svg>
  );
};

/* ── Status badge ── */
const StatusBadge: React.FC<{ status: Drone["status"] }> = ({ status }) => (
  <span className={`status-badge status-badge--${status.toLowerCase()}`}>{status}</span>
);

/* ── Drone Card ── */
const DroneCard: React.FC<{ drone: Drone; index: number; onDetail: (d: Drone) => void }> = ({
  drone,
  index,
  onDetail,
}) => (
  <article
    className="drone-card"
    style={{ animationDelay: `${index * 0.08}s`, "--card-accent": drone.color } as React.CSSProperties}
  >
    <div className="card__image-wrap">
      <DroneIllustration color={drone.color} kategori={drone.kategori} />
      <div className="card__overlay" />
      <StatusBadge status={drone.status} />
      <span className="card__year">{drone.tahun}</span>
    </div>

    <div className="card__body">
      <div className="card__meta">
        <span className="card__kategori">{drone.kategori}</span>
        <span className="card__id">{drone.id.toUpperCase()}</span>
      </div>
      <h3 className="card__name">{drone.name}</h3>
      <p className="card__subtitle">{drone.subtitle}</p>

      <div className="card__specs">
        {drone.spesifikasi.slice(0, 3).map((s) => (
          <div className="spec" key={s.label}>
            <span className="spec__label">{s.label}</span>
            <span className="spec__value">{s.value}</span>
          </div>
        ))}
      </div>

      <button className="card__cta" onClick={() => onDetail(drone)} aria-label={`Lihat detail ${drone.name}`}>
        <span>Lihat Detail</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  </article>
);

/* ── Modal Detail ── */
const DroneModal: React.FC<{ drone: Drone; onClose: () => void }> = ({ drone, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={drone.name}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ "--card-accent": drone.color } as React.CSSProperties}>
        <button className="modal__close" onClick={onClose} aria-label="Tutup">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="modal__top">
          <div className="modal__illustration">
            <DroneIllustration color={drone.color} kategori={drone.kategori} />
          </div>
          <div className="modal__intro">
            <div className="modal__badge-row">
              <span className="card__kategori">{drone.kategori}</span>
              <StatusBadge status={drone.status} />
            </div>
            <h2 className="modal__name">{drone.name}</h2>
            <p className="modal__subtitle">{drone.subtitle}</p>
            <p className="modal__desc">{drone.deskripsi}</p>
          </div>
        </div>

        <div className="modal__body">
          <div className="modal__section">
            <h4 className="modal__section-title">Spesifikasi Teknis</h4>
            <div className="modal__specs">
              {drone.spesifikasi.map((s) => (
                <div className="modal__spec-row" key={s.label}>
                  <span className="modal__spec-label">{s.label}</span>
                  <span className="modal__spec-divider" />
                  <span className="modal__spec-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="modal__section">
            <h4 className="modal__section-title">Kegunaan</h4>
            <div className="modal__tags">
              {drone.kegunaan.map((k) => (
                <span className="modal__use-tag" key={k}>{k}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal__footer">
          <span className="modal__id">{drone.id.toUpperCase()}</span>
          <span className="modal__year">Tahun Produksi: {drone.tahun}</span>
        </div>
      </div>
    </div>
  );
};

/* ── Intersection observer hook ── */
const useVisible = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
};

/* ── Main Component ── */
const Koleksi: React.FC = () => {
  const { ref, visible } = useVisible();
  const [activeFilter, setActiveFilter] = useState<string>("Semua");
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);

  const filtered =
    activeFilter === "Semua" ? droneData : droneData.filter((d) => d.kategori === activeFilter);

  return (
    <section className={`koleksi ${visible ? "koleksi--visible" : ""}`} ref={ref} id="koleksi">
      {/* Noise texture overlay */}
      <div className="koleksi__noise" aria-hidden="true" />

      <div className="koleksi__container">
        {/* Header */}
        <div className="koleksi__header">
          <div className="koleksi__eyebrow">
            <span className="k-eyebrow__num">03</span>
            <span className="k-eyebrow__div" />
            <span className="k-eyebrow__text">Armada UAV</span>
          </div>
          <h2 className="koleksi__title">
            Koleksi<br />
            <span className="koleksi__title-accent">Drone Kampus</span>
          </h2>
          <p className="koleksi__desc">
            {droneData.length} unit UAV aktif dalam berbagai kelas dan misi — dari pertanian presisi hingga survei LiDAR.
          </p>
        </div>

        {/* Filter */}
        <div className="koleksi__filter" role="tablist" aria-label="Filter kategori drone">
          {kategoriList.map((k) => (
            <button
              key={k}
              className={`filter-btn ${activeFilter === k ? "filter-btn--active" : ""}`}
              onClick={() => setActiveFilter(k)}
              role="tab"
              aria-selected={activeFilter === k}
            >
              {k}
              {k !== "Semua" && (
                <span className="filter-btn__count">
                  {droneData.filter((d) => d.kategori === k).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="koleksi__grid">
          {filtered.map((drone, i) => (
            <DroneCard key={drone.id} drone={drone} index={i} onDetail={setSelectedDrone} />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="koleksi__empty">
            <p>Tidak ada drone dalam kategori ini.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedDrone && (
        <DroneModal drone={selectedDrone} onClose={() => setSelectedDrone(null)} />
      )}
    </section>
  );
};

export default Koleksi;
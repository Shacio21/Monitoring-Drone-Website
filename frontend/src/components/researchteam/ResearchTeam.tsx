import React, { useEffect, useRef, useState } from "react";
import "./researchteam.css";

/* ─── Types ─── */
interface Member {
  id: string;
  nama: string;
  role: string;
  divisi: string;
  nim?: string;
  nip?: string;
  keahlian: string[];
  level: "pembimbing" | "ketua" | "anggota";
  initials: string;
  accentHue: number;
}

/* ─── Data ─── */
const pembimbing: Member[] = [
  {
    id: "p1",
    nama: "Hilda Khoirunnisa, S.T., M.Sc.",
    role: "Dosen Pembimbing Utama",
    divisi: "Avionik & Flight Control",
    nip: "197803122005011002",
    keahlian: ["Flight Controller", "Embedded Systems", "Control Theory"],
    level: "pembimbing",
    initials: "BS",
    accentHue: 200,
  },
  {
    id: "p2",
    nama: "xxxxxxxxxxxxxxxx",
    role: "Dosen Pembimbing",
    divisi: "AI & Computer Vision",
    nip: "198506072010012005",
    keahlian: ["Deep Learning", "Computer Vision", "ROS"],
    level: "pembimbing",
    initials: "DR",
    accentHue: 160,
  },
  {
    id: "p3",
    nama: "xxxxxxxxxxxxxxxx",
    role: "Dosen Pembimbing",
    divisi: "Mekanik & Struktural",
    nip: "198912302015041001",
    keahlian: ["Aerodinamika", "CAD/CAE", "Material Komposit"],
    level: "pembimbing",
    initials: "RF",
    accentHue: 35,
  },
];

const ketua: Member = {
  id: "k1",
  nama: "Fulan bin fulan",
  role: "Ketua Tim",
  divisi: "Koordinasi & Flight Ops",
  nim: "221311001",
  keahlian: ["Mission Planning", "Pilot UAV", "Team Leadership"],
  level: "ketua",
  initials: "AF",
  accentHue: 52,
};

const anggota: Member[] = [
  {
    id: "a1",
    nama: "Muhammad Dirgam Shacio",
    role: "Wakil Ketua",
    divisi: "Navigasi & GCS",
    nim: "221311002",
    keahlian: ["Ground Control", "GPS/RTK", "Mission Planner"],
    level: "anggota",
    initials: "SN",
    accentHue: 300,
  },
  {
    id: "a2",
    nama: "Rendra Wijaya",
    role: "Hardware Engineer",
    divisi: "Elektronik & Wiring",
    nim: "221311015",
    keahlian: ["PCB Design", "Power Systems", "ESC/Motor"],
    level: "anggota",
    initials: "RW",
    accentHue: 20,
  },
  {
    id: "a3",
    nama: "Nabilah Putri",
    role: "Software Engineer",
    divisi: "Flight Software",
    nim: "221311023",
    keahlian: ["PX4 / ArduPilot", "Python", "MAVLink"],
    level: "anggota",
    initials: "NP",
    accentHue: 180,
  },
  {
    id: "a4",
    nama: "Galang Prasetyo",
    role: "AI Engineer",
    divisi: "Computer Vision",
    nim: "221311031",
    keahlian: ["YOLOv8", "TensorFlow", "Edge Inference"],
    level: "anggota",
    initials: "GP",
    accentHue: 260,
  },
  {
    id: "a5",
    nama: "Lestari Indah",
    role: "Mapping Specialist",
    divisi: "Geospasial & GIS",
    nim: "221311044",
    keahlian: ["Photogrammetry", "ArcGIS", "Point Cloud"],
    level: "anggota",
    initials: "LI",
    accentHue: 140,
  },
  {
    id: "a6",
    nama: "Dimas Arya Putra",
    role: "Mekanik",
    divisi: "Desain Airframe",
    nim: "221311052",
    keahlian: ["SolidWorks", "3D Printing", "Composite Layup"],
    level: "anggota",
    initials: "DA",
    accentHue: 10,
  },
  {
    id: "a7",
    nama: "Vina Setiawati",
    role: "Dokumentasi & Riset",
    divisi: "R&D Support",
    nim: "221311061",
    keahlian: ["Technical Writing", "Data Analysis", "Field Testing"],
    level: "anggota",
    initials: "VS",
    accentHue: 340,
  },
  {
    id: "a8",
    nama: "Bagas Firmansyah",
    role: "Pilot & Operator",
    divisi: "Flight Operations",
    nim: "221311078",
    keahlian: ["UAV Piloting", "Pre-flight Check", "Log Analysis"],
    level: "anggota",
    initials: "BF",
    accentHue: 90,
  },
];

/* ─── Avatar ─── */
const Avatar = ({ member, size = 72 }: { member: Member; size?: number }) => {
  const hue = member.accentHue;
  return (
    <div
      className={`avatar avatar--${member.level}`}
      style={{
        width: size,
        height: size,
        "--av-hue": hue,
      } as React.CSSProperties}
    >
      <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="avatar__bg">
        <defs>
          <radialGradient id={`ag-${member.id}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor={`hsl(${hue},70%,35%)`} />
            <stop offset="100%" stopColor={`hsl(${hue},50%,12%)`} />
          </radialGradient>
        </defs>
        <rect width="72" height="72" fill={`url(#ag-${member.id})`} />
        <circle cx="36" cy="28" r="13" fill={`hsl(${hue},60%,55%)`} opacity="0.25" />
        <ellipse cx="36" cy="58" rx="22" ry="14" fill={`hsl(${hue},60%,55%)`} opacity="0.18" />
      </svg>
      <span className="avatar__initials">{member.initials}</span>
      {member.level === "pembimbing" && (
        <span className="avatar__crown" aria-hidden="true">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M1 9L3.5 2L7 6L10.5 2L13 9H1Z" fill={`hsl(${hue},80%,65%)`} />
          </svg>
        </span>
      )}
      {member.level === "ketua" && (
        <span className="avatar__star" aria-hidden="true">★</span>
      )}
    </div>
  );
};

/* ─── Member Card ─── */
const MemberCard = ({
  member,
  index,
  featured = false,
}: {
  member: Member;
  index: number;
  featured?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const hue = member.accentHue;

  return (
    <div
      ref={ref}
      className={`member-card member-card--${member.level} ${featured ? "member-card--featured" : ""} ${visible ? "member-card--visible" : ""}`}
      style={{
        "--mc-hue": hue,
        "--mc-delay": `${index * 0.06}s`,
      } as React.CSSProperties}
    >
      <div className="mc-top">
        <Avatar member={member} size={featured ? 88 : 64} />
        <div className="mc-identity">
          <span className="mc-role">{member.role}</span>
          <h3 className="mc-nama">{member.nama}</h3>
          <span className="mc-divisi">{member.divisi}</span>
        </div>
      </div>

      <div className="mc-id-line">
        <span className="mc-id-label">{member.nip ? "NIP" : "NIM"}</span>
        <span className="mc-id-value">{member.nip || member.nim}</span>
      </div>

      <div className="mc-skills">
        {member.keahlian.map((k) => (
          <span key={k} className="mc-skill">{k}</span>
        ))}
      </div>

      <div className="mc-accent-bar" />
    </div>
  );
};

/* ─── Org connector lines (decorative SVG) ─── */
const OrgConnector = () => (
  <div className="org-connector" aria-hidden="true">
    <svg viewBox="0 0 600 60" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="300" y1="0" x2="300" y2="30" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      <line x1="80" y1="30" x2="520" y2="30" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      <line x1="80" y1="30" x2="80" y2="60" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      <line x1="300" y1="30" x2="300" y2="60" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      <line x1="520" y1="30" x2="520" y2="60" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      <circle cx="80" cy="30" r="3" fill="rgba(255,255,255,0.2)"/>
      <circle cx="300" cy="30" r="3" fill="rgba(255,255,255,0.2)"/>
      <circle cx="520" cy="30" r="3" fill="rgba(255,255,255,0.2)"/>
    </svg>
  </div>
);

/* ─── Main Component ─── */
const ResearchTeam: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [hv, setHv] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setHv(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (headerRef.current) obs.observe(headerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="rteam" id="tim">
      {/* Bg texture */}
      <div className="rteam__bg" aria-hidden="true">
        <div className="bg-dot-grid" />
        <div className="bg-glow bg-glow--a" />
        <div className="bg-glow bg-glow--b" />
      </div>

      {/* Header */}
      <div className={`rteam__header ${hv ? "rteam__header--visible" : ""}`} ref={headerRef}>
        <div className="rteam__eyebrow">
          <span className="ey-num">04</span>
          <span className="ey-line" />
          <span className="ey-label">Research Team</span>
        </div>
        <h2 className="rteam__title">
          Otak di Balik<br />
          <em>Setiap Penerbangan</em>
        </h2>
        <p className="rteam__subtitle">
          {pembimbing.length} dosen pembimbing · {1 + anggota.length} mahasiswa aktif · multidisiplin
        </p>
      </div>

      {/* ── LEVEL 1: Dosen Pembimbing ── */}
      <div className="rteam__tier">
        <div className="tier-label">
          <span className="tier-label__badge">Dosen Pembimbing</span>
          <span className="tier-label__count">{pembimbing.length} orang</span>
        </div>
        <div className="tier-grid tier-grid--pembimbing">
          {pembimbing.map((m, i) => (
            <MemberCard key={m.id} member={m} index={i} />
          ))}
        </div>
      </div>

      {/* Org connector */}
      <OrgConnector />

      {/* ── LEVEL 2: Ketua Tim ── */}
      <div className="rteam__tier rteam__tier--center">
        <div className="tier-label">
          <span className="tier-label__badge tier-label__badge--ketua">Ketua Tim</span>
        </div>
        <div className="tier-grid tier-grid--ketua">
          <MemberCard member={ketua} index={0} featured />
        </div>
      </div>

      {/* Org connector bottom */}
      <div className="org-connector-simple" aria-hidden="true">
        <div className="ocs-line" />
      </div>

      {/* ── LEVEL 3: Anggota ── */}
      <div className="rteam__tier">
        <div className="tier-label">
          <span className="tier-label__badge tier-label__badge--anggota">Anggota Tim</span>
          <span className="tier-label__count">{anggota.length} mahasiswa</span>
        </div>
        <div className="tier-grid tier-grid--anggota">
          {anggota.map((m, i) => (
            <MemberCard key={m.id} member={m} index={i} />
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="rteam__stats">
        {[
          { v: `${pembimbing.length + 1 + anggota.length}`, l: "Total Anggota" },
          { v: "5", l: "Divisi Aktif" },
          { v: "12", l: "Riset Berjalan" },
          { v: "2022", l: "Tahun Berdiri" },
        ].map((s) => (
          <div className="rstat" key={s.l}>
            <span className="rstat__v">{s.v}</span>
            <span className="rstat__l">{s.l}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ResearchTeam;
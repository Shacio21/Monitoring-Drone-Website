import React from "react";
import Navbar from "../../components/navbar/Navbar";
import HeroSection from "../../components/herosection/HeroSection";
import Tentang from "../../components/tentang/Tentang";
import Koleksi from "../../components/koleksi/Koleksi";
import Teknologi from "../../components/teknologi/Teknologi";
import ResearchTeam from "../../components/researchteam/ResearchTeam";
import Kontak from "../../components/Kontak/Kontak";
import "./landingpage.css";

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection />
      <Tentang />
      <Koleksi /> 
      <Teknologi /> 
      <ResearchTeam />
      <Kontak />  
    </div>
  );
};

export default LandingPage;
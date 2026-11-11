import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "../components/home/Hero";
import KineticBridge from "../components/transition/KineticBridge";
import GalleryEntrance from "../components/gallery/GalleryEntrance";
import StudentGallery from "../components/gallery/StudentGallery";

export default function HomePage() {
  const location = useLocation();
  useLayoutEffect(() => {
    if (location.hash === "#estudiantes") {
      document.getElementById("estudiantes")?.scrollIntoView({ behavior: "instant" });
    } else if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.hash]);

  return (
    <>
      <Hero />
      <KineticBridge />
      <GalleryEntrance />
      <StudentGallery />
    </>
  );
}


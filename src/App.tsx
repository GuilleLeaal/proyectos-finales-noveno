import { useLayoutEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Hero from "./components/home/Hero";
import KineticBridge from "./components/transition/KineticBridge";
import GalleryEntrance from "./components/gallery/GalleryEntrance";
import StudentGallery from "./components/gallery/StudentGallery";
import StudentProjectPage from "./pages/StudentProjectPage";
import { ProjectNavigationProvider } from "./components/navigation/ProjectNavigationTransition";
import ExhibitionAutoScroll from "./components/exhibition/ExhibitionAutoScroll";

function Home() {
  const location = useLocation();
  useLayoutEffect(() => {
    if (location.hash === "#estudiantes") {
      document.getElementById("estudiantes")?.scrollIntoView({ behavior: "instant" });
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

export default function App() {
  return (
    <ProjectNavigationProvider>
      <ExhibitionAutoScroll />
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/proyectos/:id" element={<StudentProjectPage />} />
      <Route path="*" element={<Home />} />
      </Routes>
    </ProjectNavigationProvider>
  );
}

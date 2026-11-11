import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { ProjectNavigationProvider } from "./components/navigation/ProjectNavigationTransition";
import ExhibitionAutoScroll from "./components/exhibition/ExhibitionAutoScroll";

const Home = lazy(() => import("./pages/HomePage"));
const StudentProjectPage = lazy(() => import("./pages/StudentProjectPage"));

export default function App() {
  return (
    <ProjectNavigationProvider>
      <ExhibitionAutoScroll />
      <Suspense fallback={<div role="status" style={{ minHeight: "100svh", padding: "2rem" }}>Cargando…</div>}>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/proyectos/:id" element={<StudentProjectPage />} />
      <Route path="*" element={<Home />} />
      </Routes>
      </Suspense>
    </ProjectNavigationProvider>
  );
}

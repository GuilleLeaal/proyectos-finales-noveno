import { useEffect, useRef } from "react";
import "./GalleryEntrance.css";

/**
 * A visual invitation to the future student gallery.
 * The three images are CSS-only abstract placeholders, NOT student projects.
 */
export default function GalleryEntrance() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.classList.add("gallery-entrance--visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("gallery-entrance--visible");
          observer.disconnect();
        }
      },
      { threshold: 0.16 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="galeria" ref={sectionRef} className="gallery-entrance">
      <div className="gallery-entrance__stage">
        <div className="gallery-entrance__cards" aria-hidden="true">
          <div className="gallery-entrance__card gallery-entrance__card--one">
            <div className="gallery-entrance__art gallery-entrance__art--one" />
          </div>
          <div className="gallery-entrance__card gallery-entrance__card--two">
            <div className="gallery-entrance__art gallery-entrance__art--two" />
          </div>
          <div className="gallery-entrance__card gallery-entrance__card--three">
            <div className="gallery-entrance__art gallery-entrance__art--three" />
          </div>
        </div>

        <div className="gallery-entrance__copy">
          <p className="gallery-entrance__overline">UNA EXPOSICIÓN DE IDEAS</p>
          <h2 className="gallery-entrance__title">
            LA<br />
            GALERÍA<span>.</span>
          </h2>
          <p className="gallery-entrance__caption">
            Descubrí los proyectos de nuestros estudiantes.
          </p>
        </div>
      </div>
    </section>
  );
}

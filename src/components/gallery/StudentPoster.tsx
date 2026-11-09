import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Student } from "../../data/students";
import { posterThemes } from "../../data/posterThemes";
import { useProjectNavigation } from "../navigation/ProjectNavigationTransition";


export function StudentPoster({
  student,
  featured = false,
}: {
  student: Student;
  featured?: boolean;
}) {
  const { openStudent } = useProjectNavigation();
  const theme = posterThemes[student.artwork];
  const style = {
    "--poster-bg": theme.bg,
    "--poster-ink": theme.ink,
    "--poster-accent": theme.accent,
    "--poster-accent2": theme.accent2,
  } as CSSProperties;

  const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`;
  const fullName = `${student.firstName} ${student.lastName}`;

  return (
    <Link
      to={`/proyectos/${student.id}`}
      className={`student-poster artwork-${student.artwork}${featured ? " student-poster--featured" : ""}`}
      style={style}
      aria-label={`Ver página de ${fullName}, grupo ${student.group}`}
      onClick={(event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openStudent(student, event.currentTarget);
      }}
    >
      <span className="student-poster__art" aria-hidden="true">
        <span className="student-poster__field" />
        <span className="student-poster__shape student-poster__shape--main" />
        <span className="student-poster__shape student-poster__shape--secondary" />
        <span className="student-poster__initials">{initials}</span>
        <span className="student-poster__shine" />
      </span>
      <span className="student-poster__top">
        <span>PF<span className="student-poster__dot">.</span> / 26</span>
        <span>9.º {student.group.slice(-1)}</span>
      </span>
      <span className="student-poster__footer">
        <span className="student-poster__nameblock">
          <span className="student-poster__first">{student.firstName}</span>
          <span className="student-poster__last">{student.lastName}</span>
        </span>
        <span className="student-poster__open" aria-hidden="true">
          <ArrowUpRight size={25} strokeWidth={1.8} />
        </span>
      </span>
    </Link>
  );
}

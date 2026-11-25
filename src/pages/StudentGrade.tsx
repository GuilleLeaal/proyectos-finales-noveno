import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LockKeyhole, X } from "lucide-react";
import "./StudentGrade.css";

export default function StudentGrade({ studentId }: { studentId: string }) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const attemptRef = useRef(0);
  const [grade, setGrade] = useState<number | null | undefined>();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [finished, setFinished] = useState(false);
  const revealed = grade !== undefined;

  function resetDialog() {
    attemptRef.current++;
    setGrade(undefined);
    setFeedback("");
    setError("");
    setChecking(false);
    setFinished(false);
    if (codeRef.current) codeRef.current.value = "";
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking || !codeRef.current) return;
    const attempt = ++attemptRef.current;
    const code = codeRef.current.value;
    setError("");
    setChecking(true);

    try {
      const result = await fetch("/api/student-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ studentId, code }),
      });
      if (attempt !== attemptRef.current || !dialogRef.current?.open) return;
      if (result.status === 403) {
        setError("El código no corresponde a esta página.");
        codeRef.current?.focus();
        codeRef.current?.select();
        return;
      }
      if (result.status === 429) {
        setError("Demasiados intentos. Esperá unos minutos y volvé a probar.");
        return;
      }
      if (!result.ok) throw new Error("Consulta no disponible");
      const { grade: score, feedback: review } = await result.json();
      if (attempt !== attemptRef.current || !dialogRef.current?.open) return;
      if ((score !== null && (!Number.isInteger(score) || score < 1 || score > 10)) || typeof review !== "string") {
        throw new Error("Evaluación inválida");
      }
      if (codeRef.current) codeRef.current.value = "";
      closeRef.current?.focus();
      setFeedback(review);
      setGrade(score);
    } catch {
      if (attempt === attemptRef.current && dialogRef.current?.open) {
        setError("No se pudo consultar la nota en este momento.");
      }
    } finally {
      if (attempt === attemptRef.current) setChecking(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="student-grade__trigger"
        aria-haspopup="dialog"
        aria-controls={id}
        onClick={() => {
          dialogRef.current?.showModal();
          codeRef.current?.focus();
        }}
      >
        <LockKeyhole size={15} aria-hidden="true" /> Ver mi nota
      </button>
      <dialog id={id} ref={dialogRef} className="student-grade__dialog" aria-labelledby={id + "-title"} onClose={resetDialog}>
        <button type="button" ref={closeRef} className="student-grade__close" aria-label="Cerrar nota" onClick={() => dialogRef.current?.close()}>
          <X size={20} aria-hidden="true" />
        </button>
        <h2 id={id + "-title"}>Tu nota del proyecto</h2>
        <div className="student-grade__stage" aria-hidden="true">
          <div
            className="student-grade__coin"
            data-revealed={revealed}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget && revealed) setFinished(true);
            }}
          >
            <div className="student-grade__face">
              <LockKeyhole size={44} strokeWidth={1.45} />
            </div>
            <div className="student-grade__face student-grade__face--back">
              {revealed && (
                <div className="student-grade__score">
                  {grade === null ? (
                    <strong className="student-grade__pending">Pendiente</strong>
                  ) : (
                    <><strong className="student-grade__number">{grade}</strong><span>de 10</span></>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {revealed ? (
          <>
            <p className="sr-only" role="status">
              {finished && (grade === null ? "Tu evaluación está pendiente." : "Tu nota es " + grade + " de 10.")}
            </p>
            {finished && feedback && (
              <section className="student-grade__feedback" aria-labelledby={id + "-feedback"}>
                <h3 id={id + "-feedback"}>Devolución</h3>
                <p>{feedback}</p>
              </section>
            )}
          </>
        ) : (
          <form className="student-grade__form" autoComplete="off" onSubmit={submitCode}>
            <label htmlFor={id + "-code"}>Código personal</label>
            <input
              id={id + "-code"}
              ref={codeRef}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000-000"
              pattern="[0-9]{3}-?[0-9]{3}"
              spellCheck={false}
              required
              onChange={({ currentTarget }) => {
                const digits = currentTarget.value.replace(/\D/g, "").slice(0, 6);
                currentTarget.value = digits.length > 3 ? digits.slice(0, 3) + "-" + digits.slice(3) : digits;
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? id + "-error" : undefined}
            />
            {error && <p id={id + "-error"} role="alert">{error}</p>}
            <button type="submit" disabled={checking}>{checking ? "Abriendo…" : "Revelar nota"}</button>
          </form>
        )}
      </dialog>
    </>
  );
}

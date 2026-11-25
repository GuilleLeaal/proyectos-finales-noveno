import { Readable } from "node:stream";
import { loadEnv } from "vite";
import { readGradeAccess, respondToGradeLookup } from "./student-grade.mjs";

const windowMs = 10 * 60 * 1000;

export function viteGradeAccess(mode) {
  function setup(server) {
    const { GRADE_ACCESS } = loadEnv(mode, process.cwd(), "GRADE_ACCESS");
    const records = readGradeAccess(GRADE_ACCESS);
    const attempts = new Map();
    const checkAttempts = (id) => {
      const now = Date.now();
      const attempt = attempts.get(id);
      if (!attempt || attempt.until <= now) {
        attempts.set(id, { number: 1, until: now + windowMs });
        return "allowed";
      }
      return ++attempt.number <= 5 ? "allowed" : "blocked";
    };

    server.middlewares.use((req, res, next) => {
      if (req.url?.split("?")[0] !== "/api/student-grade") return next();

      const request = new Request("http://localhost/api/student-grade", {
        method: req.method,
        headers: req.headers,
        ...(req.method === "POST" && { body: Readable.toWeb(req), duplex: "half" }),
      });
      void respondToGradeLookup(request, records, checkAttempts).then(async (result) => {
        res.writeHead(result.status, Object.fromEntries(result.headers));
        res.end(await result.text());
      }).catch(next);
    });
  }

  return { name: "noveno-grade-access", configureServer: setup, configurePreviewServer: setup };
}

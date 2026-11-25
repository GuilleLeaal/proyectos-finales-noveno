import { Readable } from "node:stream";
import { loadEnv } from "vite";
import { createGradeAttemptLimiter, readGradeAccess, respondToGradeLookup } from "./student-grade.mjs";

export function viteGradeAccess(mode) {
  function setup(server) {
    const { GRADE_ACCESS } = loadEnv(mode, process.cwd(), "GRADE_ACCESS");
    const records = readGradeAccess(GRADE_ACCESS);
    const canAttempt = createGradeAttemptLimiter();

    server.middlewares.use((req, res, next) => {
      if (req.url?.split("?")[0] !== "/api/student-grade") return next();

      const request = new Request("http://localhost/api/student-grade", {
        method: req.method,
        headers: req.headers,
        ...(req.method === "POST" && { body: Readable.toWeb(req), duplex: "half" }),
      });
      void respondToGradeLookup(request, records, canAttempt).then(async (result) => {
        res.writeHead(result.status, Object.fromEntries(result.headers));
        res.end(await result.text());
      }).catch(next);
    });
  }

  return { name: "noveno-grade-access", configureServer: setup, configurePreviewServer: setup };
}

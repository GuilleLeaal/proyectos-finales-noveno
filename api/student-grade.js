import { checkRateLimit } from "@vercel/firewall";
import { readGradeAccess, respondToGradeLookup } from "../server/student-grade.mjs";

const records = readGradeAccess(process.env.GRADE_ACCESS);
const liveFirewall = process.env.VERCEL === "1" && process.env.NODE_ENV === "production";

export function POST(request) {
  return respondToGradeLookup(request, records, async (studentId, request) => {
    if (!liveFirewall) return "unavailable";

    const headers = new Headers(request.headers);
    headers.set("host", "proyectos-finales-noveno.vercel.app");
    const result = await checkRateLimit("noveno-codigos", {
      headers,
      rateLimitKey: studentId,
      timeout: 1500,
    });
    if (result.rateLimited || result.error === "blocked") return "blocked";
    return result.error ? "unavailable" : "allowed";
  });
}

import { timingSafeEqual } from "node:crypto";

export function readGradeAccess(value) {
  if (!value) return null;
  try {
    const records = Object.entries(JSON.parse(value));
    const valid = records.length > 0 && records.every(([id, entry]) => {
      if (!/^9[ac]-[a-z0-9-]+$/.test(id) || !Array.isArray(entry) || entry.length !== 3) return false;
      const [code, grade, feedback] = entry;
      return typeof code === "string" && /^\d{6}$/.test(code) &&
        typeof feedback === "string" && feedback.length <= 320 &&
        (grade === null || (Number.isInteger(grade) && grade >= 1 && grade <= 10));
    });
    return valid ? new Map(records) : null;
  } catch {
    return null;
  }
}

function reply(status, body, headers = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function respondToGradeLookup(request, records, checkAttempts) {
  if (request.method !== "POST") return reply(405, { error: "method" }, { Allow: "POST" });
  if (!records) return reply(503, { error: "unavailable" });

  let input;
  try {
    input = await request.json();
  } catch {
    return reply(400, { error: "format" });
  }
  const studentId = input?.studentId;
  const code = input?.code;
  if (typeof studentId !== "string" || typeof code !== "string" || !/^\d{3}-?\d{3}$/.test(code)) {
    return reply(400, { error: "format" });
  }

  const record = records.get(studentId);
  if (!record) return reply(403, { error: "code" });

  let limit;
  try {
    limit = await checkAttempts(studentId, request);
  } catch {
    return reply(503, { error: "unavailable" });
  }
  if (limit === "blocked") return reply(429, { error: "attempts" });
  if (limit !== "allowed") return reply(503, { error: "unavailable" });

  const [expected, grade, feedback] = record;
  const matches = timingSafeEqual(Buffer.from(code.replace("-", "")), Buffer.from(expected));
  return matches ? reply(200, { grade, feedback }) : reply(403, { error: "code" });
}

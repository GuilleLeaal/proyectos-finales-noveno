import { createGradeAttemptLimiter, readGradeAccess, respondToGradeLookup } from "../server/student-grade.mjs";

const records = readGradeAccess(process.env.GRADE_ACCESS);
const canAttempt = createGradeAttemptLimiter();

export function POST(request) {
  return respondToGradeLookup(request, records, canAttempt);
}

import assert from "node:assert/strict";
import test from "node:test";

const first = "9a-estudiante-prueba";
const second = "9c-estudiante-pendiente";
const feedback = "El trabajo organiza bien las dos páginas.";

function lookup(studentId, code) {
  return new Request("http://localhost/api/student-grade", {
    method: "POST",
    body: JSON.stringify({ studentId, code }),
  });
}

test("la consulta usa la variable privada y valida el código sin depender de servicios externos", async () => {
  const previous = process.env.GRADE_ACCESS;
  process.env.GRADE_ACCESS = JSON.stringify({
    [first]: ["016245", 8, feedback],
    [second]: ["728903", null, ""],
  });
  try {
    const { POST } = await import("../api/student-grade.js");
    const wrong = await POST(lookup(first, "728-903"));
    assert.equal(wrong.status, 403);
    assert.deepEqual(await wrong.json(), { error: "code" });

    const result = await POST(lookup(first, "016-245"));
    assert.equal(result.status, 200);
    assert.equal(result.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await result.json(), { grade: 8, feedback });

    for (let attempt = 0; attempt < 3; attempt++) {
      assert.equal((await POST(lookup(first, "100-002"))).status, 403);
    }
    assert.equal((await POST(lookup(first, "016-245"))).status, 429);

    const pending = await POST(lookup(second, "728903"));
    assert.equal(pending.status, 200);
    assert.deepEqual(await pending.json(), { grade: null, feedback: "" });
  } finally {
    if (previous === undefined) delete process.env.GRADE_ACCESS;
    else process.env.GRADE_ACCESS = previous;
  }
});

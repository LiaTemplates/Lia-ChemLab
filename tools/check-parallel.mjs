// Alle Prüfungen auf mehrere Prozesse verteilt. Aufruf: node tools/check-parallel.mjs [Anzahl, Vorgabe: Zahl der Kerne]
import { spawn } from "node:child_process";
import os from "node:os";

const n = Number(process.argv[2]) || os.availableParallelism();
const start = Date.now();
const runs = Array.from({ length: n }, (_, i) => new Promise((done) => {
  let out = "";
  const child = spawn(process.execPath, ["--test", "--test-reporter=tap", "check.mjs"], { cwd: new URL("..", import.meta.url), env: { ...process.env, SHARD: `${i + 1}/${n}` } });
  child.stdout.on("data", (d) => { out += d; });
  child.stderr.on("data", (d) => { out += d; });
  child.on("close", (code) => done({ code, out }));
}));
const results = await Promise.all(runs);
let pass = 0, fail = 0;
for (const { out } of results) {
  if (!/^# pass /m.test(out)) console.log(out.split("\n").slice(-20).join("\n"));      // der Teil kam gar nicht zum Prüfen
  pass += Number((out.match(/^# pass (\d+)/m) || [0, 0])[1]);
  fail += Number((out.match(/^# fail (\d+)/m) || [0, 0])[1]);
  // fehlgeschlagene Prüfungen mit ihrer Meldung
  for (const block of out.split(/\n(?=not ok )/).filter((b) => b.startsWith("not ok "))) console.log(block.split("\n").slice(0, 12).join("\n"));
}
console.log(`${pass} bestanden, ${fail} fehlgeschlagen, ${n} Prozesse, ${((Date.now() - start) / 1000).toFixed(0)} s`);
process.exitCode = fail || results.some((r) => r.code) ? 1 : 0;

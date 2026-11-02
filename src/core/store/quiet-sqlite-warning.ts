/**
 * node:sqlite prints "SQLite is an experimental feature" on first load. Atlas chose it on purpose
 * (see sqlite.ts), so that one warning is hidden. Every other warning still prints as usual.
 * Imported before node:sqlite; warnings are delivered on the next tick, after this has run.
 */
const isSqliteNotice = (w: Error) => w.name === "ExperimentalWarning" && /SQLite/i.test(w.message);

const defaults = process.listeners("warning");
process.removeAllListeners("warning");
process.on("warning", (w) => {
  if (isSqliteNotice(w)) return;
  for (const l of defaults) l.call(process, w);
});

export { isSqliteNotice };

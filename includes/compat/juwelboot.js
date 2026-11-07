const path = require("path");
if (path.basename(process.argv[1] || "") === "Main.js") {
  try { require("../../Script/commands/juwelalert.js"); }
  catch (e) { console.error("[juwelboot] juwelalert load failed:", e.message); }
}

const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "dist");

// Clean dist
if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true });
fs.mkdirSync(dist);

// Copy scroll.html as index.html
fs.copyFileSync(
  path.join(__dirname, "scroll.html"),
  path.join(dist, "index.html")
);

// Copy frame directories
for (const dir of ["v1", "v2", "v3", "v4", "v5"]) {
  const src = path.join(__dirname, dir);
  const dst = path.join(dist, dir);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, f), path.join(dst, f));
  }
}

console.log("Site built to dist/");

import path from "path";
import fs from "fs";
import svgtofont from "svgtofont";
import { globSync } from "glob";
import svgson from "svgson";

// prep working dir
const svgDir = path.resolve(process.cwd(), "svg");
if (fs.existsSync(svgDir)) {
  const filesToClean = fs.readdirSync(svgDir).map((dirName) => path.resolve(svgDir, dirName));
  for (const file of filesToClean) {
    fs.rmSync(file, { recursive: true });
  }
} else {
  fs.mkdirSync(svgDir);
}
// make icons fg/bg = black/transparent
const icons = globSync("icons/**/*.svg");
process.stdout.write("\nTransparentizing icons: ");
for (let i = 0; i < icons.length; i++) {
  const icon = icons[i];
  const filename = path.basename(icon);
  const newpath = path.resolve(svgDir, filename);
  const svg = svgson.parseSync(fs.readFileSync(icon));
  svg.children = svg.children.reduce((acc, child) => {
    if (process.stdout?.cursorTo) {
      process.stdout.cursorTo(25);
      process.stdout.clearLine(1);
      process.stdout.write(`Processing icon #${i} of ${icons.length}, ${filename}`);
    }
    const entries = Object.entries(child.attributes);
    if (entries.length === 1 && entries[0][0] === "d" && entries[0][1] === "M0 0h512v512H0z") return acc;
    child.attributes.fill = "#000";
    acc.push(child);
    return acc;
  }, []);
  fs.writeFileSync(newpath, svgson.stringify(svg));
}
if (process.stdout?.cursorTo) {
  process.stdout.cursorTo(25);
  process.stdout.clearLine(1);
  process.stdout.write("Done!\nGenerating font & styles... \n");
}

svgtofont({
  src: path.resolve(process.cwd(), "svg"), // svg path
  dist: path.resolve(process.cwd(), "styles"), // output path
  fontName: "game-icons.net", // font name
  css: true, // Create CSS files.
  emptyDist: true,
  classNamePrefix: "ginf",
}).then(() => {
  if (process.stdout?.cursorTo) process.stdout.write("Tidying unnessary artefacts...");
  const toDelete = globSync("styles/*.{styl,scss,less}");
  for (const file of toDelete) {
    fs.rmSync(file);
  }
  if (process.stdout?.cursorTo) process.stdout.write(" Done!\n");
});

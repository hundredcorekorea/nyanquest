const sharp = require("sharp");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "..", "public", "icons");
const SOURCE_DIR = "C:\\Users\\from_\\Documents\\nyanQuest";

async function generateIcons() {
  const iconSource = path.join(SOURCE_DIR, "대표_아이콘.png");
  const graphicSource = path.join(SOURCE_DIR, "그래픽이미지.png");

  // ===== App icons from original artwork =====
  const sizes = [192, 512];

  for (const size of sizes) {
    // Regular icon (with rounded corners via composite)
    await sharp(iconSource)
      .resize(size, size, { fit: "cover" })
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);

    // Maskable icon: add 20% safe zone padding with amber background
    const padding = Math.round(size * 0.1);
    const innerSize = size - padding * 2;
    const resizedIcon = await sharp(iconSource)
      .resize(innerSize, innerSize, { fit: "cover" })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 251, b: 235, alpha: 1 }, // #fffbeb
      },
    })
      .composite([{ input: resizedIcon, left: padding, top: padding }])
      .png()
      .toFile(path.join(ICONS_DIR, `icon-maskable-${size}.png`));
    console.log(`Generated icon-maskable-${size}.png`);
  }

  // ===== Favicon (32x32) =====
  await sharp(iconSource)
    .resize(32, 32, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS_DIR, "..", "favicon.png"));
  console.log("Generated favicon.png");

  // ===== Favicon ICO (16x16) for broader compatibility =====
  await sharp(iconSource)
    .resize(48, 48, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS_DIR, "..", "favicon-48.png"));
  console.log("Generated favicon-48.png");

  // ===== Apple touch icon (180x180) =====
  await sharp(iconSource)
    .resize(180, 180, { fit: "cover" })
    .png()
    .toFile(path.join(ICONS_DIR, "apple-touch-icon.png"));
  console.log("Generated apple-touch-icon.png");

  // ===== Screenshots from graphic image =====
  // Wide screenshot (1280x720) - crop from graphic image
  const graphicMeta = await sharp(graphicSource).metadata();
  console.log(`Graphic source: ${graphicMeta.width}x${graphicMeta.height}`);

  await sharp(graphicSource)
    .resize(1280, 720, { fit: "cover", position: "center" })
    .png()
    .toFile(path.join(ICONS_DIR, "screenshot-wide.png"));
  console.log("Generated screenshot-wide.png");

  // Narrow screenshot (720x1280) - create from graphic + icon combo
  const narrowBg = await sharp({
    create: {
      width: 720,
      height: 1280,
      channels: 4,
      background: { r: 255, g: 251, b: 235, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const graphicResized = await sharp(graphicSource)
    .resize(720, 405, { fit: "cover" })
    .png()
    .toBuffer();

  const iconResized = await sharp(iconSource)
    .resize(200, 200, { fit: "cover" })
    .png()
    .toBuffer();

  await sharp(narrowBg)
    .composite([
      { input: graphicResized, left: 0, top: 200 },
      { input: iconResized, left: 260, top: 700 },
    ])
    .png()
    .toFile(path.join(ICONS_DIR, "screenshot-narrow.png"));
  console.log("Generated screenshot-narrow.png");

  // ===== Default OG image (1200x630) for social sharing =====
  await sharp(graphicSource)
    .resize(1200, 630, { fit: "cover", position: "center" })
    .png()
    .toFile(path.join(ICONS_DIR, "..", "og-default.png"));
  console.log("Generated og-default.png (1200x630)");

  console.log("\nAll icons generated from original artwork!");
}

generateIcons().catch(console.error);

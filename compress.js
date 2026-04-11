import fs from "fs";
import path from "path";
import sharp from "sharp";

// The final target folder
const targetFolders = [
  "./public/modeimages/bg"
];

targetFolders.forEach((folder) => {
  const outputFolder = `${folder}_compressed`;

  // Create the output folder safely
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  // Double check the folder exists before scanning
  if (fs.existsSync(folder)) {
    const files = fs.readdirSync(folder);
    console.log(`\nScanning [${folder}]... Found ${files.length} items.`);

    files.forEach((file) => {
      // ONLY grab image files 
      if (file.match(/\.(jpg|jpeg|png)$/i)) {
        const inputPath = path.join(folder, file);
        const outputPath = path.join(outputFolder, file);

        sharp(inputPath)
          .jpeg({ quality: 60, mozjpeg: true })
          .toFile(outputPath)
          .then(() => console.log(`✅ Compressed: ${file}`))
          .catch((err) => console.error(`❌ Failed on ${file}:`, err));
      }
    });
  } else {
    console.log(`⚠️ Could not find folder: ${folder}`);
  }
});
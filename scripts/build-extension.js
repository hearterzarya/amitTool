const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const extensionDir = path.join(__dirname, '..', 'extention');
const outputDir = path.join(__dirname, '..', 'public', 'extension');
const zipFileName = 'growtools-extension.zip';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const zipPath = path.join(outputDir, zipFileName);

// Remove old zip if exists
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Files to include in the extension
const filesToInclude = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'logo.png',
  'lib/crypto-js.min.js',
  'lib/jquery-v3.3.1.min.js',
  'lib/underscore.min.js',
];

console.log('Building extension ZIP...');
console.log('Extension directory:', extensionDir);
console.log('Output ZIP:', zipPath);

// Check if all required files exist
const missingFiles = [];
for (const file of filesToInclude) {
  const filePath = path.join(extensionDir, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error('Missing files:', missingFiles);
  process.exit(1);
}

// Create ZIP file
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

output.on('close', () => {
  const stats = fs.statSync(zipPath);
  console.log(`✓ Extension ZIP created successfully!`);
  console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`  Location: ${zipPath}`);
});

archive.on('error', (err) => {
  console.error('Error creating ZIP:', err);
  process.exit(1);
});

archive.pipe(output);

// Add files to archive
for (const file of filesToInclude) {
  const filePath = path.join(extensionDir, file);
  archive.file(filePath, { name: file });
}

archive.finalize();

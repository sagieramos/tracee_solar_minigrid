const fs = require('fs');
const path = require('path');

console.log('🔨 Starting production build...\n');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
    console.log('✓ Created dist directory');
}

/**
 * Minify HTML with advanced optimizations
 */
function minifyHTML(html, filename) {
    let optimized = html;
    
    // Remove HTML comments
    optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');
    
    // Process style tags
    optimized = optimized.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs, css) => {
        let minified = css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around special chars
            .replace(/;\}/g, '}') // Remove last semicolon
            .replace(/([:\s])0(px|em|rem|%)/g, '$10'); // Remove units only from exact 0
        return `<style${attrs}>${minified.trim()}</style>`;
    });
    
    // Process script tags
    optimized = optimized.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, js) => {
        if (attrs.includes('src=')) {
            return match; // Keep external scripts as-is
        }
        let minified = js
            .replace(/\/\/.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .replace(/^\s+|\s+$/gm, '') // Trim each line
            .replace(/\n+/g, '\n'); // Collapse multiple newlines into one
        return `<script${attrs}>${minified.trim()}</script>`;
    });

    // Collapse extra whitespace between tags
    optimized = optimized.replace(/>\s+</g, '><');
    
    // Optimize CSS classes (sort for better gzip)
    optimized = optimized.replace(/ class="([^"]+)"/g, (match, p1) => {
        const classes = p1.split(' ')
            .filter(c => c.trim())
            .sort()
            .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
        const classStr = classes.join(' ');
        return classStr ? ` class="${classStr}"` : '';
    });
    
    // Remove trailing zeros from decimal values
    optimized = optimized.replace(/([:\s])0+(\.\d+)/g, '$1$2');
    
    return optimized.trim();
}

/**
 * Extract and inline critical CSS for faster FCP
 */
function extractCriticalCSS(html) {
    const criticalStyles = `
        body{margin:0;background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 50%,#f8fafc 100%);color:#0f172a;font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        .hidden{display:none}
        @media (min-width: 768px) {
            .md\\:hidden{display:none}
            .md\\:block{display:block}
        }
        .fixed{position:fixed}
        .top-0{top:0}.left-0{left:0}.right-0{right:0}
        .z-50{z-index:50}
        .bg-slate-900{background-color:#0f172a}
        .text-white{color:#fff}
        .text-yellow-500{color:#f59e0b}
        .flex{display:flex}
        .items-center{align-items:center}
        .justify-between{justify-content:space-between}
        .gap-3{gap:.75rem}
        .px-4{padding-left:1rem;padding-right:1rem}
        .py-3{padding-top:.75rem;padding-bottom:.75rem}
        .shadow-lg{box-shadow:0 10px 15px -3px rgba(0,0,0,.1)}
    `.replace(/\s+/g, ' ').trim();
    
    return criticalStyles;
}

/**
 * Add resource hints for better performance
 */
function addResourceHints(html) {
    const resourceHints = `
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" as="style">
        <link rel="preload" href="output.css" as="style">
        <link rel="stylesheet" href="output.css">
    `.replace(/\s+/g, ' ').trim();
    
    // Insert after <head> tag
    html = html.replace('<head>', `<head>\n    ${resourceHints}`);
    
    return html;
}

/**
 * Process HTML files
 */
const htmlFiles = [
    { input: 'src/index.html', output: 'dist/index.html' },
    { input: 'src/briefing.html', output: 'dist/briefing.html' }
];

let totalOriginal = 0;
let totalMinified = 0;

console.log('📄 Processing HTML files...\n');

htmlFiles.forEach(({ input, output }) => {
    if (fs.existsSync(input)) {
        let content = fs.readFileSync(input, 'utf8');
        
        // Add resource hints
        content = addResourceHints(content);
        
        // Inline critical CSS before closing </head>
        const criticalCSS = extractCriticalCSS(content);
        content = content.replace('</head>', `    <style>${criticalCSS}</style>\n</head>`);
        
        // Minify
        const minified = minifyHTML(content, input);
        fs.writeFileSync(output, minified);
        
        const originalSize = Buffer.byteLength(content, 'utf8');
        const minifiedSize = Buffer.byteLength(minified, 'utf8');
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
        
        totalOriginal += originalSize;
        totalMinified += minifiedSize;
        
        console.log(`✓ ${input} → ${output}`);
        console.log(`  Original:  ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`  Minified:  ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`  Saved:     ${savings}%\n`);
    } else {
        console.log(`✗ ${input} not found`);
    }
});

/**
 * Copy SVG files to dist (optimized)
 */
console.log('📐 Processing SVG files...\n');

const svgFiles = ['minigrid_diagram.svg', 'distribution_layout.svg', 'capex_composition.svg', 'capital_structure.svg'];

svgFiles.forEach(svg => {
    const inputPath = `src/assets/${svg}`;
    if (fs.existsSync(inputPath)) {
        let content = fs.readFileSync(inputPath, 'utf8');
        const originalSize = Buffer.byteLength(content, 'utf8');
        
        // Basic SVG optimization
        let optimized = content
            .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/>\s+</g, '><') // Remove spaces between tags
            .replace(/ class=""/g, '') // Remove empty classes
            .trim();
        
        const optimizedSize = Buffer.byteLength(optimized, 'utf8');
        const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
        
        fs.writeFileSync(`dist/${svg}`, optimized);
        console.log(`✓ ${inputPath} → dist/${svg}`);
        console.log(`  Original:  ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`  Optimized: ${(optimizedSize / 1024).toFixed(2)} KB`);
        console.log(`  Saved:     ${savings}%\n`);
    }
});

/**
 * Copy static assets
 */
console.log('📦 Copying static assets...\n');

const staticAssets = ['manifest.json'];
staticAssets.forEach(asset => {
    const inputPath = `src/${asset}`;
    if (fs.existsSync(inputPath)) {
        fs.copyFileSync(inputPath, `dist/${asset}`);
        console.log(`✓ ${inputPath} → dist/${asset}`);
    }
});

/**
 * Copy backup files for reference
 */
console.log('📋 Creating build manifest...\n');

const manifest = {
    buildTime: new Date().toISOString(),
    files: {
        html: htmlFiles.map(f => f.output.replace('dist/', '')),
        svg: svgFiles.filter(f => fs.existsSync(`dist/${f}`)).map(f => f),
        static: staticAssets.filter(f => fs.existsSync(`dist/${f}`))
    },
    stats: {
        totalOriginal: `${(totalOriginal / 1024).toFixed(2)} KB`,
        totalMinified: `${(totalMinified / 1024).toFixed(2)} KB`,
        savings: `${((1 - totalMinified / totalOriginal) * 100).toFixed(1)}%`
    },
    recommendations: [
        'Enable Gzip/Brotli compression on your server',
        'Use a CDN for static assets',
        'Set proper cache headers (7 days for static assets)',
        'Consider lazy-loading non-critical images'
    ]
};

fs.writeFileSync('dist/build-manifest.json', JSON.stringify(manifest, null, 2));
console.log('✓ Created dist/build-manifest.json\n');

/**
 * Summary
 */
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Build Summary`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`HTML Original:   ${(totalOriginal / 1024).toFixed(2)} KB`);
console.log(`HTML Minified:   ${(totalMinified / 1024).toFixed(2)} KB`);
console.log(`Total Saved:     ${((1 - totalMinified / totalOriginal) * 100).toFixed(1)}%`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n✅ Production build complete!');
console.log('📁 Deploy files from ./dist directory');
console.log('\n🚀 Next steps:');
console.log('   1. Run: npm run build:css (build Tailwind CSS)');
console.log('   2. Enable Gzip/Brotli on your server');
console.log('   3. Upload dist/ to your hosting\n');

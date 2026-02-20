const fs = require('fs');

function minifyHTML(html) {
    return html
        .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
        .replace(/\n\s*/g, '\n') // Remove leading whitespace on lines
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/>\s+</g, '><') // Remove spaces between tags
        .replace(/^\s+|\s+$/g, '') // Trim
        .replace(/ class="([^"]+)"/g, (match, p1) => {
            // Sort class names for better gzip compression
            const sorted = p1.split(' ').sort().unique().join(' ');
            return sorted ? ` class="${sorted}"` : '';
        });
}

// Add unique method to Array if not exists
if (!Array.prototype.unique) {
    Array.prototype.unique = function() {
        return [...new Set(this)];
    };
}

function optimizeHTML(content, filename) {
    let optimized = content;
    
    // Remove unused CSS classes (keep only essential ones)
    // This is a simple optimization - for production use PurgeCSS
    
    // Optimize script tags
    optimized = optimized.replace(/<script>/g, '<script>');
    
    // Remove trailing zeros from decimal values in CSS
    optimized = optimized.replace(/(:|\s)0+(\.\d+)/g, '$1$2');
    
    // Minify inline CSS in style tags
    optimized = optimized.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs, css) => {
        const minifiedCSS = css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around special chars
            .replace(/;\}/g, '}') // Remove last semicolon
            .replace(/0(px|em|rem|%)/g, '0'); // Remove units from 0
        return `<style${attrs}>${minifiedCSS}</style>`;
    });
    
    return minifyHTML(optimized);
}

const files = [
    { input: 'index.html', output: 'index.min.html' },
    { input: 'briefing.html', output: 'briefing.min.html' }
];

console.log('🔨 Optimizing HTML files for production...\n');

let totalOriginal = 0;
let totalMinified = 0;

files.forEach(({ input, output }) => {
    if (fs.existsSync(input)) {
        const content = fs.readFileSync(input, 'utf8');
        const optimized = optimizeHTML(content, input);
        fs.writeFileSync(output, optimized);
        
        const originalSize = Buffer.byteLength(content, 'utf8');
        const minifiedSize = Buffer.byteLength(optimized, 'utf8');
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

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Total Original:  ${(totalOriginal / 1024).toFixed(2)} KB`);
console.log(`Total Minified:  ${(totalMinified / 1024).toFixed(2)} KB`);
console.log(`Total Saved:     ${((1 - totalMinified / totalOriginal) * 100).toFixed(1)}%`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n✅ Production build complete!');
console.log('📁 Deploy the .min.html files for production.');

#!/bin/bash

# Production Build Script for TraceeSolar Minigrid
# Optimizes HTML files for deployment

echo "🔨 Building production files..."

# Check if html-minifier is available, if not use node
if command -v html-minifier &> /dev/null; then
    echo "✓ Using html-minifier CLI"
    
    # Minify index.html
    html-minifier \
        --collapse-whitespace \
        --remove-comments \
        --minify-css true \
        --minify-js true \
        --remove-optional-tags \
        --remove-redundant-attributes \
        --use-short-doctype \
        --input-dir . \
        --output-dir . \
        --file-ext html:html
    
    echo "✓ Minification complete"
else
    echo "⚠ html-minifier not found. Using manual optimization..."
    
    # Create optimized versions using sed/awk
    for file in index.html briefing.html; do
        if [ -f "$file" ]; then
            # Remove HTML comments, collapse whitespace, trim
            sed -e 's/<!--[^>]*-->//g' \
                -e 's/  */ /g' \
                -e 's/> </></g' \
                -e '/^[[:space:]]*$/d' \
                "$file" > "${file%.html}.min.html"
            echo "✓ Created ${file%.html}.min.html"
        fi
    done
fi

# Check if Node.js is available for better minification
if command -v node &> /dev/null; then
    echo "✓ Node.js available, creating optimized build..."
    
    # Create a simple Node.js minification script
    cat > minify.js << 'NODESCRIPT'
const fs = require('fs');
const path = require('path');

function minifyHTML(html) {
    return html
        .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/>\s+</g, '><') // Remove spaces between tags
        .replace(/^\s+|\s+$/g, '') // Trim
        .replace(/<!DOCTYPE html>/gi, '<!DOCTYPE html>') // Normalize doctype
        .replace(/<html lang="en"/gi, '<html lang="en"') // Normalize html tag
        .replace(/class="([^"]+)"/g, (match, p1) => {
            // Sort class names for better gzip compression
            return 'class="' + p1.split(' ').sort().join(' ') + '"';
        });
}

const files = ['index.html', 'briefing.html'];

files.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const minified = minifyHTML(content);
        const outputPath = file.replace('.html', '.min.html');
        fs.writeFileSync(outputPath, minified);
        console.log(`✓ Minified ${file} → ${outputPath}`);
        console.log(`  Original: ${(content.length / 1024).toFixed(2)} KB`);
        console.log(`  Minified: ${(minified.length / 1024).toFixed(2)} KB`);
        console.log(`  Saved: ${((1 - minified.length / content.length) * 100).toFixed(1)}%`);
    }
});
NODESCRIPT

    node minify.js
    rm minify.js
fi

echo ""
echo "📊 File size comparison:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh *.html | awk '{print $9 ": " $5}'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Build complete! Deploy the .min.html files for production."

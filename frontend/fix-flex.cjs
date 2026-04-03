const fs = require('fs');
const path = require('path');

const srcDir = path.join('c:', 'Users', 'Naveen', 'Downloads', 'tool (3)to', 'tool (2)to', 'toolto', 'tool', 'frontend', 'src', 'pages');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

walkDir(srcDir, function(filePath) {
    if (filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Fix 1: Add min-h-0 to the nested wrapper in all pages
        if (content.includes('className="fade-in flex flex-col h-full overflow-hidden"')) {
            content = content.replace(/className="fade-in flex flex-col h-full overflow-hidden"/g, 'className="fade-in flex flex-col h-full overflow-hidden min-h-0"');
            modified = true;
        }

        // Fix 2: Ensure CustomerOutstanding uses master-content-layout
        // Right now it checks: isEmbedded ? 'p-0 pb-24' : 'master-content-layout'
        // That strips flex: 1 and min-h-0!
        if (content.includes("isEmbedded ? 'p-0 pb-24' : 'master-content-layout'")) {
            content = content.replace(/isEmbedded \? 'p-0 pb-24' : 'master-content-layout'/g, "isEmbedded ? 'master-content-layout p-0 pb-32' : 'master-content-layout'");
            modified = true;
        }
        
        // Let's also catch any others that strip master-content-layout
        if (content.match(/isEmbedded\s*\?\s*'p-0'\s*:\s*'master-content-layout'/)) {
            content = content.replace(/isEmbedded\s*\?\s*'p-0'\s*:\s*'master-content-layout'/g, "isEmbedded ? 'master-content-layout p-0 pb-32' : 'master-content-layout'");
            modified = true;
        }

        // Some pages might not have the wrapper in `if (isEmbedded)`:
        // Wait, CustomerOutstanding has: `if (isEmbedded) return content;`
        // But in ReportsPage it's rendered inside flex-1 flex col block.
        // It's perfectly fine if `content` itself gets `master-content-layout` (which supplies flex: 1, min-h: 0, overflow-y-auto).
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Updated min-h-0 / layout:", filePath);
        }
    }
});

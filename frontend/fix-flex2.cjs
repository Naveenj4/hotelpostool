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

        // Replace h-full with flex-1
        if (content.includes('className="fade-in flex flex-col h-full overflow-hidden min-h-0"')) {
            content = content.replace(/className="fade-in flex flex-col h-full overflow-hidden min-h-0"/g, 'className="fade-in flex-1 flex flex-col min-h-0 overflow-hidden w-full"');
            modified = true;
        }
        
        // Let's also check if any are still without min-h-0
        if (content.includes('className="fade-in flex flex-col h-full overflow-hidden"')) {
            content = content.replace(/className="fade-in flex flex-col h-full overflow-hidden"/g, 'className="fade-in flex-1 flex flex-col min-h-0 overflow-hidden w-full"');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Updated h-full to flex-1:", filePath);
        }
    }
});

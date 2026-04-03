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

        // Pattern 1: p-0 pt-2 lg:p-0 -> pb-24
        if (content.includes("isEmbedded ? 'p-0 pt-2 lg:p-0' : 'p-6 lg:p-14'")) {
            content = content.replace(/isEmbedded \? 'p-0 pt-2 lg:p-0' : 'p-6 lg:p-14'/g, "isEmbedded ? 'p-0 pb-24 pt-2 lg:px-0 lg:pb-32' : 'p-6 lg:p-14 pb-24'");
            modified = true;
        }

        // Pattern 2: p-0 : p-6 lg:p-14
        if (content.includes("isEmbedded ? 'p-0' : 'p-6 lg:p-14'")) {
            content = content.replace(/isEmbedded \? 'p-0' : 'p-6 lg:p-14'/g, "isEmbedded ? 'p-0 pb-32' : 'p-6 lg:p-14 pb-24'");
            modified = true;
        }

        // Pattern 3: p-0 pt-2 : p-6 lg:p-14
        if (content.includes("isEmbedded ? 'p-0 pt-2' : 'p-6 lg:p-14'")) {
            content = content.replace(/isEmbedded \? 'p-0 pt-2' : 'p-6 lg:p-14'/g, "isEmbedded ? 'p-0 pt-2 pb-32' : 'p-6 lg:p-14 pb-24'");
            modified = true;
        }

        // Pattern 4: CategoryWiseSales p-0 : p-6 lg:p-10
        if (content.includes("isEmbedded ? 'p-0' : 'p-6 lg:p-10'")) {
            content = content.replace(/isEmbedded \? 'p-0' : 'p-6 lg:p-10'/g, "isEmbedded ? 'p-0 pb-32' : 'p-6 lg:p-10 pb-24'");
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Updated:", filePath);
        }
    }
});

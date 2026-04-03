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

        // Any isEmbedded ? 'p-0' ... should be parsed and 'pb-24' inserted before closing quote.
        // It looks like: className={`${isEmbedded ? 'p-0' : ...
        content = content.replace(/(isEmbedded\s*\?\s*'p-0)(\s*pt-2)?(\s*lg:p-0)?'(\s*:\s*')/g, "$1$2 pb-24$3'$4");
        // For ones that we already updated, it might be p-0 pb-24 now.
        // Let's just be simple and do exact strings that weren't caught

        if (content.match(/isEmbedded\s*\?\s*'p-0'\s*:\s*'master-content-layout'/g)) {
            content = content.replace(/isEmbedded\s*\?\s*'p-0'\s*:\s*'master-content-layout'/g, "isEmbedded ? 'p-0 pb-32' : 'master-content-layout'");
            modified = true;
        }

        // For DayWisePurchase and others
        if (content.match(/isEmbedded\s*\?\s*'p-0'\s*:\s*'p-6 lg:p-14'/g)) {
            content = content.replace(/isEmbedded\s*\?\s*'p-0'\s*:\s*'p-6 lg:p-14'/g, "isEmbedded ? 'p-0 pb-32' : 'p-6 lg:p-14 pb-24'");
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Updated exactly:", filePath);
        }
    }
});

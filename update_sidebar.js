const fs = require('fs');
const files = [
    'frontend/src/pages/dashboard/BillsAndSalesPage.jsx',
    'frontend/src/pages/dashboard/CategoryMaster.jsx',
    'frontend/src/pages/dashboard/CounterMaster.jsx',
    'frontend/src/pages/ReportsPage.jsx',
    'frontend/src/pages/SettingsPage.jsx',
    'frontend/src/pages/StockPage.jsx'
];
const replacement = `    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };`;

const regex = /^[ \t]*const toggleSidebar = \(\) => \{\r?\n[ \t]*const newState = !isCollapsed;\r?\n[ \t]*setIsCollapsed\(newState\);\r?\n[ \t]*localStorage\.setItem\('sidebarCollapsed', newState\);\r?\n[ \t]*\};/m;

let count = 0;
for (const file of files) {
    if (fs.existsSync(file)) {
        let text = fs.readFileSync(file, 'utf8');
        if (regex.test(text)) {
            // check if we need \r\n
            const repl = text.includes('\r\n') ? replacement.replace(/\n/g, '\r\n') : replacement;
            text = text.replace(regex, repl);
            fs.writeFileSync(file, text);
            count++;
        } else {
            console.log('Target not found in ' + file);
        }
    } else {
        console.log('File not found: ' + file);
    }
}
console.log('Updated ' + count + ' files.');

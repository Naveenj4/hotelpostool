const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            filelist = walkSync(filePath, filelist);
        } else if (file.endsWith('.jsx')) {
            filelist.push(filePath);
        }
    });
    return filelist;
};

const pages = walkSync(pagesDir);

pages.forEach(file => {
    if (file.includes('AccessControlPage.jsx') || file.includes('SelfServiceDashboard.jsx') || file.includes('BillingPage.jsx')) return;
    if (!fs.readFileSync(file, 'utf8').includes('toggleSidebar')) return;

    let content = fs.readFileSync(file, 'utf8');

    // Skip if already applied
    if (content.includes('isMobileSidebarOpen')) return;

    // 1. Add state hook
    content = content.replace(
        /const \[isCollapsed, setIsCollapsed\] = useState\(\(\) => localStorage.getItem\('sidebarCollapsed'\) === 'true'\);/g,
        `const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);`
    );

    // 2. Replace toggleSidebar function
    const oldToggle = `const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState);
    };`;

    const newToggle = `const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };`;

    content = content.replace(oldToggle, newToggle);

    // also check other variations of toggleSidebar (ProductMaster has it inline or different)
    // ProductMaster has: 
    // <Header toggleSidebar={() => {
    //    const ns = !isCollapsed;
    //    setIsCollapsed(ns);
    //    localStorage.setItem('sidebarCollapsed', ns);
    // }} />
    content = content.replace(
        /<Header toggleSidebar=\{\(\) => \{\s*const ns = !isCollapsed;\s*setIsCollapsed\(ns\);\s*localStorage\.setItem\('sidebarCollapsed', ns\);\s*\}\} \/>/g,
        `<Header toggleSidebar={() => window.innerWidth <= 768 ? setIsMobileSidebarOpen(!isMobileSidebarOpen) : (setIsCollapsed(!isCollapsed), localStorage.setItem('sidebarCollapsed', !isCollapsed))} />`
    );

    // 3. Update Sidebar usages
    content = content.replace(
        /<Sidebar isCollapsed=\{isCollapsed\} \/>/g,
        `<Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />
            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}`
    );

    fs.writeFileSync(file, content);
    console.log(`Updated: ${file}`);
});

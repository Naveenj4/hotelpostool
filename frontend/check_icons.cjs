const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\navee\\Downloads\\tool (2)to\\toolto\\tool\\frontend\\src';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const jxFiles = getAllFiles(srcDir).filter(f => f.endsWith('.jsx'));

jxFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find icons used in JSX: <IconName ... /> or {IconName}
  const usedIcons = new Set();
  const iconRegex = /<([A-Z][A-Za-z0-9]+)\s/g;
  let match;
  while ((match = iconRegex.exec(content)) !== null) {
    usedIcons.add(match[1]);
  }
  
  // Also check for Icon as ImageIcon (aliased)
  const aliasRegex = /\s([A-Z][A-Za-z0-9]+)\s+as\s+([A-Z][A-Za-z0-9]+)/g;
  const aliases = {};
  while ((match = aliasRegex.exec(content)) !== null) {
      aliases[match[2]] = match[1];
  }

  // Common React/Component exclusions
  const exclusions = new Set(['Sidebar', 'Header', 'Route', 'Navigate', 'Routes', 'AuthProvider', 'Provider', 'Link', 'Outlet', 'TableLogo', 'TableSVG', 'KpiCard', 'ReservationModal', 'TableCard', 'BillPreviewModal', 'SidebarPaymentFlow', 'CardSkeleton', 'Image', 'ProtectedGate', 'PermissionRoute', 'ProtectedRoute', 'AppRoutes', 'AuthContext', 'BrowserRouter', 'Chart', 'Bar', 'Pie', 'Doughnut', 'Line', 'ThemeContext', 'Suspense']);
  
  // Check imports from lucide-react
  const lucideMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/);
  const importedIcons = new Set();
  if (lucideMatch) {
    lucideMatch[1].split(',').forEach(i => {
      const parts = i.trim().split(/\s+as\s+/);
      importedIcons.add(parts[0].trim());
      if (parts[1]) importedIcons.add(parts[1].trim());
    });
  }

  const missing = [];
  usedIcons.forEach(icon => {
    if (!importedIcons.has(icon) && !exclusions.has(icon) && !aliases[icon]) {
      // Check if it's imported from somewhere else (like another component)
      const otherImport = new RegExp(`import\\s+.*${icon}.*\\s+from`).test(content);
      if (!otherImport) {
          missing.push(icon);
      }
    }
  });

  if (missing.length > 0) {
    console.log(`File: ${file}`);
    console.log(`Missing Lucide Icons: ${missing.join(', ')}`);
    console.log('---');
  }
});

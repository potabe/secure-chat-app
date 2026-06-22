const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/Primananda/Desktop/secure-chat/client/src';

const colorMap = {
  'bg-[#313338]': 'bg-background',
  'bg-[#2b2d31e6]': 'bg-card/90',
  'bg-[#2b2d31]': 'bg-card',
  'bg-[#1e1f22]': 'bg-secondary',
  'bg-[#383a40]': 'bg-input',
  'bg-[#3f4147]': 'bg-accent',
  'bg-[#4e5058]': 'bg-muted-foreground',
  'border-[#3f4147]': 'border-border',
  'border-[#ffffff14]': 'border-border',
  'text-[#dbdee1]': 'text-foreground',
  'text-[#80848e]': 'text-muted-foreground',
  'text-[#4e5058]': 'text-muted-foreground',
  'text-white': 'text-foreground', // Careful with text-white if primary button uses it
  'bg-[#2e3035]': 'bg-accent',
};

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Manual safe replacements
  content = content.replace(/bg-\[\#313338\]/g, 'bg-background');
  content = content.replace(/bg-\[\#1e1f22\]/g, 'bg-secondary');
  content = content.replace(/bg-\[\#2b2d31\]/g, 'bg-card');
  content = content.replace(/bg-\[\#2b2d31e6\]/g, 'bg-card/90');
  content = content.replace(/bg-\[\#383a40\]/g, 'bg-input');
  
  content = content.replace(/hover:bg-\[\#2e3035\]/g, 'hover:bg-accent');
  content = content.replace(/hover:bg-\[\#3f4147\]/g, 'hover:bg-accent');
  content = content.replace(/bg-\[\#3f4147\]/g, 'bg-accent');
  
  content = content.replace(/border-\[\#3f4147\]/g, 'border-border');
  content = content.replace(/border-\[\#ffffff14\]/g, 'border-border');
  
  content = content.replace(/text-\[\#dbdee1\]/g, 'text-foreground');
  content = content.replace(/text-\[\#80848e\]/g, 'text-muted-foreground');
  content = content.replace(/text-\[\#4e5058\]/g, 'text-muted-foreground');
  
  // Specific inline styles in ChatPage, ChannelSidebar
  content = content.replace(/background:\s*['"]#313338['"]/g, 'background: "var(--background)"');
  content = content.replace(/background:\s*['"]#1e1f22['"]/g, 'background: "var(--secondary)"');
  content = content.replace(/borderRight:\s*['"]1px solid #3f4147['"]/g, 'borderRight: "1px solid var(--border)"');
  content = content.replace(/color:\s*['"]#80848e['"]/g, 'color: "var(--muted-foreground)"');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir(directory);
console.log('Done!');

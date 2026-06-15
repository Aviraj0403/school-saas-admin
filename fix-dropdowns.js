const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = walk(path.join(__dirname, 'src', 'app'));
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const origContent = content;
  
  // Use [\s\S]*? to match until the FIRST > that is actually the end of the tag.
  // Wait, if we use [\s\S]*?>, it will stop at the first > inside onChange={(e) => ...}
  // So we should just replace className="[^"]+" inside the entire file wherever it's close to Dropdown
  // Better approach: Since Dropdown is a known element, let's just find "className=" and if it's near <Dropdown we can be safe, 
  // or we can use a small parser, but regex is fine if we replace all className=".*" that have border, bg-, rounded ONLY if they are inside <Dropdown
  
  // Let's use a while loop with indexOf('<Dropdown') and indexOf('>', ...) but skip '=>'
  // Actually, we can split by '<Dropdown' and process each chunk.
  
  const chunks = content.split('<Dropdown');
  for (let i = 1; i < chunks.length; i++) {
    // Find the end of the Dropdown tag.
    // It's tricky with '=>', but typically there's a '/>' or '>'
    // Let's just find the first `className="([^"]+)"` in chunks[i] before any `</Dropdown>` or `/>`
    // Actually, we can just replace className="([^"]+)" across the whole chunk up to `/>` or `>` 
    
    chunks[i] = chunks[i].replace(/className="([^"]+)"/, (classMatch, classes) => {
      const badPrefixes = ['border', 'bg-', 'dark:border', 'dark:bg', 'rounded', 'outline', 'hover:', 'focus:', 'transition', 'dark:hover:', 'dark:focus:', 'focus-within:'];
      const keepClasses = classes.split(/\s+/).filter(cls => {
        if (!cls) return false;
        if (badPrefixes.some(p => cls.startsWith(p))) return false;
        if (cls.includes('border')) return false;
        return true;
      });
      return `className="${keepClasses.join(' ')}"`;
    });
  }
  
  content = chunks.join('<Dropdown');
  
  if (content !== origContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log('Fixed Dropdown in:', file);
  }
});

console.log('Total files changed:', changedFiles);

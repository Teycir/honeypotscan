export function parseSourceCode(sourceCode: string): string {
  const normalized = sourceCode.trim();
  const cleaned = normalized.startsWith('{{') && normalized.endsWith('}}') 
    ? normalized.slice(1, -1) 
    : normalized;
  
  if (cleaned.startsWith('{')) {
    try {
      const json = JSON.parse(cleaned);
      
      if (json.sources) {
        let combined = '';
        for (const [filename, fileObj] of Object.entries(json.sources)) {
          if ((fileObj as any).content) {
            combined += `// File: ${filename}\n${(fileObj as any).content}\n\n`;
          }
        }
        if (combined) return combined;
      }
    } catch (e) {
      // Not JSON, return as-is
    }
  }
  
  return sourceCode;
}

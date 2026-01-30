interface SourceFile {
  content?: string;
}

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
          const file = fileObj as SourceFile;
          if (file.content) {
            combined += `// File: ${filename}\n${file.content}\n\n`;
          }
        }
        if (combined) return combined;
      }
    } catch {
      // Not JSON, return as-is
    }
  }
  
  return sourceCode;
}

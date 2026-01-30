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
    } catch (error) {
      // Log JSON parse failures for debugging purposes
      // This helps identify malformed source code responses from APIs
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[parser] JSON parse failed for source code:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          preview: cleaned.substring(0, 100) + '...',
        });
      }
      // Not JSON or malformed JSON, return as-is
    }
  }
  
  return sourceCode;
}

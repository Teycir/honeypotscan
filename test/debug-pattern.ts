import { readFileSync } from "fs";
import { HONEYPOT_PATTERNS } from "../lib/patterns";

const filePath = "/home/teycir/smartcontractpatternfinderReports/report_1769549264/sources/ethereum/001_0x4c89364f18ecc562165820989549022e64ec2ed2_risk474.sol";
const source = readFileSync(filePath, "utf-8");

console.log("Testing patterns on:", filePath);
console.log("=".repeat(80));

for (const pattern of HONEYPOT_PATTERNS) {
  const match = pattern.regex.exec(source);
  if (match) {
    const lineNumber = source.substring(0, match.index).split('\n').length;
    console.log(`\n✅ MATCH: ${pattern.name}`);
    console.log(`   Line: ${lineNumber}`);
    console.log(`   Preview: ${match[0].substring(0, 150).replace(/\n/g, ' ')}...`);
  } else {
    console.log(`❌ NO MATCH: ${pattern.name}`);
  }
}

// Test if tx.origin exists in the file
console.log("\n" + "=".repeat(80));
const txOriginMatches = source.match(/tx\.origin/g);
console.log(`\nTotal tx.origin occurrences: ${txOriginMatches ? txOriginMatches.length : 0}`);

if (txOriginMatches && txOriginMatches.length > 0) {
  const lines = source.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('tx.origin')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
    }
  });
}

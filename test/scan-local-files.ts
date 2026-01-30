import { detectHoneypot } from "../lib/detector";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";

interface ScanResult {
  file: string;
  address: string;
  chain: string;
  riskScore: number;
  isHoneypot: boolean;
  patternsFound: number;
  patterns: Array<{ name: string; line: number }>;
}

function extractInfoFromFilename(filename: string): {
  address: string;
  riskScore: number;
} {
  const match = filename.match(/0x[a-fA-F0-9]+_risk(\d+)\.sol$/);
  const addressMatch = filename.match(/(0x[a-fA-F0-9]+)/);
  
  return {
    address: addressMatch ? addressMatch[1] : "unknown",
    riskScore: match ? parseInt(match[1]) : 0,
  };
}

function getAllSolidityFiles(dir: string): Array<{ path: string; chain: string }> {
  const files: Array<{ path: string; chain: string }> = [];
  
  function traverse(currentDir: string, chain: string = "") {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        const newChain = ["ethereum", "polygon", "arbitrum"].includes(item) ? item : chain;
        traverse(fullPath, newChain);
      } else if (item.endsWith(".sol")) {
        files.push({ path: fullPath, chain: chain || "unknown" });
      }
    }
  }
  
  traverse(dir);
  return files;
}

function scanLocalFiles(sourceDir: string): ScanResult[] {
  console.log("🛡️  HoneypotScan - Local File Scanner");
  console.log("=".repeat(80));
  console.log(`\n📂 Source directory: ${sourceDir}\n`);

  const files = getAllSolidityFiles(sourceDir);
  console.log(`Found ${files.length} Solidity files\n`);

  const results: ScanResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const { path: filePath, chain } = files[i];
    const filename = basename(filePath);
    const { address, riskScore } = extractInfoFromFilename(filename);

    console.log(`[${i + 1}/${files.length}] ${filename}`);
    console.log(`  Chain: ${chain} | Address: ${address} | Risk Score: ${riskScore}`);

    try {
      const source = readFileSync(filePath, "utf-8");
      const { isHoneypot, patterns } = detectHoneypot(source);

      results.push({
        file: filename,
        address,
        chain,
        riskScore,
        isHoneypot,
        patternsFound: patterns.length,
        patterns: patterns.map(p => ({ name: p.name, line: p.line })),
      });

      if (isHoneypot) {
        console.log(`  🚨 HONEYPOT DETECTED - ${patterns.length} patterns found`);
        patterns.forEach((p) => console.log(`     - ${p.name} (line ${p.line})`));
      } else {
        console.log(`  ✅ Safe - no honeypot patterns detected`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${(error as Error).message}`);
    }

    console.log("");
  }

  return results;
}

function printSummary(results: ScanResult[]) {
  console.log("=".repeat(80));
  console.log("📊 SCAN SUMMARY");
  console.log("=".repeat(80));

  const honeypots = results.filter((r) => r.isHoneypot);
  const safe = results.filter((r) => !r.isHoneypot);

  console.log(`\nTotal Scanned: ${results.length}`);
  console.log(`🚨 Honeypots Detected: ${honeypots.length}`);
  console.log(`✅ Safe Contracts: ${safe.length}`);

  if (honeypots.length > 0) {
    console.log("\n" + "-".repeat(80));
    console.log("🚨 HONEYPOT CONTRACTS:");
    console.log("-".repeat(80));
    
    honeypots.forEach((contract) => {
      console.log(`\n📍 ${contract.file}`);
      console.log(`   Address: ${contract.address}`);
      console.log(`   Chain: ${contract.chain}`);
      console.log(`   Risk Score: ${contract.riskScore}`);
      console.log(`   Patterns Found: ${contract.patternsFound}`);
      contract.patterns.forEach(p => {
        console.log(`     - ${p.name} (line ${p.line})`);
      });
    });
  }

  console.log("\n" + "-".repeat(80));
  console.log("📈 DETECTION STATISTICS:");
  console.log("-".repeat(80));
  
  const byChain = results.reduce((acc, r) => {
    if (!acc[r.chain]) {
      acc[r.chain] = { total: 0, honeypots: 0 };
    }
    acc[r.chain].total++;
    if (r.isHoneypot) acc[r.chain].honeypots++;
    return acc;
  }, {} as Record<string, { total: number; honeypots: number }>);

  Object.entries(byChain).forEach(([chain, stats]) => {
    const rate = ((stats.honeypots / stats.total) * 100).toFixed(1);
    console.log(`${chain.padEnd(15)} ${stats.honeypots}/${stats.total} (${rate}%)`);
  });

  console.log("\n" + "-".repeat(80));
  console.log("🎯 ACCURACY CHECK (comparing with risk scores):");
  console.log("-".repeat(80));
  
  const highRiskContracts = results.filter(r => r.riskScore >= 100);
  const detectedHighRisk = highRiskContracts.filter(r => r.isHoneypot);
  
  console.log(`High-risk contracts (risk >= 100): ${highRiskContracts.length}`);
  console.log(`Detected as honeypots: ${detectedHighRisk.length}`);
  if (highRiskContracts.length > 0) {
    const accuracy = ((detectedHighRisk.length / highRiskContracts.length) * 100).toFixed(1);
    console.log(`Detection accuracy on high-risk: ${accuracy}%`);
  }

  const lowRiskContracts = results.filter(r => r.riskScore < 50);
  const falsePositives = lowRiskContracts.filter(r => r.isHoneypot);
  
  console.log(`\nLow-risk contracts (risk < 50): ${lowRiskContracts.length}`);
  console.log(`Detected as honeypots (false positives?): ${falsePositives.length}`);

  console.log("\n" + "=".repeat(80) + "\n");
}

async function main() {
  const sourceDir = process.argv[2] || "/home/teycir/smartcontractpatternfinderReports/report_1769549264/sources";
  
  const results = scanLocalFiles(sourceDir);
  printSummary(results);

  const outputFile = `test/results/scan-local-results-${Date.now()}.json`;
  const fs = await import("fs/promises");
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        sourceDirectory: sourceDir,
        totalScanned: results.length,
        honeypots: results.filter((r) => r.isHoneypot),
        safe: results.filter((r) => !r.isHoneypot),
      },
      null,
      2
    )
  );

  console.log(`💾 Results saved to: ${outputFile}\n`);
}

main().catch(console.error);

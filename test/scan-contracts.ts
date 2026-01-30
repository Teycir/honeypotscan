import { fetchContractSource } from "../lib/fetcher";
import { detectHoneypot } from "../lib/detector";
import type { Env } from "../types";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    // .env.local not found, continue
  }
}

loadEnv();

interface ContractResult {
  address: string;
  isHoneypot: boolean;
  patternsFound: number;
  chain: string;
  error?: string;
}

async function getRecentContracts(
  apiKey: string,
  chain: string = "ethereum",
  startBlock: number,
  endBlock: number
): Promise<string[]> {
  const chainIds: Record<string, number> = {
    ethereum: 1,
    polygon: 137,
    arbitrum: 42161,
  };

  const chainId = chainIds[chain];
  const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=${endBlock}&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "1" && Array.isArray(data.result)) {
      const uniqueAddresses = new Set<string>();
      data.result.forEach((log: { address: string }) => {
        if (log.address) {
          uniqueAddresses.add(log.address);
        }
      });
      return Array.from(uniqueAddresses);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching contracts for blocks ${startBlock}-${endBlock}:`, error);
    return [];
  }
}

async function scanContracts(
  contracts: string[],
  chain: string,
  env: Env
): Promise<ContractResult[]> {
  const results: ContractResult[] = [];

  for (let i = 0; i < contracts.length; i++) {
    const address = contracts[i];
    console.log(`\n[${i + 1}/${contracts.length}] Scanning: ${address}`);

    try {
      const source = await fetchContractSource(address, chain, env);
      
      if (!source) {
        console.log(`  ⚠️  No source code available`);
        results.push({
          address,
          isHoneypot: false,
          patternsFound: 0,
          chain,
          error: "No source code",
        });
        continue;
      }

      const { isHoneypot, patterns } = detectHoneypot(source);

      results.push({
        address,
        isHoneypot,
        patternsFound: patterns.length,
        chain,
      });

      if (isHoneypot) {
        console.log(`  🚨 HONEYPOT DETECTED - ${patterns.length} patterns found`);
        patterns.forEach((p) => console.log(`     - ${p.name} (line ${p.line})`));
      } else {
        console.log(`  ✅ Safe - no honeypot patterns detected`);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.log(`  ❌ Error: ${(error as Error).message}`);
      results.push({
        address,
        isHoneypot: false,
        patternsFound: 0,
        chain,
        error: (error as Error).message,
      });
    }
  }

  return results;
}

function printSummary(results: ContractResult[]) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 SCAN SUMMARY");
  console.log("=".repeat(80));

  const honeypots = results.filter((r) => r.isHoneypot);
  const safe = results.filter((r) => !r.isHoneypot && !r.error);
  const errors = results.filter((r) => r.error);

  console.log(`\nTotal Scanned: ${results.length}`);
  console.log(`🚨 Honeypots Found: ${honeypots.length}`);
  console.log(`✅ Safe Contracts: ${safe.length}`);
  console.log(`⚠️  Errors: ${errors.length}`);

  if (honeypots.length > 0) {
    console.log("\n" + "-".repeat(80));
    console.log("🚨 HONEYPOT CONTRACTS:");
    console.log("-".repeat(80));
    honeypots.forEach((contract) => {
      console.log(`\n📍 ${contract.address}`);
      console.log(`   Chain: ${contract.chain}`);
      console.log(`   Patterns: ${contract.patternsFound}`);
    });
  }

  if (safe.length > 0) {
    console.log("\n" + "-".repeat(80));
    console.log("✅ SAFE CONTRACTS:");
    console.log("-".repeat(80));
    safe.forEach((contract) => {
      console.log(`   ${contract.address} (${contract.chain})`);
    });
  }

  if (errors.length > 0) {
    console.log("\n" + "-".repeat(80));
    console.log("⚠️  CONTRACTS WITH ERRORS:");
    console.log("-".repeat(80));
    errors.forEach((contract) => {
      console.log(`   ${contract.address}: ${contract.error}`);
    });
  }

  console.log("\n" + "=".repeat(80));
  console.log(`Detection Rate: ${((honeypots.length / (honeypots.length + safe.length)) * 100).toFixed(2)}%`);
  console.log("=".repeat(80) + "\n");
}

async function main() {
  console.log("🛡️  HoneypotScan - Mass Contract Scanner");
  console.log("=".repeat(80));

  const apiKey = process.env.ETHERSCAN_API_KEY_1 || process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    console.error("❌ ETHERSCAN_API_KEY or ETHERSCAN_API_KEY_1 not found in environment variables");
    console.error("   Please set it in .env.local or export it");
    process.exit(1);
  }

  const env: Env = {
    CACHE: undefined,
    ETHERSCAN_API_KEY_1: apiKey,
    ETHERSCAN_API_KEY_2: process.env.ETHERSCAN_API_KEY_2,
    ETHERSCAN_API_KEY_3: process.env.ETHERSCAN_API_KEY_3,
    ETHERSCAN_API_KEY_4: process.env.ETHERSCAN_API_KEY_4,
    ETHERSCAN_API_KEY_5: process.env.ETHERSCAN_API_KEY_5,
    ETHERSCAN_API_KEY_6: process.env.ETHERSCAN_API_KEY_6,
  };

  const chain = "ethereum";
  
  console.log("\n📡 Fetching latest block number...");
  const blockResponse = await fetch(`https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_blockNumber&apikey=${apiKey}`);
  const blockData = await blockResponse.json();
  const latestBlock = parseInt(blockData.result, 16);
  
  console.log(`  Latest block: ${latestBlock}`);

  const blocksPerBatch = 1000;
  const numBatches = 10;
  
  console.log(`\nConfiguration:`);
  console.log(`  Chain: ${chain}`);
  console.log(`  Blocks per batch: ${blocksPerBatch}`);
  console.log(`  Number of batches: ${numBatches}`);
  console.log(`  Block range: ${latestBlock - (numBatches * blocksPerBatch)} to ${latestBlock}`);

  console.log("\n📥 Fetching contracts from recent blocks...\n");

  const allContracts: string[] = [];
  for (let i = 0; i < numBatches; i++) {
    const endBlock = latestBlock - (i * blocksPerBatch);
    const startBlock = endBlock - blocksPerBatch + 1;
    
    console.log(`Batch ${i + 1}/${numBatches}: blocks ${startBlock} to ${endBlock}`);
    const contracts = await getRecentContracts(apiKey, chain, startBlock, endBlock);
    allContracts.push(...contracts);
    console.log(`  Retrieved ${contracts.length} unique token contracts`);
    
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  console.log(`\n✅ Total contracts fetched: ${allContracts.length}`);

  if (allContracts.length === 0) {
    console.error("❌ No contracts fetched. Exiting.");
    process.exit(1);
  }

  console.log("\n🔍 Starting contract scans...");
  const results = await scanContracts(allContracts, chain, env);

  printSummary(results);

  const outputFile = `test/results/scan-results-${Date.now()}.json`;
  const fs = await import("fs/promises");
  await fs.writeFile(
    outputFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        chain,
        totalScanned: results.length,
        honeypots: results.filter((r) => r.isHoneypot),
        safe: results.filter((r) => !r.isHoneypot && !r.error),
        errors: results.filter((r) => r.error),
      },
      null,
      2
    )
  );

  console.log(`💾 Results saved to: ${outputFile}\n`);
}

main().catch(console.error);

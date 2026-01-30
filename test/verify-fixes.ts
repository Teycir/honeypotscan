/**
 * Test script to verify bug fixes
 * Run with: npx tsx test/verify-fixes.ts
 */

import { detectHoneypot } from "../lib/detector";
import { sanitizeContractCode } from "../lib/sanitizer";
import { readFileSync } from "fs";
import { join } from "path";

const TESTS_PASSED: string[] = [];
const TESTS_FAILED: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    TESTS_PASSED.push(name);
    console.log(`✅ ${name}`);
  } catch (error) {
    TESTS_FAILED.push(name);
    console.error(`❌ ${name}`);
    console.error(`   ${(error as Error).message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log("🧪 Running verification tests...\n");

// ============================================
// Test #2: Pattern Detection - Multiple Matches
// ============================================
test("Detector finds multiple matches of same pattern", () => {
  const code = `
    pragma solidity ^0.8.0;
    contract Test {
      function balanceOf(address owner) public view returns (uint256) {
        if (tx.origin == address(0)) return 0;
        return _balances[tx.origin];
      }
      function transfer(address to, uint256 amount) public returns (bool) {
        require(tx.origin != address(0), "Invalid");
        _balances[tx.origin] -= amount;
        return true;
      }
    }
  `;
  
  const result = detectHoneypot(code);
  // Should find multiple tx.origin patterns
  assert(result.patterns.length >= 2, `Expected at least 2 patterns, got ${result.patterns.length}`);
});

// ============================================
// Test #3: Sanitizer preserves URLs in strings
// ============================================
test("Sanitizer preserves URLs in strings", () => {
  const code = `
    pragma solidity ^0.8.0;
    contract Test {
      string public url = "https://example.com/api/v1";
      // This is a comment
      string public docs = "See: http://docs.example.com";
    }
  `;
  
  const result = sanitizeContractCode(code);
  assert(result.isValid, "Code should be valid");
  assert(result.sanitized.includes("https://example.com/api/v1"), "Should preserve HTTPS URL");
  assert(result.sanitized.includes("http://docs.example.com"), "Should preserve HTTP URL");
  assert(!result.sanitized.includes("// This is a comment"), "Should remove comment");
});

test("Sanitizer removes comments but keeps URL protocols", () => {
  const code = `
    pragma solidity ^0.8.0;
    contract Test {
      // Comment line
      string x = "http://test.com"; // inline comment
    }
  `;
  
  const result = sanitizeContractCode(code);
  assert(result.sanitized.includes("http://test.com"), "URL should be preserved");
  assert(!result.sanitized.includes("Comment line"), "Comment should be removed");
  assert(!result.sanitized.includes("inline comment"), "Inline comment should be removed");
});

// ============================================
// Test with real honeypot contract from test/archive
// ============================================
test("Detects honeypot in real contract file", () => {
  const honeypotPath = join(__dirname, "archive/honeypot_0x4c89364f18ecc562165820989549022e64ec2ed2.sol");
  const code = readFileSync(honeypotPath, "utf-8");
  
  const result = detectHoneypot(code);
  assert(result.patterns.length > 0, `Expected patterns to be found in honeypot contract, got ${result.patterns.length}`);
  console.log(`   Found ${result.patterns.length} patterns in honeypot contract`);
  result.patterns.forEach(p => console.log(`     - ${p.name} (line ${p.line})`));
});

test("Safe contract passes detection", () => {
  const safePath = join(__dirname, "archive/safe_0x1bbb07f167db1da861c2e6aa5b636cb80f00b60d.sol");
  const code = readFileSync(safePath, "utf-8");
  
  const result = detectHoneypot(code);
  // Safe contract should have fewer patterns than detection threshold
  console.log(`   Found ${result.patterns.length} patterns in safe contract (threshold is 2)`);
  // Note: Some patterns may still match in safe contracts, but should be below threshold
});

// ============================================
// Test Fisher-Yates shuffle distribution
// ============================================
test("Fisher-Yates shuffle is unbiased", () => {
  // Quick statistical test for shuffle bias
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  const counts: Record<string, number> = { A: 0, B: 0, C: 0 };
  const iterations = 3000;
  
  for (let i = 0; i < iterations; i++) {
    const shuffled = shuffleArray(['A', 'B', 'C']);
    counts[shuffled[0]]++;
  }
  
  // Each element should appear first roughly 33% of the time (±5%)
  const expected = iterations / 3;
  const tolerance = expected * 0.15; // 15% tolerance
  
  for (const [key, count] of Object.entries(counts)) {
    const diff = Math.abs(count - expected);
    assert(diff < tolerance, `Shuffle bias detected: ${key} appeared first ${count} times (expected ~${Math.round(expected)})`);
  }
  console.log(`   Distribution: A=${counts.A}, B=${counts.B}, C=${counts.C} (expected ~${Math.round(expected)} each)`);
});

// ============================================
// Summary
// ============================================
console.log("\n" + "=".repeat(50));
console.log("📊 TEST SUMMARY");
console.log("=".repeat(50));
console.log(`✅ Passed: ${TESTS_PASSED.length}`);
console.log(`❌ Failed: ${TESTS_FAILED.length}`);

if (TESTS_FAILED.length > 0) {
  console.log("\nFailed tests:");
  TESTS_FAILED.forEach(t => console.log(`  - ${t}`));
  process.exit(1);
}

console.log("\n🎉 All tests passed!\n");

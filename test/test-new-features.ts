/**
 * Test script for new zero-load features
 * Tests pattern explanations, share utils, and scan history
 */

import * as fs from 'fs';
import * as path from 'path';
import { detectHoneypot } from '../lib/detector';
import { getPatternExplanation, PATTERN_EXPLANATIONS } from '../lib/pattern-explanations';
import { 
  encodeResultForShare, 
  decodeResultFromHash, 
  generateTextSummary,
  generateShareUrl
} from '../lib/share-utils';

const ARCHIVE_DIR = path.join(__dirname, 'archive');

interface TestResult {
  test: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(message);
}

function test(name: string, fn: () => boolean, details?: string) {
  try {
    const passed = fn();
    results.push({ test: name, passed, details });
    console.log(`${passed ? '✅' : '❌'} ${name}${details ? ` - ${details}` : ''}`);
  } catch (error) {
    results.push({ test: name, passed: false, details: String(error) });
    console.log(`❌ ${name} - Error: ${error}`);
  }
}

async function main() {
  console.log('\n🧪 Testing New Zero-Load Features\n');
  console.log('='.repeat(50));
  
  // Test 1: Pattern Explanations
  console.log('\n📚 Testing Pattern Explanations...\n');
  
  test('All patterns have explanations', () => {
    const patternNames = [
      'balance_tx_origin', 'allowance_tx_origin', 'transfer_tx_origin',
      'hidden_fee_taxPayer', 'isSuper_tx_origin', 'tx_origin_require',
      'tx_origin_if_auth', 'tx_origin_assert', 'tx_origin_mapping',
      'sell_block_pattern', 'asymmetric_transfer_logic', 'transfer_whitelist_only',
      'hidden_sell_tax'
    ];
    
    for (const name of patternNames) {
      const explanation = getPatternExplanation(name);
      if (!explanation) {
        return false;
      }
    }
    return true;
  }, `${Object.keys(PATTERN_EXPLANATIONS).length} explanations defined`);
  
  test('Explanations have required fields', () => {
    for (const [name, exp] of Object.entries(PATTERN_EXPLANATIONS)) {
      if (!exp.title || !exp.description || !exp.severity || !exp.howItWorks || !exp.protection) {
        console.log(`  Missing fields for: ${name}`);
        return false;
      }
    }
    return true;
  });
  
  // Test 2: Share URL encoding/decoding
  console.log('\n🔗 Testing Share Utils...\n');
  
  test('Encode and decode share URL', () => {
    const result = {
      address: '0x4c89364f18ecc562165820989549022e64ec2ed2',
      isHoneypot: true,
      confidence: 85,
      patterns: [{ name: 'tx_origin_require' }, { name: 'tx_origin_mapping' }],
      chain: 'ethereum',
      tokenName: 'Test Token',
      tokenSymbol: 'TEST',
      scannedAt: new Date().toISOString(),
    };
    
    const encoded = encodeResultForShare(result);
    const decoded = decodeResultFromHash(encoded);
    
    return (
      decoded !== null &&
      decoded.a === result.address &&
      decoded.h === result.isHoneypot &&
      decoded.c === result.confidence &&
      decoded.p === result.patterns.length &&
      decoded.n === result.chain
    );
  });
  
  test('Generate text summary', () => {
    const result = {
      address: '0x4c89364f18ecc562165820989549022e64ec2ed2',
      isHoneypot: true,
      confidence: 85,
      patterns: [{ name: 'tx_origin_require', line: 123 }],
      chain: 'ethereum',
      message: 'Honeypot detected!',
      tokenName: 'Scam Token',
      tokenSymbol: 'SCAM',
    };
    
    const summary = generateTextSummary(result);
    
    return (
      summary.includes('HONEYPOT DETECTED') &&
      summary.includes(result.address) &&
      summary.includes('tx_origin_require') &&
      summary.includes('honeypotscan.com')
    );
  });
  
  // Test 3: Contract detection with test files
  console.log('\n🔍 Testing Contract Detection with Archive Files...\n');
  
  // Honeypot contract
  const honeypotFile = path.join(ARCHIVE_DIR, 'honeypot_0x4c89364f18ecc562165820989549022e64ec2ed2.sol');
  if (fs.existsSync(honeypotFile)) {
    const honeypotSource = fs.readFileSync(honeypotFile, 'utf-8');
    const honeypotResult = detectHoneypot(honeypotSource);
    
    test('Detect honeypot contract', () => honeypotResult.isHoneypot, 
      `Found ${honeypotResult.patterns.length} patterns`);
    
    test('Honeypot patterns have explanations', () => {
      for (const pattern of honeypotResult.patterns) {
        const exp = getPatternExplanation(pattern.name);
        if (!exp) {
          console.log(`  Missing explanation for: ${pattern.name}`);
          return false;
        }
      }
      return true;
    }, honeypotResult.patterns.map(p => p.name).join(', '));
  } else {
    console.log('  ⚠️  Honeypot test file not found');
  }
  
  // Safe contract
  const safeFile = path.join(ARCHIVE_DIR, 'safe_0x1bbb07f167db1da861c2e6aa5b636cb80f00b60d.sol');
  if (fs.existsSync(safeFile)) {
    const safeSource = fs.readFileSync(safeFile, 'utf-8');
    const safeResult = detectHoneypot(safeSource);
    
    test('Detect safe contract', () => !safeResult.isHoneypot,
      `Found ${safeResult.patterns.length} patterns (threshold not met)`);
  } else {
    console.log('  ⚠️  Safe test file not found');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed\n`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed\n');
    process.exit(1);
  }
}

main().catch(console.error);

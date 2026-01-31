/**
 * Test ReDoS protection with malicious inputs
 */

import { detectHoneypot } from '../lib/detector';

console.log('🧪 Testing ReDoS Protection\n');
console.log('='.repeat(80));

// Test 1: Normal contract (should be fast)
console.log('\n📋 Test 1: Normal safe contract');
const normalContract = `
pragma solidity ^0.8.0;

contract SafeToken {
    mapping(address => uint256) public balanceOf;
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}
`;

const start1 = Date.now();
const result1 = detectHoneypot(normalContract);
const time1 = Date.now() - start1;
console.log(`   Result: ${result1.isHoneypot ? '🚨 HONEYPOT' : '✅ SAFE'}`);
console.log(`   Time: ${time1}ms`);
console.log(`   Patterns: ${result1.patterns.length}`);

// Test 2: Known honeypot (should be fast and detected)
console.log('\n📋 Test 2: Known honeypot with tx.origin');
const honeypotContract = `
pragma solidity ^0.8.0;

contract HoneypotToken {
    mapping(address => uint256) public balanceOf;
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(tx.origin == msg.sender, "No contracts allowed");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}
`;

const start2 = Date.now();
const result2 = detectHoneypot(honeypotContract);
const time2 = Date.now() - start2;
console.log(`   Result: ${result2.isHoneypot ? '🚨 HONEYPOT' : '✅ SAFE'}`);
console.log(`   Time: ${time2}ms`);
console.log(`   Patterns: ${result2.patterns.length}`);
result2.patterns.forEach(p => console.log(`     - ${p.name} (line ${p.line})`));

// Test 3: Malicious input designed to trigger ReDoS
console.log('\n📋 Test 3: Malicious ReDoS attack payload');
// Create a string that would cause catastrophic backtracking with [^}]{0,500} pattern
// Pattern: function balanceOf[^}]{0,500}tx.origin
// Attack: "function balanceOf" + 500 chars without } + lots of backtracking
const maliciousPayload = 
  'function balanceOf(address owner) public view returns (uint256) ' +
  'a'.repeat(450) + // Fill up to near the limit
  'b'.repeat(50) +  // Extra chars to trigger backtracking
  // No closing brace and no tx.origin - forces regex to backtrack through all combinations
  ' tx.originnnnnn'; // Almost matches but doesn't quite

const start3 = Date.now();
const result3 = detectHoneypot(maliciousPayload);
const time3 = Date.now() - start3;
console.log(`   Result: ${result3.isHoneypot ? '🚨 HONEYPOT' : '✅ SAFE'}`);
console.log(`   Time: ${time3}ms`);
console.log(`   Patterns: ${result3.patterns.length}`);

if (time3 > 200) {
  console.log('   ⚠️  WARNING: Execution took longer than expected!');
} else {
  console.log('   ✅ ReDoS protection working - execution completed quickly');
}

// Test 4: Extreme ReDoS payload
console.log('\n📋 Test 4: Extreme ReDoS payload (nested backtracking)');
const extremePayload = 
  'function balanceOf(address x) external view returns (uint256) {\n' +
  '  ' + 'if ('.repeat(200) + 'true' + ')'.repeat(200) + ' {\n' +
  '    ' + 'a'.repeat(400) + '\n' +
  '  }\n' +
  '  tx.originnnnn\n'; // Almost tx.origin but not quite

const start4 = Date.now();
const result4 = detectHoneypot(extremePayload);
const time4 = Date.now() - start4;
console.log(`   Result: ${result4.isHoneypot ? '🚨 HONEYPOT' : '✅ SAFE'}`);
console.log(`   Time: ${time4}ms`);
console.log(`   Patterns: ${result4.patterns.length}`);

if (time4 > 200) {
  console.log('   ⚠️  WARNING: Execution took longer than expected!');
} else {
  console.log('   ✅ ReDoS protection working - execution completed quickly');
}

// Test 5: Large file (chunking test)
console.log('\n📋 Test 5: Large contract file (70KB)');
const largeContract = 
  '// Large contract\n' +
  'pragma solidity ^0.8.0;\n\n' +
  'contract Large {\n' +
  '  function safe1() public {}\n'.repeat(1000) +
  '  function balanceOf(address x) public returns (uint) {\n' +
  '    require(tx.origin == msg.sender);\n' + // Honeypot pattern in large file
  '    return 0;\n' +
  '  }\n' +
  '  function safe2() public {}\n'.repeat(1000) +
  '}\n';

const start5 = Date.now();
const result5 = detectHoneypot(largeContract);
const time5 = Date.now() - start5;
console.log(`   Result: ${result5.isHoneypot ? '🚨 HONEYPOT' : '✅ SAFE'}`);
console.log(`   Time: ${time5}ms`);
console.log(`   File size: ${(largeContract.length / 1024).toFixed(1)}KB`);
console.log(`   Patterns: ${result5.patterns.length}`);
result5.patterns.forEach(p => console.log(`     - ${p.name} (line ${p.line})`));

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY');
console.log('='.repeat(80));
console.log(`\nAll tests completed:`);
console.log(`  Test 1 (normal): ${time1}ms`);
console.log(`  Test 2 (honeypot): ${time2}ms`);
console.log(`  Test 3 (ReDoS attack): ${time3}ms ${time3 > 200 ? '⚠️  SLOW' : '✅'}`);
console.log(`  Test 4 (extreme ReDoS): ${time4}ms ${time4 > 200 ? '⚠️  SLOW' : '✅'}`);
console.log(`  Test 5 (large file): ${time5}ms`);

const maxTime = Math.max(time1, time2, time3, time4, time5);
if (maxTime > 200) {
  console.log(`\n⚠️  Some tests exceeded timeout threshold (200ms)`);
  console.log(`   Max execution time: ${maxTime}ms`);
  process.exit(1);
} else {
  console.log(`\n✅ All tests passed - ReDoS protection working correctly!`);
  console.log(`   Max execution time: ${maxTime}ms`);
  process.exit(0);
}

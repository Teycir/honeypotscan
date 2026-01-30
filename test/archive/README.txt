Test Contract Samples
=====================

This directory contains sample contracts used for testing the honeypot scanner.

Honeypot Contract (Detected)
-----------------------------
File: honeypot_0x4c89364f18ecc562165820989549022e64ec2ed2.sol
Address: 0x4c89364f18ecc562165820989549022e64ec2ed2
Chain: Ethereum
Risk Score: 474
Patterns Detected: 2
  - tx_origin_require (line 1123)
  - tx_origin_mapping (line 1123)

The contract uses tx.origin in a require statement to restrict transfers,
a classic honeypot technique that prevents victims from selling tokens.

Safe Contract (Not a Honeypot)
-------------------------------
File: safe_0x1bbb07f167db1da861c2e6aa5b636cb80f00b60d.sol
Address: 0x1bbb07f167db1da861c2e6aa5b636cb80f00b60d
Chain: Ethereum
Risk Score: 0
Patterns Detected: 0

This contract has no honeypot patterns and is considered safe.

Usage
-----
These contracts can be used to test the scanner:
  tsx test/scan-local-files.ts test/archive/

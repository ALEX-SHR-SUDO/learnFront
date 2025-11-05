# Examples

This directory contains example scripts and documentation for working with SPL token metadata.

## verifyTokenMetadata.js

A command-line utility to verify that a token has correct SPL token metadata (not NFT metadata).

### Usage

```bash
node examples/verifyTokenMetadata.js <MINT_ADDRESS>
```

### Example

```bash
# Verify a token that was created with correct SPL token metadata
node examples/verifyTokenMetadata.js FeR8VBqNRSUD5NtXAj2n3j1dAHkZHfyDktKuLXD4pump
```

### What it checks

The script verifies that the token metadata has:
- ✅ `tokenStandard: 2` (Fungible SPL token, not NFT)
- ✅ `editionNonce: 255 or 251` (no edition, not an NFT)
- ✅ `sellerFeeBasisPoints: 0` (no royalties, not an NFT)
- ✅ `collection: null` (no collection, not part of NFT collection)
- ✅ `uses: null` (no usage limits, not an NFT with limited uses)

### Output

The script will output:
1. Verification status (valid or invalid)
2. Any issues found with the metadata
3. Full metadata details in JSON format
4. Quick summary of key fields
5. Link to view the token on Solscan

### Example Output

```
🔍 Verifying SPL Token Metadata
================================

Mint Address: FeR8VBqNRSUD5NtXAj2n3j1dAHkZHfyDktKuLXD4pump
Network: Devnet

Fetching and verifying metadata...

✅ VALID SPL TOKEN METADATA
===========================

The token has correct SPL token metadata structure.

Metadata Details:
{
  "key": 4,
  "updateAuthority": "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM",
  "mint": "FeR8VBqNRSUD5NtXAj2n3j1dAHkZHfyDktKuLXD4pump",
  "data": {
    "name": "jelly-my-jelly",
    "symbol": "jellyjelly",
    "uri": "https://ipfs.io/ipfs/QmRaah2aa24T3F2hGQCf8XefSuaNFZM2wGx2W2UnsxfLxM",
    "sellerFeeBasisPoints": 0
  },
  "primarySaleHappened": 0,
  "isMutable": 0,
  "editionNonce": 251,
  "tokenStandard": 2
}

📊 Key Fields to Check:
========================
tokenStandard: 2 ✅ (Fungible)
editionNonce: 251 ✅ (No edition)
sellerFeeBasisPoints: 0 ✅
isMutable: 0 ✅ (Immutable)

🔗 View on Solscan:
https://solscan.io/token/FeR8VBqNRSUD5NtXAj2n3j1dAHkZHfyDktKuLXD4pump?cluster=devnet
```

## memoExample.md

Documentation explaining the transaction memo feature that adds human-readable metadata to token creation transactions.

### What it covers

- Memo format and structure
- How to view memos on block explorers
- Benefits of using transaction memos
- Technical implementation details
- Code examples

See [memoExample.md](./memoExample.md) for complete documentation.

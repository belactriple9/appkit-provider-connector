# AppKit Provider Connector

A TypeScript connector library that bridges the 1inch Limit Order SDK with the AppKit wallet connection framework. This library provides a standardized interface for signing EIP-712 typed data and executing blockchain calls through AppKit-connected wallets.

## Features

- EIP-712 Typed Data Signing: Sign limit orders and other typed data using connected wallets
- Blockchain Calls: Execute read-only smart contract calls via eth_call
- Multi-Adapter Support: Compatible with both Wagmi and Ethers AppKit adapters
- Cross-Platform: Works with React, React Native, and other JavaScript environments
- Type Safety: Full TypeScript support with comprehensive type definitions
- Interface Compliance: Implements the `BlockchainProviderConnector` interface

## Project Structure

```
├── signer/                           # Core connector implementation
│   ├── AppKitProviderConnector.ts    # Main connector class
│   ├── BlockchainProviderConnector.ts # Interface definition
│   ├── appkit.types.ts              # TypeScript type definitions
│   └── AppKitConnector.README.md    # Detailed documentation
├── test-ui/                         # React test application
│   ├── src/                         # React app source code
│   ├── package.json                 # Test app dependencies
│   └── vite.config.ts              # Vite configuration
└── README.md                        # This file
```

## Installation

Install AppKit dependencies for your preferred adapter using Bun or Yarn:

### Wagmi Adapter (Recommended)
```bash
bun add @reown/appkit-adapter-wagmi @reown/appkit @wagmi/core @tanstack/react-query wagmi viem ethers
# or
yarn add @reown/appkit-adapter-wagmi @reown/appkit @wagmi/core @tanstack/react-query wagmi viem ethers
```

### Ethers Adapter
```bash
bun add @reown/appkit-adapter-ethers @reown/appkit ethers
# or
yarn add @reown/appkit-adapter-ethers @reown/appkit ethers
```

## Quick Start

### 1. Set up AppKit (Wagmi Example)

```typescript
import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from 'viem/chains'

// Configure Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  projectId: 'YOUR_PROJECT_ID',
  networks: [mainnet, arbitrum]
})

// Create AppKit instance
const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, arbitrum],
  projectId: 'YOUR_PROJECT_ID',
  metadata: {
    name: 'Your App',
    description: 'Your App Description',
    url: 'https://yourapp.com',
    icons: ['https://yourapp.com/icon.png']
  }
})
```

### 2. Initialize the Connector

```typescript
import { AppKitProviderConnector } from './signer/AppKitProviderConnector'

const connector = new AppKitProviderConnector(appKit)
```

### 3. Sign Typed Data

```typescript
import { EIP712TypedData } from '@1inch/limit-order-sdk'
import { LimitOrder } from '@1inch/limit-order-sdk'
const limitOrder = new LimitOrder({...});
const typedData: EIP712TypedData = limitOrder.getTypedData(chainId)

try {
  const signature = await connector.signTypedData(walletAddress, typedData)
  console.log('Signature:', signature)
} catch (error) {
  console.error('Signing failed:', error)
}
```

### 4. Execute Blockchain Calls

```typescript
const contractAddress = '0x...'
const callData = '0x...'

try {
  const result = await connector.ethCall(contractAddress, callData)
  console.log('Call result:', result)
} catch (error) {
  console.error('Call failed:', error)
}
```

## Test Application

This repository includes a React test application in the `test-ui/` directory to demonstrate the connector in action.

### Running the Test App

```bash
cd test-ui
bun install
bun dev
# or
yarn install
yarn dev
```

# AppKit Provider Connector

The `AppKitProviderConnector` provides a bridge between the 1inch Limit Order SDK and AppKit wallet connection library. It implements the `BlockchainProviderConnector` interface to enable wallet signing and blockchain interactions through AppKit.

## Features

- **EIP-712 Typed Data Signing**: Sign limit orders using connected wallets
- **Blockchain Calls**: Execute read-only smart contract calls
- **Multi-Adapter Support**: Works with both Wagmi and Ethers AppKit adapters

## Installation

First, install AppKit dependencies for your preferred adapter:

```bash
# For Wagmi adapter (recommended)
npm install @reown/appkit-adapter-wagmi @reown/appkit @wagmi/core @tanstack/react-query wagmi viem ethers

# For Ethers adapter  
npm install @reown/appkit-adapter-ethers @reown/appkit ethers

# For Solana adapter
npm install @reown/appkit-adapter-solana @reown/appkit
```

## Basic Usage

### 1. Set up AppKit

First, create your AppKit instance following the [AppKit documentation](https://docs.reown.com/appkit):

```typescript
import React from 'react'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, polygon } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

// Setup QueryClient
const queryClient = new QueryClient()

// 1. Get projectId from https://dashboard.reown.com
const projectId = 'YOUR_PROJECT_ID' // Replace with your actual project ID

// 2. Create a metadata object
const metadata = {
  name: 'AppKit Connector Test',
  description: 'Test application for 1inch Limit Order SDK AppKit integration',
  url: 'http://localhost:4200', // Your app URL
  icons: ['']
}

// 3. Set the networks
const networks = [mainnet, arbitrum, polygon]

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId
})

// 5. Create AppKit instance
const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: []
  }
})

export { appKit, wagmiAdapter }

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### 2. Create the Provider Connector

```typescript
import { AppKitProviderConnector, LimitOrder, Address } from '@1inch/limit-order-sdk'

// Create the connector with your AppKit instance
const providerConnector = new AppKitProviderConnector(appKit as any)
```

### 3. Use with Limit Order SDK

```typescript
import { LimitOrder, Address } from '@1inch/limit-order-sdk'

// Create a limit order with proper types
const limitOrder = new LimitOrder({
  makerAsset: new Address('0x6b175474e89094c44da98b954eedeac495271d0f'), // DAI
  takerAsset: new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'), // WETH
  makingAmount: BigInt('1000000000000000000'), // 1 DAI
  takingAmount: BigInt('500000000000000'),     // 0.0005 WETH  
  maker: new Address('0x1234...') // wallet address
})

// Get typed data for signing (use current chainId)
const typedData = limitOrder.getTypedData(chainId) // chainId from useChainId() or connector

// Sign the order using AppKit
try {
  const signature = await providerConnector.signTypedData(
    '0x1234...', // wallet address
    typedData
  )
  
  console.log('Order signed:', signature)
  console.log('Typed data:', typedData)
} catch (error) {
  console.error('Failed to sign order:', error)
}
```

### 4. Making Blockchain Calls

```typescript
// Example: Get DAI token balance
const tokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f' // DAI
const walletAddress = '0x1234...'

// Encode the balanceOf call
const callData = '0x70a08231' + walletAddress.slice(2).padStart(64, '0')

try {
  const result = await providerConnector.ethCall(tokenAddress, callData)
  console.log('DAI balance:', result)
} catch (error) {
  console.error('Failed to get balance:', error)
}
```

## Advanced Usage

### Error Handling

The connector provides detailed error messages for common issues:

```typescript
try {
  const signature = await providerConnector.signTypedData(walletAddress, typedData)
} catch (error) {
  if (error.message.includes('not connected')) {
    // Handle wallet not connected
    appKit.open() // Open AppKit modal to connect
  } else if (error.message.includes('No provider available')) {
    // Handle provider initialization issues
    console.error('AppKit provider not available')
  } else {
    // Handle other signing errors
    console.error('Signing failed:', error)
  }
}
```

### Getting Connection Info

```typescript
// Get current accounts
const accounts = await providerConnector.getAccounts()
console.log('Connected accounts:', accounts)

// Get current chain ID
const chainId = await providerConnector.getChainId()
console.log('Current chain:', chainId)
```

## Framework Integration Examples

### React with Wagmi

```tsx
import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { AppKitProvider, appKit } from './appkit.tsx'
import { AppKitProviderConnector, LimitOrder, Address } from '@1inch/limit-order-sdk'

function LimitOrderComponent() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const [connector, setConnector] = useState<AppKitProviderConnector | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isConnected && appKit) {
      try {
        const newConnector = new AppKitProviderConnector(appKit as any)
        setConnector(newConnector)
      } catch (err) {
        console.error(`Failed to create connector: ${err}`)
      }
    } else {
      setConnector(null)
    }
  }, [isConnected])
  
  const signOrder = async () => {
    if (!connector || !address) return
    
    setLoading(true)
    try {
      // Create a limit order
      const limitOrder = new LimitOrder({
        makerAsset: new Address('0x6b175474e89094c44da98b954eedeac495271d0f'), // DAI
        takerAsset: new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'), // WETH
        makingAmount: BigInt('1000000000000000000'), // 1 DAI
        takingAmount: BigInt('500000000000000'),     // 0.0005 WETH
        maker: new Address(address)
      })

      // Get typed data for current chain
      const typedData = limitOrder.getTypedData(chainId)
      
      // Sign the order
      const signature = await connector.signTypedData(address, typedData)
      console.log('Order signed:', signature)
    } catch (error) {
      console.error('Failed to sign order:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <button onClick={signOrder} disabled={!address || loading}>
        {loading ? 'Signing...' : 'Create Limit Order'}
      </button>
      {!isConnected && (
        <button onClick={() => appKit.open()}>
          Connect Wallet
        </button>
      )}
    </div>
  )
}

function App() {
  return (
    <AppKitProvider>
      <LimitOrderComponent />
    </AppKitProvider>
  )
}
```

### React with Ethers

```tsx
import { useState, useEffect } from 'react'
import { AppKitProvider, appKit } from './appkit.tsx'
import { AppKitProviderConnector, LimitOrder, Address } from '@1inch/limit-order-sdk'

function LimitOrderComponent() {
  const [connector, setConnector] = useState<AppKitProviderConnector | null>(null)
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  
  useEffect(() => {
    if (appKit) {
      const newConnector = new AppKitProviderConnector(appKit as any)
      setConnector(newConnector)
      
      // Check for existing connection
      newConnector.getAccounts().then(accounts => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
        }
      }).catch(console.error)
    }
  }, [])
  
  const signOrder = async () => {
    if (!connector || !address) return
    
    setLoading(true)
    try {
      const chainIdHex = await connector.getChainId()
      const chainId = parseInt(chainIdHex, 16)
      
      const limitOrder = new LimitOrder({
        makerAsset: new Address('0x6b175474e89094c44da98b954eedeac495271d0f'),
        takerAsset: new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
        makingAmount: BigInt('1000000000000000000'),
        takingAmount: BigInt('500000000000000'),
        maker: new Address(address)
      })

      const typedData = limitOrder.getTypedData(chainId)
      const signature = await connector.signTypedData(address, typedData)
      console.log('Order signed:', signature)
    } catch (error) {
      console.error('Failed to sign order:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const connectWallet = async () => {
    appKit.open()
    // Wait for connection and update address
    setTimeout(async () => {
      if (connector) {
        try {
          const accounts = await connector.getAccounts()
          if (accounts.length > 0) {
            setAddress(accounts[0])
          }
        } catch (error) {
          console.error('Failed to get accounts:', error)
        }
      }
    }, 1000)
  }
  
  return (
    <div>
      <button onClick={signOrder} disabled={!address || loading}>
        {loading ? 'Signing...' : 'Create Limit Order'}
      </button>
      {!address && (
        <button onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
    </div>
  )
}

function App() {
  return (
    <AppKitProvider>
      <LimitOrderComponent />
    </AppKitProvider>
  )
}
```

## Troubleshooting

### Common Issues

**TypeScript Errors with AppKit Instance**
```typescript
// Use type assertion if needed
const connector = new AppKitProviderConnector(appKit as any)
```

**Provider Not Available**
- Ensure AppKit is properly initialized before creating the connector
- Check that your project ID is valid and from https://dashboard.reown.com
- Verify wallet is connected before attempting operations

**Chain ID Conversion**
```typescript
const chainIdHex = await connector.getChainId()
const chainIdDecimal = parseInt(chainIdHex, 16) // Convert hex to decimal
```

**Required Dependencies Missing**
Make sure you have all required packages installed:
```bash
npm install @reown/appkit @reown/appkit-adapter-wagmi @wagmi/core @tanstack/react-query wagmi viem
```
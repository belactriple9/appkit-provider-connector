import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { AppKitProvider, appKit } from './appkit.tsx'
import { LimitOrder, Address } from '@1inch/limit-order-sdk'
import {AppKitProviderConnector} from '../../signer/AppKitProviderConnector.js'

function AppContent() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const [connector, setConnector] = useState<AppKitProviderConnector | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form state for limit order
  const [makerAsset, setMakerAsset] = useState('0x6b175474e89094c44da98b954eedeac495271d0f') // DAI
  const [takerAsset, setTakerAsset] = useState('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') // WETH
  const [makingAmount, setMakingAmount] = useState('1000000000000000000') // 1 DAI
  const [takingAmount, setTakingAmount] = useState('500000000000000') // 0.0005 WETH

  useEffect(() => {
    if (isConnected && appKit) {
      try {
        const newConnector = new AppKitProviderConnector(appKit as any)
        setConnector(newConnector)
        setError(null)
      } catch (err) {
        setError(`Failed to create connector: ${err}`)
      }
    } else {
      setConnector(null)
    }
  }, [isConnected])

  const clearResults = () => {
    setResult(null)
    setError(null)
  }

  const handleConnectWallet = () => {
    clearResults()
    appKit.open()
  }

  const handleGetAccounts = async () => {
    if (!connector) return
    
    setLoading(true)
    clearResults()
    
    try {
      const accounts = await connector.getAccounts()
      setResult(`Connected accounts: ${JSON.stringify(accounts, null, 2)}`)
    } catch (err) {
      setError(`Failed to get accounts: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGetChainId = async () => {
    if (!connector) return
    
    setLoading(true)
    clearResults()
    
    try {
      const chainIdHex = await connector.getChainId()
      const chainIdDec = parseInt(chainIdHex, 16)
      setResult(`Chain ID: ${chainIdHex} (${chainIdDec})`)
    } catch (err) {
      setError(`Failed to get chain ID: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTestEthCall = async () => {
    if (!connector || !address) return
    
    setLoading(true)
    clearResults()
    
    try {
      // Test eth_call with DAI balanceOf
      const tokenAddress = makerAsset
      const callData = '0x70a08231' + address.slice(2).padStart(64, '0')
      
      const balance = await connector.ethCall(tokenAddress, callData)
      setResult(`DAI Balance: ${balance}`)
    } catch (err) {
      setError(`Failed to execute eth_call: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignLimitOrder = async () => {
    if (!connector || !address) return
    
    setLoading(true)
    clearResults()
    
    try {
      // Create a limit order
      const limitOrder = new LimitOrder({
        makerAsset: new Address(makerAsset),
        takerAsset: new Address(takerAsset),
        makingAmount: BigInt(makingAmount),
        takingAmount: BigInt(takingAmount),
        maker: new Address(address)
      })

      // Get typed data for current chain
      const typedData = limitOrder.getTypedData(chainId)
      
      // Sign the order
      const signature = await connector.signTypedData(address, typedData)
      
      setResult(`Limit order signed successfully!
      
Order Details:
- Maker Asset: ${makerAsset}
- Taker Asset: ${takerAsset}
- Making Amount: ${makingAmount}
- Taking Amount: ${takingAmount}
- Maker: ${address}
- Chain ID: ${chainId}

Signature: ${signature}

Typed Data:
${JSON.stringify(typedData, null, 2)}`)
    } catch (err) {
      setError(`Failed to sign limit order: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>🔄 AppKit Connector Test</h1>
        <p>Test the 1inch Limit Order SDK AppKit integration</p>
      </div>

      {/* Connection Status */}
      <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-indicator"></div>
        {isConnected ? (
          <span>Connected to {address}</span>
        ) : (
          <span>Wallet not connected</span>
        )}
      </div>

      {/* Connection Info */}
      {isConnected && (
        <div className="info-grid">
          <div className="info-card">
            <h3>Wallet Address</h3>
            <p>{address}</p>
          </div>
          <div className="info-card">
            <h3>Chain ID</h3>
            <p>{chainId}</p>
          </div>
          <div className="info-card">
            <h3>Connector Status</h3>
            <p>{connector ? 'Ready' : 'Not initialized'}</p>
          </div>
        </div>
      )}

      {/* Connection Controls */}
      <div className="section">
        <h2>Wallet Connection</h2>
        <div className="actions">
          <button className="button" onClick={handleConnectWallet}>
            {isConnected ? 'Change Wallet' : 'Connect Wallet'}
          </button>
          <button 
            className="button secondary" 
            onClick={handleGetAccounts}
            disabled={!connector || loading}
          >
            {loading ? <span className="loading"></span> : 'Get Accounts'}
          </button>
          <button 
            className="button secondary" 
            onClick={handleGetChainId}
            disabled={!connector || loading}
          >
            {loading ? <span className="loading"></span> : 'Get Chain ID'}
          </button>
        </div>
      </div>

      {/* Blockchain Interaction */}
      <div className="section">
        <h2>Blockchain Calls</h2>
        <div className="actions">
          <button 
            className="button secondary" 
            onClick={handleTestEthCall}
            disabled={!connector || !address || loading}
          >
            {loading ? <span className="loading"></span> : 'Test eth_call (DAI Balance)'}
          </button>
        </div>
      </div>

      {/* Limit Order Testing */}
      <div className="section">
        <h2>Limit Order Signing</h2>
        
        <div className="form-group">
          <label>Maker Asset (Token to sell):</label>
          <input 
            type="text" 
            value={makerAsset} 
            onChange={(e) => setMakerAsset(e.target.value)}
            placeholder="0x6b175474e89094c44da98b954eedeac495271d0f"
          />
        </div>
        
        <div className="form-group">
          <label>Taker Asset (Token to buy):</label>
          <input 
            type="text" 
            value={takerAsset} 
            onChange={(e) => setTakerAsset(e.target.value)}
            placeholder="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
          />
        </div>
        
        <div className="form-group">
          <label>Making Amount (Wei):</label>
          <input 
            type="text" 
            value={makingAmount} 
            onChange={(e) => setMakingAmount(e.target.value)}
            placeholder="1000000000000000000"
          />
        </div>
        
        <div className="form-group">
          <label>Taking Amount (Wei):</label>
          <input 
            type="text" 
            value={takingAmount} 
            onChange={(e) => setTakingAmount(e.target.value)}
            placeholder="500000000000000"
          />
        </div>

        <div className="actions">
          <button 
            className="button" 
            onClick={handleSignLimitOrder}
            disabled={!connector || !address || loading}
          >
            {loading ? <span className="loading"></span> : 'Sign Limit Order'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="result">
          <h3>✅ Success</h3>
          <pre>{result}</pre>
        </div>
      )}

      {error && (
        <div className="error">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="section">
        <h2>Instructions</h2>
        <div className="info-card">
          <h3>Getting Started</h3>
          <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
            <p><strong>1.</strong> Click "Connect Wallet" to connect your wallet using AppKit</p>
            <p><strong>2.</strong> Test basic connector functions with "Get Accounts" and "Get Chain ID"</p>
            <p><strong>3.</strong> Test blockchain calls with "Test eth_call" (checks DAI balance)</p>
            <p><strong>4.</strong> Configure limit order parameters and click "Sign Limit Order"</p>
            <p><strong>5.</strong> Review the signed order details and signature</p>
          </div>
        </div>
        
        <div className="info-card">
          <h3>Default Tokens</h3>
          <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
            <p><strong>Maker Asset (DAI):</strong> 0x6b175474e89094c44da98b954eedeac495271d0f</p>
            <p><strong>Taker Asset (WETH):</strong> 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2</p>
            <p>You can modify these addresses to test with different tokens.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AppKitProvider>
      <AppContent />
    </AppKitProvider>
  )
}

export default App

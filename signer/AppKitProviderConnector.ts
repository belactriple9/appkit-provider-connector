import { BlockchainProviderConnector } from './BlockchainProviderConnector.js';
import { EIP712TypedData } from '@1inch/limit-order-sdk';
import { AppKitInstance, EIP1193Provider } from './appkit.types.js';

/**
 * AppKit provider connector for interacting with wallets and blockchain through AppKit
 * Supports both Wagmi and Ethers adapters
 */
export class AppKitProviderConnector implements BlockchainProviderConnector {
    private appKit: AppKitInstance;
    private provider: EIP1193Provider | null = null;

    /**
     * Creates an instance of AppKitProviderConnector
     * @param appKit - The AppKit instance (created with createAppKit)
     */
    constructor(appKit: AppKitInstance) {
        this.appKit = appKit;
    }

    /**
     * Get the current provider from AppKit
     * This will work with both Wagmi and Ethers adapters
     */
    private async getProvider(): Promise<EIP1193Provider> {
        if (!this.provider) {
            // For Wagmi adapter
            if (this.appKit.getWalletProvider) {
                this.provider = await this.appKit.getWalletProvider();
            }
            // For Ethers adapter
            else if (this.appKit.getProvider) {
                this.provider = await this.appKit.getProvider();
            }
            // Fallback to checking if provider is directly available
            else if (this.appKit.provider) {
                this.provider = this.appKit.provider;
            } else {
                throw new Error('No provider available from AppKit');
            }
        }
        return this.provider;
    }

    /**
     * Signs EIP-712 typed data using the connected wallet
     * @param walletAddress - The wallet address to sign with
     * @param typedData - The EIP-712 typed data to sign
     * @returns Promise resolving to the signature string
     */
    async signTypedData(
        walletAddress: string,
        typedData: EIP712TypedData
    ): Promise<string> {
        const provider = await this.getProvider();
        
        if (!provider) {
            throw new Error('No wallet provider available');
        }

        // Ensure wallet is connected and address matches
        const accounts = await provider.request({ 
            method: 'eth_accounts' 
        });
        
        if (!accounts.includes(walletAddress.toLowerCase())) {
            throw new Error(`Wallet address ${walletAddress} is not connected`);
        }

        try {
            // Use eth_signTypedData_v4 for EIP-712 signing
            const signature = await provider.request({
                method: 'eth_signTypedData_v4',
                params: [walletAddress, JSON.stringify(typedData)],
            });
            
            return signature;
        } catch (error) {
            throw new Error(`Failed to sign typed data: ${error}`);
        }
    }

    /**
     * Makes a read-only call to a smart contract
     * @param contractAddress - The contract address to call
     * @param callData - The encoded call data
     * @returns Promise resolving to the call result
     */
    async ethCall(contractAddress: string, callData: string): Promise<string> {
        const provider = await this.getProvider();
        
        if (!provider) {
            throw new Error('No wallet provider available');
        }

        try {
            const result = await provider.request({
                method: 'eth_call',
                params: [
                    {
                        to: contractAddress,
                        data: callData,
                    },
                    'latest',
                ],
            });
            
            return result;
        } catch (error) {
            throw new Error(`Failed to execute eth_call: ${error}`);
        }
    }

    /**
     * Get the current chain ID from the provider
     * @returns Promise resolving to the chain ID as a hex string
     */
    async getChainId(): Promise<string> {
        const provider = await this.getProvider();
        
        if (!provider) {
            throw new Error('No wallet provider available');
        }

        try {
            const chainId = await provider.request({
                method: 'eth_chainId',
            });
            
            return chainId;
        } catch (error) {
            throw new Error(`Failed to get chain ID: ${error}`);
        }
    }

    /**
     * Get the current connected accounts
     * @returns Promise resolving to an array of account addresses
     */
    async getAccounts(): Promise<string[]> {
        const provider = await this.getProvider();
        
        if (!provider) {
            throw new Error('No wallet provider available');
        }

        try {
            const accounts = await provider.request({
                method: 'eth_accounts',
            });
            
            return accounts;
        } catch (error) {
            throw new Error(`Failed to get accounts: ${error}`);
        }
    }
}
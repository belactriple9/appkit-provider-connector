/**
 * Type definitions for AppKit integration
 */

export interface AppKitInstance {
    /**
     * Get wallet provider (Wagmi adapter)
     */
    getWalletProvider?(): Promise<EIP1193Provider>;
    
    /**
     * Get provider (Ethers adapter)
     */
    getProvider?(): Promise<EIP1193Provider>;
    
    /**
     * Direct provider access
     */
    provider?: EIP1193Provider;
    
    /**
     * Open the AppKit modal
     */
    open(): void;
    
    /**
     * Close the AppKit modal
     */
    close(): void;
    
    /**
     * Subscribe to events
     */
    subscribe(callback: (state: AppKitState) => void): () => void;
}

export interface EIP1193Provider {
    /**
     * Make a JSON-RPC request
     */
    request(args: { method: string; params?: any[] }): Promise<any>;
    
    /**
     * Subscribe to provider events
     */
    on(event: string, listener: (...args: any[]) => void): void;
    
    /**
     * Remove event listener
     */
    removeListener(event: string, listener: (...args: any[]) => void): void;
}

export interface AppKitState {
    /**
     * Current connection status
     */
    open: boolean;
    
    /**
     * Selected chain ID
     */
    selectedChain?: {
        id: number;
        name: string;
    };
    
    /**
     * Connected account address
     */
    address?: string;
    
    /**
     * Connection status
     */
    isConnected: boolean;
}

export interface RequestArguments {
    method: string;
    params?: unknown[] | object;
}

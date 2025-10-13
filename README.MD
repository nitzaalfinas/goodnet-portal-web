# 🌉 DexGood Bridge Portal

Modern React web application for seamless cross-chain asset transfers between Ethereum L1 (Sepolia Testnet) and DexGood L2 Network. Built with React 18, TypeScript, Vite, and wagmi for optimal performance and developer experience.

## 🚀 Features

- ✅ **Cross-Chain Bridge**: ETH, ERC-20 tokens, and DXG token transfers
- ✅ **Modern Web3 Integration**: wagmi v2 with viem for type-safe blockchain interactions
- ✅ **Multi-Wallet Support**: MetaMask, WalletConnect, and other popular wallets
- ✅ **Real-Time Updates**: Live transaction status and balance updates
- ✅ **Responsive Design**: Mobile-first design with Tailwind CSS
- ✅ **Type Safety**: Full TypeScript implementation with strict typing
- ✅ **Development Tools**: Hot reload, proxy support, and comprehensive debugging
- ✅ **Production Ready**: Optimized builds with Docker containerization

## 🏗️ Tech Stack

### **Frontend Framework**
- **React 18**: Latest React with concurrent features
- **TypeScript**: Full type safety and excellent IDE support
- **Vite**: Lightning-fast build tool and dev server

### **Web3 Integration**
- **wagmi v2**: Type-safe React hooks for Ethereum
- **viem**: Modern TypeScript-first Ethereum library
- **TanStack React Query**: Powerful data fetching and caching

### **UI & Styling**
- **Tailwind CSS 4**: Utility-first CSS framework with latest features
- **Material-UI v6**: Modern React components
- **Emotion**: CSS-in-JS styling solution
- **Heroicons**: Beautiful hand-crafted SVG icons

### **Developer Tools**
- **Biome**: Fast formatter and linter (ESLint/Prettier replacement)
- **Docker**: Multi-stage containerization for dev and production

## 📋 Quick Start

### 1. **Prerequisites**
```bash
node >= 18.0.0
npm >= 8.0.0
git
```

### 2. **Clone & Install**
```bash
git clone <repository-url>
cd goodnet-portal-web
npm install
```

### 3. **Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env
```

### 4. **Start Development Server**
```bash
npm run dev
```

🎉 **Open http://localhost:5173** - The app will auto-reload on changes!

## ⚙️ Environment Configuration

### **Development Environment (`.env`)**
```env
# ========== APPLICATION SETTINGS ==========
VITE_ENVIRONMENT=development
VITE_DOMAIN_EVM=http://localhost:3000

# ========== L1 NETWORK (Ethereum Sepolia) ==========
VITE_L1_CHAIN_ID=11155111
VITE_L1_NAME=Ethereum Sepolia
VITE_L1_COIN_SYMBOL=ETH
VITE_L1_BRIDGE_CONTRACT=0x4c6079Eb7a4682da071649c42924241806007ab1
VITE_L1_EXPLORER_URL=https://sepolia.etherscan.io
VITE_L1_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# ========== L2 NETWORK (DexGood Testnet) ==========
VITE_L2_CHAIN_ID=98765432103
VITE_L2_NAME=Dexgood Testnet
VITE_L2_COIN_SYMBOL=TDXG
VITE_L2_BRIDGE_CONTRACT=0x2D535ebA806a81c884dbcdC946f014489863e456
VITE_L2_EXPLORER_URL=https://testnet-scan.dexgood.com
VITE_L2_RPC_URL=https://testnet-scan.dexgood.com/rpc

# ========== TOKEN ADDRESSES ==========
VITE_L1_DXG_TOKEN_ADDRESS=0x66e28Db788a06061347e05d9a28919ad2998c526

# ========== WALLET INTEGRATION ==========
VITE_WC_PROJECT_ID=your_walletconnect_project_id_from_cloud_dashboard
```

### **Production Environment**
```env
# Production settings
VITE_ENVIRONMENT=production
VITE_DOMAIN_EVM=https://testnet-bridge.dexgood.com

# Use production RPC endpoints
VITE_L1_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_L2_RPC_URL=https://testnet-scan.dexgood.com/rpc

# Production WalletConnect project
VITE_WC_PROJECT_ID=production_walletconnect_project_id
```

## 🔧 Available Scripts

### **Development**
```bash
# Start development server with hot reload
npm run dev
# → http://localhost:5173 (with proxy support)

# Type checking without building
npm run typecheck

# Check code formatting and linting
npm run lint

# Preview production build locally
npm run preview
```

### **Production**
```bash
# Build for production
npm run build
# → Creates optimized bundle in /dist

# Preview production build
npm run preview
# → Serves built files locally
```

### **Development with Docker**
```bash
# Development container with hot reload
docker build -f Dockerfile.development -t dexgood-bridge-dev .
docker run -p 5173:5173 -v $(pwd):/app dexgood-bridge-dev

# Production container
docker build -f Dockerfile.production -t dexgood-bridge-prod .
docker run -p 80:80 dexgood-bridge-prod
```

## 📁 Project Structure

```
goodnet-portal-web/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── bridge/          # Bridge-specific components
│   │   │   ├── BridgeContainer.tsx    # Main bridge container
│   │   │   ├── BridgeOne.tsx         # L1→L2 bridge component
│   │   │   ├── BridgeTwo.tsx         # L2→L1 bridge component
│   │   │   ├── BridgeClaim.tsx       # Bridge claiming interface
│   │   │   ├── TokenSelectorL1.tsx   # L1 token selection
│   │   │   └── TokenSelectorL2.tsx   # L2 token selection
│   │   ├── common/          # Shared components
│   │   ├── debug/           # Development debugging tools
│   │   ├── home/            # Landing page components
│   │   ├── layouts/         # Page layout components
│   │   ├── modals/          # Modal dialogs
│   │   ├── navbar/          # Navigation components
│   │   └── ui/              # Basic UI components
│   ├── config/              # Application configuration
│   │   ├── bridge.ts        # Bridge configuration
│   │   ├── chains.ts        # Blockchain network configs
│   │   ├── env.ts           # Environment variables
│   │   ├── tokens_l1.ts     # L1 token definitions
│   │   └── tokens_l2.ts     # L2 token definitions
│   ├── hooks/               # Custom React hooks
│   │   └── useTokens.ts     # Token balance & approval hooks
│   ├── layouts/             # Page layout templates
│   ├── libs/                # Contract ABIs and libraries
│   ├── pages/               # Application pages
│   │   ├── Home.tsx         # Landing page
│   │   └── Debug.tsx        # Developer debugging page
│   ├── theme/               # Material-UI theme customization
│   ├── type/                # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Root application component
│   ├── index.tsx            # Application entry point
│   ├── wagmi.ts             # wagmi configuration
│   └── index.css            # Global styles
├── public/                  # Static assets
├── .env                     # Environment configuration
├── .env.example             # Environment template
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── biome.json               # Code formatting configuration
├── Dockerfile.development   # Development container
├── Dockerfile.production    # Production container
├── nginx.conf               # Production nginx configuration
└── package.json             # Dependencies and scripts
```

## 🌉 Bridge Operations

### **Supported Assets**

**L1 → L2 (Deposit):**
- **ETH** → **ETHg** (Wrapped Ethereum on L2)
- **ERC20 tokens** → **Wrapped ERC20** (Normalized to 18 decimals)
- **DXG tokens** → **Native TDXG** (L2 gas token)

**L2 → L1 (Withdraw):**
- **ETHg** → **ETH** (Burns ETHg, releases ETH)
- **Wrapped ERC20** → **Original ERC20** (Burns wrapped, releases original)
- **Native TDXG** → **DXG tokens** (Sends TDXG, releases DXG)

### **Bridge Process Flow**

#### **L1 → L2 Deposit Process:**
```
1. User connects wallet to L1 network
2. User selects token and amount to bridge
3. App requests token approval (if ERC20)
4. User confirms deposit transaction on L1
5. L1 bridge contract locks tokens
6. Backend service detects deposit event
7. Backend service mints/sends tokens on L2
8. User receives tokens on L2 network
```

#### **L2 → L1 Withdraw Process:**
```
1. User connects wallet to L2 network
2. User selects token and amount to withdraw
3. User confirms withdraw transaction on L2
4. L2 bridge contract burns/receives tokens
5. Backend service detects withdraw event
6. Backend service releases tokens on L1
7. User receives original tokens on L1
```

### **User Interface Features**

- 🔄 **Automatic Network Switching**: App prompts to switch networks when needed
- 💰 **Real-Time Balances**: Live balance updates on both networks
- 📊 **Transaction History**: View pending and completed bridge transactions
- 🚨 **Error Handling**: Clear error messages and recovery instructions
- 📱 **Mobile Responsive**: Optimized for mobile and desktop usage
- 🌓 **Dark/Light Mode**: Automatic theme switching
- 🔍 **Transaction Tracking**: Direct links to blockchain explorers

## 🛠️ Development Guide

### **Code Organization**

#### **Component Architecture**
```typescript
// Example: Bridge component structure
├── BridgeContainer.tsx       # Main container with state management
├── BridgeOne.tsx            # L1→L2 bridge form
├── BridgeTwo.tsx            # L2→L1 bridge form  
├── TokenSelectorL1.tsx      # L1-specific token selection
├── TokenSelectorL2.tsx      # L2-specific token selection
└── BridgeClaim.tsx          # Transaction claiming interface
```

#### **Configuration Management**
```typescript
// config/env.ts - Environment variables with validation
export const config = {
  l1: {
    chainId: Number(import.meta.env.VITE_L1_CHAIN_ID),
    name: import.meta.env.VITE_L1_NAME,
    bridge: import.meta.env.VITE_L1_BRIDGE_CONTRACT as `0x${string}`,
    rpcUrl: import.meta.env.VITE_L1_RPC_URL,
  },
  l2: {
    chainId: Number(import.meta.env.VITE_L2_CHAIN_ID),
    name: import.meta.env.VITE_L2_NAME,
    bridge: import.meta.env.VITE_L2_BRIDGE_CONTRACT as `0x${string}`,
    rpcUrl: import.meta.env.VITE_L2_RPC_URL,
  }
};
```

#### **Type Safety**
```typescript
// type/market.ts - Comprehensive type definitions
export interface BridgeTransaction {
  id: string;
  type: 'deposit' | 'withdraw';
  fromChain: Chain;
  toChain: Chain;
  token: BridgeToken;
  amount: bigint;
  status: 'pending' | 'completed' | 'failed';
  txHash?: `0x${string}`;
  timestamp: number;
}

export interface BridgeToken {
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  isNative: boolean;
  addresses: Record<number, string>;
}
```

### **Custom Hooks**

#### **Token Management**
```typescript
// hooks/useTokens.ts
export const useTokenBalance = (token: BridgeToken, address?: string, chainId?: number) => {
  return useReadContract({
    address: token.isNative ? undefined : token.addresses[chainId!] as `0x${string}`,
    abi: token.isNative ? [] : ERC20_ABI,
    functionName: token.isNative ? undefined : 'balanceOf',
    args: token.isNative ? [] : [address],
    query: {
      enabled: !!address && !!chainId,
    },
  });
};
```

#### **Bridge Operations**
```typescript
// Example bridge transaction hook
export const useBridgeDeposit = () => {
  const { writeContract, isPending, error } = useWriteContract();
  
  const deposit = async (token: BridgeToken, amount: string) => {
    if (token.isNative) {
      await writeContract({
        address: L1_BRIDGE_ADDRESS,
        abi: BRIDGE_L1_ABI,
        functionName: 'depositETH',
        value: parseEther(amount),
      });
    } else {
      await writeContract({
        address: L1_BRIDGE_ADDRESS,
        abi: BRIDGE_L1_ABI,
        functionName: 'depositERC20',
        args: [token.addresses[L1_CHAIN_ID] as `0x${string}`, parseUnits(amount, token.decimals)],
      });
    }
  };
  
  return { deposit, isPending, error };
};
```

### **Styling Guidelines**

#### **Tailwind CSS Usage**
```typescript
// Consistent styling patterns
const buttonStyles = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors",
  secondary: "bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors",
  danger: "bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors",
};

// Responsive design patterns
const containerStyles = "max-w-md mx-auto bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50";
```

#### **Theme Integration**
```typescript
// theme/AppTheme.tsx - Material-UI theme customization
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6' },
    secondary: { main: '#6b7280' },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
});
```

### **Testing Strategy**

#### **Component Testing**
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom

# Example test structure
src/
├── __tests__/
│   ├── components/
│   │   ├── BridgeOne.test.tsx
│   │   └── TokenSelector.test.tsx
│   ├── hooks/
│   │   └── useTokens.test.tsx
│   └── utils/
│       └── formatter.test.tsx
```

#### **End-to-End Testing**
```bash
# Install Playwright for E2E testing
npm install --save-dev @playwright/test

# Example E2E test
tests/
├── bridge-deposit.spec.ts    # Test L1→L2 deposit flow
├── bridge-withdraw.spec.ts   # Test L2→L1 withdraw flow
└── wallet-connection.spec.ts # Test wallet connection flows
```

## 🚀 Deployment

### **Development Deployment**
```bash
# Local development with hot reload
npm run dev
# → http://localhost:5173

# Docker development environment
docker-compose -f docker-compose.dev.yml up
```

### **Production Deployment**

#### **Static Build Deployment**
```bash
# Build for production
npm run build

# Serve static files (nginx, Apache, etc.)
# Files will be in /dist directory
```

#### **Docker Production Deployment**
```bash
# Build production image
docker build -f Dockerfile.production -t dexgood-bridge:latest .

# Run production container
docker run -p 80:80 -d dexgood-bridge:latest
```

#### **Nginx Configuration (Production)**
```nginx
# nginx.conf
server {
    listen 80;
    server_name testnet-bridge.dexgood.com;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### **Environment-Specific Builds**

#### **Staging Environment**
```env
VITE_ENVIRONMENT=staging
VITE_DOMAIN_EVM=https://staging-bridge.dexgood.com
VITE_L1_RPC_URL=https://sepolia.infura.io/v3/STAGING_KEY
VITE_L2_RPC_URL=https://staging-rpc.dexgood.com
```

#### **Production Environment**
```env
VITE_ENVIRONMENT=production
VITE_DOMAIN_EVM=https://bridge.dexgood.com
VITE_L1_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_L2_RPC_URL=https://rpc.dexgood.com
```

## 🔧 Development Tools & Configuration

### **Vite Configuration**
```typescript
// vite.config.ts - Optimized for development and production
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/rpc': {
        target: 'https://testnet-scan.dexgood.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rpc/, '/rpc')
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['wagmi', 'viem', '@tanstack/react-query']
        }
      }
    }
  }
});
```

### **TypeScript Configuration**
```json
// tsconfig.json - Strict TypeScript setup
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### **Code Quality Tools**

#### **Biome Configuration**
```json
// biome.json - Fast linting and formatting
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "lineWidth": 120
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "organizeImports": {
    "enabled": true
  }
}
```

#### **Pre-commit Hooks**
```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged

# Setup pre-commit formatting
npx husky add .husky/pre-commit "npx lint-staged"

# Package.json configuration
{
  "lint-staged": {
    "*.{ts,tsx}": ["npm run lint", "npm run typecheck"]
  }
}
```

## 📊 Performance Optimization

### **Bundle Analysis**
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer

# Key optimizations:
# - Code splitting by routes and features
# - Tree shaking for unused code elimination
# - Dynamic imports for heavy libraries
# - Optimized asset loading
```

### **Runtime Performance**
```typescript
// Lazy loading for better performance
const BridgeContainer = lazy(() => import('@/components/bridge/BridgeContainer'));
const DebugPage = lazy(() => import('@/pages/Debug'));

// Memoization for expensive calculations
const memoizedTokenList = useMemo(() => {
  return tokens.filter(token => isTokenAvailableOnChain(token, chainId));
}, [tokens, chainId]);

// Optimized re-renders
const BridgeForm = memo(({ token, onTokenChange }) => {
  return <TokenSelector token={token} onChange={onTokenChange} />;
});
```

### **Network Optimization**
```typescript
// Efficient RPC calls
const { data: balance } = useReadContract({
  address: tokenAddress,
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: [userAddress],
  query: {
    staleTime: 30_000, // 30 seconds
    cacheTime: 300_000, // 5 minutes
    refetchInterval: 60_000, // 1 minute
  },
});
```

## 🛡️ Security Considerations

### **Wallet Security**
- 🔐 **Never store private keys** in frontend code
- ✅ **Validate all user inputs** before blockchain interactions
- 🔒 **Use secure RPC endpoints** with proper authentication
- 📝 **Audit smart contract interactions** for potential vulnerabilities

### **Transaction Security**
```typescript
// Example: Secure transaction validation
const validateTransaction = (amount: string, balance: bigint, token: BridgeToken) => {
  // Check minimum amount
  const minAmount = parseUnits('0.001', token.decimals);
  const txAmount = parseUnits(amount, token.decimals);
  
  if (txAmount < minAmount) {
    throw new Error('Amount too small');
  }
  
  // Check sufficient balance (including gas)
  const gasReserve = token.isNative ? parseEther('0.01') : 0n;
  if (balance < txAmount + gasReserve) {
    throw new Error('Insufficient balance');
  }
  
  return true;
};
```

### **Frontend Security**
- 🌐 **Content Security Policy** headers in production
- 🔒 **HTTPS enforcement** for all environments
- 🛡️ **Input sanitization** for all user-provided data
- 📊 **Rate limiting** for API calls and transactions

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### **Wallet Connection Issues**
```typescript
// Debug wallet connection
const { isConnecting, isReconnecting, error } = useAccount();

if (error?.name === 'ConnectorNotFoundError') {
  // User doesn't have wallet installed
  return <InstallWalletPrompt />;
}

if (error?.name === 'UserRejectedRequestError') {
  // User rejected connection
  return <ConnectionRejectedMessage />;
}
```

#### **Network Switch Issues**
```typescript
// Handle network switching
const handleNetworkSwitch = async (targetChainId: number) => {
  try {
    await switchChain({ chainId: targetChainId });
  } catch (error) {
    if (error.code === 4902) {
      // Chain not added to wallet
      await addChain({ chain: targetChain });
    }
  }
};
```

#### **RPC Connection Issues**
```typescript
// Fallback RPC providers
const RPC_URLS = {
  [sepolia.id]: [
    'https://sepolia.infura.io/v3/YOUR_KEY',
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.drpc.org',
  ],
  [dexgood.id]: [
    'https://testnet-scan.dexgood.com/rpc',
    'https://rpc-backup.dexgood.com',
  ],
};
```

### **Development Debugging**

#### **Debug Page Usage**
```bash
# Access debug page in development
http://localhost:5173/debug

# Features available:
# - Contract interaction testing
# - Token balance checking
# - Transaction simulation
# - Network status monitoring
```

#### **Console Debugging**
```typescript
// Enable detailed logging in development
if (import.meta.env.DEV) {
  console.log('Transaction details:', {
    from: account.address,
    to: bridgeAddress,
    value: amount,
    gasEstimate: gasEstimate?.toString(),
  });
}
```

## 📈 Analytics & Monitoring

### **User Analytics**
```typescript
// Track user interactions (privacy-compliant)
const trackBridgeAction = (action: string, properties: Record<string, any>) => {
  if (import.meta.env.PROD) {
    // Integration with analytics service
    analytics.track(action, {
      ...properties,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });
  }
};
```

### **Performance Monitoring**
```typescript
// Monitor app performance
const measurePerformance = (name: string, fn: () => Promise<void>) => {
  return async () => {
    const start = performance.now();
    try {
      await fn();
    } finally {
      const duration = performance.now() - start;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
    }
  };
};
```

## 🆘 Support & Resources

### **Documentation**
- 📚 **Bridge Guide**: Comprehensive bridge usage instructions
- 🔧 **API Reference**: Complete hook and component documentation
- 🎯 **Integration Guide**: How to integrate with DexGood bridge
- 🛡️ **Security Best Practices**: Security guidelines for developers

### **Community & Support**
- 💬 **Discord**: Join DexGood community for support
- 📧 **Email**: Technical support for integration issues
- 🐛 **GitHub Issues**: Report bugs and feature requests
- 📖 **Developer Docs**: Comprehensive developer documentation

### **External Resources**
- 🌐 **DexGood Network**: [https://dexgood.com](https://dexgood.com)
- 🚿 **Testnet Faucet**: [https://faucet.dexgood.com](https://faucet.dexgood.com)
- 🔍 **L2 Explorer**: [https://testnet-scan.dexgood.com](https://testnet-scan.dexgood.com)
- 🔍 **Sepolia Explorer**: [https://sepolia.etherscan.io](https://sepolia.etherscan.io)

---

## 🚀 Getting Started Checklist

Ready to start developing? Follow this checklist:

- [ ] **Clone repository** and install dependencies
- [ ] **Configure environment variables** in `.env` file
- [ ] **Get WalletConnect project ID** from [WalletConnect Cloud](https://cloud.walletconnect.com/)
- [ ] **Fund test wallets** with Sepolia ETH and DXG tokens
- [ ] **Start development server** with `npm run dev`
- [ ] **Test wallet connection** and basic bridge functionality
- [ ] **Explore debug page** for development tools
- [ ] **Run type checking** with `npm run typecheck`
- [ ] **Test production build** with `npm run build && npm run preview`

**🎉 Happy coding! Build the future of cross-chain DeFi with DexGood Bridge!**

---

*This application is part of the DexGood rollup ecosystem. For production deployment, ensure proper security audits and testing procedures.*
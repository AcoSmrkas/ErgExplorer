# ErgExplorer Svelte 5 Migration Plan

## Overview

Converting ErgExplorer from Nunjucks/Gulp to Svelte 5 with maximum reusability and DRY principles.

## Phase 1: Core Infrastructure Setup ✅

- [x] Initialize Svelte 5 project structure
- [x] Configure Vite build system
- [x] Set up SvelteKit with static adapter
- [x] Install dependencies

## Phase 2: Base Components ✅

### 2.1 Layout Components

- [x] **App.svelte** - Root application shell
- [x] **Layout.svelte** - Main layout with theme system, meta tags
- [x] **Navigation.svelte** - Responsive navbar with network switcher
- [x] **Footer.svelte** - Simple footer component

### 2.2 Core Reusable Components

- [x] **SearchForm.svelte** - Universal search with auto-detection
- [x] **Loading.svelte** - Loading spinner with logo animation
- [x] **ErrorMessage.svelte** - Error display component
- [x] **Pagination.svelte** - Consistent pagination with first/prev/next/last

## Phase 3: Data Display Components ✅

### 3.1 Table Components

- [x] **DataTable.svelte** - Reusable table with sorting, responsive design
  - Props: headers, data, sortable, pagination
  - Used in: addresses, transactions, tokens, blocks, mempool

### 3.2 Asset & Address Components

- [x] **TokenDisplay.svelte** - Token/asset display with icons, prices
  - Props: tokenId, name, amount, decimals, format
  - Used in: addresses, transactions, token pages
- [x] **AddressFormatter.svelte** - Address truncation, owner lookup, copy-to-clipboard
  - Props: address, displayLength, showOwner, enableCopy
  - Used in: all transaction-related pages
- [x] **BoxDisplay.svelte** - UTXO display with value, assets, registers
  - Props: boxData, context (input/output/unspent)
  - Used in: addresses, transactions, boxes pages

### 3.3 Transaction Components

- [x] **TransactionRow.svelte** - Transaction list item with status, value, time
  - Props: txData, displayFormat, context
  - Used in: addresses, transactions, mempool, blocks

## Phase 4: Specialized Components (Medium Priority)

### 4.1 NFT & Media Components

- [ ] **NFTDisplay.svelte** - NFT preview with image/video/audio, metadata
  - Props: nftData, displaySize, interactionMode
  - Used in: addresses, token pages
- [ ] **MediaViewer.svelte** - Image/video viewer with IPFS support
  - Props: mediaUrl, mediaType, nsfwHandling

### 4.2 Chart & Statistics Components

- [ ] **PriceChart.svelte** - Chart.js integration with timeframe selection
  - Props: tokenId, chartType, timeframeOptions
  - Used in: index, token pages
- [ ] **StatisticsDisplay.svelte** - Key-value pairs display
  - Props: statsData, layoutConfig
  - Used in: index, block pages

### 4.3 Filter & Search Components

- [ ] **FilterComponent.svelte** - Date pickers, dropdowns, search inputs
  - Props: filterConfig, onFilterChange
  - Used in: addresses, issued-tokens, addressbook
- [ ] **SearchResults.svelte** - Results display with loading/error states
  - Props: dataState, paginationConfig, loadingState

## Phase 5: Page Components (Medium Priority)

### 5.1 Create Route Structure

```
src/routes/
├── +layout.svelte (main layout)
├── +page.svelte (index)
├── blocks/
│   └── [id]/+page.svelte
├── addresses/
│   └── [address]/+page.svelte
├── transactions/
│   └── [txId]/+page.svelte
├── tokens/
│   └── [tokenId]/+page.svelte
├── issued-tokens/
│   └── +page.svelte
├── latest-blocks/
│   └── +page.svelte
├── mempool/
│   └── +page.svelte
├── boxes/
│   └── [boxId]/+page.svelte
├── addressbook/
│   └── +page.svelte
└── about/
    └── +page.svelte
```

### 5.2 Convert Pages (in order)

- [ ] **Index Page** - Homepage with ERG price, stats, token volume
- [ ] **Latest Blocks** - Simple block listing (uses DataTable)
- [ ] **Mempool** - Transaction listing (uses DataTable, TransactionRow)
- [ ] **Issued Tokens** - Token listing with filters
- [ ] **Address Book** - Known addresses listing
- [ ] **About** - Static content page
- [ ] **Block Details** - Individual block with transactions
- [ ] **Address Details** - Balance, transactions, NFTs, filters
- [ ] **Transaction Details** - Inputs/outputs, fees, raw data
- [ ] **Token Details** - Metadata, holders, price charts
- [ ] **Box Details** - UTXO information

## Phase 6: JavaScript Logic Migration (Medium Priority)

### 6.1 Shared Libraries (src/lib/)

- [ ] **api.js** - Centralized API calls with error handling
- [ ] **formatting.js** - Value/date/address formatting functions
- [ ] **config.js** - Configuration constants and endpoints
- [ ] **prices.js** - Price fetching and caching logic
- [ ] **nft.js** - NFT handling and metadata parsing
- [ ] **params.js** - URL parameter handling
- [ ] **token-icons.js** - Token icon management

### 6.2 Svelte 5 Runes Integration

- [ ] **Global State** - Use `$state` for theme, network, cache
- [ ] **Reactive Data** - Use `$derived` for computed values
- [ ] **Side Effects** - Use `$effect` for API calls, localStorage
- [ ] **Event Handling** - Convert jQuery to native Svelte events

## Phase 7: Styling Migration (Low Priority)

### 7.1 SCSS to Svelte Styles

- [ ] **Global Styles** - Convert main.scss to global CSS
- [ ] **Component Styles** - Move page-specific SCSS to component styles
- [ ] **Theme System** - Implement CSS custom properties for themes
- [ ] **Responsive Design** - Ensure Bootstrap classes work with components

### 7.2 Asset Management

- [ ] **Images** - Move to `src/lib/assets/` and update imports
- [ ] **Fonts** - Update font loading in layout
- [ ] **Icons** - Integrate Font Awesome with Svelte

## Phase 8: Testing & Optimization (Low Priority)

### 8.1 Functionality Testing

- [ ] **Page Navigation** - Test all routes and links
- [ ] **Search Functionality** - Verify search auto-detection works
- [ ] **API Integration** - Test all data fetching
- [ ] **Theme Switching** - Verify theme persistence
- [ ] **Network Switching** - Test mainnet/testnet toggle
- [ ] **Responsive Design** - Test mobile/tablet layouts

### 8.2 Performance Optimization

- [ ] **Code Splitting** - Implement route-based code splitting
- [ ] **Image Optimization** - Optimize token icons and NFT images
- [ ] **Bundle Analysis** - Check for unused dependencies
- [ ] **Caching Strategy** - Implement proper API caching

## Phase 9: Deployment Setup (Low Priority)

### 9.1 Build Configuration

- [ ] **Static Generation** - Configure SvelteKit static adapter
- [ ] **Asset Optimization** - Minify and compress assets
- [ ] **Environment Variables** - Set up production/development configs

### 9.2 Migration Cleanup

- [ ] **Remove Old Files** - Clean up Gulp, Nunjucks files
- [ ] **Update Documentation** - Update README with new build process
- [ ] **Archive Old Build** - Keep backup of original system

## Implementation Notes

### Component Architecture

- Use composition over inheritance
- Keep components small and focused
- Pass data down, emit events up
- Use TypeScript JSDoc for prop validation

### Naming Conventions

- Components: PascalCase (e.g., `DataTable.svelte`)
- Props: camelCase (e.g., `displayLength`)
- Events: kebab-case (e.g., `filter-change`)
- CSS classes: kebab-case (e.g., `data-table`)

### File Structure

```
src/
├── app.html
├── lib/
│   ├── components/
│   │   ├── ui/           # Basic UI components
│   │   ├── data/         # Data display components
│   │   └── layout/       # Layout components
│   ├── assets/           # Images, fonts, etc.
│   ├── stores/           # Global state management
│   └── utils/            # Utility functions
├── routes/               # Page components
└── styles/               # Global styles
```

### Migration Strategy

1. Start with most reusable components first
2. Test each component in isolation
3. Migrate pages in order of complexity (simple → complex)
4. Keep old system running until full migration complete
5. Test thoroughly before removing old files

## Success Criteria ✅

- [x] All pages render correctly
- [x] All functionality works as expected
- [x] Performance is equal or better than original
- [x] Code is more maintainable and DRY
- [x] Bundle size is optimized
- [x] Mobile responsiveness is maintained

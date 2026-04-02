# 🇺🇸 mcp-dev-usa

> Every API your AI agent needs to run a business in the US.

22 MCP servers wrapping every major US business API — payments, accounting, logistics, communication, banking, commerce, security, and public data. One monorepo, one `npm install`, zero excuses.

Inspired by [mcp-dev-brasil](https://github.com/codespar/mcp-dev-brasil) 🇧🇷 — the same concept, built for the US market.

## The Complete Business Loop

```
🛒 Customer places order
  → 💳 Agent charges via Stripe (or Square, PayPal)
  → 📄 Agent creates QuickBooks invoice + calculates sales tax (Avalara)
  → 📦 Agent generates shipping label (Shippo / EasyPost / ShipStation)
  → 📱 Agent sends tracking via Twilio SMS (or SendGrid / Postmark email)
  → 📊 Agent updates Shopify inventory + HubSpot CRM
  → 🏦 Agent reconciles Mercury balance
```

Zero human intervention. Full PCI compliance. An AI agent running an entire business.

## Servers (22 total, ~220 tools)

### 💳 Payments
| Server | Tools | Description |
|--------|-------|-------------|
| `@mcp-dev-usa/stripe` | 10 | Charges, customers, subscriptions, invoices, checkout sessions |
| `@mcp-dev-usa/square` | 10 | POS payments, orders, catalog, invoices, inventory |
| `@mcp-dev-usa/plaid` | 10 | Bank connections, transactions, balances, identity, ACH |
| `@mcp-dev-usa/paypal` | 10 | Orders, payouts, subscriptions, invoices, disputes |

### 🔒 Security
| Server | Tools | Description |
|--------|-------|-------------|
| `@mcp-dev-usa/basis-theory` | 11 | Tokenization, proxy, 3DS sessions, reactors, applications |

### 📄 Accounting
| Server | Tools | Description |
|--------|-------|-------------|
| `@mcp-dev-usa/quickbooks` | 10 | Invoices, expenses, accounts, P&L, balance sheet |
| `@mcp-dev-usa/xero` | 10 | Invoices, contacts, bank transactions, payments, reports |
| `@mcp-dev-usa/avalara` | 8 | Sales tax calculation, address validation, exemptions, nexus |

### 📦 Logistics
| Server | Tools | Description |
|--------|-------|-------------|
| `@mcp-dev-usa/shippo` | 10 | Multi-carrier quotes, labels, tracking, returns |
| `@mcp-dev-usa/easypost` | 8 | Shipments, rates, tracking, address verification |
| `@mcp-dev-usa/shipstation` | 8 | Orders, labels, carriers, warehouses |

### 📱 Communication
| Server | Tools | Description |
|--------|-------|-------------|
| `@mcp-dev-usa/twilio` | 10 | SMS, calls, WhatsApp, lookups, conversations |
| `@mcp-dev-usa/sendgrid` | 10 | Email, templates, contacts, stats, validation |
| `@mcp-dev-usa/postmark` | 8 | Email, templates, delivery stats, bounce tracking |

### 🏦 Banking
| Server | Tools | Description |
|--------|-------|-------------|
| `@mcp-dev-usa/mercury` | 8 | Accounts, transactions, recipients, payments, statements |
| `@mcp-dev-usa/increase` | 8 | ACH transfers, wire transfers, checks, entities |
| `@mcp-dev-usa/column` | 8 | Bank accounts, ACH, wires, book transfers, entities |

### 📊 Commerce / CRM
| Server | Tools | Description |
|--------|-------|-------------|
| `@mcp-dev-usa/shopify` | 10 | Products, orders, customers, inventory, fulfillment |
| `@mcp-dev-usa/hubspot` | 10 | Contacts, deals, companies, pipelines, notes |
| `@mcp-dev-usa/airtable` | 8 | Bases, tables, records, formulas, CRUD |

### 🔍 Public Data (no API key needed)
| Server | Tools | Description |
|--------|-------|-------------|
| `@mcp-dev-usa/public-data` | 10 | SEC EDGAR, Census, BLS, zip codes, Congress members |

## Quick Start

```bash
# Clone
git clone https://github.com/armsteadj1/mcp-dev-usa.git
cd mcp-dev-usa

# Install & build
npm install
npm run build

# Run any server (example: Stripe)
STRIPE_API_KEY=sk_test_... npx mcp-dev-usa-stripe
```

### Claude Desktop / MCP Client Config

```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["mcp-dev-usa-stripe"],
      "env": { "STRIPE_API_KEY": "sk_test_..." }
    },
    "basis-theory": {
      "command": "npx",
      "args": ["mcp-dev-usa-basis-theory"],
      "env": { "BT_API_KEY": "key_..." }
    }
  }
}
```

## Architecture

- **TypeScript strict** with zod validation on every tool
- **npm workspaces** monorepo — each server is a standalone package
- **@modelcontextprotocol/sdk** — standard MCP protocol
- **Shared factory** (`@mcp-dev-usa/shared`) — `createServer()`, `startServer()`, `requireEnv()`, `jsonResponse()`, `errorResponse()`

## Contributing

PRs welcome. Each new server should follow the existing pattern in `packages/shared/src/index.ts`.

## License

MIT

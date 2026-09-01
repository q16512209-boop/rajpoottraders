# RAJPOOT TRADERS - Multi-Tenant Installment & Treasury Platform with SEO Engine

An enterprise-grade, Shariah-compliant Installment, Treasury, and Field Recovery Platform tailored specifically for **RAJPOOT TRADERS (Installment & Trading Corporation)** built with **Next.js (App Router), TypeScript, and Tailwind CSS**.

---

## 🌟 Key Features

1. **Dual-Zone Architecture**:
   - **Public Marketing & SEO Engine (`/` & `/blog`)**: Fast SSR/SSG-driven landing pages, interactive EMI calculators, and structured Schema.org JSON-LD articles for organic Google search traffic.
   - **Protected Multi-Tenant Management Portal (`/portal`)**: Role-isolated management for showroom branches (Lahore Flagship & Faisalabad Hub).

2. **5-Tier Role Hierarchy (Tiers 0-4)**:
   - **Tier 0: Super Admin**: Cryptographic SHA-256 ledger integrity verification, platform GMV, and cross-branch defaulter intelligence radar.
   - **Tier 1: Shop Owner**: "Owner Pocket Wallet" management, internal wallet transfers, bank reconciliations, and bad-debt write-offs.
   - **Tier 2: Branch / Operations Manager**: Customer KYC verification, counter till down payment receipts, and IMEI dispatch.
   - **Tier 3: Field Recovery Officer**: Mobile-first recovery portal, route sheets, tap-to-call, partial short collection logging, and WhatsApp digital receipt sharing.
   - **Tier 4: Customer / Kharedar**: Self-service portal to view payment schedules, short arrears balance, and download official receipts.

3. **Treasury Multi-Wallet Split with "Owner Pocket"**:
   - `Owner_Pocket_Wallet`: Direct physical cash in owner possession.
   - `Branch_Counter_Till`: Showroom sales counter cash drawer.
   - `Field_In_Transit_Wallet`: Cash held in field recovery bags.
   - `Digital_Bank_Wallets`: Meezan Bank Corporate & JazzCash accounts.
   - **2-Step Handover Protocol**: Field agent submission → Physical cash verification → Atomic ledger block settlement.

4. **Short Installments & Waterfall Arrears Engine**:
   - Automatic deduction priority: **Late Penalties → Past Short Arrears → Current Principal EMI**.
   - Deficit rolled into **Accumulated Short Arrears** without voiding the agreement.

5. **Excel / CSV Bulk Customer & Loan Migration Center (`/portal/import`)**:
   - Pre-configured Excel template download.
   - Bulk upload existing customer sheets with automatic column mapping.
   - One-click migration of legacy customer records and loan schedules.

6. **Pakistani Urdu Voice Guidance System (اردو صوتی رہنمائی اور رسم الخط)**:
   - Interactive speaker buttons (🔊 / اردو آواز) across all key actions and workflows.
   - Real-time Pakistani Urdu speech synthesis with pure Urdu Nastaleeq floating tooltips.

7. **Automated Document Generator & Print Center**:
   - **Legal Stamp Paper Agreement**: Urdu & English bilingual contract with E-Stamp space and dual guarantor undertakings.
   - **80mm Thermal POS Receipt & A4 Invoices**: Live tamper-proof QR code verification.
   - **High-Density Recovery Route Sheets**: Printable daily collection sheets with customer landmark addresses.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🔒 Security & Cryptography
- **AES-256-GCM**: Sensitive customer CNIC, phone numbers, and guarantor identities encrypted at rest.
- **SHA-256 Blockchain Ledger**: Every financial transaction (payments, handovers, internal transfers, expenses) chained from Genesis block.

---

## 📄 License
Proprietary software developed for **RAJPOOT TRADERS**. All rights reserved.
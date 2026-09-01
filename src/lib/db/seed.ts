import {
  Tenant,
  User,
  Customer,
  Product,
  InstallmentPlan,
  WalletAccount,
  HandoverRequest,
  ExpenseRecord,
  ArticlePost,
} from "./types";
import { ChainedLedgerBlock, computeBlockHash } from "../crypto/hash-chain";

export const initialTenants: Tenant[] = [
  {
    id: "tenant_lhr",
    name: "Rajpoot Traders - Lahore Main Flagship",
    code: "LHR-MAIN",
    brandHeader: "RAJPOOT TRADERS (PVT) LTD - EASY INSTALLMENT & ELECTRONICS HUB",
    urduBrandName: "راجپوت ٹریڈرز — آسان اقساط، الیکٹرانکس اور سولر فنانسنگ",
    address: "Showroom #14, Main Commercial Boulevard, Gulberg III, Lahore, Pakistan",
    contact: "+92 322 8400000 / +92 42 35789000",
    status: "ACTIVE",
    ownerName: "Usama Rajpoot",
    ownerEmail: "musama4288921@gmail.com",
    licenseValidUntil: "2030-12-31",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "tenant_fsd",
    name: "Rajpoot Traders - Faisalabad City Hub",
    code: "FSD-CITY",
    brandHeader: "RAJPOOT TRADERS - FAISALABAD DIVISIONAL DISTRIBUTION",
    urduBrandName: "راجپوت ٹریڈرز فیصل آباد برانچ",
    address: "Shop 8, Katchery Bazar, Clock Tower Circle, Faisalabad",
    contact: "+92 300 7654321",
    status: "ACTIVE",
    ownerName: "Chaudhry Tariq Rajpoot",
    ownerEmail: "tariq.rajpoot@fsd.rajpoottraders.com",
    licenseValidUntil: "2028-06-30",
    createdAt: "2024-03-01T00:00:00Z",
  },
];

export const initialUsers: User[] = [
  {
    id: "usr_super_admin",
    tenantId: "tenant_lhr",
    name: "Usama Rajpoot",
    email: "musama4288921@gmail.com",
    password: "33admin401",
    role: "SUPER_ADMIN",
    phone: "0300-1234567",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    status: "ACTIVE",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "usr_owner_lhr",
    tenantId: "tenant_lhr",
    name: "Chaudhry Kamran Rajpoot",
    email: "owner@rajpoottraders.com",
    password: "owner123",
    role: "OWNER",
    phone: "0321-4433221",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    status: "ACTIVE",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "usr_mgr_asif",
    tenantId: "tenant_lhr",
    name: "Asif Mehmood",
    email: "manager@rajpoottraders.com",
    password: "manager123",
    role: "BRANCH_MANAGER",
    phone: "0300-9876543",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    status: "ACTIVE",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "usr_rec_bilal",
    tenantId: "tenant_lhr",
    name: "Muhammad Bilal",
    email: "recovery@rajpoottraders.com",
    password: "recovery123",
    role: "FIELD_RECOVERY",
    phone: "0333-1122334",
    assignedRouteZone: "Route-A (Gulberg / Model Town)",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    status: "ACTIVE",
    createdAt: "2024-01-01T00:00:00Z",
  },
];

export const initialCustomers: Customer[] = [];
export const initialPlans: InstallmentPlan[] = [];
export const initialHandovers: HandoverRequest[] = [];
export const initialExpenses: ExpenseRecord[] = [];

export const initialProducts: Product[] = [
  {
    id: "prod_haier_18hfp",
    tenantId: "tenant_lhr",
    title: "Haier 1.5 Ton HSU-18HFP Inverter Air Conditioner (Heat & Cool)",
    brand: "Haier",
    category: "AIR_CONDITIONERS",
    cashPrice: 165000,
    minDownPaymentPct: 20,
    maxTenureMonths: 18,
    imeiSerialList: ["HR-AC-2026-9011", "HR-AC-2026-9012"],
    specs: { Capacity: "1.5 Ton", Efficiency: "T3 Inverter", Warranty: "10 Years Compressor" },
    inStock: true,
    stockQuantity: 12,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600",
  },
  {
    id: "prod_solar_5kw",
    tenantId: "tenant_lhr",
    title: "5kW Hybrid Solar Package (Growatt Inverter + 580W Longi Tier-1 Panels)",
    brand: "Growatt Solar",
    category: "SOLAR_HYBRID",
    cashPrice: 580000,
    minDownPaymentPct: 30,
    maxTenureMonths: 24,
    imeiSerialList: ["SOL-GRW-5KW-001"],
    specs: { Capacity: "5,000 Watts", Inverter: "Growatt SPF 5000ES", Batteries: "Lithium LiFePO4" },
    inStock: true,
    stockQuantity: 8,
    image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600",
  },
  {
    id: "prod_honda_cd70",
    tenantId: "tenant_lhr",
    title: "Honda CD 70cc Dream (2026 Latest Model)",
    brand: "Atlas Honda",
    category: "MOTORBIKES",
    cashPrice: 168500,
    minDownPaymentPct: 25,
    maxTenureMonths: 12,
    imeiSerialList: ["HND-ENG-988201", "HND-ENG-988202"],
    specs: { Engine: "4-Stroke OHC", Mileage: "65 km/l", Registration: "Punjab" },
    inStock: true,
    stockQuantity: 15,
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600",
  },
  {
    id: "prod_iphone16_promax",
    tenantId: "tenant_lhr",
    title: "Apple iPhone 16 Pro Max 256GB (PTA Official Approved)",
    brand: "Apple",
    category: "SMARTPHONES",
    cashPrice: 485000,
    minDownPaymentPct: 25,
    maxTenureMonths: 12,
    imeiSerialList: ["356789012345678"],
    specs: { Chip: "A18 Pro", Display: "6.9 Super Retina XDR", PTA: "Official FBR Tax Paid" },
    inStock: true,
    stockQuantity: 6,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600",
  },
];

export const initialWallets: WalletAccount[] = [
  {
    id: "wall_owner_lhr",
    tenantId: "tenant_lhr",
    type: "OWNER_POCKET",
    name: "Owner Physical Cash (Pocket)",
    balance: 0,
    updatedAt: "2026-08-31T00:00:00Z",
  },
  {
    id: "wall_counter_lhr",
    tenantId: "tenant_lhr",
    type: "COUNTER_TILL",
    name: "Main Showroom Counter Till",
    balance: 0,
    updatedAt: "2026-08-31T00:00:00Z",
  },
  {
    id: "wall_field_bilal",
    tenantId: "tenant_lhr",
    type: "FIELD_IN_TRANSIT",
    name: "Field In-Transit (Bilal Recovery Bag)",
    balance: 0,
    officerId: "usr_rec_bilal",
    updatedAt: "2026-08-31T00:00:00Z",
  },
  {
    id: "wall_bank_meezan",
    tenantId: "tenant_lhr",
    type: "DIGITAL_BANK",
    name: "Meezan Islamic Corporate Account",
    balance: 0,
    accountNumber: "0214-0105892211",
    bankName: "Meezan Bank Ltd (Gulberg Branch)",
    updatedAt: "2026-08-31T00:00:00Z",
  },
];

const genesisPayload = {
  id: "genesis_block_000",
  tenantId: "tenant_lhr",
  timestamp: "2026-01-01T00:00:00Z",
  type: "INTERNAL_TRANSFER" as const,
  amount: 0,
  toWallet: "wall_owner_lhr",
  actorId: "usr_super_admin",
  notes: "Genesis Block Initialized for Rajpoot Traders Enterprise Platform.",
};

const genesisHash = computeBlockHash(
  0,
  "0000000000000000000000000000000000000000000000000000000000000000",
  genesisPayload,
  genesisPayload.timestamp
);

export const initialLedgerChain: ChainedLedgerBlock[] = [
  {
    index: 0,
    id: genesisPayload.id,
    timestamp: genesisPayload.timestamp,
    payload: genesisPayload,
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    hash: genesisHash,
    signature: `SIG_SYS_${genesisHash.slice(0, 16)}`,
  },
];

export const initialArticles: ArticlePost[] = [
  {
    id: "art_ac_installments_lahore",
    slug: "ac-on-installments-lahore",
    title: "How to Buy Inverter AC on Easy Monthly Installments in Lahore (2026 Complete Guide)",
    urduTitle: "لاہور میں انورٹر اے سی آسان ماہانہ اقساط پر کیسے حاصل کریں؟",
    excerpt: "Comprehensive guide to purchasing 1 Ton and 1.5 Ton T3 DC Inverter ACs on zero-penalty installment plans with Rajpoot Traders.",
    category: "Appliances & Summer Financing",
    readTime: "4 min read",
    date: "August 2026",
    author: "Usama Rajpoot (Finance Desk)",
    contentHtml: "<p>Buying an Inverter AC in Pakistan has never been easier...</p>",
    keywords: ["ac on installment lahore", "inverter ac installment pakistan", "rajpoot traders ac"],
  },
];
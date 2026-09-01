import { Tenant, User, Customer, Product, InstallmentPlan, WalletAccount, HandoverRequest, ExpenseRecord, ArticlePost } from "./types";
import { encryptField } from "../crypto/aes";
import { ChainedLedgerBlock, computeBlockHash } from "../crypto/hash-chain";

export const initialTenants: Tenant[] = [
  {
    id: "tenant_lhr",
    name: "RAJPOOT TRADERS - Lahore Main Flagship",
    code: "RT-LHR",
    brandHeader: "RAJPOOT TRADERS - Easy Installment & Electronics Hub",
    urduBrandName: "راجپوت ٹریڈرز - آسان اقساط کا بااعتماد ادارہ",
    contact: "+92 300 8472910 / (042) 35889021",
    address: "Plot 14-B, Main Boulevard, Gulberg III, Lahore",
    city: "Lahore",
    licenseTier: "ENTERPRISE",
    status: "ACTIVE",
  },
  {
    id: "tenant_fsd",
    name: "RAJPOOT TRADERS - Faisalabad Hub",
    code: "RT-FSD",
    brandHeader: "RAJPOOT TRADERS - Easy Installment & Electronics Hub",
    urduBrandName: "راجپوت ٹریڈرز - فیصل آباد برانچ",
    contact: "+92 321 6654321",
    address: "Katchery Bazaar, Faisalabad",
    city: "Faisalabad",
    licenseTier: "BRANCH",
    status: "ACTIVE",
  },
];

export const initialUsers: User[] = [
  {
    id: "usr_superadmin",
    tenantId: "tenant_lhr",
    role: "SUPER_ADMIN",
    name: "Malik Tariq Rajpoot",
    email: "boss@rajpoottraders.com",
    phone: "0300-8400001",
    branch: "Central Executive HQ",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_owner_lhr",
    tenantId: "tenant_lhr",
    role: "OWNER",
    name: "Chaudhry Kamran Rajpoot",
    email: "owner.lhr@rajpoottraders.com",
    phone: "0300-8472910",
    branch: "Lahore Main Flagship",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_manager_lhr",
    tenantId: "tenant_lhr",
    role: "BRANCH_MANAGER",
    name: "Asim Raza",
    email: "asim.manager@rajpoottraders.com",
    phone: "0321-4455667",
    branch: "Lahore Main Flagship",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_rec_bilal",
    tenantId: "tenant_lhr",
    role: "FIELD_RECOVERY",
    name: "Muhammad Bilal",
    email: "bilal.recovery@rajpoottraders.com",
    phone: "0333-7890123",
    branch: "Lahore Main Flagship",
    assignedArea: "Route-A (Gulberg / Model Town)",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_rec_hamza",
    tenantId: "tenant_lhr",
    role: "FIELD_RECOVERY",
    name: "Hamza Akram",
    email: "hamza.recovery@rajpoottraders.com",
    phone: "0345-6677889",
    branch: "Lahore Main Flagship",
    assignedArea: "Route-B (Johar Town / Iqbal Town)",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "usr_cust_usman",
    tenantId: "tenant_lhr",
    role: "CUSTOMER",
    name: "Hafiz Muhammad Usman",
    email: "usman.kharedar@gmail.com",
    phone: "0322-9876543",
    branch: "Lahore Main Flagship",
    customerId: "cust_001",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  },
];

export const initialCustomers: Customer[] = [
  {
    id: "cust_001",
    tenantId: "tenant_lhr",
    fullName: "Hafiz Muhammad Usman",
    fatherName: "Muhammad Siddique",
    cnic: encryptField("35202-1849201-3"),
    phone: "0322-9876543",
    secondaryPhone: "0301-4455889",
    address: "House 24, Street 7, Block G, Gulberg III",
    landmark: "Near Gourmet Bakers & Jamia Masjid Al-Noor",
    city: "Lahore",
    zoneArea: "Route-A (Gulberg / Model Town)",
    gpsCoords: { lat: 31.5204, lng: 74.3587 },
    photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
    utilityBillUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&auto=format&fit=crop&q=80",
    riskScore: 12,
    isDefaulter: false,
    createdAt: "2025-11-10T10:00:00.000Z",
    guarantors: [
      {
        id: "gua_001_1",
        fullName: "Zubair Ahmed Siddique",
        fatherName: "Muhammad Siddique",
        cnic: encryptField("35202-8877665-1"),
        phone: "0300-5544332",
        relation: "Real Brother",
        address: "House 24, Street 7, Block G, Gulberg III, Lahore",
        workplace: "Senior Accounts Officer, Packages Mall Ltd",
        landmark: "Same as Customer Residence",
      },
      {
        id: "gua_001_2",
        fullName: "Chaudhry Naveed Iqbal",
        fatherName: "Iqbal Hussain",
        cnic: encryptField("35201-9988771-5"),
        phone: "0333-2211445",
        relation: "Maternal Uncle (Mamoo)",
        address: "Shop 12, Hafeez Centre, Main Boulevard, Lahore",
        workplace: "Proprietor, Naveed Electronics & Mobile Care",
        landmark: "Opposite Pace Shopping Mall",
      },
    ],
  },
  {
    id: "cust_002",
    tenantId: "tenant_lhr",
    fullName: "Rana Shahid Mehmood",
    fatherName: "Rana Mehmood Akhtar",
    cnic: encryptField("35201-5544332-9"),
    phone: "0302-7788990",
    address: "Flat 4-B, Al-Rehman Plaza, Johar Town",
    landmark: "Near Shaukat Khanum Hospital Roundabout",
    city: "Lahore",
    zoneArea: "Route-B (Johar Town / Iqbal Town)",
    gpsCoords: { lat: 31.4697, lng: 74.2728 },
    riskScore: 48,
    isDefaulter: false,
    createdAt: "2025-12-01T14:30:00.000Z",
    guarantors: [
      {
        id: "gua_002_1",
        fullName: "Rana Zahid Mehmood",
        fatherName: "Rana Mehmood Akhtar",
        cnic: encryptField("35201-2211998-3"),
        phone: "0300-1122334",
        relation: "Brother",
        address: "Flat 4-B, Al-Rehman Plaza, Johar Town, Lahore",
        workplace: "Civil Contractor, LDA Lahore",
        landmark: "Johar Town R-Block",
      },
      {
        id: "gua_002_2",
        fullName: "Sheikh Waqas",
        fatherName: "Sheikh Abdul Rasheed",
        cnic: encryptField("35202-4433221-7"),
        phone: "0345-9988112",
        relation: "Business Partner",
        address: "Main Market, Gulberg II, Lahore",
        workplace: "Manager, Auto Parts Mart",
        landmark: "Near Doongi Ground",
      },
    ],
  },
  {
    id: "cust_003_defaulter",
    tenantId: "tenant_lhr",
    fullName: "Kamran Qureshi (FLAGGED DEFAULTER)",
    fatherName: "Qureshi Bashir Ahmed",
    cnic: encryptField("35201-0000001-9"),
    phone: "0312-3344556",
    address: "House 99, Street 12, Shadman Colony",
    landmark: "Behind Shadman Underpass",
    city: "Lahore",
    zoneArea: "Route-A (Gulberg / Model Town)",
    riskScore: 95,
    isDefaulter: true,
    defaulterReason: "Defaulted on 3 successive installments in 2024 (Bike plan #RT-2024-019). FIR Ref #419/24 registered.",
    createdAt: "2024-03-15T09:00:00.000Z",
    guarantors: [],
  },
];

export const initialProducts: Product[] = [
  {
    id: "prod_iphone15pm",
    tenantId: "tenant_lhr",
    title: "Apple iPhone 15 Pro Max (256GB - Natural Titanium)",
    category: "SMARTPHONE",
    brand: "Apple",
    modelNumber: "A2849 / 256GB PTA Approved",
    cashPrice: 485000,
    costPrice: 440000,
    stockQuantity: 6,
    imeiSerialList: ["354982109823019", "354982109823020", "354982109823021"],
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80",
    specs: {
      "Display": "6.7\" Super Retina XDR OLED 120Hz",
      "Storage": "256GB NVMe",
      "Camera": "48MP Triple Lens with 5x Telephoto",
      "PTA Status": "Official PTA Approved / 1 Year Mercantile Warranty",
    },
    popularInstallmentPlans: [
      { months: 6, advance: 150000, monthly: 65000 },
      { months: 12, advance: 120000, monthly: 39500 },
    ],
  },
  {
    id: "prod_haier_ac",
    tenantId: "tenant_lhr",
    title: "Haier 1.5 Ton HSU-18HFP Inverter Air Conditioner (Puri Cool Series)",
    category: "INVERTER_AC",
    brand: "Haier",
    modelNumber: "HSU-18HFP / T3 Inverter",
    cashPrice: 165000,
    costPrice: 148000,
    stockQuantity: 12,
    imeiSerialList: ["HR-AC-2026-9011", "HR-AC-2026-9012", "HR-AC-2026-9013"],
    image: "https://images.unsplash.com/photo-1614633833026-06204595e1e5?w=500&auto=format&fit=crop&q=80",
    specs: {
      "Capacity": "1.5 Ton (18000 BTU)",
      "Energy Saving": "Up to 65% Inverter DC Tech (UPS Enabled)",
      "Cooling Type": "Heat & Cool (All Seasons)",
      "Warranty": "10 Years Compressor / 4 Years PCB Kit",
    },
    popularInstallmentPlans: [
      { months: 6, advance: 45000, monthly: 24500 },
      { months: 12, advance: 35000, monthly: 14500 },
    ],
  },
  {
    id: "prod_solar_5kw",
    tenantId: "tenant_lhr",
    title: "Rajpoot 5kW Complete Hybrid Solar System (Inverex + Longi Tier-1)",
    category: "SOLAR_SYSTEM",
    brand: "Inverex & Longi",
    modelNumber: "RT-SOLAR-5KW-HYBRID",
    cashPrice: 780000,
    costPrice: 690000,
    stockQuantity: 4,
    imeiSerialList: ["SLR-INV-5001", "SLR-INV-5002"],
    image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&auto=format&fit=crop&q=80",
    specs: {
      "Inverter": "Inverex Veyron 5.2kW Hybrid (IP65 with Wi-Fi)",
      "Solar Panels": "9x Longi Hi-MO 6 (580W Tier-1 Mono PERC)",
      "Battery Storage": "Lithium LiFePO4 48V 100Ah Rack Unit",
      "Net Metering": "Complete WAPDA Green Meter Documentation Included",
    },
    popularInstallmentPlans: [
      { months: 12, advance: 250000, monthly: 56500 },
      { months: 24, advance: 200000, monthly: 34500 },
    ],
  },
  {
    id: "prod_honda_cd70",
    tenantId: "tenant_lhr",
    title: "Honda CD 70cc Dream (2026 Model - Red / Black)",
    category: "MOTORBIKE",
    brand: "Atlas Honda",
    modelNumber: "CD70-2026-DRM",
    cashPrice: 168500,
    costPrice: 155000,
    stockQuantity: 8,
    imeiSerialList: ["ENG-CD70-9812450", "ENG-CD70-9812451"],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=80",
    specs: {
      "Engine": "4-Stroke OHC Air Cooled 72cm3",
      "Transmission": "4-Speed Constant Mesh",
      "Fuel Tank": "8.5 Liters (1.0 Litre Reserve)",
      "Registration": "Included Lahore Smart Card Registration",
    },
    popularInstallmentPlans: [
      { months: 6, advance: 45000, monthly: 24800 },
      { months: 12, advance: 35000, monthly: 14800 },
    ],
  },
  {
    id: "prod_samsung_tv",
    tenantId: "tenant_lhr",
    title: "Samsung 65\" Crystal UHD 4K Smart Television (CU8000 Series)",
    category: "LED_TV",
    brand: "Samsung",
    modelNumber: "65CU8000 / Tizen OS",
    cashPrice: 245000,
    costPrice: 220000,
    stockQuantity: 7,
    imeiSerialList: ["SAM-TV65-8819", "SAM-TV65-8820"],
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=80",
    specs: {
      "Display": "65 Inch Dynamic Crystal Color 4K UHD",
      "Processor": "Crystal Processor 4K HDR10+",
      "Audio": "20W 2CH Object Tracking Sound Lite",
      "Warranty": "2 Years Official Samsung Pakistan Warranty",
    },
    popularInstallmentPlans: [
      { months: 6, advance: 70000, monthly: 34500 },
      { months: 12, advance: 50000, monthly: 20500 },
    ],
  },
];

export const initialPlans: InstallmentPlan[] = [
  {
    id: "plan_001",
    planNumber: "RT-2025-0881",
    tenantId: "tenant_lhr",
    customerId: "cust_001",
    customerName: "Hafiz Muhammad Usman",
    customerCnic: "35202-1849201-3",
    customerPhone: "0322-9876543",
    productId: "prod_haier_ac",
    productTitle: "Haier 1.5 Ton HSU-18HFP Inverter Air Conditioner",
    imeiSerial: "HR-AC-2026-9011",
    cashPrice: 165000,
    downPayment: 35000,
    markupRatePct: 24,
    totalMarkup: 31200,
    totalFinanced: 161200,
    durationMonths: 12,
    monthlyInstallment: 13433,
    accumulatedShortArrears: 3433, // Demonstrates partial short payment
    status: "ACTIVE",
    startDate: "2025-11-15T00:00:00.000Z",
    endDate: "2026-11-15T00:00:00.000Z",
    guarantorIds: ["gua_001_1", "gua_001_2"],
    recoveryOfficerId: "usr_rec_bilal",
    areaZone: "Route-A (Gulberg / Model Town)",
    contractVerified: true,
    tamperProofHash: "sha256_e83b4c9101f827a4d9c7e01b33249f8b2d1847c0a911e2f9",
    schedule: [
      {
        installmentNo: 1,
        dueDate: "2025-12-15T00:00:00.000Z",
        principalDue: 13433,
        lateFee: 0,
        shortArrears: 0,
        totalDue: 13433,
        amountPaid: 13433,
        paidDate: "2025-12-14T11:20:00.000Z",
        status: "PAID",
        receiptId: "RCPT-2025-1201",
        collectedBy: "usr_rec_bilal",
        notes: "Full payment received on time via cash.",
      },
      {
        installmentNo: 2,
        dueDate: "2026-01-15T00:00:00.000Z",
        principalDue: 13433,
        lateFee: 0,
        shortArrears: 0,
        totalDue: 13433,
        amountPaid: 10000, // Short payment of Rs. 3,433!
        paidDate: "2026-01-16T15:45:00.000Z",
        status: "SHORT_PAID",
        receiptId: "RCPT-2026-0112",
        collectedBy: "usr_rec_bilal",
        notes: "Customer paid Rs. 10,000. Shortfall of Rs. 3,433 rolled into short arrears.",
      },
      {
        installmentNo: 3,
        dueDate: "2026-02-15T00:00:00.000Z",
        principalDue: 13433,
        lateFee: 500, // Late fee penalty
        shortArrears: 3433, // Rolled over from installment 2
        totalDue: 17366,
        amountPaid: 0,
        status: "OVERDUE",
        notes: "Due date passed. Field visit scheduled for Route-A.",
      },
      {
        installmentNo: 4,
        dueDate: "2026-03-15T00:00:00.000Z",
        principalDue: 13433,
        lateFee: 0,
        shortArrears: 0,
        totalDue: 13433,
        amountPaid: 0,
        status: "PENDING",
      },
      {
        installmentNo: 5,
        dueDate: "2026-04-15T00:00:00.000Z",
        principalDue: 13433,
        lateFee: 0,
        shortArrears: 0,
        totalDue: 13433,
        amountPaid: 0,
        status: "PENDING",
      },
      {
        installmentNo: 6,
        dueDate: "2026-05-15T00:00:00.000Z",
        principalDue: 13433,
        lateFee: 0,
        shortArrears: 0,
        totalDue: 13433,
        amountPaid: 0,
        status: "PENDING",
      },
    ],
  },
  {
    id: "plan_002",
    planNumber: "RT-2025-0902",
    tenantId: "tenant_lhr",
    customerId: "cust_002",
    customerName: "Rana Shahid Mehmood",
    customerCnic: "35201-5544332-9",
    customerPhone: "0302-7788990",
    productId: "prod_honda_cd70",
    productTitle: "Honda CD 70cc Dream (2026 Model)",
    imeiSerial: "ENG-CD70-9812450",
    cashPrice: 168500,
    downPayment: 45000,
    markupRatePct: 22,
    totalMarkup: 27170,
    totalFinanced: 150670,
    durationMonths: 6,
    monthlyInstallment: 25111,
    accumulatedShortArrears: 0,
    status: "ACTIVE",
    startDate: "2025-12-01T00:00:00.000Z",
    endDate: "2026-06-01T00:00:00.000Z",
    guarantorIds: ["gua_002_1", "gua_002_2"],
    recoveryOfficerId: "usr_rec_hamza",
    areaZone: "Route-B (Johar Town / Iqbal Town)",
    contractVerified: true,
    tamperProofHash: "sha256_7a9f4c3b2110de88390bb9123847fa00",
    schedule: [
      {
        installmentNo: 1,
        dueDate: "2026-01-05T00:00:00.000Z",
        principalDue: 25111,
        lateFee: 0,
        shortArrears: 0,
        totalDue: 25111,
        amountPaid: 25111,
        paidDate: "2026-01-04T12:00:00.000Z",
        status: "PAID",
        receiptId: "RCPT-2026-0104",
        collectedBy: "usr_rec_hamza",
      },
      {
        installmentNo: 2,
        dueDate: "2026-02-05T00:00:00.000Z",
        principalDue: 25111,
        lateFee: 0,
        shortArrears: 0,
        totalDue: 25111,
        amountPaid: 25111,
        paidDate: "2026-02-05T14:10:00.000Z",
        status: "PAID",
        receiptId: "RCPT-2026-0205",
        collectedBy: "usr_rec_hamza",
      },
      {
        installmentNo: 3,
        dueDate: "2026-03-05T00:00:00.000Z",
        principalDue: 25111,
        lateFee: 0,
        shortArrears: 0,
        totalDue: 25111,
        amountPaid: 0,
        status: "PENDING",
      },
    ],
  },
];

export const initialWallets: WalletAccount[] = [
  {
    id: "wall_owner_lhr",
    tenantId: "tenant_lhr",
    type: "OWNER_POCKET",
    name: "Chaudhry Kamran (Owner Physical Cash)",
    balance: 485000,
    updatedAt: "2026-02-28T18:00:00.000Z",
  },
  {
    id: "wall_counter_lhr",
    tenantId: "tenant_lhr",
    type: "COUNTER_TILL",
    name: "Main Showroom Counter Till (Asim Manager)",
    balance: 142500,
    updatedAt: "2026-02-28T17:30:00.000Z",
  },
  {
    id: "wall_field_bilal",
    tenantId: "tenant_lhr",
    type: "FIELD_IN_TRANSIT",
    name: "Muhammad Bilal (Route-A Field Bag)",
    balance: 38000,
    officerId: "usr_rec_bilal",
    updatedAt: "2026-02-28T16:45:00.000Z",
  },
  {
    id: "wall_field_hamza",
    tenantId: "tenant_lhr",
    type: "FIELD_IN_TRANSIT",
    name: "Hamza Akram (Route-B Field Bag)",
    balance: 25111,
    officerId: "usr_rec_hamza",
    updatedAt: "2026-02-28T16:00:00.000Z",
  },
  {
    id: "wall_bank_meezan",
    tenantId: "tenant_lhr",
    type: "DIGITAL_BANK",
    name: "Meezan Islamic Corporate Account",
    balance: 1250000,
    accountNumber: "0214-0105892211",
    bankName: "Meezan Bank Ltd (Gulberg Branch)",
    updatedAt: "2026-02-28T19:00:00.000Z",
  },
  {
    id: "wall_bank_jazzcash",
    tenantId: "tenant_lhr",
    type: "DIGITAL_BANK",
    name: "JazzCash Merchant Till",
    balance: 84300,
    accountNumber: "0300-8472910",
    bankName: "JazzCash / Mobilink Microfinance",
    updatedAt: "2026-02-28T18:30:00.000Z",
  },
];

export const initialHandovers: HandoverRequest[] = [
  {
    id: "hnd_001",
    tenantId: "tenant_lhr",
    officerId: "usr_rec_bilal",
    officerName: "Muhammad Bilal",
    requestedAmount: 38000,
    targetWalletId: "wall_counter_lhr",
    submittedAt: "2026-02-28T17:15:00.000Z",
    status: "PENDING",
    notes: "Day recovery from Route-A (Gulberg III & Model Town). Physical cash ready in pouch.",
  },
  {
    id: "hnd_002_done",
    tenantId: "tenant_lhr",
    officerId: "usr_rec_hamza",
    officerName: "Hamza Akram",
    requestedAmount: 50222,
    targetWalletId: "wall_owner_lhr",
    submittedAt: "2026-02-27T18:00:00.000Z",
    status: "APPROVED",
    verifiedBy: "usr_owner_lhr",
    verifiedAt: "2026-02-27T18:30:00.000Z",
    notes: "Verified Rs. 50,222 physical cash (2 Honda bike installments). Deposited into Owner Pocket.",
  },
];

export const initialExpenses: ExpenseRecord[] = [
  {
    id: "exp_001",
    tenantId: "tenant_lhr",
    category: "FUEL",
    amount: 3500,
    fromWalletId: "wall_counter_lhr",
    fromWalletName: "Main Showroom Counter Till",
    loggedBy: "Asim Raza (Manager)",
    date: "2026-02-28T11:00:00.000Z",
    description: "Bike fuel allowance for Route-A & Route-B recovery officers.",
  },
  {
    id: "exp_002",
    tenantId: "tenant_lhr",
    category: "TEA_UTILITIES",
    amount: 1850,
    fromWalletId: "wall_counter_lhr",
    fromWalletName: "Main Showroom Counter Till",
    loggedBy: "Asim Raza (Manager)",
    date: "2026-02-28T16:00:00.000Z",
    description: "Daily tea, mineral water & guest refreshments for showroom customers.",
  },
  {
    id: "exp_003",
    tenantId: "tenant_lhr",
    category: "OWNER_DRAW",
    amount: 50000,
    fromWalletId: "wall_bank_meezan",
    fromWalletName: "Meezan Islamic Corporate Account",
    loggedBy: "Chaudhry Kamran (Owner)",
    date: "2026-02-25T14:00:00.000Z",
    description: "Weekly personal drawings / household allocation by Owner.",
  },
];

// Initial Hash-Chained Audit Ledger
const genesisPayload = {
  id: "genesis_000",
  tenantId: "tenant_lhr",
  timestamp: "2025-11-01T00:00:00.000Z",
  type: "INTERNAL_TRANSFER" as const,
  amount: 1000000,
  toWallet: "wall_owner_lhr",
  actorId: "usr_superadmin",
  notes: "Genesis Treasury Capital Allocation for Rajpoot Traders Lahore Branch.",
};

const genesisHash = computeBlockHash(0, "0000000000000000000000000000000000000000000000000000000000000000", genesisPayload, genesisPayload.timestamp);

const block1Payload = {
  id: "tx_001",
  tenantId: "tenant_lhr",
  timestamp: "2025-11-15T11:00:00.000Z",
  type: "DOWN_PAYMENT" as const,
  amount: 35000,
  toWallet: "wall_counter_lhr",
  planId: "plan_001",
  customerId: "cust_001",
  actorId: "usr_manager_lhr",
  notes: "Advance Token & Down Payment for Haier Inverter AC #RT-2025-0881.",
};

const block1Hash = computeBlockHash(1, genesisHash, block1Payload, block1Payload.timestamp);

const block2Payload = {
  id: "tx_002",
  tenantId: "tenant_lhr",
  timestamp: "2026-01-16T15:45:00.000Z",
  type: "SHORT_PAYMENT" as const,
  amount: 10000,
  toWallet: "wall_field_bilal",
  planId: "plan_001",
  customerId: "cust_001",
  actorId: "usr_rec_bilal",
  notes: "Partial short installment collection from Hafiz Usman (Rs. 10k vs Rs. 13.4k due).",
};

const block2Hash = computeBlockHash(2, block1Hash, block2Payload, block2Payload.timestamp);

export const initialLedgerChain: ChainedLedgerBlock[] = [
  {
    index: 0,
    id: genesisPayload.id,
    timestamp: genesisPayload.timestamp,
    payload: genesisPayload,
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    hash: genesisHash,
    signature: `SIG_T0_${genesisHash.slice(0, 16)}`,
  },
  {
    index: 1,
    id: block1Payload.id,
    timestamp: block1Payload.timestamp,
    payload: block1Payload,
    prevHash: genesisHash,
    hash: block1Hash,
    signature: `SIG_T2_${block1Hash.slice(0, 16)}`,
  },
  {
    index: 2,
    id: block2Payload.id,
    timestamp: block2Payload.timestamp,
    payload: block2Payload,
    prevHash: block1Hash,
    hash: block2Hash,
    signature: `SIG_T3_${block2Hash.slice(0, 16)}`,
  },
];

export const initialArticles: ArticlePost[] = [
  {
    slug: "how-installment-plans-work-in-pakistan",
    title: "How Easy Monthly Installments (Hire-Purchase) Work at Rajpoot Traders in 2026",
    summary: "A complete transparent breakdown of Shariah-compliant hire-purchase agreements, down payments, dual guarantor requirements, and easy approval processes.",
    category: "Financial Guides",
    author: "Malik Tariq Rajpoot (Director)",
    date: "Feb 18, 2026",
    readTime: "6 min read",
    tags: ["Installments", "Hire-Purchase", "Consumer Rights", "Lahore"],
    schemaKeywords: ["easy installments pakistan", "rajpoot traders installment", "electronics on installment lahore", "bike installment plan without bank"],
    content: `
### Understanding the Hire-Purchase Model at Rajpoot Traders

In Pakistan's dynamic economic landscape, purchasing high-value consumer assets like inverter air conditioners, solar energy setups, smartphones, and motorbikes with 100% upfront cash is challenging for many families and small business owners.

**RAJPOOT TRADERS** has pioneered a trusted, transparent, and direct hire-purchase model across Punjab that removes traditional commercial bank bureaucracy while maintaining high legal integrity and mutual respect.

---

### Key Pillars of Our Installment Structure

1. **Direct Shop-to-Consumer Financing**: No third-party bank credit cards or hidden compounding interest penalties.
2. **Fixed Transparent Markup**: Transparent markup fixed at the inception of the hire-purchase contract.
3. **Dual Guarantor (Zamin) Trust Network**: Protecting both the merchant and the purchaser through verified family or commercial guarantees.
4. **Flexible Short-Payment Relief**: If you face unexpected medical or family emergencies, our *Arrears Rebalancing Engine* allows partial payments without instant contract termination.

---

### Documents Required for Instant Approval

- Original CNIC and 2 Photocopies of the Applicant (Kharedar)
- 2x Passport Size Photographs
- Latest Electricity / Gas Utility Bill of Residential Address
- 2x CNIC Copies & Utility Bills of 2 Verified Guarantors (Zamin 1 & Zamin 2)
- Post-dated or Security Verification Acknowledgement
`,
  },
  {
    slug: "solar-system-easy-installments-lahore",
    title: "5kW & 10kW Hybrid Solar Systems on Easy Monthly Installments in Lahore & Faisalabad",
    summary: "Beat surging WAPDA electricity tariffs with Tier-1 Longi Mono-PERC solar panels and Inverex Hybrid inverters on customized 12 to 24-month payment plans.",
    category: "Solar Energy",
    author: "Engr. Asim Raza (Operations Lead)",
    date: "Feb 22, 2026",
    readTime: "8 min read",
    tags: ["Solar Systems", "Net Metering", "Inverex", "Longi", "Energy Savings"],
    schemaKeywords: ["solar on installments lahore", "5kw hybrid solar installment", "solar system installment faisalabad", "rajpoot traders solar financing"],
    content: `
### Slash Your Heavy Summer Bills with Rajpoot Solar Financing

With residential WAPDA unit tariffs crossing Rs. 60+ per kWh during peak hours, switching to solar energy is no longer a luxury—it is an urgent household financial shield.

At **RAJPOOT TRADERS**, we offer complete turnkey 3kW, 5kW, and 10kW Hybrid and On-Grid Solar packages with only 25% to 30% down payment, spreading the remaining cost over 12 or 24 manageable monthly installments.

---

### What Is Included in the Turnkey Package?

- **Tier-1 Photovoltaic Panels**: High-efficiency Longi / Jinko 580W+ N-Type Bifacial panels with 25-year performance warranty.
- **Pure Sine Wave Hybrid Inverters**: Inverex Veyron / Nitrox with dual MPPT and mobile Wi-Fi live monitoring.
- **Heavy-Duty Galvanized Structures**: Elevated rooftop mounting frames rated for wind speeds up to 140 km/h.
- **WAPDA Green Meter Documentation**: Full liaison for fast-track bi-directional net metering approvals.
`,
  },
  {
    slug: "managing-short-installments-and-credit-health",
    title: "Managing Short Installments: How Arrears Rebalancing Keeps Your Agreement Active",
    summary: "Learn how Rajpoot Traders handles partial payments, late penalties, and rolling arrears so you never risk unexpected repossession.",
    category: "Customer Support",
    author: "Chaudhry Kamran Rajpoot",
    date: "Feb 25, 2026",
    readTime: "5 min read",
    tags: ["Short Installments", "Treasury", "Arrears Policy", "Customer Safety"],
    schemaKeywords: ["installment arrears rules", "short installment payment lahore", "rajpoot traders recovery", "hire purchase law pakistan"],
    content: `
### Transparency First: The Short Repayment Protocol

Life doesn't always go according to plan. When a customer cannot pay their full monthly installment of Rs. 13,500 due to temporary liquidity issues, traditional lenders often levy predatory fines or threaten immediate repossession.

At **RAJPOOT TRADERS**, our automated platform uses a mathematical waterfall allocation:

$$\\text{Payment} \\rightarrow \\text{Late Fee} \\rightarrow \\text{Past Short Arrears} \\rightarrow \\text{Current Principal}$$

Any remaining unpaid principal is safely logged as *Accumulated Short Arrears* and rolled into the customer's ledger, allowing you to settle the remainder in the subsequent pay cycle without panic.
`,
  },
];

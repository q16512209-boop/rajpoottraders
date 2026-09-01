import * as XLSX from "xlsx";
import { Customer, InstallmentPlan } from "../db/types";

export interface ImportedCustomerRow {
  Customer_Full_Name: string;
  Father_Name: string;
  CNIC: string;
  Phone: string;
  Address: string;
  City?: string;
  Zone_Area?: string;
  Guarantor_1_Name?: string;
  Guarantor_1_CNIC?: string;
  Guarantor_1_Phone?: string;
  Guarantor_1_Relation?: string;
  Guarantor_2_Name?: string;
  Guarantor_2_CNIC?: string;
  Guarantor_2_Phone?: string;
  Guarantor_2_Relation?: string;
  Product_Item?: string;
  Cash_Price?: number;
  Advance_Down_Payment?: number;
  Duration_Months?: number;
  Monthly_Installment?: number;
  Pending_Short_Arrears?: number;
}

export const SAMPLE_TEMPLATE_ROWS: ImportedCustomerRow[] = [
  {
    Customer_Full_Name: "Hafiz Muhammad Usman",
    Father_Name: "Muhammad Siddique",
    CNIC: "35202-1849201-3",
    Phone: "0322-9876543",
    Address: "House 24, Street 7, Block G, Gulberg III",
    City: "Lahore",
    Zone_Area: "Route-A (Gulberg / Model Town)",
    Guarantor_1_Name: "Zubair Ahmed Siddique",
    Guarantor_1_CNIC: "35202-8877665-1",
    Guarantor_1_Phone: "0300-5544332",
    Guarantor_1_Relation: "Brother",
    Guarantor_2_Name: "Chaudhry Naveed Iqbal",
    Guarantor_2_CNIC: "35201-9988771-5",
    Guarantor_2_Phone: "0333-2211445",
    Guarantor_2_Relation: "Uncle",
    Product_Item: "Haier 1.5 Ton HSU-18HFP Inverter Air Conditioner",
    Cash_Price: 165000,
    Advance_Down_Payment: 35000,
    Duration_Months: 12,
    Monthly_Installment: 13433,
    Pending_Short_Arrears: 3433,
  },
  {
    Customer_Full_Name: "Rana Shahid Mehmood",
    Father_Name: "Rana Mehmood Akhtar",
    CNIC: "35201-5544332-9",
    Phone: "0302-7788990",
    Address: "Flat 4-B, Al-Rehman Plaza, Johar Town",
    City: "Lahore",
    Zone_Area: "Route-B (Johar Town / Iqbal Town)",
    Guarantor_1_Name: "Rana Zahid Mehmood",
    Guarantor_1_CNIC: "35201-2211998-3",
    Guarantor_1_Phone: "0300-1122334",
    Guarantor_1_Relation: "Brother",
    Guarantor_2_Name: "Sheikh Waqas",
    Guarantor_2_CNIC: "35202-4433221-7",
    Guarantor_2_Phone: "0345-9988112",
    Guarantor_2_Relation: "Partner",
    Product_Item: "Honda CD 70cc Dream (2026 Model)",
    Cash_Price: 168500,
    Advance_Down_Payment: 45000,
    Duration_Months: 6,
    Monthly_Installment: 25111,
    Pending_Short_Arrears: 0,
  },
];

/**
 * Downloads a pre-configured sample Excel template for Rajpoot Traders
 */
export function downloadExcelTemplate() {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_ROWS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rajpoot_Traders_Import");
  XLSX.writeFile(wb, "Rajpoot_Traders_Customer_Import_Template.xlsx");
}

/**
 * Parses an uploaded Excel / CSV file into structured customer records
 */
export async function parseExcelFile(file: File): Promise<ImportedCustomerRow[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

  // Normalize column names
  return rows.map((r) => ({
    Customer_Full_Name: String(r.Customer_Full_Name || r.FullName || r.Name || r["Customer Name"] || "").trim(),
    Father_Name: String(r.Father_Name || r.FatherName || r["Father Name"] || "").trim(),
    CNIC: String(r.CNIC || r.cnic || r["CNIC Number"] || "").trim(),
    Phone: String(r.Phone || r.Mobile || r["Mobile Number"] || "").trim(),
    Address: String(r.Address || r["Residential Address"] || "").trim(),
    City: String(r.City || "Lahore").trim(),
    Zone_Area: String(r.Zone_Area || r.Zone || r.Route || "Route-A (Gulberg / Model Town)").trim(),
    Guarantor_1_Name: String(r.Guarantor_1_Name || r["Zamin 1 Name"] || "").trim(),
    Guarantor_1_CNIC: String(r.Guarantor_1_CNIC || r["Zamin 1 CNIC"] || "").trim(),
    Guarantor_1_Phone: String(r.Guarantor_1_Phone || r["Zamin 1 Phone"] || "").trim(),
    Guarantor_1_Relation: String(r.Guarantor_1_Relation || "Relative").trim(),
    Guarantor_2_Name: String(r.Guarantor_2_Name || r["Zamin 2 Name"] || "").trim(),
    Guarantor_2_CNIC: String(r.Guarantor_2_CNIC || r["Zamin 2 CNIC"] || "").trim(),
    Guarantor_2_Phone: String(r.Guarantor_2_Phone || r["Zamin 2 Phone"] || "").trim(),
    Guarantor_2_Relation: String(r.Guarantor_2_Relation || "Commercial").trim(),
    Product_Item: String(r.Product_Item || r.Product || r.Item || "Electronics / Asset").trim(),
    Cash_Price: Number(r.Cash_Price || r.Price || 100000),
    Advance_Down_Payment: Number(r.Advance_Down_Payment || r.Advance || 25000),
    Duration_Months: Number(r.Duration_Months || r.Months || 12),
    Monthly_Installment: Number(r.Monthly_Installment || r.Installment || 8500),
    Pending_Short_Arrears: Number(r.Pending_Short_Arrears || r.Arrears || 0),
  }));
}

/**
 * Export current customers and plans to Excel file
 */
export function exportPlansToExcel(plans: InstallmentPlan[]) {
  const exportData = plans.map((p) => ({
    "Plan Number": p.planNumber,
    "Customer Name": p.customerName,
    "Customer CNIC": p.customerCnic,
    "Customer Phone": p.customerPhone,
    "Product Title": p.productTitle,
    "IMEI/Serial": p.imeiSerial,
    "Cash Price (PKR)": p.cashPrice,
    "Down Payment (PKR)": p.downPayment,
    "Total Financed (PKR)": p.totalFinanced,
    "Duration (Months)": p.durationMonths,
    "Monthly Installment (PKR)": p.monthlyInstallment,
    "Accumulated Short Arrears (PKR)": p.accumulatedShortArrears,
    "Route Area": p.areaZone,
    "Contract Status": p.status,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rajpoot_Installment_Records");
  XLSX.writeFile(wb, `Rajpoot_Traders_Plans_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
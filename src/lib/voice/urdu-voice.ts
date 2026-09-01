"use client";

export interface UrduVoiceGuidance {
  id: string;
  urduText: string;
  transliteration?: string;
  englishTitle: string;
}

export const URDU_GUIDES: Record<string, UrduVoiceGuidance> = {
  NEW_PLAN: {
    id: "NEW_PLAN",
    urduText: "نیا اقساط پلان بنانے کے لیے یہاں کلک کریں۔ خریدار اور اشیاء منتخب کریں۔",
    transliteration: "Naya installment plan bananay k leay yahan click karen.",
    englishTitle: "Create Installment Plan",
  },
  LOG_PAYMENT: {
    id: "LOG_PAYMENT",
    urduText: "گاہک کی ماہانہ قسط یا شارٹ ادائیگی درج کریں اور رسید حاصل کریں۔",
    transliteration: "Gahak ki mahana qist ya short adaygi darj karen.",
    englishTitle: "Log Installment Payment",
  },
  IMPORT_EXCEL: {
    id: "IMPORT_EXCEL",
    urduText: "ایکسل یا سی ایس وی فائل کے ذریعے پرانے کسٹمرز اور اقساط کا ڈیٹا سسٹم میں شامل کریں۔",
    transliteration: "Excel file k zariye puranay customers ka data import karen.",
    englishTitle: "Import Existing Customers from Excel",
  },
  EXPORT_EXCEL: {
    id: "EXPORT_EXCEL",
    urduText: "تمام گاہکوں اور اقساط کے کھاتوں کی ایکسل فائل ڈاؤن لوڈ کریں۔",
    transliteration: "Tamam gahkon k khaton ki Excel file download karen.",
    englishTitle: "Export Data to Excel",
  },
  PRINT_STAMP: {
    id: "PRINT_STAMP",
    urduText: "قانونی اسٹامپ پیپر، ہائیر پرچیز ایگریمنٹ اور دو ضامنان کا اقرار نامہ پرنٹ کریں۔",
    transliteration: "Legal Stamp paper aur do zamino ka agreement print karen.",
    englishTitle: "Print Legal Stamp Paper",
  },
  PRINT_RECEIPT: {
    id: "PRINT_RECEIPT",
    urduText: "تھرمل یا اے فور سائز پر ادائیگی کی تصدیقی رسید بمعہ کیو آر کوڈ پرنٹ کریں۔",
    transliteration: "Thermal ya A4 size payment receipt print karen.",
    englishTitle: "Print Payment Receipt",
  },
  ROUTE_SHEET: {
    id: "ROUTE_SHEET",
    urduText: "فیلڈ ریکوری افسر کے لیے ایڈریس اور فون نمبر والی روزانہ وصولی شیٹ پرنٹ کریں۔",
    transliteration: "Field recovery officer k leay daily route sheet print karen.",
    englishTitle: "Print Recovery Route Sheet",
  },
  HANDOVER: {
    id: "HANDOVER",
    urduText: "فیلڈ سے وصول شدہ کیش گن کر تصدیق کریں اور شو روم کاؤنٹر یا اونر کی جیب میں منتقل کریں۔",
    transliteration: "Field cash verify kar k Owner pocket ya counter till mn shift karen.",
    englishTitle: "2-Step Cash Handover",
  },
  DEFULTER_RADAR: {
    id: "DEFULTER_RADAR",
    urduText: "گاہک کے شناختی کارڈ اور پتے کی خودکار جانچ سے ڈیفالٹر لنکس اور رسک اسکور دیکھیں۔",
    transliteration: "Customer CNIC aur address say defaulter risk radar check karen.",
    englishTitle: "Defaulter Risk Radar",
  },
  TREASURY: {
    id: "TREASURY",
    urduText: "اونر جیب والٹ، کاؤنٹر ٹل، اور بینک بیلنس کے درمیان رقم ٹرانسفر کریں۔",
    transliteration: "Owner Pocket, Counter Till aur Bank k darmian balance transfer karen.",
    englishTitle: "Treasury Wallet Split",
  },
  EXPENSE: {
    id: "EXPENSE",
    urduText: "پیٹرول، چائے، تنخواہ اور دکان کے روزانہ اخراجات درج کریں۔",
    transliteration: "Petrol, tea, salaries aur rozana k akhrajat darj karen.",
    englishTitle: "Log Daily Expense",
  },
  CLEAN_DATA: {
    id: "CLEAN_DATA",
    urduText: "ڈیمو ڈیٹا صاف کریں اور اپنی اصلی راجپوت ٹریڈرز کمپنی کا اصل ریکارڈ درج کریں۔",
    transliteration: "Demo data saaf kar k asli company ka record darj karen.",
    englishTitle: "Production Clean Slate Setup",
  },
  CUSTOMER_KYC: {
    id: "CUSTOMER_KYC",
    urduText: "نئے کسٹمر کا اصل نام، شناختی کارڈ، بجلی کا بل اور دو بااعتماد ضامن درج کریں۔",
    transliteration: "Naye customer ka CNIC, utility bill aur 2 Zamin darj karen.",
    englishTitle: "Register Customer & Dual Zamin",
  },
};

export function speakUrdu(text: string, onStart?: () => void, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech Synthesis is not supported in this browser.");
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const urduVoice =
    voices.find((v) => v.lang === "ur-PK" || v.lang === "ur" || v.lang.startsWith("ur")) ||
    voices.find((v) => v.lang === "hi-IN" || v.lang.startsWith("hi")) ||
    voices[0];

  if (urduVoice) {
    utterance.voice = urduVoice;
  }
  utterance.lang = "ur-PK";

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.error("Urdu Voice error:", e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
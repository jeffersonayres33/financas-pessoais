export interface ExtractedReceiptData {
  value: number | null;
  date: string | null;
  establishment: string | null;
  category: string | null;
  description: string | null;
  confidence: "high" | "medium" | "low";
  rawText: string;
}

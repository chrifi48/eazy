"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui";

// Uses the browser's "Save as PDF" in the print dialog; the admin chrome is hidden via print: classes.
export default function PrintButton() {
  return <Button variant="outline" onClick={() => window.print()}><FileDown className="h-4 w-4" />Export PDF</Button>;
}

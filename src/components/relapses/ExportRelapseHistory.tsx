import { useState } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { Download } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export default function ExportRelapseHistory() {
  const { data: relapses = [] } = useRelapses();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (relapses.length === 0) {
      toast.error("No relapses to export");
      return;
    }

    setExporting(true);
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text("Relapse History Report", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated ${format(new Date(), "MMM d, yyyy")} · ${relapses.length} relapse${relapses.length !== 1 ? "s" : ""}`, 14, 28);

      // Summary stats
      const recovered = relapses.filter((r) => r.is_recovered).length;
      const ongoing = relapses.filter((r) => !r.is_recovered).length;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Recovery Rate: ${Math.round((recovered / relapses.length) * 100)}%  ·  Recovered: ${recovered}  ·  Ongoing: ${ongoing}`, 14, 36);

      // Table
      const tableData = relapses.map((r) => {
        const start = parseISO(r.start_date);
        const end = r.end_date ? parseISO(r.end_date) : new Date();
        const dur = differenceInDays(end, start) + 1;
        return [
          format(start, "MMM d, yyyy"),
          r.end_date ? format(parseISO(r.end_date), "MMM d, yyyy") : "Ongoing",
          `${dur}d`,
          r.severity.charAt(0).toUpperCase() + r.severity.slice(1),
          r.symptoms.slice(0, 4).join(", ") + (r.symptoms.length > 4 ? "..." : ""),
          r.triggers.join(", ") || "—",
          r.treatment || "—",
          r.is_recovered ? "Yes" : "No",
        ];
      });

      autoTable(doc, {
        startY: 42,
        head: [["Start", "End", "Duration", "Severity", "Symptoms", "Triggers", "Treatment", "Recovered"]],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 7 },
        columnStyles: {
          4: { cellWidth: 35 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 },
        },
      });

      // Notes section
      const notesRelapses = relapses.filter((r) => r.notes?.trim());
      if (notesRelapses.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY ?? 100;
        if (finalY > 250) doc.addPage();
        const startY = finalY > 250 ? 20 : finalY + 10;
        doc.setFontSize(12);
        doc.text("Notes", 14, startY);
        let y = startY + 6;
        notesRelapses.forEach((r) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(`${format(parseISO(r.start_date), "MMM d, yyyy")} (${r.severity})`, 14, y);
          y += 4;
          doc.setTextColor(0);
          doc.setFontSize(8);
          const lines = doc.splitTextToSize(r.notes!.trim(), 180);
          doc.text(lines, 14, y);
          y += lines.length * 4 + 4;
        });
      }

      doc.save(`relapse-history-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  if (relapses.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50"
    >
      {exporting ? (
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <Download className="h-3 w-3" />
      )}
      Export PDF
    </button>
  );
}

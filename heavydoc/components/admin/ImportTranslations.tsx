"use client";

import { useState, useRef } from "react";
import { Upload, Download, CheckCircle, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface ImportRow {
  entity_type: string;
  entity_id: string;
  field: string;
  es: string;
  en: string;
  pt: string;
}

const TEMPLATE_DATA = [
  ["entity_type", "entity_id", "field", "es", "en", "pt"],
  ["machines", "uuid-here", "name", "Reach Stacker Kalmar", "Kalmar Reach Stacker", "Empilhadeira Kalmar"],
  ["machines", "uuid-here", "description", "Descripción en ES", "Description in EN", "Descrição em PT"],
  ["systems", "uuid-here", "name", "Motor Cummins", "Cummins Engine", "Motor Cummins"],
  ["error_codes", "uuid-here", "title", "Falla de aceite", "Oil failure", "Falha de óleo"],
];

export default function ImportTranslations() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [status, setStatus] = useState<"idle" | "preview" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const XLSX = await import("xlsx");
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<ImportRow>(ws);
    setRows(data);
    setStatus("preview");
  }

  async function handleImport() {
    setStatus("loading");
    const supabase = createClient();

    const TABLE_MAP: Record<string, string> = {
      machines: "machines",
      systems: "systems",
      subsystems: "subsystems",
      error_codes: "error_codes",
      tools: "tools",
      hazards: "hazards",
    };

    try {
      for (const row of rows) {
        const table = TABLE_MAP[row.entity_type];
        if (!table || !row.entity_id || !row.field) continue;

        // Fetch current translations
        const { data: current } = await supabase
          .from(table)
          .select("id, translations")
          .eq("id", row.entity_id)
          .single();

        if (!current) continue;

        const existing = (current.translations as Record<string, Record<string, string>>) ?? {};
        const updated = {
          ...existing,
          es: { ...existing.es, [row.field]: row.es },
          en: { ...existing.en, [row.field]: row.en },
          pt: { ...existing.pt, [row.field]: row.pt },
        };

        await supabase.from(table).update({ translations: updated } as never).eq("id", row.entity_id);
      }

      setStatus("success");
      setMessage(`${rows.length} filas importadas exitosamente.`);
    } catch (err) {
      setStatus("error");
      setMessage(`Error: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  }

  function downloadTemplate() {
    import("xlsx").then((XLSX) => {
      const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_DATA);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Translations");
      XLSX.writeFile(wb, "troubleshooting-translations-template.xlsx");
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Importar Traducciones</h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Instrucciones</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Descarga la plantilla de Excel.</li>
          <li>Completa las columnas ES, EN y PT para cada entidad.</li>
          <li>Los IDs deben corresponder a los UUIDs reales de la base de datos.</li>
          <li>Sube el archivo y confirma la importación.</li>
        </ol>
      </div>

      <Button
        variant="secondary"
        icon={<Download className="w-4 h-4" />}
        onClick={downloadTemplate}
      >
        Descargar Plantilla
      </Button>

      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-navy transition-colors"
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          {file ? file.name : "Haz clic para seleccionar un archivo .xlsx"}
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {status === "preview" && rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {rows.length} filas encontradas. Vista previa:
          </p>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="text-xs w-full">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  {["entity_type", "entity_id", "field", "es", "en", "pt"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium truncate">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-700">{row.entity_type}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs">{row.entity_id?.slice(0, 8)}…</td>
                    <td className="px-3 py-2 text-gray-700">{row.field}</td>
                    <td className="px-3 py-2 text-gray-700 truncate max-w-[100px]">{row.es}</td>
                    <td className="px-3 py-2 text-gray-700 truncate max-w-[100px]">{row.en}</td>
                    <td className="px-3 py-2 text-gray-700 truncate max-w-[100px]">{row.pt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <p className="text-xs text-gray-400 text-center py-2">
                y {rows.length - 5} filas más...
              </p>
            )}
          </div>

          <Button
            onClick={handleImport}
            loading={status as string === "loading"}
            icon={<Upload className="w-4 h-4" />}
          >
            Importar {rows.length} filas
          </Button>
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  );
}

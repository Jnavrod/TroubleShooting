"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ECDetailEditor } from "./ErrorCodeAdmin";
import { updateErrorCode, deleteErrorCode } from "@/lib/actions/error-codes";
import type { ErrorCode, Severity } from "@/types/database";

const SEVERITY_OPTIONS: Severity[] = ["low", "medium", "high", "critical"];
const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

interface Props {
  locale: string;
  errorCode: ErrorCode;
  subsystemName: string;
  systemName: string;
  systemSlug: string;
  tools: { id: string; translations: Record<string, Record<string, string>> }[];
}

export default function ErrorCodeEditPage({
  locale,
  errorCode,
  subsystemName,
  systemName,
  systemSlug,
  tools,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState(errorCode.code);
  const [severity, setSeverity] = useState<Severity>(errorCode.severity);
  const [titleEs, setTitleEs] = useState(errorCode.translations?.es?.title ?? "");
  const [descriptionEs, setDescriptionEs] = useState(
    errorCode.translations?.es?.description ?? ""
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  function handleSaveMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateErrorCode(errorCode.id, {
          code,
          severity,
          titleEs,
          descriptionEs,
        });
        setSavedMsg("Datos guardados y traducidos a EN/PT.");
        setTimeout(() => setSavedMsg(null), 3000);
        router.refresh();
      } catch {
        setSavedMsg("Error al guardar.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteErrorCode(errorCode.id);
      router.push(`/${locale}/admin/systems`);
    });
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb / back */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href={`/${locale}/admin/systems`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Sistemas
        </Link>
        <nav className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
          <Link
            href={`/${locale}/systems/${systemSlug}`}
            className="hover:text-navy transition-colors"
          >
            {systemName}
          </Link>
          <span>/</span>
          <span>{subsystemName}</span>
          <span>/</span>
          <span className="font-mono font-semibold text-navy">{errorCode.code}</span>
        </nav>
      </div>

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-lg font-bold bg-navy text-white px-3 py-1 rounded-lg">
              {errorCode.code}
            </span>
            <Badge variant={errorCode.severity}>
              {SEVERITY_LABELS[errorCode.severity]}
            </Badge>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setConfirmDelete(true)}
          >
            Eliminar
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {errorCode.translations?.es?.title ?? errorCode.code}
        </h1>
      </div>

      {/* Metadata edit form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Información básica
        </h2>
        <form onSubmit={handleSaveMeta} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="Ej. HYD-001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Severidad *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título (ES) *</label>
            <input
              value={titleEs}
              onChange={(e) => setTitleEs(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (ES)</label>
            <textarea
              value={descriptionEs}
              onChange={(e) => setDescriptionEs(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            />
          </div>
          <p className="text-xs text-gray-400">
            La traducción a EN y PT se generará automáticamente al guardar.
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs font-medium ${
              savedMsg?.startsWith("Error") ? "text-red-600" : "text-green-700"
            }`}>
              {savedMsg ?? ""}
            </p>
            <Button
              type="submit"
              loading={isPending}
              icon={<Save className="w-4 h-4" />}
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>

      {/* Steps / tools / hazards editor */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Contenido (Diagnóstico, Reparación, Herramientas, Peligros)
          </h2>
        </div>
        <ECDetailEditor
          errorCode={errorCode}
          tools={tools}
          isPending={isPending}
          startTransition={startTransition}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar Código de Error"
        message={`¿Eliminar el código "${errorCode.code}"? Se eliminarán todos sus pasos, herramientas y peligros. Esta acción no se puede deshacer.`}
        loading={isPending}
      />
    </div>
  );
}

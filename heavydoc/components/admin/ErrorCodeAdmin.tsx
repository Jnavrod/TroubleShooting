"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, AlertTriangle, Wrench,
  Stethoscope, ChevronDown, ChevronRight, FileEdit,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Badge from "@/components/ui/Badge";
import RichEditor from "@/components/editor/RichEditor";
import { createClient } from "@/lib/supabase/client";
import {
  createErrorCode, updateErrorCode, deleteErrorCode,
  saveStep, deleteStep, createHazard, updateHazard, deleteHazard,
  addToolToErrorCode, updateErrorCodeTool, removeToolFromErrorCode,
  retranslateAllSteps,
} from "@/lib/actions/error-codes";
import type {
  Subsystem, ErrorCode, DiagnosticStep, RepairStep, Hazard, ErrorCodeTool,
  HazardSeverity, HazardIcon, Severity, Json,
} from "@/types/database";

interface Props {
  subsystem: Subsystem;
  errorCodes: ErrorCode[];
  tools: { id: string; translations: Record<string, Record<string, string>> }[];
}

const SEVERITY_OPTIONS: Severity[] = ["low", "medium", "high", "critical"];
const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Baja", medium: "Media", high: "Alta", critical: "Crítica",
};

export default function ErrorCodeAdmin({ subsystem, errorCodes, tools }: Props) {
  const [isPending, startTransition] = useTransition();
  const [ecFormOpen, setEcFormOpen] = useState(false);
  const [editEC, setEditEC] = useState<ErrorCode | null>(null);
  const [deleteEC, setDeleteEC] = useState<ErrorCode | null>(null);
  const [expandedEC, setExpandedEC] = useState<string | null>(null);

  function getECName(ec: ErrorCode) {
    return ec.translations?.es?.title ?? ec.code;
  }

  async function handleECSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = fd.get("code") as string;
    const severity = fd.get("severity") as Severity;
    const titleEs = fd.get("titleEs") as string;
    const descriptionEs = fd.get("descriptionEs") as string;

    startTransition(async () => {
      if (editEC) {
        await updateErrorCode(editEC.id, { code, severity, titleEs, descriptionEs });
      } else {
        await createErrorCode({ subsystemId: subsystem.id, code, severity, titleEs, descriptionEs });
      }
      setEcFormOpen(false);
    });
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Códigos de Error
        </p>
        <Button
          variant="ghost"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => { setEditEC(null); setEcFormOpen(true); }}
        >
          Agregar código
        </Button>
      </div>

      {!errorCodes.length && (
        <p className="text-xs text-gray-400 py-2 text-center">Sin códigos de error.</p>
      )}

      {errorCodes.map((ec) => {
        const isExpanded = expandedEC === ec.id;
        return (
          <div
            key={ec.id}
            className={`border rounded-xl overflow-hidden transition-colors ${
              isExpanded ? "border-navy/40 shadow-sm" : "border-gray-200"
            }`}
          >
            {/* ── Header del error code ── */}
            <div className={`px-3 py-3 ${isExpanded ? "bg-navy/5" : "bg-white"}`}>
              {/* Fila superior: código + título + severidad */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold bg-navy text-white px-2 py-0.5 rounded flex-shrink-0">
                  {ec.code}
                </span>
                <span className="text-sm text-gray-800 font-medium flex-1 truncate">
                  {getECName(ec)}
                </span>
                <Badge variant={ec.severity as Severity}>
                  {SEVERITY_LABELS[ec.severity as Severity]}
                </Badge>
              </div>

              {/* Fila de acciones — botones con texto */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setExpandedEC(isExpanded ? null : ec.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    isExpanded
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-navy border-navy/30 hover:bg-navy/5"
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  {isExpanded ? "Cerrar editor" : "Editar contenido"}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                  />
                </button>

                <button
                  onClick={() => { setEditEC(ec); setEcFormOpen(true); }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar código / título
                </button>

                <button
                  onClick={() => setDeleteEC(ec)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            </div>

            {/* ── Editor expandible: pasos, herramientas, peligros ── */}
            {isExpanded && (
              <div className="border-t border-navy/20 bg-white">
                <ECDetailEditor
                  errorCode={ec}
                  tools={tools}
                  isPending={isPending}
                  startTransition={startTransition}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Modal editar/crear error code */}
      <Modal
        open={ecFormOpen}
        onClose={() => setEcFormOpen(false)}
        title={editEC ? "Editar Código de Error" : "Nuevo Código de Error"}
        size="md"
      >
        <form onSubmit={handleECSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input
                name="code"
                required
                defaultValue={editEC?.code ?? ""}
                placeholder="Ej. HYD-001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severidad *</label>
              <select
                name="severity"
                defaultValue={editEC?.severity ?? "medium"}
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
              name="titleEs"
              required
              defaultValue={editEC?.translations?.es?.title ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (ES)</label>
            <textarea
              name="descriptionEs"
              rows={3}
              defaultValue={editEC?.translations?.es?.description ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            />
          </div>
          <p className="text-xs text-gray-400">Traducción EN/PT se genera automáticamente.</p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setEcFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteEC}
        onClose={() => setDeleteEC(null)}
        onConfirm={() =>
          deleteEC &&
          startTransition(async () => {
            await deleteErrorCode(deleteEC.id);
            setDeleteEC(null);
          })
        }
        title="Eliminar Código de Error"
        message={`¿Eliminar el código "${deleteEC?.code}"? Se eliminarán todos sus pasos, herramientas y peligros.`}
        loading={isPending}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Editor de contenido del error code (pasos, herramientas, peligros)
// ─────────────────────────────────────────────────────────────────────────────
export function ECDetailEditor({
  errorCode,
  tools,
  isPending,
  startTransition,
}: {
  errorCode: ErrorCode;
  tools: { id: string; translations: Record<string, Record<string, string>> }[];
  isPending: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startTransition: (fn: () => any) => void;
}) {
  const [tab, setTab] = useState<"diagnostic" | "repair" | "tools" | "hazards">("diagnostic");

  const [diagSteps, setDiagSteps] = useState<DiagnosticStep[]>([]);
  const [repairSteps, setRepairSteps] = useState<RepairStep[]>([]);
  const [ecHazards, setEcHazards] = useState<Hazard[]>([]);
  const [ecTools, setEcTools] = useState<
    (ErrorCodeTool & { tool: { id: string; translations: Record<string, Record<string, string>> } })[]
  >([]);
  const [loadingData, setLoadingData] = useState(true);

  // New item state
  const [diagContent, setDiagContent] = useState<Json>({});
  const [repairContent, setRepairContent] = useState<Json>({});
  const [diagKey, setDiagKey] = useState(0);
  const [repairKey, setRepairKey] = useState(0);
  const [selectedToolId, setSelectedToolId] = useState("");
  const [toolQty, setToolQty] = useState("");
  const [hazardSeverity, setHazardSeverity] = useState<HazardSeverity>("warning");
  const [hazardIcon, setHazardIcon] = useState<HazardIcon>("generic");
  const [hazardTitle, setHazardTitle] = useState("");
  const [hazardDesc, setHazardDesc] = useState("");

  // Step editing
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<Json>({});

  // Hazard editing
  const [editingHazardId, setEditingHazardId] = useState<string | null>(null);
  const [editHazardSev, setEditHazardSev] = useState<HazardSeverity>("warning");
  const [editHazardIcon, setEditHazardIcon] = useState<HazardIcon>("generic");
  const [editHazardTitle, setEditHazardTitle] = useState("");
  const [editHazardDesc, setEditHazardDesc] = useState("");

  // Tool editing
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [editToolQty, setEditToolQty] = useState("");
  const [editToolNotes, setEditToolNotes] = useState("");

  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function showMsg(ok: boolean, text: string) {
    setSaveMsg({ ok, text });
    setTimeout(() => setSaveMsg(null), 3500);
  }

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const supabase = createClient();
    const [diagRes, repairRes, hazardRes, toolRes] = await Promise.all([
      supabase.from("diagnostic_steps").select("*").eq("error_code_id", errorCode.id).order("step_order"),
      supabase.from("repair_steps").select("*").eq("error_code_id", errorCode.id).order("step_order"),
      supabase.from("hazards").select("*").eq("error_code_id", errorCode.id).order("display_order"),
      supabase.from("error_code_tools").select("*, tool:tools(id, translations)").eq("error_code_id", errorCode.id),
    ]);
    setDiagSteps((diagRes.data ?? []) as DiagnosticStep[]);
    setRepairSteps((repairRes.data ?? []) as RepairStep[]);
    setEcHazards((hazardRes.data ?? []) as Hazard[]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEcTools((toolRes.data ?? []) as any);
    setLoadingData(false);
  }, [errorCode.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const tabs = [
    { key: "diagnostic" as const, label: "Diagnóstico", count: diagSteps.length, icon: Stethoscope },
    { key: "repair" as const, label: "Reparación", count: repairSteps.length, icon: Wrench },
    { key: "tools" as const, label: "Herramientas", count: ecTools.length, icon: Wrench },
    { key: "hazards" as const, label: "Peligros", count: ecHazards.length, icon: AlertTriangle },
  ];

  // ── Helpers de inline edición ──────────────────────────────────────────────
  const HAZARD_SEV_LABELS: Record<HazardSeverity, string> = {
    warning: "Advertencia", caution: "Precaución", danger: "Peligro",
  };
  const HAZARD_ICON_LABELS: Record<HazardIcon, string> = {
    electric: "Eléctrico", pressure: "Alta Presión", burn: "Quemadura",
    crush: "Aplastamiento", chemical: "Químico", generic: "General",
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === key
                ? "border-navy text-navy bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60"
            }`}
          >
            {label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              tab === key ? "bg-navy text-white" : "bg-gray-200 text-gray-600"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {saveMsg && (
          <p className={`text-xs text-center font-medium py-2 px-3 rounded-lg ${
            saveMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {saveMsg.text}
          </p>
        )}

        {loadingData && (
          <p className="text-xs text-gray-400 text-center py-4">Cargando datos...</p>
        )}

        {/* ══ DIAGNÓSTICO ════════════════════════════════════════════════════ */}
        {tab === "diagnostic" && !loadingData && (
          <div className="space-y-3">
            {diagSteps.length > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" loading={isPending}
                  onClick={() => startTransition(async () => {
                    try { await retranslateAllSteps(errorCode.id); await loadData(); showMsg(true, "Pasos retraducidos a EN y PT."); }
                    catch { showMsg(false, "Error al retraducir."); }
                  })}>
                  Retraducir todos a EN / PT
                </Button>
              </div>
            )}

            {diagSteps.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">
                Sin pasos de diagnóstico. Agrega el primero abajo.
              </p>
            )}

            {diagSteps.map((step, i) => (
              <div key={step.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Cabecera del paso */}
                <div
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedStep === step.id
                      ? <ChevronDown className="w-4 h-4 text-navy" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />
                    }
                    <span className="text-sm font-semibold text-navy">Paso {i + 1}</span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStepId(step.id);
                        setEditingContent(step.content_json as Json);
                        setExpandedStep(step.id);
                      }}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar paso
                    </button>
                    <button
                      type="button"
                      onClick={() => startTransition(async () => {
                        try { await deleteStep("diagnostic_steps", step.id); await loadData(); showMsg(true, "Paso eliminado."); }
                        catch { showMsg(false, "Error al eliminar."); }
                      })}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>

                {/* Contenido expandido */}
                {expandedStep === step.id && (
                  <div className="p-4 bg-white space-y-3">
                    {editingStepId === step.id ? (
                      <>
                        <RichEditor
                          key={`diag-edit-${step.id}`}
                          initialContent={step.content_json as Json}
                          bucket="diagnostic-media"
                          onChange={setEditingContent}
                        />
                        <div className="flex gap-2 justify-end pt-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingStepId(null)}>
                            Cancelar
                          </Button>
                          <Button size="sm" loading={isPending}
                            onClick={() => startTransition(async () => {
                              try {
                                await saveStep("diagnostic_steps", {
                                  id: step.id,
                                  error_code_id: errorCode.id,
                                  step_order: step.step_order,
                                  content_json: editingContent,
                                });
                                setEditingStepId(null);
                                await loadData();
                                showMsg(true, "Paso guardado y traducido a EN / PT.");
                              } catch { showMsg(false, "Error al guardar el paso."); }
                            })}>
                            Guardar y traducir
                          </Button>
                        </div>
                      </>
                    ) : (
                      <RichEditor initialContent={step.content_json as Json} readOnly />
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Nuevo paso */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                + Nuevo paso de diagnóstico
              </p>
              <RichEditor
                key={diagKey}
                placeholder="Describe el procedimiento de diagnóstico..."
                bucket="diagnostic-media"
                onChange={setDiagContent}
              />
              <div className="flex justify-end">
                <Button size="sm" loading={isPending}
                  onClick={() => startTransition(async () => {
                    try {
                      await saveStep("diagnostic_steps", {
                        error_code_id: errorCode.id,
                        step_order: diagSteps.length,
                        content_json: JSON.parse(JSON.stringify(diagContent)),
                      });
                      setDiagContent({}); setDiagKey((k) => k + 1);
                      await loadData();
                      showMsg(true, "Paso de diagnóstico guardado.");
                    } catch { showMsg(false, "Error al guardar el paso."); }
                  })}>
                  <Plus className="w-3.5 h-3.5" /> Guardar paso
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ══ REPARACIÓN ═════════════════════════════════════════════════════ */}
        {tab === "repair" && !loadingData && (
          <div className="space-y-3">
            {repairSteps.length > 0 && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" loading={isPending}
                  onClick={() => startTransition(async () => {
                    try { await retranslateAllSteps(errorCode.id); await loadData(); showMsg(true, "Pasos retraducidos."); }
                    catch { showMsg(false, "Error al retraducir."); }
                  })}>
                  Retraducir todos a EN / PT
                </Button>
              </div>
            )}

            {repairSteps.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">
                Sin pasos de reparación. Agrega el primero abajo.
              </p>
            )}

            {repairSteps.map((step, i) => (
              <div key={step.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedStep === step.id
                      ? <ChevronDown className="w-4 h-4 text-navy" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />
                    }
                    <span className="text-sm font-semibold text-navy">Paso {i + 1}</span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStepId(step.id);
                        setEditingContent(step.content_json as Json);
                        setExpandedStep(step.id);
                      }}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar paso
                    </button>
                    <button
                      type="button"
                      onClick={() => startTransition(async () => {
                        try { await deleteStep("repair_steps", step.id); await loadData(); showMsg(true, "Paso eliminado."); }
                        catch { showMsg(false, "Error al eliminar."); }
                      })}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
                {expandedStep === step.id && (
                  <div className="p-4 bg-white space-y-3">
                    {editingStepId === step.id ? (
                      <>
                        <RichEditor
                          key={`repair-edit-${step.id}`}
                          initialContent={step.content_json as Json}
                          bucket="repair-media"
                          onChange={setEditingContent}
                        />
                        <div className="flex gap-2 justify-end pt-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingStepId(null)}>
                            Cancelar
                          </Button>
                          <Button size="sm" loading={isPending}
                            onClick={() => startTransition(async () => {
                              try {
                                await saveStep("repair_steps", {
                                  id: step.id,
                                  error_code_id: errorCode.id,
                                  step_order: step.step_order,
                                  content_json: editingContent,
                                });
                                setEditingStepId(null);
                                await loadData();
                                showMsg(true, "Paso guardado y traducido.");
                              } catch { showMsg(false, "Error al guardar."); }
                            })}>
                            Guardar y traducir
                          </Button>
                        </div>
                      </>
                    ) : (
                      <RichEditor initialContent={step.content_json as Json} readOnly />
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                + Nuevo paso de reparación
              </p>
              <RichEditor
                key={repairKey}
                placeholder="Describe el procedimiento de reparación..."
                bucket="repair-media"
                onChange={setRepairContent}
              />
              <div className="flex justify-end">
                <Button size="sm" loading={isPending}
                  onClick={() => startTransition(async () => {
                    try {
                      await saveStep("repair_steps", {
                        error_code_id: errorCode.id,
                        step_order: repairSteps.length,
                        content_json: JSON.parse(JSON.stringify(repairContent)),
                      });
                      setRepairContent({}); setRepairKey((k) => k + 1);
                      await loadData();
                      showMsg(true, "Paso de reparación guardado.");
                    } catch { showMsg(false, "Error al guardar el paso."); }
                  })}>
                  <Plus className="w-3.5 h-3.5" /> Guardar paso
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ══ HERRAMIENTAS ═══════════════════════════════════════════════════ */}
        {tab === "tools" && !loadingData && (
          <div className="space-y-3">
            {ecTools.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">
                Sin herramientas asignadas.
              </p>
            )}

            {ecTools.map((et) => (
              <div key={et.tool_id} className="border border-gray-200 rounded-xl overflow-hidden">
                {editingToolId === et.tool_id ? (
                  /* ── Formulario de edición de herramienta ── */
                  <div className="p-4 bg-white space-y-3">
                    <p className="text-sm font-semibold text-gray-800">
                      {et.tool?.translations?.es?.name ?? et.tool_id}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                        <input
                          type="number"
                          min="1"
                          value={editToolQty}
                          onChange={(e) => setEditToolQty(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notas de uso</label>
                        <input
                          type="text"
                          value={editToolNotes}
                          onChange={(e) => setEditToolNotes(e.target.value)}
                          placeholder="Ej: Conectar en punto P1"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingToolId(null)}>
                        Cancelar
                      </Button>
                      <Button size="sm" loading={isPending}
                        onClick={() => startTransition(async () => {
                          try {
                            await updateErrorCodeTool(errorCode.id, et.tool_id, {
                              quantity: editToolQty ? parseInt(editToolQty) : null,
                              notes: editToolNotes || null,
                            });
                            setEditingToolId(null);
                            await loadData();
                            showMsg(true, "Herramienta actualizada.");
                          } catch { showMsg(false, "Error al actualizar."); }
                        })}>
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Vista normal de herramienta ── */
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {et.tool?.translations?.es?.name ?? et.tool_id}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {et.quantity && <span>Cantidad: {et.quantity}</span>}
                        {et.notes && <span className="truncate italic">{et.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingToolId(et.tool_id);
                          setEditToolQty(et.quantity ? String(et.quantity) : "");
                          setEditToolNotes(et.notes ?? "");
                        }}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => startTransition(async () => {
                          try { await removeToolFromErrorCode(errorCode.id, et.tool_id); await loadData(); showMsg(true, "Herramienta eliminada."); }
                          catch { showMsg(false, "Error al eliminar."); }
                        })}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Quitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Agregar herramienta */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                + Agregar herramienta
              </p>
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Herramienta</label>
                  <select
                    value={selectedToolId}
                    onChange={(e) => setSelectedToolId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                  >
                    <option value="">Seleccionar herramienta...</option>
                    {tools.map((t) => (
                      <option key={t.id} value={t.id}>{t.translations?.es?.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={toolQty}
                    onChange={(e) => setToolQty(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" loading={isPending} disabled={!selectedToolId}
                  onClick={() => startTransition(async () => {
                    try {
                      await addToolToErrorCode(errorCode.id, selectedToolId, toolQty ? parseInt(toolQty) : null, null);
                      setSelectedToolId(""); setToolQty("");
                      await loadData();
                      showMsg(true, "Herramienta agregada.");
                    } catch { showMsg(false, "Error al agregar."); }
                  })}>
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ══ PELIGROS ═══════════════════════════════════════════════════════ */}
        {tab === "hazards" && !loadingData && (
          <div className="space-y-3">
            {ecHazards.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">
                Sin peligros registrados.
              </p>
            )}

            {ecHazards.map((h) => (
              <div key={h.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {editingHazardId === h.id ? (
                  /* ── Formulario de edición de peligro ── */
                  <div className="p-4 bg-white space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Editando peligro</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Severidad</label>
                        <select
                          value={editHazardSev}
                          onChange={(e) => setEditHazardSev(e.target.value as HazardSeverity)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                        >
                          {(["warning", "caution", "danger"] as HazardSeverity[]).map((s) => (
                            <option key={s} value={s}>{HAZARD_SEV_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de icono</label>
                        <select
                          value={editHazardIcon}
                          onChange={(e) => setEditHazardIcon(e.target.value as HazardIcon)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                        >
                          {(["electric", "pressure", "burn", "crush", "chemical", "generic"] as HazardIcon[]).map((ic) => (
                            <option key={ic} value={ic}>{HAZARD_ICON_LABELS[ic]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                      <input
                        value={editHazardTitle}
                        onChange={(e) => setEditHazardTitle(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                      <textarea
                        rows={2}
                        value={editHazardDesc}
                        onChange={(e) => setEditHazardDesc(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingHazardId(null)}>
                        Cancelar
                      </Button>
                      <Button size="sm" loading={isPending} disabled={!editHazardTitle}
                        onClick={() => startTransition(async () => {
                          try {
                            await updateHazard(h.id, {
                              severity: editHazardSev,
                              icon: editHazardIcon,
                              titleEs: editHazardTitle,
                              descriptionEs: editHazardDesc,
                            });
                            setEditingHazardId(null);
                            await loadData();
                            showMsg(true, "Peligro actualizado y traducido.");
                          } catch { showMsg(false, "Error al actualizar el peligro."); }
                        })}>
                        Guardar y traducir
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Vista normal de peligro ── */
                  <div className="flex items-start justify-between px-4 py-3 bg-gray-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {h.translations?.es?.title}
                      </p>
                      {h.translations?.es?.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {h.translations.es.description}
                        </p>
                      )}
                      <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        h.severity === "danger" ? "bg-red-100 text-red-700"
                        : h.severity === "caution" ? "bg-orange-100 text-orange-700"
                        : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {HAZARD_SEV_LABELS[h.severity as HazardSeverity]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3 mt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHazardId(h.id);
                          setEditHazardSev(h.severity as HazardSeverity);
                          setEditHazardIcon(h.icon as HazardIcon);
                          setEditHazardTitle(h.translations?.es?.title ?? "");
                          setEditHazardDesc(h.translations?.es?.description ?? "");
                        }}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => startTransition(async () => {
                          try { await deleteHazard(h.id); await loadData(); showMsg(true, "Peligro eliminado."); }
                          catch { showMsg(false, "Error al eliminar."); }
                        })}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Nuevo peligro */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                + Nuevo peligro
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Severidad</label>
                  <select
                    value={hazardSeverity}
                    onChange={(e) => setHazardSeverity(e.target.value as HazardSeverity)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                  >
                    {(["warning", "caution", "danger"] as HazardSeverity[]).map((s) => (
                      <option key={s} value={s}>{HAZARD_SEV_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de icono</label>
                  <select
                    value={hazardIcon}
                    onChange={(e) => setHazardIcon(e.target.value as HazardIcon)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                  >
                    {(["electric", "pressure", "burn", "crush", "chemical", "generic"] as HazardIcon[]).map((ic) => (
                      <option key={ic} value={ic}>{HAZARD_ICON_LABELS[ic]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                <input
                  value={hazardTitle}
                  onChange={(e) => setHazardTitle(e.target.value)}
                  placeholder="Ej: Alta presión hidráulica"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={hazardDesc}
                  onChange={(e) => setHazardDesc(e.target.value)}
                  placeholder="Descripción del riesgo..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button size="sm" loading={isPending} disabled={!hazardTitle}
                  onClick={() => startTransition(async () => {
                    try {
                      await createHazard({
                        errorCodeId: errorCode.id,
                        severity: hazardSeverity,
                        icon: hazardIcon,
                        titleEs: hazardTitle,
                        descriptionEs: hazardDesc,
                        displayOrder: ecHazards.length,
                      });
                      setHazardTitle(""); setHazardDesc("");
                      await loadData();
                      showMsg(true, "Peligro guardado y traducido.");
                    } catch { showMsg(false, "Error al guardar el peligro."); }
                  })}>
                  <Plus className="w-3.5 h-3.5" /> Guardar peligro
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

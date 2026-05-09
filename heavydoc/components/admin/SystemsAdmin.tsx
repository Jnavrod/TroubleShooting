"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Settings2, ChevronDown, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ImageUpload from "@/components/ui/ImageUpload";
import ErrorCodeAdmin from "./ErrorCodeAdmin";
import {
  createSystem, updateSystem, deleteSystem,
  createSubsystem, updateSubsystem, deleteSubsystem,
} from "@/lib/actions/systems";
import type { System, Subsystem, ErrorCode } from "@/types/database";

type SystemWithSubsystems = System & {
  subsystems: (Subsystem & { error_codes: ErrorCode[] })[];
};

interface Props {
  systems: SystemWithSubsystems[];
  tools: { id: string; translations: Record<string, Record<string, string>> }[];
  locale: string;
}

export default function SystemsAdmin({ systems, tools }: Props) {
  const [isPending, startTransition] = useTransition();

  // System modals
  const [sysFormOpen, setSysFormOpen] = useState(false);
  const [editSystem, setEditSystem] = useState<System | null>(null);
  const [deleteSystem_, setDeleteSystem] = useState<System | null>(null);
  const [sysIconUrl, setSysIconUrl] = useState<string | null>(null);

  // Subsystem modals
  const [subFormOpen, setSubFormOpen] = useState(false);
  const [subForSystem, setSubForSystem] = useState<System | null>(null);
  const [editSub, setEditSub] = useState<Subsystem | null>(null);
  const [deleteSub, setDeleteSub] = useState<Subsystem | null>(null);

  // UI expand state
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedSystems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function getSysName(s: System) { return s.translations?.es?.name ?? ""; }
  function getSubName(s: Subsystem) { return s.translations?.es?.name ?? ""; }

  // System handlers
  async function handleSysSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nameEs = fd.get("nameEs") as string;
    const descriptionEs = fd.get("descriptionEs") as string;
    startTransition(async () => {
      if (editSystem) {
        await updateSystem(editSystem.id, { nameEs, descriptionEs, iconUrl: sysIconUrl });
      } else {
        await createSystem({ nameEs, descriptionEs, iconUrl: sysIconUrl });
      }
      setSysFormOpen(false);
    });
  }

  async function handleSysDelete() {
    if (!deleteSystem_) return;
    startTransition(async () => {
      await deleteSystem(deleteSystem_.id);
      setDeleteSystem(null);
    });
  }

  // Subsystem handlers
  async function handleSubSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nameEs = fd.get("nameEs") as string;
    const descriptionEs = fd.get("descriptionEs") as string;
    startTransition(async () => {
      if (editSub) {
        await updateSubsystem(editSub.id, { nameEs, descriptionEs });
      } else if (subForSystem) {
        const system = systems.find((s) => s.id === subForSystem.id);
        await createSubsystem({
          systemId: subForSystem.id,
          nameEs,
          descriptionEs,
          displayOrder: system?.subsystems.length ?? 0,
        });
      }
      setSubFormOpen(false);
    });
  }

  async function handleSubDelete() {
    if (!deleteSub) return;
    startTransition(async () => {
      await deleteSubsystem(deleteSub.id);
      setDeleteSub(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sistemas</h1>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => { setEditSystem(null); setSysIconUrl(null); setSysFormOpen(true); }}
        >
          Nuevo Sistema
        </Button>
      </div>

      {!systems.length ? (
        <div className="text-center py-16 text-gray-400">
          <Settings2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay sistemas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {systems.map((system) => (
            <div key={system.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* System header */}
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  onClick={() => toggleExpand(system.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {expandedSystems.has(system.id)
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                  <Settings2 className="w-5 h-5 text-navy" />
                  <div>
                    <p className="font-semibold text-gray-900">{getSysName(system)}</p>
                    <p className="text-xs text-gray-400">
                      {system.subsystems.length} subsistemas ·{" "}
                      {system.subsystems.reduce((a, ss) => a + ss.error_codes.length, 0)} códigos de error
                    </p>
                  </div>
                </button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" icon={<Pencil className="w-4 h-4" />}
                    onClick={() => { setEditSystem(system); setSysIconUrl(system.icon_url); setSysFormOpen(true); }} />
                  <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-500" />}
                    onClick={() => setDeleteSystem(system)} />
                </div>
              </div>

              {/* Subsystems (expanded) */}
              {expandedSystems.has(system.id) && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
                  <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => { setSubForSystem(system); setEditSub(null); setSubFormOpen(true); }}>
                    Agregar Subsistema
                  </Button>

                  {system.subsystems.map((sub) => (
                    <div key={sub.id} className="bg-white border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <p className="font-medium text-gray-800 text-sm">{getSubName(sub)}</p>
                        <div className="flex gap-1.5">
                          <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => { setEditSub(sub); setSubForSystem(system); setSubFormOpen(true); }} />
                          <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                            onClick={() => setDeleteSub(sub)} />
                        </div>
                      </div>
                      {/* Error codes within subsystem */}
                      <ErrorCodeAdmin
                        subsystem={sub}
                        errorCodes={sub.error_codes}
                        tools={tools}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* System form modal */}
      <Modal open={sysFormOpen} onClose={() => setSysFormOpen(false)}
        title={editSystem ? "Editar Sistema" : "Nuevo Sistema"}>
        <form onSubmit={handleSysSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (ES) *</label>
            <input name="nameEs" required
              defaultValue={editSystem?.translations?.es?.name ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (ES)</label>
            <textarea name="descriptionEs" rows={2}
              defaultValue={editSystem?.translations?.es?.description ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ícono / Imagen</label>
            <ImageUpload bucket="system-images" value={sysIconUrl} onChange={setSysIconUrl} />
          </div>
          <p className="text-xs text-gray-400">Traducción EN/PT generada automáticamente.</p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setSysFormOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Subsystem form modal */}
      <Modal open={subFormOpen} onClose={() => setSubFormOpen(false)}
        title={editSub ? "Editar Subsistema" : `Nuevo Subsistema — ${subForSystem ? getSysName(subForSystem) : ""}`}>
        <form onSubmit={handleSubSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (ES) *</label>
            <input name="nameEs" required
              defaultValue={editSub?.translations?.es?.name ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (ES)</label>
            <textarea name="descriptionEs" rows={2}
              defaultValue={editSub?.translations?.es?.description ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setSubFormOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirms */}
      <ConfirmDialog open={!!deleteSystem_} onClose={() => setDeleteSystem(null)} onConfirm={handleSysDelete}
        title="Eliminar Sistema" message={`¿Eliminar "${deleteSystem_ ? getSysName(deleteSystem_) : ""}"? Se eliminará todo su contenido.`}
        loading={isPending} />
      <ConfirmDialog open={!!deleteSub} onClose={() => setDeleteSub(null)} onConfirm={handleSubDelete}
        title="Eliminar Subsistema" message={`¿Eliminar "${deleteSub ? getSubName(deleteSub) : ""}"?`}
        loading={isPending} />
    </div>
  );
}

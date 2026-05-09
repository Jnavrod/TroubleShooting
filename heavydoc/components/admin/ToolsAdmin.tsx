"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ImageUpload from "@/components/ui/ImageUpload";
import { createTool, updateTool, deleteTool } from "@/lib/actions/tools";
import type { Tool } from "@/types/database";

export default function ToolsAdmin({ tools }: { tools: Tool[] }) {
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tool | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function getName(t: Tool) {
    return t.translations?.es?.name ?? "";
  }

  function openCreate() {
    setEditTarget(null);
    setImageUrl(null);
    setFormOpen(true);
  }

  function openEdit(t: Tool) {
    setEditTarget(t);
    setImageUrl(t.image_url);
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nameEs = fd.get("nameEs") as string;
    const descriptionEs = fd.get("descriptionEs") as string;
    const partNumber = (fd.get("partNumber") as string) || null;

    startTransition(async () => {
      if (editTarget) {
        await updateTool(editTarget.id, { nameEs, descriptionEs, imageUrl, partNumber });
      } else {
        await createTool({ nameEs, descriptionEs, imageUrl, partNumber });
      }
      setFormOpen(false);
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteTool(deleteTarget.id);
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Herramientas</h1>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Nueva Herramienta
        </Button>
      </div>

      {!tools.length ? (
        <div className="text-center py-16 text-gray-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay herramientas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden group relative"
            >
              {tool.image_url ? (
                <div className="relative h-32 bg-gray-50">
                  <Image
                    src={tool.image_url}
                    alt={getName(tool)}
                    fill
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <div className="h-24 bg-gray-50 flex items-center justify-center">
                  <Wrench className="w-8 h-8 text-gray-300" />
                </div>
              )}
              <div className="p-3">
                <p className="font-medium text-sm text-gray-900 line-clamp-1">
                  {getName(tool)}
                </p>
                {tool.part_number && (
                  <p className="text-xs text-gray-400">{tool.part_number}</p>
                )}
              </div>
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                <button
                  onClick={() => openEdit(tool)}
                  className="bg-white shadow rounded-lg p-1.5 hover:text-navy transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(tool)}
                  className="bg-white shadow rounded-lg p-1.5 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? "Editar Herramienta" : "Nueva Herramienta"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (ES) *</label>
            <input
              name="nameEs"
              required
              defaultValue={editTarget?.translations?.es?.name ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (ES)</label>
            <textarea
              name="descriptionEs"
              rows={2}
              defaultValue={editTarget?.translations?.es?.description ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° de Parte</label>
            <input
              name="partNumber"
              defaultValue={editTarget?.part_number ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
            <ImageUpload bucket="tool-images" value={imageUrl} onChange={setImageUrl} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isPending}>Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Herramienta"
        message={`¿Eliminar "${deleteTarget ? getName(deleteTarget) : ""}"?`}
        loading={isPending}
      />
    </div>
  );
}

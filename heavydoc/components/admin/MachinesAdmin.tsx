"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Trash2, Link2, Unlink, Cpu } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  createMachine,
  updateMachine,
  deleteMachine,
  assignSystemToMachine,
  removeSystemFromMachine,
} from "@/lib/actions/machines";
import type { Machine, System, MachineSystem } from "@/types/database";

interface Props {
  machines: Machine[];
  systems: System[];
  machineSystems: MachineSystem[];
  locale: string;
}

export default function MachinesAdmin({ machines, systems, machineSystems }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Machine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null);
  const [systemsTarget, setSystemsTarget] = useState<Machine | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [localMS, setLocalMS] = useState<MachineSystem[]>(machineSystems);

  function getMachineSystemIds(machineId: string) {
    return localMS
      .filter((ms) => ms.machine_id === machineId)
      .map((ms) => ms.system_id);
  }

  function getSystemName(s: System) {
    return s.translations?.es?.name ?? "";
  }

  function getName(m: Machine) {
    return m.translations?.es?.name ?? "";
  }

  function openCreate() {
    setEditTarget(null);
    setImageUrl(null);
    setFormOpen(true);
  }

  function openEdit(m: Machine) {
    setEditTarget(m);
    setImageUrl(m.image_url);
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nameEs = fd.get("nameEs") as string;
    const descriptionEs = fd.get("descriptionEs") as string;

    startTransition(async () => {
      if (editTarget) {
        await updateMachine(editTarget.id, { nameEs, descriptionEs, imageUrl });
      } else {
        await createMachine({ nameEs, descriptionEs, imageUrl });
      }
      setFormOpen(false);
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteMachine(deleteTarget.id);
      setDeleteTarget(null);
    });
  }

  async function toggleSystem(machineId: string, systemId: string, assigned: boolean, order: number) {
    // Optimistic update
    if (assigned) {
      setLocalMS((prev) => prev.filter((ms) => !(ms.machine_id === machineId && ms.system_id === systemId)));
    } else {
      setLocalMS((prev) => [...prev, { machine_id: machineId, system_id: systemId, display_order: order }]);
    }
    startTransition(async () => {
      try {
        if (assigned) {
          await removeSystemFromMachine(machineId, systemId);
        } else {
          await assignSystemToMachine(machineId, systemId, order);
        }
        router.refresh();
      } catch {
        setLocalMS(machineSystems); // revert on error
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Máquinas</h1>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Nueva Máquina
        </Button>
      </div>

      {!machines.length ? (
        <div className="text-center py-16 text-gray-400">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No hay máquinas. Crea la primera.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {machines.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4">
              {m.image_url ? (
                <Image
                  src={m.image_url}
                  alt={getName(m)}
                  width={56}
                  height={56}
                  className="rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-7 h-7 text-navy/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{getName(m)}</p>
                <p className="text-xs text-gray-400">
                  {getMachineSystemIds(m.id).length} sistemas asignados
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Link2 className="w-4 h-4" />}
                  onClick={() => setSystemsTarget(m)}
                  title="Asignar sistemas"
                >
                  Sistemas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Pencil className="w-4 h-4" />}
                  onClick={() => openEdit(m)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4 text-red-500" />}
                  onClick={() => setDeleteTarget(m)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? "Editar Máquina" : "Nueva Máquina"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre (ES) *
            </label>
            <input
              name="nameEs"
              required
              defaultValue={editTarget ? (editTarget.translations?.es?.name ?? "") : ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (ES)
            </label>
            <textarea
              name="descriptionEs"
              rows={3}
              defaultValue={editTarget ? (editTarget.translations?.es?.description ?? "") : ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
            <ImageUpload
              bucket="machine-images"
              value={imageUrl}
              onChange={setImageUrl}
            />
          </div>
          <p className="text-xs text-gray-400">
            La traducción a EN y PT se generará automáticamente.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Máquina"
        message={`¿Eliminar "${deleteTarget ? getName(deleteTarget) : ""}"? Esta acción no se puede deshacer.`}
        loading={isPending}
      />

      {/* Assign Systems Modal */}
      <Modal
        open={!!systemsTarget}
        onClose={() => setSystemsTarget(null)}
        title={`Sistemas — ${systemsTarget ? getName(systemsTarget) : ""}`}
        size="lg"
      >
        <div className="space-y-2">
          {!systems.length && (
            <p className="text-sm text-gray-400">No hay sistemas disponibles.</p>
          )}
          {systems.map((s, i) => {
            const assigned = systemsTarget
              ? getMachineSystemIds(systemsTarget.id).includes(s.id)
              : false;
            return (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-gray-50"
              >
                <p className="text-sm font-medium text-gray-900">{getSystemName(s)}</p>
                <Button
                  variant={assigned ? "danger" : "secondary"}
                  size="sm"
                  icon={assigned ? <Unlink className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                  loading={isPending}
                  onClick={() =>
                    systemsTarget && toggleSystem(systemsTarget.id, s.id, assigned, i)
                  }
                >
                  {assigned ? "Quitar" : "Asignar"}
                </Button>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

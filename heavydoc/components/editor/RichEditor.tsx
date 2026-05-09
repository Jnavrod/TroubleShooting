"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Table as TableIcon, ImagePlus, Undo, Redo,
} from "lucide-react";
import type { Json } from "@/types/database";

interface RichEditorProps {
  initialContent?: Json;
  onChange?: (json: Json) => void;
  placeholder?: string;
  bucket?: string;
  readOnly?: boolean;
}

export default function RichEditor({
  initialContent,
  onChange,
  placeholder = "Escribe aquí...",
  bucket = "diagnostic-media",
  readOnly = false,
}: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tablePickerRef = useRef<HTMLDivElement>(null);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHeader, setTableHeader] = useState(true);

  useEffect(() => {
    if (!tablePickerOpen) return;
    function handleOutside(e: MouseEvent) {
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target as Node)) {
        setTablePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [tablePickerOpen]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto" } }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    immediatelyRender: false,
    content: (initialContent as object) ?? undefined,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Json);
    },
  });

  const uploadImage = useCallback(
    async (file: File) => {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) return;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      editor?.chain().focus().setImage({ src: data.publicUrl }).run();
    },
    [editor, bucket]
  );

  if (readOnly) {
    return (
      <div
        className="prose prose-sm max-w-none tiptap-editor notranslate"
        translate="no"
      >
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div
      className="border border-gray-300 rounded-xl overflow-hidden tiptap-editor notranslate"
      translate="no"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 bg-gray-50 border-b border-gray-200">
        {[
          { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
          { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
          { icon: UnderlineIcon, action: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive("underline") },
        ].map(({ icon: Icon, action, active }, i) => (
          <button
            key={i}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); action(); }}
            className={`p-1.5 rounded-lg transition-colors ${active ? "bg-navy text-white" : "text-gray-600 hover:bg-gray-200"}`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}

        <div className="w-px bg-gray-200 mx-1" />

        {[
          { icon: AlignLeft, action: () => editor?.chain().focus().setTextAlign("left").run() },
          { icon: AlignCenter, action: () => editor?.chain().focus().setTextAlign("center").run() },
          { icon: AlignRight, action: () => editor?.chain().focus().setTextAlign("right").run() },
        ].map(({ icon: Icon, action }, i) => (
          <button
            key={i}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); action(); }}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}

        <div className="w-px bg-gray-200 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}
          className={`p-1.5 rounded-lg transition-colors ${editor?.isActive("bulletList") ? "bg-navy text-white" : "text-gray-600 hover:bg-gray-200"}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }}
          className={`p-1.5 rounded-lg transition-colors ${editor?.isActive("orderedList") ? "bg-navy text-white" : "text-gray-600 hover:bg-gray-200"}`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-200 mx-1" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
          title="Insertar imagen"
        >
          <ImagePlus className="w-4 h-4" />
        </button>

        <div className="relative" ref={tablePickerRef}>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setTablePickerOpen((v) => !v); }}
            className={`p-1.5 rounded-lg transition-colors ${tablePickerOpen ? "bg-navy text-white" : "text-gray-600 hover:bg-gray-200"}`}
            title="Insertar tabla"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          {tablePickerOpen && (
            <div className="absolute z-50 mt-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-56">
              <p className="text-xs font-semibold text-gray-700 mb-2">Insertar tabla</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Filas</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Columnas</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                <input
                  type="checkbox"
                  checked={tableHeader}
                  onChange={(e) => setTableHeader(e.target.checked)}
                  className="rounded"
                />
                Primera fila como encabezado
              </label>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor
                    ?.chain()
                    .focus()
                    .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: tableHeader })
                    .run();
                  setTablePickerOpen(false);
                }}
                className="w-full bg-navy text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-navy-light transition-colors"
              >
                Insertar {tableRows} × {tableCols}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().undo().run(); }}
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().redo().run(); }}
          className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 min-h-[180px] prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
      />
    </div>
  );
}

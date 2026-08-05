import React, { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import { toast } from "../../utils/toast";

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: number | string;
  maxHeight?: number | string;
  className?: string;
  maxCharacters?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = "",
  onChange,
  placeholder = "Nhập nội dung...",
  editable = true,
  minHeight = 160,
  maxHeight = 400,
  className = "",
  maxCharacters,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
          class: "text-primary underline cursor-pointer",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-3 border border-outline-variant",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b border-outline-variant",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-outline-variant p-2 bg-surface-container-low font-bold text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-outline-variant p-2 align-top",
        },
      }),
      CharacterCount.configure({
        limit: maxCharacters,
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: `prose prose-slate max-w-none p-4 focus:outline-none text-on-surface text-sm leading-relaxed`,
        style: `min-height: ${typeof minHeight === "number" ? `${minHeight}px` : minHeight}; max-height: ${typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight}; overflow-y: auto;`,
      },
      handlePaste: (view, event) => {
        // 1. Chặn dán file ảnh từ clipboard
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith("image/")) {
              event.preventDefault();
              toast.warning("Vui lòng dùng phần đính kèm tệp để nộp ảnh.");
              return true;
            }
          }
        }

        // 2. Chặn dán HTML chứa thẻ img / base64
        const html = event.clipboardData?.getData("text/html");
        if (html && /<img[^>]*>/i.test(html)) {
          event.preventDefault();
          // Strip ảnh và chèn text thuần
          const stripped = html.replace(/<img[^>]*>/gi, "");
          view.dispatch(view.state.tr.replaceSelectionWith(view.state.schema.text(stripped)));
          toast.warning("Hình ảnh đã bị loại bỏ. Vui lòng dùng phần đính kèm tệp để nộp ảnh.");
          return true;
        }

        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith("image/")) {
              event.preventDefault();
              toast.warning("Vui lòng dùng phần đính kèm tệp để nộp ảnh.");
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Nếu chỉ có <p></p> rỗng thì trả về rỗng
      const cleanHtml = editor.isEmpty ? "" : html;
      if (onChange) {
        onChange(cleanHtml);
      }
    },
  });

  // Đồng bộ content khi content prop thay đổi từ bên ngoài (ví dụ phục hồi draft)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (!content && editor.isEmpty) return;
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  // Đồng bộ trạng thái editable
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Nhập đường dẫn liên kết (URL):", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const formattedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: formattedUrl }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const wordCount = editor.storage.characterCount.words();
  const charCount = editor.storage.characterCount.characters();

  return (
    <div
      className={`rounded-xl border border-outline-variant bg-white transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
        !editable ? "bg-surface-container-low opacity-80 cursor-not-allowed" : ""
      } ${className}`}
    >
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-1 border-b border-outline-variant bg-surface-container-low p-2 rounded-t-xl text-on-surface-variant">
          {/* Text Style */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg hover:bg-white transition text-xs font-bold ${
              editor.isActive("bold") ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="In đậm (Ctrl+B)"
          >
            <span className="material-symbols-outlined text-[18px]">format_bold</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg hover:bg-white transition text-xs ${
              editor.isActive("italic") ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="In nghiêng (Ctrl+I)"
          >
            <span className="material-symbols-outlined text-[18px]">format_italic</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg hover:bg-white transition text-xs ${
              editor.isActive("underline") ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="Gạch chân (Ctrl+U)"
          >
            <span className="material-symbols-outlined text-[18px]">format_underlined</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg hover:bg-white transition text-xs ${
              editor.isActive("strike") ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="Gạch ngang"
          >
            <span className="material-symbols-outlined text-[18px]">strikethrough_s</span>
          </button>

          <div className="w-[1px] h-5 bg-outline-variant mx-1 self-center" />

          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded-lg hover:bg-white transition text-xs font-bold ${
              editor.isActive("heading", { level: 2 }) ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="Tiêu đề lớn (H2)"
          >
            H2
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 rounded-lg hover:bg-white transition text-xs font-bold ${
              editor.isActive("heading", { level: 3 }) ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="Tiêu đề vừa (H3)"
          >
            H3
          </button>

          <div className="w-[1px] h-5 bg-outline-variant mx-1 self-center" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg hover:bg-white transition text-xs ${
              editor.isActive("bulletList") ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="Danh sách dấu chấm"
          >
            <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg hover:bg-white transition text-xs ${
              editor.isActive("orderedList") ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="Danh sách số thứ tự"
          >
            <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg hover:bg-white transition text-xs ${
              editor.isActive("blockquote") ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="Trích dẫn"
          >
            <span className="material-symbols-outlined text-[18px]">format_quote</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded-lg hover:bg-white transition text-xs ${
              editor.isActive("codeBlock") ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="Khối code"
          >
            <span className="material-symbols-outlined text-[18px]">code_blocks</span>
          </button>

          <div className="w-[1px] h-5 bg-outline-variant mx-1 self-center" />

          {/* Table & Link */}
          <button
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            className="p-1.5 rounded-lg hover:bg-white transition text-xs"
            title="Chèn bảng (3x3)"
          >
            <span className="material-symbols-outlined text-[18px]">table</span>
          </button>

          <button
            type="button"
            onClick={setLink}
            className={`p-1.5 rounded-lg hover:bg-white transition text-xs ${
              editor.isActive("link") ? "bg-white text-primary shadow-xs" : ""
            }`}
            title="Chèn liên kết"
          >
            <span className="material-symbols-outlined text-[18px]">link</span>
          </button>

          <div className="w-[1px] h-5 bg-outline-variant mx-1 self-center" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg hover:bg-white transition text-xs disabled:opacity-30"
            title="Hoàn tác (Ctrl+Z)"
          >
            <span className="material-symbols-outlined text-[18px]">undo</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg hover:bg-white transition text-xs disabled:opacity-30"
            title="Làm lại (Ctrl+Y)"
          >
            <span className="material-symbols-outlined text-[18px]">redo</span>
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <EditorContent editor={editor} />

      {/* Footer: Word & Character Count */}
      <div className="flex justify-between items-center px-4 py-2 bg-surface-container-lowest border-t border-outline-variant/60 rounded-b-xl text-[11px] text-on-surface-variant">
        <span>
          {editable ? "Trình soạn thảo trực tiếp" : "Chế độ chỉ đọc"}
        </span>
        <div className="flex items-center gap-3">
          <span>{wordCount} từ</span>
          <span>•</span>
          <span>
            {charCount} {maxCharacters ? `/ ${maxCharacters}` : ""} ký tự
          </span>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;

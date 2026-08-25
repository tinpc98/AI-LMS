import React, { useRef, useState } from 'react';
import type { FormulaDisplayMode } from '../../features/question/question.types';
import { FormulaRenderer } from '../Content/FormulaRenderer';

export interface FormulaEditorProps {
  initialLatex?: string;
  initialMode?: FormulaDisplayMode;
  onSave: (latex: string, mode: FormulaDisplayMode) => void;
  onCancel: () => void;
}

const BASIC_SYMBOLS = [
  { label: '+', latex: '+' },
  { label: '-', latex: '-' },
  { label: '×', latex: '\\times' },
  { label: '÷', latex: '\\div' },
  { label: '=', latex: '=' },
  { label: '≠', latex: '\\neq' },
  { label: '<', latex: '<' },
  { label: '>', latex: '>' },
  { label: '±', latex: '\\pm' },
  { label: '√', latex: '\\sqrt{}' },
  { label: 'x²', latex: '^{2}' },
  { label: 'xⁿ', latex: '^{}' },
  { label: 'xₙ', latex: '_{}' },
  { label: 'a/b', latex: '\\frac{}{}' },
];

const ADVANCED_SYMBOLS = [
  { label: 'π', latex: '\\pi' },
  { label: 'θ', latex: '\\theta' },
  { label: 'α', latex: '\\alpha' },
  { label: 'β', latex: '\\beta' },
  { label: '∑', latex: '\\sum' },
  { label: '∫', latex: '\\int' },
  { label: 'lim', latex: '\\lim_{x \\to \\infty}' },
  { label: 'sin', latex: '\\sin()' },
  { label: 'cos', latex: '\\cos()' },
  { label: 'tan', latex: '\\tan()' },
  { label: 'log', latex: '\\log_{}' },
  { label: 'ln', latex: '\\ln()' },
  { label: '∞', latex: '\\infty' },
  { label: '∈', latex: '\\in' },
  { label: '∉', latex: '\\notin' },
  { label: '⊂', latex: '\\subset' },
  { label: '∪', latex: '\\cup' },
  { label: '∩', latex: '\\cap' },
];

export const FormulaEditor: React.FC<FormulaEditorProps> = ({
  initialLatex = '',
  initialMode = 'INLINE',
  onSave,
  onCancel
}) => {
  const [latex, setLatex] = useState(initialLatex);
  const [mode, setMode] = useState<FormulaDisplayMode>(initialMode);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertLatex = (symbol: string) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    const newLatex = latex.substring(0, start) + symbol + latex.substring(end);
    setLatex(newLatex);
    
    // Khôi phục focus vào giữa symbol nếu cần (ví dụ \frac{}{})
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        let cursorOffset = symbol.length;
        if (symbol.includes('{}')) {
          cursorOffset = symbol.indexOf('{}') + 1;
        } else if (symbol.includes('()')) {
          cursorOffset = symbol.indexOf('()') + 1;
        }
        textareaRef.current.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }
    }, 0);
  };

  const handleSave = () => {
    if (!latex.trim()) return;
    onSave(latex.trim(), mode);
  };

  const symbols = isAdvanced ? [...BASIC_SYMBOLS, ...ADVANCED_SYMBOLS] : BASIC_SYMBOLS;

  return (
    <div className="border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setMode('INLINE')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'INLINE' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
              type="button"
            >
              Nội tuyến (Inline)
            </button>
            <button
              onClick={() => setMode('BLOCK')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${mode === 'BLOCK' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
              type="button"
            >
              Khối (Block)
            </button>
          </div>
          <button
            onClick={() => setIsAdvanced(!isAdvanced)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            type="button"
          >
            {isAdvanced ? 'Cơ bản' : 'Nâng cao'}
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {symbols.map((sym, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => insertLatex(sym.latex)}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-indigo-50 hover:border-indigo-300 text-gray-700 font-serif text-sm transition-colors"
              title={sym.latex}
            >
              {sym.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Preview Split */}
      <div className="flex flex-col md:flex-row">
        {/* Editor */}
        <div className="w-full md:w-1/2 p-2 border-b md:border-b-0 md:border-r border-gray-300">
          <textarea
            ref={textareaRef}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="Nhập mã LaTeX ở đây... VD: c = \pm\sqrt{a^2 + b^2}"
            className="w-full h-32 p-2 border-0 focus:ring-0 resize-none font-mono text-sm bg-gray-50 rounded"
          />
        </div>

        {/* Preview */}
        <div className="w-full md:w-1/2 p-4 bg-white flex flex-col">
          <span className="text-xs text-gray-500 uppercase font-bold mb-2">Xem trước</span>
          <div className="flex-grow flex items-center justify-center bg-gray-50 rounded border border-gray-200 overflow-auto p-4">
            <FormulaRenderer latex={latex} displayMode={mode} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 bg-gray-50 border-t border-gray-300 flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 text-sm transition-colors"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!latex.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm transition-colors disabled:opacity-50"
        >
          Lưu công thức
        </button>
      </div>
    </div>
  );
};

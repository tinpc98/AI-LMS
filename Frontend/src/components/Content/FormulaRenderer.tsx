import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { FormulaDisplayMode } from '../../features/question/question.types';

export interface FormulaRendererProps {
  latex: string;
  displayMode: FormulaDisplayMode;
  className?: string;
}

/**
 * FormulaRenderer an toàn, dùng KaTeX thay cho dangerouslySetInnerHTML.
 * Nếu có lỗi cú pháp LaTeX, nó sẽ không sập app mà báo lỗi nhẹ nhàng (KaTeX default behavior hoặc ta cấu hình renderError).
 */
export const FormulaRenderer: React.FC<FormulaRendererProps> = ({ latex, displayMode, className }) => {
  if (!latex) return null;

  try {
    if (displayMode === 'BLOCK') {
      return (
        <div className={`my-2 text-center overflow-x-auto ${className || ''}`}>
          <BlockMath math={latex} renderError={(err) => <span className="text-red-500 font-mono text-sm">{err.name}: {err.message}</span>} />
        </div>
      );
    }
    
    return (
      <span className={`inline-block ${className || ''}`}>
        <InlineMath math={latex} renderError={(err) => <span className="text-red-500 font-mono text-sm">{err.name}: {err.message}</span>} />
      </span>
    );
  } catch (error) {
    console.error("Formula render error:", error);
    return <span className="text-red-500">[Invalid Formula]</span>;
  }
};

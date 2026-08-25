import React, { Fragment } from 'react';
import type { ContentBlock } from '../../features/question/question.types';
import { FormulaRenderer } from './FormulaRenderer';

export interface ContentRendererProps {
  blocks: ContentBlock[];
  className?: string;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ blocks, className }) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className={`space-y-1 ${className || ''}`}>
      {blocks.sort((a, b) => a.order - b.order).map((block) => {
        switch (block.type) {
          case 'TEXT':
            return (
              <span key={block.id} className="whitespace-pre-wrap text-gray-800 break-words dark:text-gray-200">
                {block.text}
              </span>
            );
          
          case 'FORMULA':
            return (
              <FormulaRenderer 
                key={block.id}
                latex={block.latex} 
                displayMode={block.displayMode} 
              />
            );
          
          case 'IMAGE':
            return (
              <div key={block.id} className="my-2 flex flex-col items-center">
                <img 
                  src={block.image.url} 
                  alt={block.image.alt || "Question Image"} 
                  className="max-w-full h-auto rounded-md shadow-sm border border-gray-200"
                  style={{ maxHeight: '400px' }}
                />
                {block.image.caption && (
                  <p className="text-sm text-gray-500 mt-1 italic">{block.image.caption}</p>
                )}
              </div>
            );
            
          default:
            return null;
        }
      })}
    </div>
  );
};

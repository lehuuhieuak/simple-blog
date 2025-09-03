'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Eye, Edit, SplitSquareHorizontal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type ViewMode = 'edit' | 'preview' | 'split';

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Content (Markdown)</label>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant={viewMode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('edit')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            type="button"
            variant={viewMode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('split')}
          >
            <SplitSquareHorizontal className="h-4 w-4 mr-2" />
            Split
          </Button>
          <Button
            type="button"
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('preview')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>
      
      {viewMode === 'edit' && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write your post content in Markdown...'}
          className="min-h-[400px] font-mono"
        />
      )}

      {viewMode === 'preview' && (
        <div className="min-h-[400px] rounded-md border border-input bg-background p-3">
          <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:leading-relaxed [&_li]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-relaxed [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-relaxed [&_h4]:text-base [&_h4]:font-medium [&_h4]:leading-relaxed [&_h5]:text-sm [&_h5]:font-medium [&_h5]:leading-relaxed [&_h6]:text-xs [&_h6]:font-medium [&_h6]:leading-relaxed [&_ol]:list-decimal [&_ol]:list-inside [&_ul]:list-disc [&_ul]:list-inside">
            <ReactMarkdown>{value || 'Nothing to preview...'}</ReactMarkdown>
          </div>
        </div>
      )}

      {viewMode === 'split' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Editor</div>
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || 'Write your post content in Markdown...'}
              className="min-h-[400px] font-mono resize-none"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Preview</div>
            <div className="min-h-[400px] rounded-md border border-input bg-background p-3 overflow-auto">
              <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:leading-relaxed [&_li]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-relaxed [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-relaxed [&_h4]:text-base [&_h4]:font-medium [&_h4]:leading-relaxed [&_h5]:text-sm [&_h5]:font-medium [&_h5]:leading-relaxed [&_h6]:text-xs [&_h6]:font-medium [&_h6]:leading-relaxed [&_ol]:list-decimal [&_ol]:list-inside [&_ul]:list-disc [&_ul]:list-inside">
                <ReactMarkdown>{value || 'Nothing to preview...'}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
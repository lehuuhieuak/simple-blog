'use client';

import {
  $getRoot,
  $getSelection,
  $createParagraphNode,
  $createTextNode,
  EditorState,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { $convertToMarkdownString, $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text';
import {
  ListItemNode,
  ListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { $setBlocksType } from '@lexical/selection';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  Edit,
  SplitSquareHorizontal,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    hashtag: 'editor-text-hashtag',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
    code: 'editor-text-code',
  },
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable',
  },
};

function onError(error: Error) {
  console.error(error);
}

interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type ViewMode = 'edit' | 'preview' | 'split';

// Toolbar Component
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  };

  const insertUnorderedList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const insertOrderedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  return (
    <div className="flex items-center space-x-1 p-2 border-b border-border">
      <Button
        type="button"
        variant={isBold ? 'default' : 'outline'}
        size="sm"
        onClick={formatBold}
        className="h-8 w-8 p-0"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={isItalic ? 'default' : 'outline'}
        size="sm"
        onClick={formatItalic}
        className="h-8 w-8 p-0"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={isUnderline ? 'default' : 'outline'}
        size="sm"
        onClick={formatUnderline}
        className="h-8 w-8 p-0"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-2" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => formatHeading('h1')}
        className="h-8 w-8 p-0"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => formatHeading('h2')}
        className="h-8 w-8 p-0"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => formatHeading('h3')}
        className="h-8 w-8 p-0"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-2" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={insertUnorderedList}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={insertOrderedList}
        className="h-8 w-8 p-0"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={formatQuote}
        className="h-8 w-8 p-0"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        className="h-8 w-8 p-0"
      >
        <Code className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Convert Lexical state to markdown
function convertToMarkdown(editorState: EditorState): string {
  let markdown = '';
  editorState.read(() => {
    try {
      markdown = $convertToMarkdownString(TRANSFORMERS);
    } catch (error) {
      // Fallback to plain text if conversion fails
      const root = $getRoot();
      markdown = root.getTextContent();
    }
  });
  return markdown;
}

// Plugin to initialize editor with markdown content
function InitializeMarkdownPlugin({ markdown }: { markdown: string }) {
  const [editor] = useLexicalComposerContext();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (markdown && markdown.trim() && !isInitialized) {
      editor.update(() => {
        try {
          // Clear the editor first
          const root = $getRoot();
          root.clear();
          
          // Convert markdown to Lexical nodes
          $convertFromMarkdownString(markdown, TRANSFORMERS);
          setIsInitialized(true);
        } catch (error) {
          console.error('Error converting markdown to editor state:', error);
          // Fallback: set as plain text
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode().append($createTextNode(markdown)));
          setIsInitialized(true);
        }
      });
    }
  }, [editor, markdown, isInitialized]);

  return null;
}

export function LexicalEditor({
  value,
  onChange,
  placeholder,
}: LexicalEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [markdownContent, setMarkdownContent] = useState(value);

  const initialConfig = {
    namespace: 'BlogEditor',
    theme,
    onError,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
    ],
  };

  const handleEditorChange = (editorState: EditorState) => {
    const markdown = convertToMarkdown(editorState);
    setMarkdownContent(markdown);
    onChange(markdown);
  };

  useEffect(() => {
    setMarkdownContent(value);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Content (Rich Text)</label>
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
        <div className="border border-input rounded-md overflow-hidden">
          <LexicalComposer initialConfig={initialConfig}>
            <ToolbarPlugin />
            <div className="relative">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable className="min-h-[400px] p-3 outline-none resize-none" />
                }
                placeholder={
                  <div className="absolute top-3 left-3 text-muted-foreground pointer-events-none">
                    {placeholder || 'Write your post content...'}
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <OnChangePlugin onChange={handleEditorChange} />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <InitializeMarkdownPlugin markdown={value} />
            </div>
          </LexicalComposer>
        </div>
      )}

      {viewMode === 'preview' && (
        <div className="min-h-[400px] rounded-md border border-input bg-background p-3">
          <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:leading-relaxed [&_li]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-relaxed [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-relaxed [&_h4]:text-base [&_h4]:font-medium [&_h4]:leading-relaxed [&_h5]:text-sm [&_h5]:font-medium [&_h5]:leading-relaxed [&_h6]:text-xs [&_h6]:font-medium [&_h6]:leading-relaxed [&_ol]:list-decimal [&_ol]:list-inside">
            <ReactMarkdown>
              {markdownContent || 'Nothing to preview...'}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {viewMode === 'split' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Editor
            </div>
            <div className="border border-input rounded-md overflow-hidden">
              <LexicalComposer initialConfig={initialConfig}>
                <ToolbarPlugin />
                <div className="relative">
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable className="min-h-[400px] p-3 outline-none resize-none" />
                    }
                    placeholder={
                      <div className="absolute top-3 left-3 text-muted-foreground pointer-events-none">
                        {placeholder || 'Write your post content...'}
                      </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />
                  <OnChangePlugin onChange={handleEditorChange} />
                  <HistoryPlugin />
                  <ListPlugin />
                  <LinkPlugin />
                  <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                  <InitializeMarkdownPlugin markdown={value} />
                </div>
              </LexicalComposer>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Preview
            </div>
            <div className="min-h-[400px] rounded-md border border-input bg-background p-3 overflow-auto">
              <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:leading-relaxed [&_li]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-relaxed [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:leading-relaxed [&_h4]:text-base [&_h4]:font-medium [&_h4]:leading-relaxed [&_h5]:text-sm [&_h5]:font-medium [&_h5]:leading-relaxed [&_h6]:text-xs [&_h6]:font-medium [&_h6]:leading-relaxed [&_ol]:list-decimal [&_ol]:list-in">
                <ReactMarkdown>
                  {markdownContent || 'Nothing to preview...'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

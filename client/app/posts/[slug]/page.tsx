'use client';

import { Badge } from '@/components/ui/badge';
import { formatDatetime } from '@/lib/utils';
import {
  getHierarchicalIndexes,
  TableOfContentDataItem,
  TableOfContents,
} from '@tiptap/extension-table-of-contents';
import { Markdown } from '@tiptap/markdown';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Calendar, User } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Image } from '@tiptap/extension-image';

import '@/components/tiptap-node/blockquote-node/blockquote-node.scss';
import '@/components/tiptap-node/code-block-node/code-block-node.scss';
import '@/components/tiptap-node/heading-node/heading-node.scss';
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss';
import '@/components/tiptap-node/image-node/image-node.scss';
import '@/components/tiptap-node/list-node/list-node.scss';
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss';

import { ToC } from './Toc';
import './styles.css';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_username: string;
  author_email: string;
  created_at: string;
  updated_at: string;
  published: boolean;
}

const MemorizedToC = React.memo(ToC);

export default function PostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<Post | null>(null);
  const [items, setItems] = useState<TableOfContentDataItem[]>([]);

  async function getPost(slug: string): Promise<Post | null> {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL!}/posts/${slug}`,
        {
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch {
      return null;
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        resize: {
          enabled: true,
          directions: ['top', 'bottom', 'left', 'right'], // can be any direction or diagonal combination
          minWidth: 50,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
      Markdown,
      TableOfContents.configure({
        getIndex: getHierarchicalIndexes,
        onUpdate(content) {
          setItems(content);
        },
      }),
    ],
    contentType: 'markdown',
    editable: false,
  });

  const handleGetPost = async (slug: string) => {
    const fetchedPost = await getPost(slug);
    setPost(fetchedPost);
    editor?.commands.setContent(fetchedPost?.content || '', {
      contentType: 'markdown',
    });
  };

  useEffect(() => {
    if (editor) {
      handleGetPost(slug);
    }
  }, [editor, slug]);

  return (
    // <div className="max-w-max mx-auto">
    <article>
      {/* <div className="lg:grid lg:grid-cols-4 lg:gap-8"> */}
      <div className="col-group">
        <div
          // className={`${
          //   headings.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'
          // }`}
          className="main"
        >
          <header className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="default">Published</Badge>
            </div>

            <h1 className="text-4xl font-bold mb-4">{post?.title}</h1>

            <div className="flex items-center space-x-6 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{post?.author_username}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDatetime(post?.created_at)}</span>
              </div>
              {post?.updated_at !== post?.created_at && (
                <div className="flex items-center space-x-2">
                  <span>Updated: {formatDatetime(post?.updated_at)}</span>
                </div>
              )}
            </div>
          </header>

          <EditorContent editor={editor} />
        </div>
        <div className="sidebar">
          <div className="sidebar-options">
            <div className="label-large">Table of contents</div>
            <div className="table-of-contents">
              <MemorizedToC editor={editor} items={items} />
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 pt-8 border-t">
        <div className="text-center text-muted-foreground">
          <p>
            Written by <strong>{post?.author_username}</strong>
          </p>
          <p className="text-sm mt-2">
            Published on {formatDatetime(post?.created_at)}
            {post?.updated_at !== post?.created_at && (
              <span> • Last updated on {formatDatetime(post?.updated_at)}</span>
            )}
          </p>
        </div>
      </footer>
    </article>
    // </div>
  );
}

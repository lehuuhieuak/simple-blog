import CodeBlock from '@/components/code-block';
import TableOfContents from '@/components/table-of-contents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Link, User } from 'lucide-react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

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

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      }/posts/${slug}`,
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | DevBlog`,
    description: post.excerpt,
    authors: [{ name: post.author_username }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.author_username],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Utility function to generate consistent IDs
  const generateId = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
  };

  // Extract headings from markdown content
  const extractHeadings = (content: string) => {
    const headingRegex = /^(#{2,6})\s+(.+)$/gm;
    const headings: { level: number; text: string; id: string }[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim().replaceAll(/`/g, '');
      const id = generateId(text);

      headings.push({ level, text, id });
    }

    console.log(headings);

    return headings;
  };

  const headings = extractHeadings(post.content);

  // Regex để tìm tất cả các dòng bắt đầu bằng một hoặc nhiều dấu #
  // ^      : Bắt đầu của một dòng (nhờ có cờ 'm')
  // #+     : Một hoặc nhiều ký tự '#'
  // .*     : Bất kỳ ký tự nào cho đến hết dòng
  // g (global) : Tìm tất cả các kết quả khớp
  // m (multiline): Khiến cho ^ và $ khớp với đầu/cuối của từng dòng, thay vì chỉ đầu/cuối của cả chuỗi
  const headingRegex = /^#+.*$/gm;

  const content = post.content.replace(headingRegex, (matchedLine) => {
    // `matchedLine` chính là toàn bộ dòng đã được tìm thấy,
    // ví dụ: "#### With the `fetch` API"

    // Bây giờ, chúng ta chỉ cần thay thế ký tự ` trong dòng này
    return matchedLine.replaceAll('`', '');
  });

  return (
    <div className="max-w-7xl mx-auto">
      <article>
        <header className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Badge variant="default">Published</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center space-x-6 text-muted-foreground">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{post.author_username}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.created_at)}</span>
            </div>
            {post.updated_at !== post.created_at && (
              <div className="flex items-center space-x-2">
                <span>Updated: {formatDate(post.updated_at)}</span>
              </div>
            )}
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Post Content */}
          <div
            className={`[&_*]:mb-2 ${
              headings.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'
            }`}
          >
            <div className="prose prose-lg max-w-none dark:prose-invert [&_p]:leading-relaxed [&_li]:leading-relaxed [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-relaxed [&_h1]:scroll-mt-20 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-relaxed [&_h2]:scroll-mt-20 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-relaxed [&_h3]:scroll-mt-20 [&_h4]:text-lg [&_h4]:font-medium [&_h4]:leading-relaxed [&_h4]:scroll-mt-20 [&_h5]:text-base [&_h5]:font-medium [&_h5]:leading-relaxed [&_h5]:scroll-mt-20 [&_h6]:text-sm [&_h6]:font-medium [&_h6]:leading-relaxed [&_h6]:scroll-mt-20 [&_ol]:list-decimal [&_ol]:list-inside [&_ul]:list-disc [&_ul]:list-inside">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => {
                    const text = String(children);
                    const id = generateId(text);
                    return (
                      <h2 id={id}>
                        <a
                          href={`#${id}`}
                          className="!text-primary flex flex-row items-center gap-2 group"
                        >
                          {children}
                          <Link className="opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer" />
                        </a>
                      </h2>
                    );
                  },
                  h3: ({ children }) => {
                    const text = String(children);
                    const id = generateId(text);
                    return (
                      <h3 id={id}>
                        <a
                          href={`#${id}`}
                          className="!text-primary flex flex-row items-center gap-2 group"
                        >
                          {children}
                          <Link className="opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer" />
                        </a>
                      </h3>
                    );
                  },
                  h4: ({ children }) => {
                    console.log(children);
                    const text = String(children);
                    const id = generateId(text);
                    return (
                      <h4 id={id}>
                        <a
                          href={`#${id}`}
                          className="!text-primary flex flex-row items-center gap-2 group"
                        >
                          {children}
                          <Link className="opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer" />
                        </a>
                      </h4>
                    );
                  },
                  h5: ({ children }) => {
                    const text = String(children);
                    const id = generateId(text);
                    return (
                      <h5 id={id}>
                        <a
                          href={`#${id}`}
                          className="!text-primary flex flex-row items-center gap-2 group"
                        >
                          {children}
                          <Link className="opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer" />
                        </a>
                      </h5>
                    );
                  },
                  h6: ({ children }) => {
                    const text = String(children);
                    const id = generateId(text);
                    return (
                      <h6 id={id}>
                        <a
                          href={`#${id}`}
                          className="!text-primary flex flex-row items-center gap-2 group"
                        >
                          {children}
                          <Link className="opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer " />
                        </a>
                      </h6>
                    );
                  },
                  code: ({ children, ...props }) => {
                    const match = String(children).match(/\n/);
                    const isInline = !match;

                    if (isInline) {
                      return (
                        <code
                          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <CodeBlock>
                        {String(children).replace(/\n$/, '')}
                      </CodeBlock>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Table of Contents - Right Side */}
          {headings.length > 0 && (
            <div className="lg:col-span-1 mb-8 lg:mb-0">
              <TableOfContents headings={headings} />
            </div>
          )}
        </div>

        <footer className="mt-12 pt-8 border-t">
          <div className="text-center text-muted-foreground">
            <p>
              Written by <strong>{post.author_username}</strong>
            </p>
            <p className="text-sm mt-2">
              Published on {formatDate(post.created_at)}
              {post.updated_at !== post.created_at && (
                <span> • Last updated on {formatDate(post.updated_at)}</span>
              )}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}

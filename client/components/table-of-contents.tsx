'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -35% 0%',
        threshold: 0,
      },
    );

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const headingElements = headings
        .map((heading) => document.getElementById(heading.id))
        .filter(Boolean);

      console.log(
        'TableOfContents: Found heading elements:',
        headingElements.length,
      );
      headingElements.forEach((element, index) => {
        console.log(
          `Heading ${index + 1}: ${element?.tagName} - ID: ${element?.id}`,
        );
      });

      headingElements.forEach((element) => {
        if (element) observer.observe(element);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      const headingElements = headings
        .map((heading) => document.getElementById(heading.id))
        .filter(Boolean);

      headingElements.forEach((element) => {
        if (element) observer.unobserve(element);
      });
    };
  }, [headings]);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show button when user scrolls down more than 300px
      setShowScrollTop(scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    headingId: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      // Update URL hash
      window.history.pushState(null, '', `#${headingId}`);
    } else {
      console.warn(`Element with ID "${headingId}" not found`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (headings.length === 0) return null;

  return (
    <div className="sticky top-25">
      <p className="py-4 font-bold">On this page</p>
      <Card className={`bottom-4 ${cn('border-hidden shadow-none')}`}>
        <CardContent className={`${cn('py-0 pb-2')}`}>
          <ScrollArea className="h-[calc(100vh-400px)]">
            <nav className="space-y-2">
              {headings.map((heading, index) => (
                <a
                  key={index}
                  href={`#${heading.id}`}
                  onClick={(e) => handleClick(e, heading.id)}
                  className={`block text-sm hover:text-primary transition-colors cursor-pointer ${
                    heading.level === 1
                      ? ''
                      : heading.level === 2
                      ? 'pl-2'
                      : heading.level === 3
                      ? 'pl-4'
                      : heading.level === 4
                      ? 'pl-6'
                      : heading.level === 5
                      ? 'pl-8'
                      : 'pl-10'
                  } ${heading.level > 2 ? 'text-muted-foreground' : ''} ${
                    activeId === heading.id ? 'text-primary font-semibold' : ''
                  }`}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </ScrollArea>
        </CardContent>
      </Card>
      {showScrollTop && (
        <>
          <hr className="mb-4" />
          <p
            onClick={scrollToTop}
            className="cursor-pointer text-sm text-muted-foreground hover:text-primary"
          >
            Scroll to top ↑
          </p>
        </>
      )}
    </div>
  );
}

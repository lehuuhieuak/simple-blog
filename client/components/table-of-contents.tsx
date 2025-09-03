'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

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

      console.log('TableOfContents: Found heading elements:', headingElements.length);
      headingElements.forEach((element, index) => {
        console.log(`Heading ${index + 1}: ${element?.tagName} - ID: ${element?.id}`);
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

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, headingId: string) => {
    e.preventDefault();
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      // Update URL hash
      window.history.pushState(null, '', `#${headingId}`);
    } else {
      console.warn(`Element with ID "${headingId}" not found`);
    }
  };

  if (headings.length === 0) return null;

  return (
    <Card className="sticky top-4">
      <CardContent className="pt-6">
        <nav className="space-y-2">
          {headings.map((heading, index) => (
            <a
              key={index}
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={`block text-sm hover:text-primary transition-colors cursor-pointer ${
                heading.level === 1 ? '' :
                heading.level === 2 ? 'pl-2' :
                heading.level === 3 ? 'pl-4' :
                heading.level === 4 ? 'pl-6' :
                heading.level === 5 ? 'pl-8' :
                'pl-10'
              } ${
                heading.level > 2 ? 'text-muted-foreground' : ''
              } ${
                activeId === heading.id ? 'text-primary font-semibold' : ''
              }`}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}

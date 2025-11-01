'use client';

import { PostDetail } from '@/components/post-detail';
import { useParams } from 'next/navigation';

export default function ClientPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  return <PostDetail slug={slug} />;
}
'use client';

import { useTitleAnimation } from '@/lib/ui/useTitleAnimation';

interface StackedTitleProps {
  readonly text: string;
  readonly className?: string;
}

export default function StackedTitle({ text, className = '' }: StackedTitleProps) {
  const titleRef = useTitleAnimation(text);

  return (
    <h1 
      ref={titleRef}
      className={className}
      style={{
        animation: 'pulse-glow 8s ease-in-out infinite',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {text}
    </h1>
  );
}

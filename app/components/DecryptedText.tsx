'use client';

import { useTextScramble } from '@/lib/ui/hooks';

interface DecryptedTextProps {
  readonly text: string;
  readonly speed?: number;
  readonly maxIterations?: number;
  readonly className?: string;
  readonly encryptedClassName?: string;
  readonly animateOn?: 'view' | 'hover';
  readonly delay?: number;
}

export default function DecryptedText({
  text,
  speed = 30,
  maxIterations = 15,
  className = '',
  encryptedClassName = 'text-blue-400 opacity-70',
  animateOn = 'view',
  delay = 0,
}: DecryptedTextProps) {
  const { displayText, scramble } = useTextScramble(text, {
    speed,
    maxIterations,
    animateOn,
    delay,
  });

  return (
    <span
      className={`inline-block ${className}`}
      onMouseEnter={() => animateOn === 'hover' && scramble()}
    >
      {displayText.split('').map((char, i) => (
        <span
          key={i}
          className={char === text[i] ? undefined : encryptedClassName}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

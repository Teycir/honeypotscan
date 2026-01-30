'use client';

import TextPressure from './TextPressure';
import DecryptedText from './DecryptedText';

interface StackedTitleProps {
  readonly text: string;
  readonly className?: string;
}

export default function StackedTitle({ text, className = '' }: StackedTitleProps) {
  return (
    <div className={className} style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', animation: 'pulse-glow 8s ease-in-out infinite' }}>
        <TextPressure
          text={text}
          flex={true}
          alpha={false}
          width={false}
          weight={true}
          italic={false}
          textColor="currentColor"
          minFontSize={48}
          className="text-white"
        />
      </div>
      <div style={{ position: 'relative', opacity: 0 }}>
        <DecryptedText 
          text={text}
          speed={30}
          maxIterations={20}
          className="font-bold"
          delay={100}
        />
      </div>
    </div>
  );
}

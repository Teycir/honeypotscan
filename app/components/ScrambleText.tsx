'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ScrambleTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  animateOnLoad?: boolean;
}

export function ScrambleText({
  text,
  speed = 50,
  maxIterations = 10,
  className = '',
  animateOnLoad = true,
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAnimatedRef = useRef(false);

  const scramble = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()';
    let iteration = 0;

    intervalRef.current = setInterval(() => {
      const result = text
        .split('')
        .map((char) => {
          if (char === ' ') return ' ';
          if (iteration >= maxIterations) return char;
          if (Math.random() < 0.1 * iteration) return char;
          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join('');

      setDisplayText(result);

      if (iteration >= maxIterations) {
        setDisplayText(text);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }

      iteration++;
    }, speed);
  }, [text, speed, maxIterations]);

  useEffect(() => {
    if (animateOnLoad && !hasAnimatedRef.current) {
      const timer = setTimeout(() => {
        scramble();
        hasAnimatedRef.current = true;
      }, 100);
      
      return () => {
        clearTimeout(timer);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [animateOnLoad, scramble]);

  return <span className={className}>{displayText}</span>;
}

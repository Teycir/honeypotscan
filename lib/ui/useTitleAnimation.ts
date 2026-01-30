import { useEffect, useRef } from 'react';

export function useTitleAnimation(text: string) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const titleEl = titleRef.current;
    if (!titleEl) return;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    function scrambleText() {
      if (!titleEl) return;
      let iteration = 0;
      const maxIterations = 20;
      const interval = setInterval(() => {
        titleEl.textContent = text.split('').map((char) => {
          if (char === ' ') return ' ';
          if (iteration >= maxIterations) return char;
          if (Math.random() < 0.1 * iteration) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        
        if (iteration >= maxIterations) {
          titleEl.textContent = text;
          clearInterval(interval);
          wrapChars();
        }
        iteration++;
      }, 30);
    }

    function wrapChars() {
      if (!titleEl) return;
      titleEl.innerHTML = text.split('').map(char => 
        `<span class="title-char" style="display: inline-block; transition: all 0.1s ease-out;">${char === ' ' ? '&nbsp;' : char}</span>`
      ).join('');
      
      const charSpans = titleEl.querySelectorAll('.title-char');
      charSpans.forEach(span => {
        span.addEventListener('mouseenter', () => {
          (span as HTMLElement).style.fontWeight = '900';
          (span as HTMLElement).style.textShadow = '0 0 20px rgba(255, 255, 255, 1)';
        });
        span.addEventListener('mouseleave', () => {
          (span as HTMLElement).style.fontWeight = '700';
          (span as HTMLElement).style.textShadow = '';
        });
      });
    }

    setTimeout(scrambleText, 100);
  }, [text]);

  return titleRef;
}

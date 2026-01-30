import { useEffect, useRef, useCallback } from 'react';

export function useTitleAnimation(text: string) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersRef = useRef<Array<{ element: Element; type: string; handler: EventListener }>>([]);

  const cleanup = useCallback(() => {
    // Clear any running intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Remove all event listeners
    listenersRef.current.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    listenersRef.current = [];
  }, []);

  useEffect(() => {
    const titleEl = titleRef.current;
    if (!titleEl) return;

    // Cleanup any previous animation state
    cleanup();

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    function wrapChars() {
      if (!titleEl) return;
      titleEl.innerHTML = text.split('').map(char => 
        `<span class="title-char" style="display: inline-block; transition: all 0.1s ease-out;">${char === ' ' ? '&nbsp;' : char}</span>`
      ).join('');
      
      const charSpans = titleEl.querySelectorAll('.title-char');
      charSpans.forEach(span => {
        const handleMouseEnter = () => {
          (span as HTMLElement).style.fontWeight = '900';
          (span as HTMLElement).style.textShadow = '0 0 20px rgba(255, 255, 255, 1)';
        };
        const handleMouseLeave = () => {
          (span as HTMLElement).style.fontWeight = '700';
          (span as HTMLElement).style.textShadow = '';
        };
        
        span.addEventListener('mouseenter', handleMouseEnter);
        span.addEventListener('mouseleave', handleMouseLeave);
        
        // Store listeners for cleanup
        listenersRef.current.push(
          { element: span, type: 'mouseenter', handler: handleMouseEnter },
          { element: span, type: 'mouseleave', handler: handleMouseLeave }
        );
      });
    }

    function scrambleText() {
      if (!titleEl) return;
      let iteration = 0;
      const maxIterations = 20;
      
      intervalRef.current = setInterval(() => {
        titleEl.textContent = text.split('').map((char) => {
          if (char === ' ') return ' ';
          if (iteration >= maxIterations) return char;
          if (Math.random() < 0.1 * iteration) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        
        if (iteration >= maxIterations) {
          titleEl.textContent = text;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          wrapChars();
        }
        iteration++;
      }, 30);
    }

    timeoutRef.current = setTimeout(scrambleText, 100);

    return cleanup;
  }, [text, cleanup]);

  return titleRef;
}

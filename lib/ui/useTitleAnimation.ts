import { useEffect, useRef, useCallback, useState } from 'react';

export function useTitleAnimation(text: string) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersRef = useRef<Array<{ element: Element; type: string; handler: EventListener }>>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Clean up event listeners from stored references
  const cleanupListeners = useCallback(() => {
    listenersRef.current.forEach(({ element, type, handler }) => {
      try {
        element.removeEventListener(type, handler);
      } catch {
        // Element may already be destroyed, ignore
      }
    });
    listenersRef.current = [];
  }, []);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    cleanupListeners();
  }, [cleanupListeners]);

  // Wait for hydration to complete before manipulating DOM
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Don't run until after hydration is complete
    if (!isMounted) return;
    
    const titleEl = titleRef.current;
    if (!titleEl) return;

    cleanup();

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    function wrapChars() {
      if (!titleEl) return;
      
      // Clean up any existing listeners before creating new elements
      cleanupListeners();
      
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
        
        listenersRef.current.push(
          { element: span, type: 'mouseenter', handler: handleMouseEnter },
          { element: span, type: 'mouseleave', handler: handleMouseLeave }
        );
      });
    }

    function scrambleText() {
      if (!titleEl) return;
      
      // IMPORTANT: Clean up listeners before scramble animation starts
      // The scramble animation uses textContent which destroys all child nodes
      // Any existing event listeners would reference destroyed DOM nodes (memory leak)
      cleanupListeners();
      
      let iteration = 0;
      const maxIterations = 20;
      
      intervalRef.current = setInterval(() => {
        // Using textContent here destroys all HTML structure
        // This is intentional for the scramble effect, but we must ensure
        // no event listeners are attached to child elements during this phase
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
          // Only attach event listeners AFTER scramble animation completes
          wrapChars();
        }
        iteration++;
      }, 30);
    }

    timeoutRef.current = setTimeout(scrambleText, 500);

    return cleanup;
  }, [text, cleanup, cleanupListeners, isMounted]);

  return titleRef;
}

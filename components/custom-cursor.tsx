"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  
  // Keep track of target mouse position
  const mouse = useRef({ x: 0, y: 0 });
  // Keep track of current ring position for lerping
  const ring = useRef({ x: 0, y: 0 });

  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if device supports a fine pointer (mouse)
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }
    
    setIsVisible(true);
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      
      // Instant update for dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const render = () => {
      // Lerp ring towards mouse (smooth trailing effect)
      ring.current.x += (mouse.current.x - ring.current.x) * 0.2;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.2;
      
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0)`;
      }
      
      rafId = requestAnimationFrame(render);
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      let isClickable = false;
      let curr: HTMLElement | null = target;
      
      // Look up the tree to determine if we are hovering a clickable element
      while (curr && curr !== document.body) {
        const style = window.getComputedStyle(curr);
        if (
          style.cursor === "pointer" ||
          curr.tagName.toLowerCase() === "a" ||
          curr.tagName.toLowerCase() === "button"
        ) {
          isClickable = true;
          break;
        }
        curr = curr.parentElement;
      }
      setIsPointer(isClickable);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onMouseOver);
    
    // Initialize ring at mouse position if possible
    // (It will jump there on first move anyway)
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        body, body *:not(input):not(textarea):not(select) {
          cursor: none !important;
        }
      `}</style>

      {/* Ring Container */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      >
        {/* Ring Inner */}
        <div 
          className={`-ml-4 -mt-4 h-8 w-8 rounded-full border transition-all duration-300 ease-out ${
            isPointer 
              ? "scale-[1.5] bg-foreground/10 border-transparent" 
              : "scale-100 border-foreground/30 bg-transparent"
          }`} 
        />
      </div>

      {/* Dot Container */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[10000] will-change-transform"
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      >
        {/* Dot Inner */}
        <div 
          className={`-ml-1 -mt-1 h-2 w-2 rounded-full bg-foreground transition-all duration-150 ${
            isPointer ? "opacity-0 scale-0" : "opacity-100 scale-100"
          }`} 
        />
      </div>
    </>
  );
}

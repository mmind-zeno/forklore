"use client";

import { useEffect } from "react";

export function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px 60px 0px" }
    );

    const observe = (el: Element) => {
      if (!el.classList.contains("visible")) io.observe(el);
    };

    document.querySelectorAll(".reveal").forEach(observe);

    // Pick up elements added by client-side navigation / React re-renders
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.classList.contains("reveal")) observe(node);
          node.querySelectorAll(".reveal").forEach(observe);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return <>{children}</>;
}

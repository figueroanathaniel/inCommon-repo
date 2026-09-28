import { useEffect, useRef } from "react";
import { useCallbackRef } from "./useCallbackRef";

export interface ScrollRevealOptions {
  threshold?: number | number[];
  rootMargin?: string;
}
/**
 * useScrollReveal — Scroll-triggered reveal hook
 *
 * Returns a callback ref. Attach it DIRECTLY to the element that has the
 * "reveal" CSS class (the one with `opacity: 0`). When that element enters
 * the viewport, `data-revealed="true"` is set ON THAT SAME element, which
 * activates the visible CSS rule. You should style the element with the data-revealed
 * to trigger the reveal animation. You should not use inline styles.
 *
 * If you want to animate multiple children independently, create a separate
 * useScrollReveal() call for each one and attach each ref to its own element.
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Set<HTMLElement>>(new Set());
  const mutationObserversRef = useRef<Map<Element, MutationObserver>>(
    new Map(),
  );
  const optionsRef = useRef(options);

  // Keep options up to date without recreating the observer unnecessarily
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const getObserver = () => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.setAttribute("data-revealed", "true");

              const revealChildren = (el: Element) => {
                Array.from(el.children).forEach((child) => {
                  if (child.getAttribute("data-revealed") !== "true") {
                    child.setAttribute("data-revealed", "true");
                  }
                  revealChildren(child);
                });
              };

              revealChildren(entry.target);

              if (!mutationObserversRef.current.has(entry.target)) {
                const mo = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.type === "childList") {
                      mutation.addedNodes.forEach((node) => {
                        if (node instanceof Element) {
                          if (node.getAttribute("data-revealed") !== "true") {
                            node.setAttribute("data-revealed", "true");
                          }
                          revealChildren(node);
                        }
                      });
                    }
                  });
                });
                mo.observe(entry.target, { childList: true, subtree: true });
                mutationObserversRef.current.set(entry.target, mo);
              }

              observerRef.current?.unobserve(entry.target);
              if (entry.target instanceof HTMLElement) {
                observedElementsRef.current.delete(entry.target);
              }
            }
          });
        },
        {
          threshold: optionsRef.current.threshold ?? 0.15,
          rootMargin: optionsRef.current.rootMargin ?? "0px 0px -40px 0px",
        },
      );
    }
    return observerRef.current;
  };

  useEffect(() => {
    return () => {
      // Disconnect observer on unmount and clear tracking set
      observerRef.current?.disconnect();
      observedElementsRef.current.clear();
      mutationObserversRef.current.forEach((mo) => mo.disconnect());
      mutationObserversRef.current.clear();
    };
  }, []);

  const observe = useCallbackRef((element: HTMLElement | null) => {
    if (!element) return;

    // Safety check for environments without IntersectionObserver
    if (typeof IntersectionObserver === "undefined") {
      element.setAttribute("data-revealed", "true");
      return;
    }

    // Check for prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        element.setAttribute("data-revealed", "true");
        return;
      }
    }

    // Only observe if we haven't already and it hasn't been revealed
    if (
      !observedElementsRef.current.has(element) &&
      element.getAttribute("data-revealed") !== "true"
    ) {
      getObserver().observe(element);
      observedElementsRef.current.add(element);
    }
  });

  return observe;
}

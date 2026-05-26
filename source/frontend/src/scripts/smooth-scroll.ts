import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Same breakpoint as Reunions `isMobile()` — use native scroll to avoid Lenis fighting touch-driven slide progress. */
const MOBILE_MEDIA = "(max-width: 1023px)";

function dispatchScrollToComplete(id: string) {
  window.dispatchEvent(
    new CustomEvent("lenis:scrollToComplete", { detail: { id } }),
  );
}

function dispatchScrollToStart(id: string) {
  window.dispatchEvent(
    new CustomEvent("lenis:scrollToStart", { detail: { id } }),
  );
}

/** Native `scrollIntoView({ behavior: 'smooth' })` has no onComplete; use scrollend + timeout fallback. */
function afterApproxSmoothScroll(onDone: () => void) {
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    onDone();
  };
  window.addEventListener("scrollend", done, { once: true, passive: true });
  window.setTimeout(done, 1100);
}

function handleInPageAnchorClick(e: MouseEvent, scrollSmooth: (el: HTMLElement) => void) {
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
  if (!link || link.target === "_blank" || link.hasAttribute("data-no-lenis")) return;

  const href = link.getAttribute("href") ?? "";
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return;

  const hash = href.slice(hashIndex);
  const pathname = (href.slice(0, hashIndex || undefined) || "").replace(/\/$/, "") || "";
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  const isSamePage = !pathname || pathname === currentPath || pathname === "";

  if (isSamePage && hash.length > 1) {
    const id = hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      scrollSmooth(target);
      if (window.history.replaceState) {
        window.history.replaceState(null, "", hash);
      }
    }
  }
}

/** Mobile: no Lenis — ScrollTrigger follows native scroll; `window.lenis` stays undefined. */
function initNativeScrollForMobile() {
  const onScroll = () => {
    ScrollTrigger.update();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  requestAnimationFrame(() => ScrollTrigger.refresh());

  document.addEventListener("click", (e) => {
    handleInPageAnchorClick(e, (target) => {
      const id = target.id;
      dispatchScrollToStart(id);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      afterApproxSmoothScroll(() => dispatchScrollToComplete(id));
    });
  });

  if (window.location.hash) {
    const id = window.location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      requestAnimationFrame(() => {
        dispatchScrollToStart(id);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        afterApproxSmoothScroll(() => dispatchScrollToComplete(id));
      });
    }
  }
}

function initLenisDesktop() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  // Storystream injects `.stry-popup` without `data-lenis-prevent` (unlike SubmitModal).
  // Lenis respects that attribute so wheel events can scroll the popup content.
  function tagStorystreamPopupsForLenis() {
    for (const el of document.querySelectorAll<HTMLElement>(
      ".stry-popup, [class*='stry-popup']",
    )) {
      if (!el.hasAttribute("data-lenis-prevent")) {
        el.setAttribute("data-lenis-prevent", "");
      }
    }
  }
  tagStorystreamPopupsForLenis();
  const storystreamPopupObserver = new MutationObserver(tagStorystreamPopupsForLenis);
  storystreamPopupObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  document.addEventListener("click", (e) => {
    handleInPageAnchorClick(e, (target) => {
      dispatchScrollToStart(target.id);
      lenis.scrollTo(target, {
        offset: 0,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        onComplete: () => {
          dispatchScrollToComplete(target.id);
        },
      });
    });
  });

  if (window.location.hash) {
    const id = window.location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      requestAnimationFrame(() => {
        dispatchScrollToStart(id);
        lenis.scrollTo(target, {
          offset: 0,
          duration: 1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          onComplete: () => {
            dispatchScrollToComplete(id);
          },
        });
      });
    }
  }

  (window as unknown as Record<string, unknown>).lenis = lenis;
  return lenis;
}

function initSmoothScroll() {
  const mobile = window.matchMedia(MOBILE_MEDIA).matches;
  if (mobile) {
    initNativeScrollForMobile();
    return;
  }
  initLenisDesktop();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initSmoothScroll());
} else {
  initSmoothScroll();
}

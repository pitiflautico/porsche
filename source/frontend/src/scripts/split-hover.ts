// ============================================
// SPLIT-HOVER
//
// Splits [data-split-hover] elements for cascade-swap hover animation.
//
// Modes (attribute value):
//   data-split-hover           → split by character (default)
//   data-split-hover="words"    → split by word
//
// Usage (HTML):
//   <a href="..." data-split-hover>My Link</a>
//   <a href="..." data-split-hover="words">Two Words</a>
//
// Custom hover color (optional):
//   <a href="..." data-split-hover style="--split-hover-color: #e8a623">Link</a>
// ============================================

function createUnit(content: string, index: number): HTMLSpanElement {
  const wrapper = document.createElement("span");
  wrapper.className = "split-char";
  wrapper.style.setProperty("--i", String(index));
  wrapper.setAttribute("aria-hidden", "true");

  const top = document.createElement("span");
  top.className = "split-char__top";
  top.textContent = content;

  const bottom = document.createElement("span");
  bottom.className = "split-char__bottom";
  bottom.textContent = content;

  wrapper.append(top, bottom);
  return wrapper;
}

export function initSplitHover(scope: HTMLElement | Document = document): void {
  scope
    .querySelectorAll<HTMLElement>("[data-split-hover]")
    .forEach((el) => {
      if (el.dataset.splitReady) return;

      const text = el.textContent?.trim() ?? "";
      el.setAttribute("aria-label", text);
      el.textContent = "";

      const mode = (el.getAttribute("data-split-hover") ?? "").toLowerCase();

      if (mode === "words") {
        const words = text.split(/\s+/).filter(Boolean);
        words.forEach((word, i) => {
          el.appendChild(createUnit(word, i));
          if (i < words.length - 1) {
            el.appendChild(document.createTextNode("\u00A0"));
          }
        });
      } else {
        [...text].forEach((char, i) => {
          el.appendChild(
            createUnit(char === " " ? "\u00A0" : char, i)
          );
        });
      }

      el.dataset.splitReady = "1";
    });
}

initSplitHover();

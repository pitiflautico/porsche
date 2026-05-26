import gsap from 'gsap';
import { SplitText } from 'gsap/all';

/**
 * Creates and animates split text with fade-in and slide-up effect
 * @param {Object} options - Animation options
 * @param {string} [options.titleSelector] - CSS selector for title element (optional)
 * @param {string} [options.descSelector] - CSS selector for description element
 * @param {number} [options.titleDelay=1] - Delay before title animation starts
 * @param {number} [options.descDelay=1.3] - Delay before description animation starts
 * @param {Function} [options.onComplete] - Optional callback function when animation completes
 * @returns {Object} - Object with timeline and reset function
 */

export function createTextAnimation(options) {
  const {
    titleSelector = null,
    descSelector = null,
    titleDelay = 1,
    descDelay = 1.3,
    onComplete = null,
  } = options;

  let titleSplit;
  let descSplit;
  let tl = null;

  const elementsToShow = [titleSelector, descSelector].filter(Boolean);
  if (elementsToShow.length === 0) return { play: () => Promise.resolve(gsap.timeline()), reset: () => {} };

  function setInitialState() {
    gsap.set(elementsToShow, { autoAlpha: 0 });
  }

  setInitialState();

  function createSplits() {
    try {
      if (titleSelector) {
        titleSplit = new SplitText(titleSelector, { type: 'words, chars, lines' });
      }
      if (descSelector) {
        descSplit = new SplitText(descSelector, { type: 'words, lines' });
      }
      return titleSplit || descSplit;
    } catch (error) {
      console.error('Error creating SplitText:', error);
      return false;
    }
  }

  function reset() {
    if (titleSplit) {
      gsap.set(titleSplit.chars, { autoAlpha: 0, y: 30 });
      gsap.set(titleSplit.lines, { overflow: 'hidden' });
    }
    if (descSplit) {
      gsap.set(descSplit.words, { autoAlpha: 0, y: 20 });
      gsap.set(descSplit.lines, { overflow: 'hidden' });
    }
  }

  function animate() {
    tl = gsap.timeline({
      onComplete: () => {
        if (titleSplit) {
          titleSplit.revert();
          titleSplit = null;
        }
        if (descSplit) {
          descSplit.revert();
          descSplit = null;
        }
        if (onComplete) onComplete();
      },
    });

    tl.set(elementsToShow, { autoAlpha: 1 }, 0);

    if (titleSplit) {
      tl.to(
        titleSplit.chars,
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.02,
          duration: 0.9,
          ease: 'power2.out',
          overwrite: 'auto',
        },
        titleDelay
      );
    }

    if (descSplit) {
      tl.to(
        descSplit.words,
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.03,
          duration: 0.9,
          ease: 'power2.out',
          overwrite: 'auto',
        },
        titleSplit ? descDelay : 0
      );
    }

    return tl;
  }

  function play() {
    if (tl) tl.kill();

    // Wait for fonts to load before creating splits
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready.then(() => {
        // Pequeño delay adicional para asegurar renderizado
        return new Promise(resolve => {
          setTimeout(() => {
            if (!createSplits()) {
              resolve(gsap.timeline());
              return;
            }
            reset();
            resolve(animate());
          }, 50);
        });
      });
    } else {
      // Fallback: esperar tiempo razonable para que las fuentes carguen
      return new Promise(resolve => {
        setTimeout(() => {
          if (!createSplits()) {
            resolve(gsap.timeline());
            return;
          }
          reset();
          resolve(animate());
        }, 300);
      });
    }
  }

  return {
    play,
    reset: () => {
      if (tl) tl.kill();
      if (titleSplit) titleSplit.revert();
      if (descSplit) descSplit.revert();
    },
  };
}
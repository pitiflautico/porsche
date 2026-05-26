import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';

gsap.registerPlugin(ScrollTrigger);

/**
 * Utility to create parallax animations with GSAP
 * @param {string} sectionId - ID of the section (e.g: 'contacto', 'faq', 'footer')
 * @param {string} backgroundClass - Class of the background element (e.g: '.contacto-bg', '.faq-bg', '.footer-bg')
 * @param {number} movement - Intensity of the movement in percentage (e.g: 15, 20, 10)
 * @param {string} type - Type of parallax: 'yPercent' (default) or 'backgroundPositionY'
 * @param {number} [opacity] - Final opacity value for overlay fade (e.g: 0.7). If not provided, no overlay is created.
 */
export function createParallaxAnimation(sectionId, backgroundClass, movement = 15, type = 'yPercent', opacity = null) {
  const sectionElement = document.querySelector(`#${sectionId}`);
  const backgroundElement = document.querySelector(backgroundClass);

  if (!sectionElement || !backgroundElement) {
    console.warn(`Parallax: Section #${sectionId} or element ${backgroundClass} not found`);
    return;
  }

  // Build parallax animation properties
  const fromProps = {};
  const toProps = {};

  if (type === 'backgroundPositionY') {
    fromProps.backgroundPositionY = -movement;
    toProps.backgroundPositionY = movement;
    toProps.ease = 'power1.inOut';
  } else {
    fromProps.yPercent = -movement;
    toProps.yPercent = movement;
    toProps.ease = 'linear';
  }

  // Create parallax animation
  const scrollTriggerConfig = {
    trigger: sectionElement,
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  };

  gsap.fromTo(
    backgroundElement,
    fromProps,
    {
      ...toProps,
      scrollTrigger: scrollTriggerConfig
    }
  );

  // Create overlay for opacity fade (only if opacity value is provided)
  if (opacity !== null && typeof opacity === 'number') {
    // Check if overlay already exists
    let overlayElement = backgroundElement.querySelector('.parallax-overlay');
    
    if (!overlayElement) {
      // Create overlay div
      overlayElement = document.createElement('div');
      overlayElement.className = 'parallax-overlay';
      overlayElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 1);
        z-index: 3;
        pointer-events: none;
        opacity: 0;
      `;
      
      // Ensure parent has position relative
      const computedStyle = window.getComputedStyle(backgroundElement);
      if (computedStyle.position === 'static') {
        backgroundElement.style.position = 'relative';
      }
      
      backgroundElement.appendChild(overlayElement);
    }

    // Animate overlay opacity using IntersectionObserver
    // Observer stays active - no need to unobserve since user can enter/leave multiple times
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rect = entry.boundingClientRect;
          const isAboveViewport = rect.bottom < 0;
          const intersectionRatio = entry.intersectionRatio;
          
          // Element is visible (any part of it)
          if (entry.isIntersecting && intersectionRatio > 0.2) {
            // More than 20% visible - fade to transparent
            gsap.to(overlayElement, {
              opacity: 0,
              duration: 0.5,
              ease: 'power2.out'
            });
          } else if (!entry.isIntersecting && isAboveViewport) {
            // Element is above viewport (scrolled up past it) - fade to dark
            gsap.to(overlayElement, {
              opacity: opacity,
              duration: 0.5,
              ease: 'power2.out'
            });
          } else if (entry.isIntersecting && intersectionRatio <= 0.2) {
            // Less than 20% visible (80% out) - fade to dark
            gsap.to(overlayElement, {
              opacity: opacity,
              duration: 0.5,
              ease: 'power2.out'
            });
          }
        });
      },
      {
        threshold: [0, 0.2, 0.5, 1], // Multiple thresholds for better detection
        rootMargin: '0px'
      }
    );
    
    observer.observe(sectionElement);
    
    // Check initial state in case element is already visible/not visible on load
    requestAnimationFrame(() => {
      const rect = sectionElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isVisible = rect.top < viewportHeight && rect.bottom > 0;
      const isAbove = rect.bottom < 0;
      const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      const visibleRatio = visibleHeight / rect.height;
      
      if (isVisible && visibleRatio > 0.2) {
        overlayElement.style.opacity = '0';
      } else if (isAbove || (isVisible && visibleRatio <= 0.2)) {
        overlayElement.style.opacity = opacity.toString();
      }
    });
  }

  ScrollTrigger.refresh();
}

/**
 * Creates a parallax animation for individual elements (title, description, etc.)
 * Can be called multiple times per section for different elements
 * 
 * @param {string|HTMLElement} trigger - Section ID selector (e.g: 'videos', 'contacto') or HTMLElement that triggers the animation
 * @param {string|HTMLElement} target - Selector (e.g: '.section-title', '#stories-title') or HTMLElement to animate
 * @param {Object} [options] - Configuration options (all optional)
 * @param {number} [options.movement=50] - Intensity of the movement in pixels or percentage
 * @param {string} [options.direction='up'] - Direction of parallax: 'up' or 'down'
 * @param {string} [options.start='top bottom'] - ScrollTrigger start position
 * @param {string} [options.end='bottom top'] - ScrollTrigger end position
 * @param {string} [options.ease='power1.inOut'] - GSAP easing function
 * @param {boolean} [options.scrub=true] - Whether to scrub the animation
 * @param {string} [options.property='y'] - CSS property to animate: 'y', 'x', 'yPercent', 'xPercent', 'opacity', etc.
 * 
 * @example
 * // Animate title with default settings
 * createElementParallax('videos', '.section-title');
 * 
 * @example
 * // Animate description with custom movement
 * createElementParallax('videos', '#stories-description', { movement: 30, direction: 'down' });
 * 
 * @example
 * // Animate parent container
 * createElementParallax('videos', '.section-content', { movement: 20 });
 */
export function createElementParallax(trigger, target, options) {
  // Si options no se pasa, usar objeto vacío
  options = options || {};
  
  const {
    movement = 50,
    direction = 'up',
    start = 'top bottom',
    end = 'bottom top',
    ease = 'power1.inOut',
    scrub = true,
    property = 'y'
  } = options;

  // Get trigger element
  const triggerElement = typeof trigger === 'string' 
    ? document.querySelector(trigger.startsWith('#') ? trigger : `#${trigger}`)
    : trigger;

  // Get target element(s) - support both single and multiple elements
  const targetElements = typeof target === 'string'
    ? document.querySelectorAll(target) // Use querySelectorAll to get all matching elements
    : Array.isArray(target) ? target : [target];

  if (!triggerElement) {
    console.warn(`ElementParallax: Trigger element not found: ${trigger}`);
    return;
  }

  if (targetElements.length === 0) {
    console.warn(`ElementParallax: Target element(s) not found: ${target}`);
    return;
  }

  // Calculate movement values based on direction
  const isPercentage = typeof movement === 'string' && movement.includes('%');
  const movementValue = typeof movement === 'number' ? movement : parseFloat(movement);
  
  const startValue = direction === 'up' ? -movementValue : movementValue;
  const endValue = direction === 'up' ? movementValue : -movementValue;

  // Build the property object
  const fromProps = {};
  const toProps = {};

  // Handle different property types
  if (property === 'y' || property === 'x') {
    fromProps[property] = startValue;
    toProps[property] = endValue;
  } else if (property === 'yPercent' || property === 'xPercent') {
    fromProps[property] = startValue;
    toProps[property] = endValue;
  } else {
    // For other properties like opacity, rotation, etc.
    fromProps[property] = startValue;
    toProps[property] = endValue;
  }

  // Create animation for all target elements
  // GSAP accepts arrays/NodeLists, so we can pass all elements at once
  gsap.fromTo(
    Array.from(targetElements), // Convert NodeList to Array for GSAP
    fromProps,
    {
      ...toProps,
      ease: ease,
      scrollTrigger: {
        trigger: triggerElement,
        start: start,
        end: end,
        scrub: scrub,
      }
    }
  );

  ScrollTrigger.refresh();
  // console.log(`🎯 Element parallax created: ${target} in ${trigger}`);
}

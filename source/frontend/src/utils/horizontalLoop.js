import gsap from 'gsap';
import { Draggable, InertiaPlugin } from 'gsap/all';

gsap.registerPlugin(Draggable, InertiaPlugin);

/**
 * Creates a horizontal looping carousel with GSAP
 * @param {HTMLElement[]} items - Array of carousel items
 * @param {Object} config - Configuration options
 * @param {boolean} [config.paused=true] - Whether the timeline is paused
 * @param {boolean} [config.draggable=false] - Whether to enable drag functionality
 * @param {boolean|HTMLElement} [config.center=false] - Center the carousel
 * @param {Function} [config.onChange] - Callback when slide changes
 * @param {number} [config.repeat] - Number of repeats
 * @param {number} [config.speed=1] - Animation speed
 * @param {number|boolean} [config.snap=1] - Snap to slides
 * @param {string} [config.paddingRight] - Right padding
 * @param {boolean} [config.reversed=false] - Reverse direction
 * @returns {Object} - GSAP timeline with custom methods
 */

export function horizontalLoop(items, config) {
  items = gsap.utils.toArray(items);
  config = config || {};
  let tl = gsap.timeline();

  gsap.context(() => {
    const onChange = config.onChange;
    let lastIndex = 0;
    tl = gsap.timeline({
      repeat: config.repeat,
      onUpdate:
        onChange &&
        function () {
          let i = tl.closestIndex();
          if (lastIndex !== i) {
            lastIndex = i;
            onChange(items[i], i);
          }
        },
      paused: config.paused,
      defaults: { ease: 'none' },
      onReverseComplete: () => {
        tl.totalTime(tl.rawTime() + tl.duration() * 100);
      },
    });

    const length = items.length;
    const container = (
      config.center === true
        ? items[0].parentNode
        : (typeof config.center === 'boolean'
          ? null
          : gsap.utils.toArray(config.center || null)[0]) || items[0].parentNode
    );

    const containerRect = container.getBoundingClientRect();
    const startX = items[0].getBoundingClientRect().left - containerRect.left;

    const times = [];
    const widths = [];
    const spaceBefore = [];
    const xPercents = [];
    let curIndex = 0;
    let indexIsDirty = false;
    const center = config.center;
    const pixelsPerSecond = (config.speed || 1) * 100;

    let snapFunction;
    if (config.snap === false) {
      snapFunction = (v) => v;
    } else {
      const snapValue = typeof config.snap === 'number' ? config.snap : 1;
      snapFunction = gsap.utils.snap(snapValue);
    }
    const snap = snapFunction;

    let timeOffset = 0;
    let totalWidth;

    const getTotalWidth = () => {
      const lastItem = items[length - 1];
      const lastItemWidth = widths[length - 1];
      const lastItemXPercent = xPercents[length - 1];
      const scaleX = gsap.getProperty(lastItem, 'scaleX');
      const paddingRight = parseFloat(config.paddingRight || '0');
      return (
        lastItem.offsetLeft +
        (lastItemXPercent / 100) * lastItemWidth -
        startX +
        spaceBefore[0] +
        lastItem.offsetWidth * scaleX +
        paddingRight
      );
    };

    const populateWidths = () => {
      let b1 = container.getBoundingClientRect();
      items.forEach((el, i) => {
        widths[i] = parseFloat(gsap.getProperty(el, 'width', 'px'));
        xPercents[i] = snap(
          (parseFloat(gsap.getProperty(el, 'x', 'px')) / widths[i]) * 100 +
          (gsap.getProperty(el, 'xPercent') || 0)
        );
        const b2 = el.getBoundingClientRect();
        spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
        b1 = b2;
      });
      gsap.set(items, { xPercent: (i) => xPercents[i] });
      totalWidth = getTotalWidth();
    };

    let timeWrap;
    const populateOffsets = () => {
      timeOffset = center ? (tl.duration() * (container.offsetWidth / 2)) / totalWidth : 0;
      if (center) {
        times.forEach((t, i) => {
          times[i] = timeWrap(
            tl.labels['label' + i] +
            (tl.duration() * widths[i]) / 2 / totalWidth -
            timeOffset
          );
        });
      }
    };

    const getClosest = (values, value, wrap) => {
      let i = values.length;
      let closest = 1e10;
      let index = 0;
      let d;
      while (i--) {
        d = Math.abs(values[i] - value);
        if (d > wrap / 2) {
          d = wrap - d;
        }
        if (d < closest) {
          closest = d;
          index = i;
        }
      }
      return index;
    };

    const populateTimeline = () => {
      tl.clear();
      for (let i = 0; i < length; i++) {
        const item = items[i];
        const curX = (xPercents[i] / 100) * widths[i];
        const distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
        const scaleX = gsap.getProperty(item, 'scaleX') || 1;
        const distanceToLoop = distanceToStart + widths[i] * scaleX;
        tl.to(
          item,
          {
            xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
            duration: distanceToLoop / pixelsPerSecond,
          },
          0
        )
          .fromTo(
            item,
            {
              xPercent: snap(((curX - distanceToLoop + totalWidth) / widths[i]) * 100),
            },
            {
              xPercent: xPercents[i],
              duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
              immediateRender: false,
            },
            distanceToLoop / pixelsPerSecond
          )
          .add('label' + i, distanceToStart / pixelsPerSecond);
        times[i] = distanceToStart / pixelsPerSecond;
      }
      timeWrap = gsap.utils.wrap(0, tl.duration());
    };

    const refresh = (deep) => {
      const progress = tl.progress();
      tl.progress(0, true);
      populateWidths();
      deep && populateTimeline();
      populateOffsets();
      deep && tl.draggable ? tl.time(times[curIndex], true) : tl.progress(progress, true);
    };

    const onResize = () => refresh(true);
    let proxy;
    gsap.set(items, { x: 0 });
    populateWidths();
    populateTimeline();
    populateOffsets();
    window.addEventListener('resize', onResize);

    function toIndex(index, vars) {
      vars = vars || {};
      let currentTime = tl.time();

      // Determinar la dirección deseada antes de ajustar índices
      let rawDiff = index - curIndex;
      let wantsToMoveForward = rawDiff > 0 || (rawDiff === 0 && index >= curIndex);

      // Ajustar el índice para tomar la ruta más corta
      let diff = index - curIndex;
      if (Math.abs(diff) > length / 2) {
        index += diff > 0 ? -length : length;
      }

      let newIndex = gsap.utils.wrap(0, length, index);
      let time = times[newIndex];

      // Detectar si estamos haciendo wrap del último al primero o viceversa
      let isWrappingForward = (curIndex === length - 1 && newIndex === 0);
      let isWrappingBackward = (curIndex === 0 && newIndex === length - 1);

      // Determinar la dirección real del movimiento
      let isMovingForward = newIndex > curIndex || isWrappingForward;
      let isMovingBackward = newIndex < curIndex || isWrappingBackward;

      // Si estamos haciendo wrap, siempre usar el ciclo siguiente/anterior según la dirección
      if (isWrappingForward) {
        // Wrap del último al primero: avanzar al siguiente ciclo para mantener dirección visual
        // El tiempo del primer slide está al inicio, pero queremos continuar hacia adelante,
        // así que sumamos la duración completa. NO envolver manualmente, dejar que el modificador lo haga
        time = time + tl.duration();
        // El modificador de tiempo se aplicará más abajo para manejar el wrap durante la animación
      } else if (isWrappingBackward) {
        // Wrap del primero al último: retroceder al ciclo anterior para mantener dirección visual
        // El tiempo del último slide está al final, pero queremos continuar hacia atrás,
        // así que restamos la duración completa. NO envolver manualmente, dejar que el modificador lo haga
        time = time - tl.duration();
        // El modificador de tiempo se aplicará más abajo para manejar el wrap durante la animación
      } else {
        // Movimiento normal: verificar si necesitamos cambiar de ciclo
        if (isMovingForward) {
          // Avanzando: si el tiempo objetivo está antes del actual, ir al siguiente ciclo
          if (time < currentTime) {
            let distanceToNext = time + tl.duration() - currentTime;
            let distanceToCurrent = currentTime - time;
            // Solo cambiar de ciclo si es más cercano
            if (distanceToNext < distanceToCurrent) {
              time += tl.duration();
            }
          }
        } else if (isMovingBackward) {
          // Retrocediendo: si el tiempo objetivo está después del actual, ir al ciclo anterior
          if (time > currentTime) {
            let distanceToPrev = currentTime - (time - tl.duration());
            let distanceToCurrent = time - currentTime;
            // Solo cambiar de ciclo si es más cercano
            if (distanceToPrev < distanceToCurrent && time - tl.duration() >= 0) {
              time -= tl.duration();
            }
          }
        }
      }

      // Aplicar timeWrap si el tiempo está fuera del rango
      if (time < 0 || time > tl.duration()) {
        vars.modifiers = { time: timeWrap };
      }

      curIndex = newIndex;
      vars.overwrite = true;
      gsap.killTweensOf(proxy);
      return vars.duration === 0 ? tl.time(timeWrap(time)) : tl.tweenTo(time, vars);
    }

    tl.toIndex = (index, vars) => toIndex(index, vars);
    tl.closestIndex = (setCurrent) => {
      let index = getClosest(times, tl.time(), tl.duration());
      if (setCurrent) {
        curIndex = index;
        indexIsDirty = false;
      }
      return index;
    };
    tl.current = () => (indexIsDirty ? tl.closestIndex(true) : curIndex);
    tl.next = (vars) => tl.toIndex(tl.current() + 1, vars);
    tl.previous = (vars) => tl.toIndex(tl.current() - 1, vars);
    tl.times = times;
    tl.refresh = refresh;
    tl.progress(1, true).progress(0, true);

    if (config.reversed) {
      tl.vars.onReverseComplete?.();
      tl.reverse();
    }

    if (config.draggable && typeof Draggable === 'function') {
      proxy = document.createElement('div');
      const wrap = gsap.utils.wrap(0, 1);
      let ratio,
        startProgress,
        draggableInstance,
        lastSnap,
        initChangeX,
        wasPlaying;

      const align = () => {
        tl.progress(
          wrap(startProgress + (draggableInstance.startX - draggableInstance.x) * ratio)
        );
      };

      const syncIndex = () => tl.closestIndex(true);

      if (typeof InertiaPlugin === 'undefined') {
        console.warn(
          'InertiaPlugin required for momentum-based scrolling and snapping. https://greensock.com/club'
        );
      }

      draggableInstance = Draggable.create(proxy, {
        trigger: items[0].parentNode,
        type: 'x',
        dragResistance: 0.2,
        touchAction: 'none', // Prevenir zoom durante el drag
        onPressInit() {
          let x = this.x;
          gsap.killTweensOf(tl);
          wasPlaying = !tl.paused();
          tl.pause();
          startProgress = tl.progress();
          ratio = 1 / totalWidth;
          initChangeX = startProgress / -ratio - x;
          gsap.set(proxy, { x: startProgress / -ratio });
        },
        onDrag: align,
        onThrowUpdate: align,
        overshootTolerance: 0,
        inertia: true,
        snap(value) {
          if (Math.abs(startProgress / -ratio - this.x) < 10) {
            return lastSnap + initChangeX;
          }
          let time = -(value * ratio) * tl.duration();
          let wrappedTime = timeWrap(time);
          let currentSlideIndex = tl.current();
          const prevIndex = gsap.utils.wrap(0, length, currentSlideIndex - 1);
          const nextIndex = gsap.utils.wrap(0, length, currentSlideIndex + 1);
          const candidateTimes = [times[currentSlideIndex], times[prevIndex], times[nextIndex]];
          let snapTime = candidateTimes[getClosest(candidateTimes, wrappedTime, tl.duration())];
          let dif = snapTime - wrappedTime;
          if (Math.abs(dif) > tl.duration() / 2) {
            dif += dif < 0 ? tl.duration() : -tl.duration();
          }
          lastSnap = (time + dif) / tl.duration() / -ratio;
          return lastSnap;
        },
        onRelease() {
          syncIndex();
          this.isThrowing && (indexIsDirty = true);
        },
        onThrowComplete: () => {
          syncIndex();
          wasPlaying && tl.play();
        },
      })[0];
      tl.draggable = draggableInstance;
    }

    tl.closestIndex(true);
    lastIndex = curIndex;
    onChange && onChange(items[curIndex], curIndex);
    return () => window.removeEventListener('resize', onResize);
  });

  return tl;
}

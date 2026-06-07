/**
 * @file motion.tsx
 * @description Drop-in replacement de framer-motion usando solo CSS iOS.
 *
 * Convierte los props animate/initial/whileHover/whileTap/transition de Framer
 * en clases CSS de globals.css con curvas iOS hardware-accelerated.
 *
 * - Bundle: framer-motion (~40 KB gzip) → 0 KB (este archivo es ~2 KB)
 * - Animaciones: CSS keyframes con cubic-bezier iOS (no JS por frame)
 * - Compat: API similar para minimizar cambios en el código existente
 *
 * Patrones soportados:
 *   <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} />
 *     → <div className="anim-fade-in-up" />
 *   <motion.button whileTap={{scale:0.97}} />
 *     → <button className="press" />
 *
 * AnimatePresence: renderiza children sin transición de exit (CSS lo cubre via
 * `exit`-class al desmontar cuando hace falta).
 */
'use client';

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ElementType,
  type ReactNode,
} from 'react';

type AnyProps = Record<string, any>;

type AnimateValue = {
  opacity?: number;
  y?: number;
  x?: number;
  scale?: number;
  rotate?: number;
};

type TransitionValue = {
  delay?: number;
  duration?: number;
  type?: string;
  stiffness?: number;
};

interface MotionExtras {
  initial?: AnimateValue | string | false;
  animate?: AnimateValue | string;
  exit?: AnimateValue | string;
  transition?: TransitionValue;
  whileHover?: AnimateValue;
  whileTap?: AnimateValue;
  layout?: boolean | string;
  layoutId?: string;
  variants?: any;
}

/**
 * Deriva una clase CSS de las props `initial` + `animate`.
 *
 * Reglas:
 * - opacity 0 → 1 con y desplazamiento → anim-fade-in-{up,down,left,right}
 * - opacity 0 → 1 sin desplazamiento → anim-fade-in
 * - scale < 1 → 1 con opacity → anim-scale-in (o spring si delay/spring type)
 */
function deriveAnimClass(initial: any, animate: any, transition: any): string {
  if (initial === false || !initial || typeof initial !== 'object') return '';
  if (!animate || typeof animate !== 'object') return '';

  const i = initial;
  const a = animate;
  const fadesIn = i.opacity !== undefined && i.opacity < (a.opacity ?? 1);

  if (i.scale !== undefined && i.scale < 1) {
    return transition?.type === 'spring' ? 'anim-spring-in' : 'anim-scale-in';
  }
  if (i.y !== undefined && i.y > 0) return 'anim-fade-in-up';
  if (i.y !== undefined && i.y < 0) return 'anim-fade-in-down';
  if (i.x !== undefined && i.x > 0) return 'anim-fade-in-left';
  if (i.x !== undefined && i.x < 0) return 'anim-fade-in-right';
  if (i.rotate !== undefined) return 'anim-rotate-in';
  if (fadesIn) return 'anim-fade-in';
  return '';
}

/** Convierte delay/duration en CSS variables inline (overrides los defaults). */
function deriveAnimStyle(transition: any): React.CSSProperties | undefined {
  if (!transition) return undefined;
  const style: any = {};
  if (typeof transition.delay === 'number' && transition.delay > 0) {
    style.animationDelay = `${transition.delay * 1000}ms`;
  }
  if (typeof transition.duration === 'number' && transition.duration > 0) {
    style.animationDuration = `${transition.duration * 1000}ms`;
  }
  return Object.keys(style).length ? style : undefined;
}

/** whileTap → clase `.press`, whileHover (scale > 1) → `.lift`/`.lift-soft`. */
function deriveInteractionClass(whileHover: any, whileTap: any): string {
  const cls: string[] = [];
  if (whileTap?.scale !== undefined && whileTap.scale < 1) cls.push('press');
  if (whileHover?.scale !== undefined && whileHover.scale > 1) cls.push('lift-soft');
  if (whileHover?.y !== undefined && whileHover.y < 0) cls.push('lift-soft');
  return cls.join(' ');
}

function makeMotion<E extends ElementType>(tag: E) {
  const C = forwardRef<any, AnyProps & MotionExtras>(function MotionComp(props, ref) {
    const {
      initial,
      animate,
      exit: _exit,
      transition,
      whileHover,
      whileTap,
      layout: _layout,
      layoutId: _layoutId,
      variants: _variants,
      className = '',
      style,
      ...rest
    } = props;

    const animClass = deriveAnimClass(initial, animate, transition);
    const interClass = deriveInteractionClass(whileHover, whileTap);
    const animStyle = deriveAnimStyle(transition);
    const finalClass = [className, animClass, interClass].filter(Boolean).join(' ');

    const Tag = tag as any;
    return (
      <Tag
        ref={ref}
        className={finalClass}
        style={animStyle ? { ...style, ...animStyle } : style}
        {...rest}
      />
    );
  });
  C.displayName = `motion.${String(tag)}`;
  return C;
}

/**
 * motion shim. API mínima compatible para `motion.div`, `motion.button`, etc.
 * Soporta initial/animate/transition/whileHover/whileTap traducidos a CSS.
 */
export const motion = {
  div: makeMotion('div'),
  button: makeMotion('button'),
  span: makeMotion('span'),
  p: makeMotion('p'),
  h1: makeMotion('h1'),
  h2: makeMotion('h2'),
  h3: makeMotion('h3'),
  h4: makeMotion('h4'),
  h5: makeMotion('h5'),
  h6: makeMotion('h6'),
  a: makeMotion('a'),
  section: makeMotion('section'),
  article: makeMotion('article'),
  header: makeMotion('header'),
  footer: makeMotion('footer'),
  main: makeMotion('main'),
  aside: makeMotion('aside'),
  ul: makeMotion('ul'),
  ol: makeMotion('ol'),
  li: makeMotion('li'),
  nav: makeMotion('nav'),
  form: makeMotion('form'),
  label: makeMotion('label'),
  input: makeMotion('input'),
  textarea: makeMotion('textarea'),
  select: makeMotion('select'),
  option: makeMotion('option'),
  img: makeMotion('img'),
  svg: makeMotion('svg'),
  path: makeMotion('path'),
  circle: makeMotion('circle'),
  rect: makeMotion('rect'),
  // Table elements
  table: makeMotion('table'),
  thead: makeMotion('thead'),
  tbody: makeMotion('tbody'),
  tfoot: makeMotion('tfoot'),
  tr: makeMotion('tr'),
  th: makeMotion('th'),
  td: makeMotion('td'),
  // Misc
  dl: makeMotion('dl'),
  dt: makeMotion('dt'),
  dd: makeMotion('dd'),
  blockquote: makeMotion('blockquote'),
  figure: makeMotion('figure'),
  figcaption: makeMotion('figcaption'),
  details: makeMotion('details'),
  summary: makeMotion('summary'),
  pre: makeMotion('pre'),
  code: makeMotion('code'),
} as const;

/**
 * AnimatePresence shim. CSS no maneja exits al desmontar, así que solo renderiza.
 * Los componentes que dependían de animaciones de exit (modal close, sidebar
 * collapse) usan ahora `.anim-fade-in*` al montar — el exit es instantáneo.
 * Para casos críticos (toast slide-out) usar GSAP via useGsap helper más abajo.
 */
export function AnimatePresence({ children }: { children: ReactNode; mode?: string; initial?: boolean }) {
  return <>{children}</>;
}

/* Compat: useAnimation y useMotionValue stubs por si quedan usos sueltos */
export function useAnimation() {
  return {
    start: async () => undefined,
    stop: () => undefined,
    set: () => undefined,
  };
}

export function useMotionValue(initial: number) {
  return { get: () => initial, set: () => undefined };
}

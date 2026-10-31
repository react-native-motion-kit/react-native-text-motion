import type { TextMotionComponent } from '@react-native-motion-kit/text-motion';

import {
  custom,
  defineTextMotion,
  fade,
  graphemes,
  lineReveal,
  lines,
  nativeText,
  overlayText,
  parallel,
  parentLabelPolicy,
  pulse,
  rise,
  scale,
  sequence,
  shake,
  slide,
  stagger,
  typewriter,
  wave,
  words,
} from '@react-native-motion-kit/text-motion';
import {
  editorialRise,
  gentleEmphasis,
  softWave,
} from '@react-native-motion-kit/text-motion/presets';

import demoCatalog from '../../docs/demos.json';

export type DocsDemoId = keyof typeof demoCatalog;
export type DocsDemoLanguage = 'en' | 'ko';

type DocsDemoRecipe = {
  Component: TextMotionComponent;
  text: Record<DocsDemoLanguage, string>;
};

const accessibility = parentLabelPolicy({ reducedMotion: 'final-state' });
const base = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.08))
  .motion({ kind: 'timing', options: { duration: 520 } })
  .accessibility(accessibility);
const Reveal = base.effect(fade().and(rise({ y: 12 }))).component();
const phrase = {
  en: 'Give your words a little motion.',
  ko: '글자에 작은 움직임을 더해보세요.',
};

export const typewriterRecipe = defineTextMotion()
  .split(graphemes())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(typewriter())
  .motion({ kind: 'timing', options: { duration: 0 } })
  .accessibility(accessibility);

const typewriterDemo = {
  Component: typewriterRecipe.component(),
  text: { en: 'Hello, motion! 👋', ko: '안녕, 텍스트 모션! 👋' },
};

export const docsDemoRecipes = {
  'editorial-rise': {
    Component: editorialRise().accessibility(accessibility).component(),
    text: { en: 'Design motion that feels native.', ko: '자연스럽게 움직이는 타이틀을 만드세요.' },
  },
  'soft-wave': { Component: softWave().accessibility(accessibility).component(), text: phrase },
  'gentle-emphasis': {
    Component: gentleEmphasis().accessibility(accessibility).component(),
    text: { en: 'A little emphasis goes a long way.', ko: '작은 강조가 시선을 이끕니다.' },
  },
  fade: { Component: base.effect(fade()).component(), text: phrase },
  rise: { Component: base.effect(rise()).component(), text: phrase },
  slide: { Component: base.effect(slide()).component(), text: phrase },
  scale: { Component: base.effect(scale()).component(), text: phrase },
  pulse: { Component: base.effect(pulse()).component(), text: phrase },
  shake: { Component: base.effect(shake()).component(), text: phrase },
  typewriter: typewriterDemo,
  'typewriter-progress': typewriterDemo,
  'line-reveal': {
    Component: defineTextMotion()
      .layout(overlayText())
      .timeline(stagger(0.16))
      .effect(lineReveal({ y: 24 }))
      .motion({ kind: 'timing', options: { duration: 650 } })
      .accessibility(accessibility)
      .component(),
    text: {
      en: 'Every rendered line\nfinds its own rhythm.',
      ko: '실제 배치된 줄마다\n리듬을 더하세요.',
    },
  },
  words: { Component: Reveal, text: phrase },
  graphemes: {
    Component: defineTextMotion()
      .split(graphemes())
      .layout(nativeText())
      .timeline(stagger(0.04))
      .effect(fade().and(rise()))
      .motion({ kind: 'timing', options: { duration: 420 } })
      .accessibility(accessibility)
      .component(),
    text: { en: 'One grapheme at a time.', ko: '한 글자씩 움직여요. 👩🏽‍💻' },
  },
  lines: {
    Component: defineTextMotion()
      .split(lines())
      .layout(nativeText())
      .timeline(stagger(0.22))
      .effect(slide().and(fade()))
      .motion({ kind: 'timing', options: { duration: 520 } })
      .accessibility(accessibility)
      .component(),
    text: {
      en: 'An authored line.\nAnd another line.',
      ko: '직접 나눈 첫 번째 줄.\n그리고 두 번째 줄.',
    },
  },
  custom: {
    Component: defineTextMotion()
      .split(custom((input) => input.split(/( \/ )/)))
      .layout(nativeText())
      .timeline(stagger(0.22))
      .effect(fade().and(rise()))
      .motion({ kind: 'timing', options: { duration: 520 } })
      .accessibility(accessibility)
      .component(),
    text: { en: 'Your phrase / Your rhythm', ko: '원하는 구절 / 원하는 리듬' },
  },
  stagger: {
    Component: base
      .timeline(stagger(0.1, { from: 'end' }))
      .effect(fade().and(rise()))
      .component(),
    text: phrase,
  },
  wave: {
    Component: base
      .timeline(wave({ amplitude: 0.25, wavelength: 4 }))
      .effect(fade().and(rise()))
      .component(),
    text: phrase,
  },
  sequence: {
    Component: base
      .timeline(sequence(stagger(0.05), wave({ amplitude: 0.18, wavelength: 4 })))
      .effect(fade().and(rise()))
      .component(),
    text: phrase,
  },
  parallel: {
    Component: base
      .timeline(parallel(stagger(0.1), wave({ amplitude: 0.2, wavelength: 4 })))
      .effect(fade().and(rise()))
      .component(),
    text: phrase,
  },
  compose: {
    Component: base
      .effect(
        fade()
          .and(rise({ y: 20 }))
          .and(scale({ from: 0.9 })),
      )
      .component(),
    text: phrase,
  },
  autoplay: { Component: Reveal, text: phrase },
  controls: {
    Component: base
      .timeline(stagger(0.14))
      .motion({ kind: 'timing', options: { duration: 1100 } })
      .effect(fade().and(rise({ y: 20 })))
      .component(),
    text: { en: 'Play, replay, reset, and stop.', ko: '재생하고, 다시 시작하고, 멈춰보세요.' },
  },
  progress: { Component: Reveal, text: phrase },
  spring: {
    Component: base
      .effect(
        fade()
          .and(rise({ y: 24 }))
          .and(scale({ from: 0.9 })),
      )
      .motion({ kind: 'spring', options: { damping: 14, stiffness: 160 } })
      .component(),
    text: phrase,
  },
} satisfies Record<DocsDemoId, DocsDemoRecipe>;

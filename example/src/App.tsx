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
  pulse,
  rise,
  scale,
  sequence,
  shake,
  slide,
  stagger,
  useTextMotionControls,
  type TextMotionComponent,
  wave,
  words,
} from '@react-native-motion-kit/text-motion';
import {
  editorialRise,
  gentleEmphasis,
  softWave,
} from '@react-native-motion-kit/text-motion/presets';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { readTextMotionSplitterDescriptor } from '../../packages/text-motion/src/recipe/descriptors';
import {
  createNativeTextLineLayoutProbeSnapshot,
  createNativeTextLineLayoutSignature,
  createNativeTextLineRanges,
  evaluateNativeTextLineLayoutCompatibility,
  groupNativeTextTokensByLineRanges,
  recordNativeTextLineLayoutMeasurement,
  type NativeTextLineLayoutInvalidationReason,
  type NativeTextLineLayoutMeasurement,
  type NativeTextLineLayoutProbeSnapshot,
  type NativeTextRenderedLine,
} from '../../packages/text-motion/src/renderers/nativeTextLineLayout';
import { words as createInternalWordSplitter } from '../../packages/text-motion/src/split/words';

type DemoGroupId = 'presets' | 'splitters' | 'effects' | 'timelines' | 'layout' | 'playback';

type DemoGroup = {
  id: DemoGroupId;
  title: string;
};

type Demo = {
  Component?: TextMotionComponent;
  caption: string;
  groupId: DemoGroupId;
  id: string;
  text: string;
  title: string;
};

const EditorialRise = editorialRise().component();
const SoftWave = softWave().component();
const GentleEmphasis = gentleEmphasis().component();

const WordsStagger = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.034))
  .effect(fade().and(rise({ y: 10 })))
  .motion({ kind: 'timing', options: { duration: 360 } })
  .component();

const GraphemeReveal = defineTextMotion()
  .split(graphemes())
  .layout(nativeText())
  .timeline(stagger(0.014, { from: 'center' }))
  .effect(fade().and(scale({ from: 0.86 })))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .component();

const LineReveal = defineTextMotion()
  .split(lines())
  .layout(nativeText())
  .timeline(stagger(0.12))
  .effect(slide({ y: 16 }).and(fade()))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .component();

const CustomReveal = defineTextMotion()
  .split(custom((input) => input.match(/\S+|\s+/g) ?? []))
  .layout(nativeText())
  .timeline(stagger(0.028, { from: 'edges' }))
  .effect(rise({ y: 8 }).and(fade()))
  .motion({ kind: 'timing', options: { duration: 340 } })
  .component();

const FadeEffect = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.026))
  .effect(fade({ from: 0.05 }))
  .component();

const RiseEffect = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.026))
  .effect(rise({ y: 18 }))
  .component();

const SlideEffect = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.026))
  .effect(slide({ x: -14, y: 6 }).and(fade()))
  .component();

const ScaleEffect = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.026))
  .effect(scale({ from: 0.78 }).and(fade()))
  .component();

const PulseEffect = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.026))
  .effect(pulse({ scale: 1.08 }).and(fade({ from: 0.6 })))
  .component();

const ShakeEffect = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.026))
  .effect(shake({ x: 8 }).and(fade()))
  .component();

const StaggerTimeline = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04, { from: 'end' }))
  .effect(rise({ y: 10 }).and(fade()))
  .component();

const SequenceTimeline = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(sequence(stagger(0.02), wave({ amplitude: 0.04, wavelength: 4 })))
  .effect(slide({ y: 12 }).and(fade()))
  .component();

const ParallelTimeline = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(parallel(stagger(0.08), wave({ amplitude: 0.05, wavelength: 3 })))
  .effect(scale({ from: 0.9 }).and(fade()))
  .component();

const WaveTimeline = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(wave({ amplitude: 0.12, wavelength: 5 }))
  .effect(rise({ y: 12 }).and(fade()))
  .component();

const SpringMotion = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.03, { from: 'center' }))
  .effect(
    slide({ y: 18 })
      .and(fade())
      .and(scale({ from: 0.92 })),
  )
  .motion({ kind: 'spring', options: { damping: 14, stiffness: 160 } })
  .component();

const ControlledProgressText = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.08))
  .effect(rise({ y: 12 }).and(fade()))
  .component();

const ControlsPlaybackText = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(rise({ y: 12 }).and(fade()))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .component();

const ControlsStressWordsText = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.018))
  .effect(rise({ y: 8 }).and(fade()))
  .motion({ kind: 'timing', options: { duration: 320 } })
  .component();

const ControlsStressGraphemeText = defineTextMotion()
  .split(graphemes())
  .layout(nativeText())
  .timeline(stagger(0.006))
  .effect(scale({ from: 0.94 }).and(fade()))
  .motion({ kind: 'timing', options: { duration: 260 } })
  .component();

const RendererProbeFadeWordsText = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.018))
  .effect(fade({ from: 0.04 }))
  .motion({ kind: 'timing', options: { duration: 260 } })
  .component();

const RendererProbeRiseWordsText = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.014))
  .effect(rise({ y: 8 }).and(fade()))
  .motion({ kind: 'timing', options: { duration: 300 } })
  .component();

const RendererProbeScaleGraphemeText = defineTextMotion()
  .split(graphemes())
  .layout(nativeText())
  .timeline(stagger(0.005))
  .effect(scale({ from: 0.94 }).and(fade()))
  .motion({ kind: 'timing', options: { duration: 240 } })
  .component();

const RendererProbeProgressText = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.018))
  .effect(rise({ y: 8 }).and(fade()))
  .component();

const LineProbeMotionText = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.028))
  .effect(rise({ y: 10 }).and(fade()))
  .motion({ kind: 'timing', options: { duration: 360 } })
  .component();

const OverlayLineRevealText = defineTextMotion()
  .layout(overlayText({ testIDPrefix: 'overlay-line' }))
  .timeline(stagger(0.1))
  .effect(lineReveal({ y: 18 }))
  .component();

const OverlayLineRevealScaleText = defineTextMotion()
  .layout(overlayText({ testIDPrefix: 'overlay-line' }))
  .timeline(stagger(0.1))
  .effect(lineReveal({ y: 18 }).and(scale({ from: 1.25, to: 1 })))
  .component();

const OverlayPulseText = defineTextMotion()
  .layout(overlayText({ testIDPrefix: 'overlay-line' }))
  .timeline(stagger(0.1))
  .effect(pulse({ scale: 1.05 }))
  .component();

const OverlayLargeScaleText = defineTextMotion()
  .layout(overlayText({ testIDPrefix: 'overlay-line' }))
  .timeline(stagger(0.1))
  .effect(scale({ from: 1.5, to: 1 }))
  .component();

type ControlsStressCase = {
  Component: TextMotionComponent;
  id: string;
  label: string;
  tokenNote: string;
} & (
  | {
      rows?: never;
      text: string;
    }
  | {
      rows: readonly string[];
      text?: never;
    }
);

const controlsStressCases: readonly ControlsStressCase[] = [
  {
    Component: ControlsStressWordsText,
    id: 'normal-words',
    label: 'Normal word case',
    text: 'Manual stress checks repeated controls replay across a longer headline',
    tokenNote: '10 word tokens',
  },
  {
    Component: ControlsStressGraphemeText,
    id: 'heavy-graphemes',
    label: 'Heavy grapheme case',
    text: 'MotionKit'.repeat(8),
    tokenNote: '72 grapheme tokens',
  },
  {
    Component: ControlsStressGraphemeText,
    id: 'extreme-graphemes',
    label: 'Extreme grapheme case',
    text: 'ControlStress'.repeat(12),
    tokenNote: '156 grapheme tokens',
  },
  {
    Component: ControlsStressWordsText,
    id: 'shared-rows',
    label: 'Shared rows case',
    rows: [
      'Replay rows without remounting',
      'Shared controls fan out here',
      'Several labels move together',
      'Each row owns playback',
      'Stress the command path',
      'Watch for visible jank',
      'Keep tapping replay quickly',
      'Rows should stay responsive',
    ],
    tokenNote: '8 components, 33 word tokens',
  },
];

type RendererProbePlaybackMode = 'autoplay' | 'controls' | 'progress';
type RendererProbeThreshold = 'normal' | 'caution' | 'stress';
type RendererProbeControls = Pick<ReturnType<typeof useTextMotionControls>, 'replay'>;
type RendererProbeAutoplaySetter = (update: (run: number) => number) => void;

type RendererProbeCase = {
  Component: TextMotionComponent;
  effectProfile: string;
  id: string;
  label: string;
  motionTokenCount: number;
  playbackMode: RendererProbePlaybackMode;
  splitLabel: string;
  threshold: RendererProbeThreshold;
} & (
  | {
      rows?: never;
      text: string;
    }
  | {
      rows: readonly string[];
      text?: never;
    }
);

const rendererProbeWordText =
  'Measure native text renderer replay across concise product titles smoothly';
const rendererProbeLongWordText =
  'Native text motion should stay readable while this example checks around fifty visible word tokens across replay controls product copy onboarding labels title rhythm renderer pressure measurement smoothness practical threshold guidance without changing public API behavior for users who build polished React Native interfaces today across screens every day reliably';
const rendererProbeGraphemeText = 'MotionKit'.repeat(6);
const rendererProbeHeavyGraphemeText = 'ControlStress'.repeat(10);

const rendererProbeCases: readonly RendererProbeCase[] = [
  {
    Component: RendererProbeFadeWordsText,
    effectProfile: 'fade',
    id: 'words-10-autoplay',
    label: 'Words 10 autoplay',
    motionTokenCount: 10,
    playbackMode: 'autoplay',
    splitLabel: 'words()',
    text: rendererProbeWordText,
    threshold: 'normal',
  },
  {
    Component: RendererProbeRiseWordsText,
    effectProfile: 'rise + fade',
    id: 'words-50-controls',
    label: 'Words 50 replay',
    motionTokenCount: 50,
    playbackMode: 'controls',
    splitLabel: 'words()',
    text: rendererProbeLongWordText,
    threshold: 'caution',
  },
  {
    Component: RendererProbeScaleGraphemeText,
    effectProfile: 'scale + fade',
    id: 'graphemes-54-controls',
    label: 'Graphemes 54 replay',
    motionTokenCount: 54,
    playbackMode: 'controls',
    splitLabel: 'graphemes()',
    text: rendererProbeGraphemeText,
    threshold: 'caution',
  },
  {
    Component: RendererProbeScaleGraphemeText,
    effectProfile: 'scale + fade',
    id: 'graphemes-130-controls',
    label: 'Graphemes 130 replay',
    motionTokenCount: 130,
    playbackMode: 'controls',
    splitLabel: 'graphemes()',
    text: rendererProbeHeavyGraphemeText,
    threshold: 'stress',
  },
  {
    Component: RendererProbeRiseWordsText,
    effectProfile: 'rise + fade',
    id: 'shared-rows-controls',
    label: 'Shared rows replay',
    motionTokenCount: 35,
    playbackMode: 'controls',
    rows: [
      'Replay several native rows',
      'Watch UI FPS while tapping',
      'Each row owns token wrappers',
      'Controls fan out together',
      'Use this as a stress check',
      'Keep labels responsive',
      'No public API changes',
      'Record visible jank clearly',
    ],
    splitLabel: 'words()',
    threshold: 'caution',
  },
  {
    Component: RendererProbeProgressText,
    effectProfile: 'rise + fade',
    id: 'words-50-progress',
    label: 'Words 50 progress',
    motionTokenCount: 50,
    playbackMode: 'progress',
    splitLabel: 'words()',
    text: rendererProbeLongWordText,
    threshold: 'caution',
  },
];

type LineProbeCase = {
  id: string;
  label: string;
  text: string;
  widthMode: 'comfortable' | 'narrow';
};

type LineRevealProbeCase = {
  align: 'auto' | 'center' | 'right';
  Component: TextMotionComponent;
  id: string;
  label: string;
  lookFor: string;
  note: string;
  text: string;
  widthMode: 'comfortable' | 'narrow';
};

type LineProbeLayoutInput = {
  lineText: string;
  measuredWidth: number;
  styleMode: string;
  text: string;
};

type LineProbeReport = {
  detail: string;
  lines: readonly {
    id: string;
    rangeLabel?: string;
    text: string;
  }[];
  status: 'waiting' | 'go' | 'no-go' | 'unsupported';
};

const initialLineProbeReport: LineProbeReport = {
  detail: 'Waiting for native text layout',
  lines: [],
  status: 'waiting',
};

const lineProbeCases: readonly LineProbeCase[] = [
  {
    id: 'repeated',
    label: 'Repeated words',
    text: 'move move move across a measured title',
    widthMode: 'comfortable',
  },
  {
    id: 'spacing',
    label: 'Spaces + newline',
    text: 'one  two   three\nfour five',
    widthMode: 'comfortable',
  },
  {
    id: 'blank-line',
    label: 'Blank line',
    text: 'one\n\ntwo',
    widthMode: 'comfortable',
  },
  {
    id: 'leading-newline',
    label: 'Leading newline',
    text: '\none two',
    widthMode: 'comfortable',
  },
  {
    id: 'trailing-newline',
    label: 'Trailing newline',
    text: 'one two\n',
    widthMode: 'comfortable',
  },
  {
    id: 'crlf-newline',
    label: 'CRLF newline',
    text: 'one\r\ntwo',
    widthMode: 'comfortable',
  },
  {
    id: 'intl',
    label: 'Intl text',
    text: '한글 café 👨‍👩‍👧‍👦 שלום motion 文字',
    widthMode: 'comfortable',
  },
  {
    id: 'wrap-risk',
    label: 'Narrow wrap risk',
    text: 'supercalifragilistic motion token boundary check',
    widthMode: 'narrow',
  },
];

const lineRevealProbeCases: readonly LineRevealProbeCase[] = [
  {
    align: 'auto',
    Component: OverlayLineRevealText,
    id: 'latin-two-line',
    label: 'Short Latin title',
    lookFor:
      'Each rendered line should reveal inside its own band and settle exactly over the readable source paragraph.',
    note: 'Observe the actual line count; wrapping can differ by platform, font, and width.',
    text: 'Design motion that feels native across screens',
    widthMode: 'narrow',
  },
  {
    align: 'auto',
    Component: OverlayLineRevealScaleText,
    id: 'line-reveal-scale',
    label: 'Reveal + scale',
    lookFor:
      'The first and last glyphs should not be clipped by the line mask while scale shrinks to the final line.',
    note: 'This combines mask-relative lineReveal with frame-level scale.',
    text: 'Scale the rendered line without cutting edge glyphs',
    widthMode: 'narrow',
  },
  {
    align: 'auto',
    Component: OverlayPulseText,
    id: 'pulse-small',
    label: 'Pulse 1.05',
    lookFor:
      'The pulse should grow from the actual line center without self-clipping at the left or right edge.',
    note: 'Pulse is a frame transform; no reveal offset should move the paragraph copy.',
    text: 'Pulse a rendered line while keeping the mask safe',
    widthMode: 'narrow',
  },
  {
    align: 'center',
    Component: OverlayLargeScaleText,
    id: 'scale-large-stress',
    label: 'Large scale stress',
    lookFor:
      'Use this as a clipping stress check: renderer self-clipping should be gone, but parent overflow or neighboring overlap can still clip.',
    note: 'This large scale is for visual QA, not a recommended default animation.',
    text: 'Large scale makes clipping problems visible quickly',
    widthMode: 'narrow',
  },
  {
    align: 'auto',
    Component: OverlayLineRevealText,
    id: 'width-reflow',
    label: 'Width reflow',
    lookFor:
      'At progress 0.5, toggling Width should keep the current progress on the newly measured lines.',
    note: 'Toggle Width; the actual rendered line count should change.',
    text: 'Responsive hero copy should follow the rendered line breaks',
    widthMode: 'comfortable',
  },
  {
    align: 'auto',
    Component: OverlayLineRevealText,
    id: 'explicit-newline',
    label: 'Explicit newline',
    lookFor: 'Hard-authored line breaks should stay readable and not add extra motion for blanks.',
    note: 'Hard line breaks stay visual, but motion follows rendered nonblank lines.',
    text: 'First line is authored\nSecond line is authored',
    widthMode: 'comfortable',
  },
  {
    align: 'auto',
    Component: OverlayLineRevealText,
    id: 'middle-blank-line',
    label: 'Middle blank line',
    lookFor: 'The blank line should preserve vertical spacing without consuming a stagger slot.',
    note: 'The blank line remains visible spacing and consumes no motion index.',
    text: 'Opening line\n\nClosing line',
    widthMode: 'comfortable',
  },
  {
    align: 'auto',
    Component: OverlayLineRevealText,
    id: 'leading-newline',
    label: 'Leading newline',
    lookFor:
      'Leading vertical space should remain readable while the first nonblank line animates first.',
    note: 'Leading whitespace can preserve vertical space without delaying motion.',
    text: '\nLeading space before a title',
    widthMode: 'comfortable',
  },
  {
    align: 'auto',
    Component: OverlayLineRevealText,
    id: 'trailing-newline',
    label: 'Trailing newline',
    lookFor: 'Trailing line breaks should not create duplicate text or a visible flash.',
    note: 'Platform payloads may differ, but readable text should remain stable.',
    text: 'Trailing line break stays readable\n',
    widthMode: 'comfortable',
  },
  {
    align: 'center',
    Component: OverlayLineRevealText,
    id: 'center-align',
    label: 'Center alignment',
    lookFor:
      'Centered lines should animate around the measured line center without sideways drift.',
    note: 'Centered line placement should match the final source paragraph.',
    text: 'Centered lines reveal where React Native placed them',
    widthMode: 'narrow',
  },
  {
    align: 'right',
    Component: OverlayLineRevealText,
    id: 'right-align',
    label: 'Right alignment',
    lookFor:
      'Right-aligned lines should use their measured center and finish without horizontal drift.',
    note: 'Right-aligned line placement should not drift during reveal.',
    text: 'Right aligned product copy follows real layout',
    widthMode: 'narrow',
  },
  {
    align: 'auto',
    Component: OverlayLineRevealText,
    id: 'korean-cjk',
    label: 'Korean / CJK',
    lookFor:
      'CJK line breaks should follow the native rendered payload instead of JS token guessing.',
    note: 'CJK wrapping should come from native text layout, not JS guessing.',
    text: '한글과 日本語 문장이 실제 렌더링 줄 기준으로 나타납니다',
    widthMode: 'narrow',
  },
  {
    align: 'auto',
    Component: OverlayLineRevealText,
    id: 'emoji-zwj',
    label: 'Emoji / ZWJ',
    lookFor:
      'Emoji clusters should stay intact inside each rendered line through replay and reset.',
    note: 'Emoji sequences should stay visually intact inside each rendered line.',
    text: 'Teams 👨‍👩‍👧‍👦 build expressive motion ✨ for mobile',
    widthMode: 'narrow',
  },
  {
    align: 'auto',
    Component: OverlayLineRevealText,
    id: 'rtl',
    label: 'RTL',
    lookFor: 'Mixed-direction text should keep React Native shaping and not jump at progress 1.',
    note: 'RTL shaping and ordering stay owned by React Native text layout.',
    text: 'שלום עולם motion title with mixed direction',
    widthMode: 'narrow',
  },
  {
    align: 'auto',
    Component: OverlayLineRevealText,
    id: 'stress-six-line',
    label: 'Stress boundary (~6-line target)',
    lookFor: 'Replay should not create duplicate overlays, missing copies, or sustained stutter.',
    note: 'Use the displayed line count as the result, not a performance claim.',
    text: 'Line reveal is intended for titles headings and concise product copy where the number of rendered lines stays small enough to inspect directly on target devices before shipping broader surfaces.',
    widthMode: 'comfortable',
  },
];

const demoGroups: readonly DemoGroup[] = [
  { id: 'presets', title: 'Presets' },
  { id: 'splitters', title: 'Splitters' },
  { id: 'effects', title: 'Effects' },
  { id: 'timelines', title: 'Timelines' },
  { id: 'layout', title: 'Layout' },
  { id: 'playback', title: 'Playback' },
];

const demos: readonly Demo[] = [
  {
    Component: EditorialRise,
    caption: 'editorialRise()',
    groupId: 'presets',
    id: 'editorial-rise',
    text: 'Design motion that feels native',
    title: 'Editorial Rise',
  },
  {
    Component: SoftWave,
    caption: 'softWave()',
    groupId: 'presets',
    id: 'soft-wave',
    text: 'Soft motion for product copy',
    title: 'Soft Wave',
  },
  {
    Component: GentleEmphasis,
    caption: 'gentleEmphasis()',
    groupId: 'presets',
    id: 'gentle-emphasis',
    text: 'Gentle emphasis for small labels',
    title: 'Gentle Emphasis',
  },
  {
    Component: WordsStagger,
    caption: 'words()',
    groupId: 'splitters',
    id: 'words',
    text: 'Words move as readable groups',
    title: 'Words',
  },
  {
    Component: GraphemeReveal,
    caption: 'graphemes()',
    groupId: 'splitters',
    id: 'graphemes',
    text: 'Glyphs: café 한글 שלום',
    title: 'Graphemes',
  },
  {
    Component: LineReveal,
    caption: 'lines() newline-only experimental splitter',
    groupId: 'splitters',
    id: 'lines',
    text: 'First line rises\nSecond line follows',
    title: 'Lines',
  },
  {
    Component: CustomReveal,
    caption: 'custom((input) => input.match(...))',
    groupId: 'splitters',
    id: 'custom',
    text: 'Custom token boundaries stay flexible',
    title: 'Custom',
  },
  {
    Component: FadeEffect,
    caption: 'fade()',
    groupId: 'effects',
    id: 'fade',
    text: 'Fade each token into place',
    title: 'Fade',
  },
  {
    Component: RiseEffect,
    caption: 'rise()',
    groupId: 'effects',
    id: 'rise',
    text: 'Rise with clean vertical motion',
    title: 'Rise',
  },
  {
    Component: SlideEffect,
    caption: 'slide()',
    groupId: 'effects',
    id: 'slide',
    text: 'Slide from a directional offset',
    title: 'Slide',
  },
  {
    Component: ScaleEffect,
    caption: 'scale()',
    groupId: 'effects',
    id: 'scale',
    text: 'Scale softly from below',
    title: 'Scale',
  },
  {
    Component: PulseEffect,
    caption: 'pulse()',
    groupId: 'effects',
    id: 'pulse',
    text: 'Pulse up, then settle back',
    title: 'Pulse',
  },
  {
    Component: ShakeEffect,
    caption: 'shake()',
    groupId: 'effects',
    id: 'shake',
    text: 'Shake without losing readability',
    title: 'Shake',
  },
  {
    Component: StaggerTimeline,
    caption: 'stagger(0.04, { from: "end" })',
    groupId: 'timelines',
    id: 'stagger',
    text: 'Stagger can start from the end',
    title: 'Stagger',
  },
  {
    Component: SequenceTimeline,
    caption: 'delay = stagger + wave',
    groupId: 'timelines',
    id: 'sequence',
    text: 'Base stagger plus wave delay',
    title: 'Sequence',
  },
  {
    Component: ParallelTimeline,
    caption: 'earliest delay wins',
    groupId: 'timelines',
    id: 'parallel',
    text: 'Parallel keeps starts close together',
    title: 'Parallel',
  },
  {
    Component: WaveTimeline,
    caption: 'wave()',
    groupId: 'timelines',
    id: 'wave',
    text: 'Wave timing rolls across text',
    title: 'Wave',
  },
  {
    Component: SpringMotion,
    caption: 'motion({ kind: "spring" })',
    groupId: 'timelines',
    id: 'spring',
    text: 'Spring motion gives words weight',
    title: 'Spring Motion',
  },
  {
    caption: 'overlayText() + lineReveal() public API probe',
    groupId: 'layout',
    id: 'overlay-line-reveal-probe',
    text: 'Rendered line reveal probe',
    title: 'Line Reveal',
  },
  {
    caption: 'diagnostic line layout probe / hard newline visual check',
    groupId: 'layout',
    id: 'line-layout-probe',
    text: 'Measured line layout probe',
    title: 'Line Layout Probe',
  },
  {
    caption: 'controls={controls}',
    groupId: 'playback',
    id: 'playback-controls',
    text: 'Controls replay without remounting',
    title: 'Playback Controls',
  },
  {
    caption: 'manual fan-out check',
    groupId: 'playback',
    id: 'controls-stress',
    text: 'Controls stress case',
    title: 'Controls Stress',
  },
  {
    caption: 'nativeText performance threshold probe',
    groupId: 'playback',
    id: 'renderer-performance-probe',
    text: 'Renderer performance probe',
    title: 'Renderer Performance',
  },
  {
    caption: 'progress={sharedValue}',
    groupId: 'playback',
    id: 'controlled-progress',
    text: 'Progress drives the whole reveal',
    title: 'Controlled Progress',
  },
];

function firstDemoIndexForGroup(groupId: DemoGroupId): number {
  return demos.findIndex((demo) => demo.groupId === groupId);
}

function previousDemoIndex(index: number): number {
  return (index + demos.length - 1) % demos.length;
}

function nextDemoIndex(index: number): number {
  return (index + 1) % demos.length;
}

function nextStressCaseIndex(index: number): number {
  return (index + 1) % controlsStressCases.length;
}

function nextRendererProbeCaseIndex(index: number): number {
  return (index + 1) % rendererProbeCases.length;
}

function nextLineProbeCaseIndex(index: number): number {
  return (index + 1) % lineProbeCases.length;
}

function nextLineRevealProbeCaseIndex(index: number): number {
  return (index + 1) % lineRevealProbeCases.length;
}

function renderedLinesFromEvent(
  event: NativeSyntheticEvent<TextLayoutEventData>,
): readonly NativeTextRenderedLine[] {
  return event.nativeEvent.lines.map((line, index) => ({
    height: line.height,
    index,
    text: line.text,
    width: line.width,
    x: line.x,
    y: line.y,
  }));
}

function countVisibleMotionLines(renderedLineItems: readonly NativeTextRenderedLine[]): number {
  return renderedLineItems.filter((line) => line.text.trim().length > 0).length;
}

function areRenderedLineCountsEqual(
  previous: readonly NativeTextRenderedLine[],
  next: readonly NativeTextRenderedLine[],
): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((line, index) => {
    const nextLine = next[index];

    return Boolean(
      nextLine &&
      line.text === nextLine.text &&
      Math.round(line.y) === Math.round(nextLine.y) &&
      Math.round(line.height) === Math.round(nextLine.height),
    );
  });
}

function createLineRevealTextAlignStyle(align: LineRevealProbeCase['align']) {
  if (align === 'center') {
    return styles.lineRevealTextCenter;
  }

  if (align === 'right') {
    return styles.lineRevealTextRight;
  }

  return styles.lineRevealTextAuto;
}

function lineTextForSignature(renderedLines: readonly NativeTextRenderedLine[]): string {
  return renderedLines.map((line) => line.text).join('\n');
}

function createLineProbeWordTokens(text: string) {
  return readTextMotionSplitterDescriptor(createInternalWordSplitter()).split(text);
}

function formatLineProbeText(text: string): string {
  return text.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
}

function resolveLineProbeInvalidationReason(
  previous: LineProbeLayoutInput | undefined,
  current: LineProbeLayoutInput,
): NativeTextLineLayoutInvalidationReason {
  if (!previous) {
    return 'initial';
  }

  if (previous.text !== current.text) {
    return 'text';
  }

  if (previous.measuredWidth !== current.measuredWidth) {
    return 'width';
  }

  if (previous.styleMode !== current.styleMode) {
    return 'style';
  }

  if (previous.lineText !== current.lineText) {
    return 'line-text';
  }

  return 'line-text';
}

function reportFromMeasurement(
  text: string,
  renderedLines: readonly NativeTextRenderedLine[],
): LineProbeReport {
  const lineRanges = createNativeTextLineRanges(text, renderedLines);
  const renderedLineItems = renderedLines.map((line) => ({
    id: `${line.index}-${line.text}-${line.x}-${line.y}-${line.width}-${line.height}`,
    text: formatLineProbeText(line.text),
  }));

  if (lineRanges.ok === false) {
    return {
      detail: lineRanges.reason,
      lines: renderedLineItems,
      status: 'unsupported',
    };
  }

  const tokens = createLineProbeWordTokens(text);
  const groups = groupNativeTextTokensByLineRanges(tokens, lineRanges.value);
  const mappedLineItems = lineRanges.value.map((lineRange) => ({
    id: `${lineRange.index}-${lineRange.sourceRange.start}-${lineRange.sourceRange.end}`,
    rangeLabel: `${lineRange.sourceRange.start}-${lineRange.sourceRange.end}`,
    text: formatLineProbeText(lineRange.text),
  }));
  const lineBreakRange = lineRanges.value.find((lineRange) => /[\r\n]/.test(lineRange.text));

  if (lineBreakRange) {
    return {
      detail: `hard break renders; measured line ${lineBreakRange.index + 1} still carries \\n`,
      lines: mappedLineItems,
      status: 'no-go',
    };
  }

  if (groups.ok === false) {
    return {
      detail: groups.reason,
      lines: mappedLineItems,
      status: 'unsupported',
    };
  }

  const compatibility = evaluateNativeTextLineLayoutCompatibility(groups.value);

  if (compatibility.status === 'no-go') {
    return {
      detail: `${compatibility.reason}: line ${compatibility.lineIndex + 1}`,
      lines: mappedLineItems,
      status: 'no-go',
    };
  }

  return {
    detail: `${compatibility.lineCount} lines / ${compatibility.tokenCount} tokens`,
    lines: mappedLineItems,
    status: 'go',
  };
}

function createLineProbeStatusStyle(status: LineProbeReport['status']) {
  if (status === 'go') {
    return [styles.lineProbeStatus, styles.lineProbeStatusGo];
  }

  if (status === 'no-go') {
    return [styles.lineProbeStatus, styles.lineProbeStatusNoGo];
  }

  if (status === 'unsupported') {
    return [styles.lineProbeStatus, styles.lineProbeStatusUnsupported];
  }

  return [styles.lineProbeStatus, styles.lineProbeStatusWaiting];
}

function createRendererProbeThresholdStyle(threshold: RendererProbeThreshold) {
  if (threshold === 'normal') {
    return [styles.rendererProbeBadge, styles.rendererProbeBadgeNormal];
  }

  if (threshold === 'caution') {
    return [styles.rendererProbeBadge, styles.rendererProbeBadgeCaution];
  }

  return [styles.rendererProbeBadge, styles.rendererProbeBadgeStress];
}

function formatRendererProbeMode(mode: RendererProbePlaybackMode): string {
  if (mode === 'autoplay') {
    return 'mount autoplay';
  }

  if (mode === 'controls') {
    return 'controls replay';
  }

  return 'external progress';
}

function createRendererProbeNodeEstimate(motionTokenCount: number): string {
  return `${motionTokenCount} wrappers / ${motionTokenCount * 2} animated token nodes`;
}

function runRendererProbePlayback(
  mode: RendererProbePlaybackMode,
  controls: RendererProbeControls,
  progress: SharedValue<number>,
  setAutoplayRun: RendererProbeAutoplaySetter,
) {
  if (mode === 'autoplay') {
    setAutoplayRun((run) => run + 1);
    return;
  }

  if (mode === 'progress') {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 720 });
    return;
  }

  controls.replay();
}

function createStableSignatureLines(
  renderedLines: readonly NativeTextRenderedLine[],
): readonly NativeTextRenderedLine[] {
  return renderedLines.map((line) => ({
    ...line,
    height: Math.round(line.height),
    width: Math.round(line.width),
    x: Math.round(line.x),
    y: Math.round(line.y),
  }));
}

function ControlsPlaybackDemo({ replaySignal, text }: { replaySignal: number; text: string }) {
  const controls = useTextMotionControls();
  const replaySignalRef = useRef(replaySignal);

  useEffect(() => {
    if (replaySignalRef.current === replaySignal) {
      return;
    }

    replaySignalRef.current = replaySignal;
    controls.replay();
  }, [controls, replaySignal]);

  return (
    <View style={styles.controlledDemo}>
      <ControlsPlaybackText controls={controls} style={styles.motionText}>
        {text}
      </ControlsPlaybackText>

      <View style={styles.progressControls}>
        <Pressable
          accessibilityRole="button"
          onPress={controls.reset}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Reset</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={controls.stop} style={styles.progressButton}>
          <Text style={styles.progressButtonText}>Stop</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={controls.play} style={styles.progressButton}>
          <Text style={styles.progressButtonText}>Play</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ControlsStressDemo({ replaySignal }: { replaySignal: number }) {
  const controls = useTextMotionControls();
  const [caseIndex, setCaseIndex] = useState(0);
  const replaySignalRef = useRef(replaySignal);
  const stressCase = controlsStressCases[caseIndex] ?? controlsStressCases[0];
  const StressText = stressCase.Component;
  const stressRows = stressCase.rows;

  useEffect(() => {
    if (replaySignalRef.current === replaySignal) {
      return;
    }

    replaySignalRef.current = replaySignal;
    controls.replay();
  }, [controls, replaySignal]);

  return (
    <View style={styles.controlledDemo}>
      <View style={styles.stressMetaGroup}>
        <Text style={styles.stressMeta}>{stressCase.label}</Text>
        <Text style={styles.stressMetaDetail}>{stressCase.tokenNote}</Text>
      </View>

      {stressRows ? (
        <View style={styles.stressRows}>
          {stressRows.map((rowText) => (
            <StressText
              controls={controls}
              key={rowText}
              style={[styles.motionText, styles.stressRowText]}
            >
              {rowText}
            </StressText>
          ))}
        </View>
      ) : (
        <StressText
          controls={controls}
          key={stressCase.id}
          style={[styles.motionText, styles.stressMotionText]}
        >
          {stressCase.text}
        </StressText>
      )}

      <View style={styles.progressControls}>
        <Pressable
          accessibilityRole="button"
          onPress={controls.replay}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Replay</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={controls.reset}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Reset</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setCaseIndex((index) => nextStressCaseIndex(index));
          }}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Case</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RendererPerformanceProbeDemo({ replaySignal }: { replaySignal: number }) {
  const controls = useTextMotionControls();
  const progress = useSharedValue(0);
  const [caseIndex, setCaseIndex] = useState(0);
  const [autoplayRun, setAutoplayRun] = useState(0);
  const replaySignalRef = useRef(replaySignal);
  const probeCase = rendererProbeCases[caseIndex] ?? rendererProbeCases[0];
  const ProbeText = probeCase.Component;
  const probeRows = probeCase.rows;
  const playbackMode = probeCase.playbackMode;
  const thresholdStyle = createRendererProbeThresholdStyle(probeCase.threshold);

  useEffect(() => {
    if (replaySignalRef.current === replaySignal) {
      return;
    }

    replaySignalRef.current = replaySignal;
    runRendererProbePlayback(playbackMode, controls, progress, setAutoplayRun);
  }, [controls, playbackMode, progress, replaySignal]);

  return (
    <View style={styles.rendererProbeDemo}>
      <View style={styles.rendererProbeHeader}>
        <View style={styles.rendererProbeTitleGroup}>
          <Text style={styles.stressMeta}>{probeCase.label}</Text>
          <Text style={styles.stressMetaDetail}>
            {probeCase.splitLabel} / {probeCase.effectProfile} /{' '}
            {formatRendererProbeMode(playbackMode)}
          </Text>
        </View>
        <Text style={thresholdStyle}>{probeCase.threshold.toUpperCase()}</Text>
      </View>

      <View style={styles.rendererProbeStats}>
        <Text style={styles.lineProbeStatText}>{probeCase.motionTokenCount} motion tokens</Text>
        <Text style={styles.lineProbeStatText}>
          {createRendererProbeNodeEstimate(probeCase.motionTokenCount)}
        </Text>
      </View>

      {probeRows ? (
        <View style={styles.stressRows}>
          {probeRows.map((rowText) => (
            <ProbeText
              controls={controls}
              key={rowText}
              style={[styles.motionText, styles.rendererProbeRowText]}
            >
              {rowText}
            </ProbeText>
          ))}
        </View>
      ) : playbackMode === 'progress' ? (
        <ProbeText progress={progress} style={[styles.motionText, styles.rendererProbeMotionText]}>
          {probeCase.text}
        </ProbeText>
      ) : (
        <ProbeText
          controls={playbackMode === 'controls' ? controls : undefined}
          key={`${probeCase.id}-${autoplayRun}`}
          style={[styles.motionText, styles.rendererProbeMotionText]}
        >
          {probeCase.text}
        </ProbeText>
      )}

      <View style={styles.progressControls}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            runRendererProbePlayback(playbackMode, controls, progress, setAutoplayRun);
          }}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Replay</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (playbackMode === 'progress') {
              progress.value = 0;
              return;
            }

            controls.reset();
          }}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Reset</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const nextCaseIndex = nextRendererProbeCaseIndex(caseIndex);
            const nextCase = rendererProbeCases[nextCaseIndex] ?? rendererProbeCases[0];

            setCaseIndex(nextCaseIndex);
            progress.value = 0;

            if (nextCase.playbackMode === 'progress') {
              progress.value = withTiming(1, { duration: 720 });
              return;
            }

            setAutoplayRun((run) => run + 1);
          }}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Case</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LineRevealProbeDemo({ replaySignal }: { replaySignal: number }) {
  const progress = useSharedValue(1);
  const [caseIndex, setCaseIndex] = useState(0);
  const [widthMode, setWidthMode] = useState<LineRevealProbeCase['widthMode']>(
    lineRevealProbeCases[0].widthMode,
  );
  const [renderedLines, setRenderedLines] = useState<readonly NativeTextRenderedLine[]>([]);
  const replaySignalRef = useRef(replaySignal);
  const probeCase = lineRevealProbeCases[caseIndex] ?? lineRevealProbeCases[0];
  const ProbeMotionText = probeCase.Component;
  const lineTextAlignStyle = createLineRevealTextAlignStyle(probeCase.align);
  const visibleMotionLineCount = countVisibleMotionLines(renderedLines);

  function replayProgress() {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 820 });
  }

  function resetProgress() {
    progress.value = 0;
  }

  function stepProgress() {
    const current = Number(progress.value);

    if (!Number.isFinite(current) || current >= 1) {
      progress.value = 0;
      return;
    }

    progress.value = Math.min(1, Math.round((current + 0.25) * 100) / 100);
  }

  function advanceCase() {
    const nextCaseIndex = nextLineRevealProbeCaseIndex(caseIndex);
    const nextCase = lineRevealProbeCases[nextCaseIndex] ?? lineRevealProbeCases[0];

    setRenderedLines([]);
    setCaseIndex(nextCaseIndex);
    setWidthMode(nextCase.widthMode);
    replayProgress();
  }

  function handleTextLayout(event: NativeSyntheticEvent<TextLayoutEventData>) {
    const nextLines = renderedLinesFromEvent(event);

    setRenderedLines((currentLines) =>
      areRenderedLineCountsEqual(currentLines, nextLines) ? currentLines : nextLines,
    );
  }

  useEffect(() => {
    if (replaySignalRef.current === replaySignal) {
      return;
    }

    replaySignalRef.current = replaySignal;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 820 });
  }, [progress, replaySignal]);

  return (
    <View style={styles.lineRevealDemo}>
      <View style={styles.lineProbeTopRow}>
        <View style={styles.stageTitleGroup}>
          <Text style={styles.stressMeta}>{probeCase.label}</Text>
          <Text style={styles.stressMetaDetail}>{probeCase.note}</Text>
        </View>
        <Text style={styles.rendererProbeBadgeNormal}>PUBLIC</Text>
      </View>

      <View
        style={[styles.lineRevealTextBox, widthMode === 'narrow' && styles.lineRevealTextBoxNarrow]}
      >
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onTextLayout={handleTextLayout}
          style={[styles.lineRevealText, lineTextAlignStyle, styles.lineRevealMeasurementText]}
        >
          {probeCase.text}
        </Text>
        <ProbeMotionText progress={progress} style={[styles.lineRevealText, lineTextAlignStyle]}>
          {probeCase.text}
        </ProbeMotionText>
      </View>

      <View style={styles.lineProbeStats}>
        <Text style={styles.lineProbeStatText}>rendered lines {renderedLines.length}</Text>
        <Text style={styles.lineProbeStatText}>motion lines {visibleMotionLineCount}</Text>
        <Text style={styles.lineProbeStatText}>animated overlays {visibleMotionLineCount}</Text>
        <Text style={styles.lineProbeStatText}>paragraph copies {visibleMotionLineCount}</Text>
      </View>

      <View style={styles.lineProbeSection}>
        <Text style={styles.lineProbeSectionLabel}>What to look for</Text>
        <Text style={styles.lineRevealLookFor}>{probeCase.lookFor}</Text>
      </View>

      <View style={styles.progressControls}>
        <Pressable
          accessibilityRole="button"
          onPress={replayProgress}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Replay</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={resetProgress} style={styles.progressButton}>
          <Text style={styles.progressButtonText}>Reset</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setWidthMode((currentMode) => (currentMode === 'narrow' ? 'comfortable' : 'narrow'));
          }}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>
            {widthMode === 'narrow' ? 'Widen' : 'Narrow'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.progressControls}>
        <Pressable accessibilityRole="button" onPress={advanceCase} style={styles.progressButton}>
          <Text style={styles.progressButtonText}>Case</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={stepProgress} style={styles.progressButton}>
          <Text style={styles.progressButtonText}>Progress +25%</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LineLayoutProbeDemo({ replaySignal }: { replaySignal: number }) {
  const controls = useTextMotionControls();
  const [caseIndex, setCaseIndex] = useState(0);
  const [compactWidth, setCompactWidth] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [probeReport, setProbeReport] = useState(initialLineProbeReport);
  const snapshotRef = useRef<NativeTextLineLayoutProbeSnapshot>(
    createNativeTextLineLayoutProbeSnapshot(),
  );
  const [probeSnapshot, setProbeSnapshot] = useState(snapshotRef.current);
  const lastInputRef = useRef<LineProbeLayoutInput | undefined>(undefined);
  const lastMeasurementRef = useRef<NativeTextLineLayoutMeasurement | undefined>(undefined);
  const replaySignalRef = useRef(replaySignal);
  const probeCase = lineProbeCases[caseIndex] ?? lineProbeCases[0];
  const currentWidthMode = compactWidth ? 'narrow' : probeCase.widthMode;
  const styleMode = currentWidthMode;
  const lineProbeTextStyle =
    currentWidthMode === 'narrow' ? styles.lineProbeNarrowText : styles.lineProbeMotionText;

  function resetProbeCounters() {
    const nextSnapshot = createNativeTextLineLayoutProbeSnapshot();

    snapshotRef.current = nextSnapshot;
    lastInputRef.current = undefined;
    lastMeasurementRef.current = undefined;
    setProbeSnapshot(nextSnapshot);
    setProbeReport(initialLineProbeReport);
  }

  function applyMeasurement(
    measurement: NativeTextLineLayoutMeasurement,
    options: { renderDuplicate: boolean },
  ) {
    const update = recordNativeTextLineLayoutMeasurement(snapshotRef.current, measurement);

    snapshotRef.current = update.snapshot;

    if (update.accepted || options.renderDuplicate) {
      setProbeSnapshot(update.snapshot);
    }

    return update;
  }

  function handleTextLayout(event: NativeSyntheticEvent<TextLayoutEventData>) {
    const renderedLines = renderedLinesFromEvent(event);
    const signatureLines = createStableSignatureLines(renderedLines);
    const currentInput = {
      lineText: lineTextForSignature(renderedLines),
      measuredWidth,
      styleMode,
      text: probeCase.text,
    };
    const signature = createNativeTextLineLayoutSignature({
      measuredWidth,
      renderedLines: signatureLines,
      style: [styles.motionText, lineProbeTextStyle],
      text: probeCase.text,
    });
    const invalidationReason = resolveLineProbeInvalidationReason(
      lastInputRef.current,
      currentInput,
    );
    const measurement = {
      invalidationReason,
      lineCount: renderedLines.length,
      signature,
      tokenCount: createLineProbeWordTokens(probeCase.text).length,
    };

    lastInputRef.current = currentInput;
    lastMeasurementRef.current = measurement;

    const update = applyMeasurement(measurement, { renderDuplicate: false });

    if (update.accepted) {
      setProbeReport(reportFromMeasurement(probeCase.text, renderedLines));
    }
  }

  function handleMeasureLayout(event: LayoutChangeEvent) {
    const nextWidth = Math.round(event.nativeEvent.layout.width);

    setMeasuredWidth((width) => (width === nextWidth ? width : nextWidth));
  }

  function repeatLastMeasurement() {
    const lastMeasurement = lastMeasurementRef.current;

    if (!lastMeasurement) {
      return;
    }

    applyMeasurement(lastMeasurement, { renderDuplicate: true });
  }

  useEffect(() => {
    if (replaySignalRef.current === replaySignal) {
      return;
    }

    replaySignalRef.current = replaySignal;
    controls.replay();
  }, [controls, replaySignal]);

  return (
    <View style={styles.lineProbeDemo}>
      <View style={styles.lineProbeTopRow}>
        <View style={styles.stageTitleGroup}>
          <Text style={styles.stressMeta}>{probeCase.label}</Text>
          <Text style={styles.stressMetaDetail}>{probeReport.detail}</Text>
        </View>
        <Text style={createLineProbeStatusStyle(probeReport.status)}>
          {probeReport.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.lineProbeSection}>
        <Text style={styles.lineProbeSectionLabel}>Original text</Text>
        <Text style={styles.lineProbeOriginalText}>{probeCase.text}</Text>
        <Text style={styles.lineProbeEscapedText}>{formatLineProbeText(probeCase.text)}</Text>
      </View>

      <View
        onLayout={handleMeasureLayout}
        style={[
          styles.lineProbeTextBox,
          currentWidthMode === 'narrow' && styles.lineProbeTextBoxNarrow,
        ]}
      >
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onTextLayout={handleTextLayout}
          style={[styles.motionText, lineProbeTextStyle, styles.lineProbeMeasurementText]}
        >
          {probeCase.text}
        </Text>

        <LineProbeMotionText controls={controls} style={[styles.motionText, lineProbeTextStyle]}>
          {probeCase.text}
        </LineProbeMotionText>
      </View>

      <View style={styles.lineProbeSection}>
        <Text style={styles.lineProbeSectionLabel}>Measured lines mapped to source ranges</Text>
        <View style={styles.lineProbeLines}>
          {probeReport.lines.map((line, index) => (
            <Text key={line.id} style={styles.lineProbeLineText}>
              {index + 1}. [{line.rangeLabel ?? 'unmapped'}] {line.text}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.lineProbeStats}>
        <Text style={styles.lineProbeStatText}>layout calls {probeSnapshot.onTextLayoutCalls}</Text>
        <Text style={styles.lineProbeStatText}>
          accepted {probeSnapshot.acceptedMappingUpdates}
        </Text>
        <Text style={styles.lineProbeStatText}>
          repeated {probeSnapshot.rejectedIdenticalPayloads}
        </Text>
        <Text style={styles.lineProbeStatText}>lines {probeSnapshot.lineCount}</Text>
      </View>

      <View style={styles.progressControls}>
        <Pressable
          accessibilityRole="button"
          onPress={controls.replay}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Replay</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={repeatLastMeasurement}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Same layout</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setCompactWidth((value) => !value);
          }}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Width</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            resetProbeCounters();
            setCaseIndex((index) => nextLineProbeCaseIndex(index));
          }}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Case</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ControlledProgressDemo({ replaySignal, text }: { replaySignal: number; text: string }) {
  const progress = useSharedValue(0);
  const replaySignalRef = useRef(replaySignal);

  useEffect(() => {
    if (replaySignalRef.current === replaySignal) {
      return;
    }

    replaySignalRef.current = replaySignal;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 720 });
  }, [progress, replaySignal]);

  return (
    <View style={styles.controlledDemo}>
      <ControlledProgressText progress={progress} style={styles.motionText}>
        {text}
      </ControlledProgressText>

      <View style={styles.progressControls}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            progress.value = 0;
          }}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Reset</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            progress.value = withTiming(0.5, { duration: 320 });
          }}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Half</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            progress.value = withTiming(1, { duration: 720 });
          }}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>Play</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  const [demoIndex, setDemoIndex] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const demo = demos[demoIndex] ?? demos[0];
  const MotionText = demo.Component;
  const controlsDemoSelected = demo.id === 'playback-controls';
  const controlsStressDemoSelected = demo.id === 'controls-stress';
  const controlledDemoSelected = demo.id === 'controlled-progress';
  const lineRevealProbeSelected = demo.id === 'overlay-line-reveal-probe';
  const lineLayoutProbeSelected = demo.id === 'line-layout-probe';
  const rendererPerformanceProbeSelected = demo.id === 'renderer-performance-probe';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>@react-native-motion-kit/text-motion</Text>
          <Text style={styles.heading}>Motion player</Text>
          <Text style={styles.summary}>
            Inspect motion recipes, playback behavior, and diagnostic line layout probes one case at
            a time.
          </Text>
        </View>

        <View style={styles.tabs}>
          {demoGroups.map((group) => {
            const selected = demo.groupId === group.id;

            return (
              <Pressable
                accessibilityRole="button"
                key={group.id}
                onPress={() => {
                  setDemoIndex(firstDemoIndexForGroup(group.id));
                  setReplayKey((key) => key + 1);
                }}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                  {group.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.stage}>
          <View style={styles.stageHeader}>
            <View style={styles.stageTitleGroup}>
              <Text style={styles.stageTitle}>{demo.title}</Text>
              <Text style={styles.stageCaption}>{demo.caption}</Text>
            </View>
            <Text style={styles.counter}>
              {demoIndex + 1} / {demos.length}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.motionFrameContent}
            key={demo.id}
            style={styles.motionFrame}
          >
            {controlsDemoSelected ? (
              <ControlsPlaybackDemo key={demo.id} replaySignal={replayKey} text={demo.text} />
            ) : controlsStressDemoSelected ? (
              <ControlsStressDemo key={demo.id} replaySignal={replayKey} />
            ) : rendererPerformanceProbeSelected ? (
              <RendererPerformanceProbeDemo key={demo.id} replaySignal={replayKey} />
            ) : lineRevealProbeSelected ? (
              <LineRevealProbeDemo key={demo.id} replaySignal={replayKey} />
            ) : lineLayoutProbeSelected ? (
              <LineLayoutProbeDemo key={demo.id} replaySignal={replayKey} />
            ) : controlledDemoSelected ? (
              <ControlledProgressDemo key={demo.id} replaySignal={replayKey} text={demo.text} />
            ) : (
              MotionText && (
                <MotionText
                  key={`${demo.id}-${replayKey}`}
                  style={[styles.motionText, demo.id === 'editorial-rise' && styles.heroTitle]}
                >
                  {demo.text}
                </MotionText>
              )
            )}
          </ScrollView>
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setDemoIndex((index) => previousDemoIndex(index));
              setReplayKey((key) => key + 1);
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Prev</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setReplayKey((key) => key + 1)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Replay</Text>
            <Text style={styles.primaryButtonMeta}>Run {replayKey + 1}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setDemoIndex((index) => nextDemoIndex(index));
              setReplayKey((key) => key + 1);
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Next</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 18,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  controlledDemo: {
    alignItems: 'center',
    gap: 18,
    width: '100%',
  },
  counter: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  eyebrow: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  header: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  heading: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginTop: 6,
  },
  heroTitle: {
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 33,
  },
  lineProbeDemo: {
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  lineProbeEscapedText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  lineProbeLineText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  lineProbeLines: {
    gap: 3,
    minHeight: 38,
    width: '100%',
  },
  lineProbeMeasurementText: {
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  lineProbeMotionText: {
    fontSize: 18,
    lineHeight: 25,
  },
  lineProbeNarrowText: {
    fontSize: 18,
    lineHeight: 25,
  },
  lineProbeOriginalText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  lineProbeSection: {
    gap: 4,
    maxWidth: 360,
    width: '100%',
  },
  lineProbeSectionLabel: {
    color: '#0f766e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  lineProbeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  lineProbeStatText: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  lineProbeStatus: {
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lineProbeStatusGo: {
    backgroundColor: '#ccfbf1',
    color: '#0f766e',
  },
  lineProbeStatusNoGo: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  lineProbeStatusUnsupported: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  lineProbeStatusWaiting: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
  },
  lineProbeTextBox: {
    maxWidth: 360,
    minHeight: 58,
    position: 'relative',
    width: '100%',
  },
  lineProbeTextBoxNarrow: {
    maxWidth: 220,
  },
  lineProbeTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    maxWidth: 360,
    width: '100%',
  },
  lineRevealDemo: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  lineRevealLookFor: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  lineRevealMeasurementText: {
    left: 0,
    opacity: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  lineRevealText: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 29,
  },
  lineRevealTextAuto: {
    textAlign: 'auto',
  },
  lineRevealTextBox: {
    maxWidth: 360,
    minHeight: 96,
    position: 'relative',
    width: '100%',
  },
  lineRevealTextBoxNarrow: {
    maxWidth: 230,
  },
  lineRevealTextCenter: {
    textAlign: 'center',
  },
  lineRevealTextRight: {
    textAlign: 'right',
  },
  motionFrame: {
    flex: 1,
  },
  motionFrameContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 210,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  motionText: {
    color: '#111827',
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 31,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    flex: 1.3,
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryButtonMeta: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 1,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  progressButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#94a3b8',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  progressButtonText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  progressControls: {
    flexDirection: 'row',
    gap: 8,
    maxWidth: 360,
    width: '100%',
  },
  rendererProbeBadge: {
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rendererProbeBadgeCaution: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  rendererProbeBadgeNormal: {
    backgroundColor: '#ccfbf1',
    color: '#0f766e',
  },
  rendererProbeBadgeStress: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  rendererProbeDemo: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  rendererProbeHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    maxWidth: 360,
    width: '100%',
  },
  rendererProbeMotionText: {
    fontSize: 17,
    lineHeight: 24,
  },
  rendererProbeRowText: {
    fontSize: 14,
    lineHeight: 19,
  },
  rendererProbeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    maxWidth: 360,
  },
  rendererProbeTitleGroup: {
    alignItems: 'flex-start',
    flex: 1,
    gap: 2,
  },
  screen: {
    backgroundColor: '#eef3f8',
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 54,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  stage: {
    backgroundColor: '#ffffff',
    borderColor: '#d9e2ec',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  stageCaption: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  stageHeader: {
    alignItems: 'flex-start',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 14,
  },
  stageTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  stageTitleGroup: {
    flex: 1,
  },
  stressMeta: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    textAlign: 'center',
  },
  stressMetaDetail: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
  stressMetaGroup: {
    alignItems: 'center',
    gap: 2,
  },
  stressMotionText: {
    fontSize: 18,
    lineHeight: 25,
  },
  stressRows: {
    gap: 4,
    width: '100%',
  },
  stressRowText: {
    fontSize: 15,
    lineHeight: 20,
  },
  summary: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  tab: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabSelected: {
    backgroundColor: '#ccfbf1',
    borderColor: '#0f766e',
  },
  tabText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    textAlign: 'center',
  },
  tabTextSelected: {
    color: '#0f4f47',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
});

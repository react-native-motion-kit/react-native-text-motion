import {
  custom,
  defineTextMotion,
  fade,
  graphemes,
  lines,
  nativeText,
  parallel,
  pulse,
  rise,
  scale,
  sequence,
  shake,
  slide,
  stagger,
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
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

type DemoGroupId = 'presets' | 'splitters' | 'effects' | 'timelines';

type DemoGroup = {
  id: DemoGroupId;
  title: string;
};

type Demo = {
  Component: TextMotionComponent;
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

const demoGroups: readonly DemoGroup[] = [
  { id: 'presets', title: 'Presets' },
  { id: 'splitters', title: 'Splitters' },
  { id: 'effects', title: 'Effects' },
  { id: 'timelines', title: 'Timelines' },
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

export default function App() {
  const [demoIndex, setDemoIndex] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const demo = demos[demoIndex] ?? demos[0];
  const MotionText = demo.Component;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>@react-native-motion-kit/text-motion</Text>
          <Text style={styles.heading}>Motion player</Text>
          <Text style={styles.summary}>
            Inspect every stable MVP case one at a time. Change case or replay without scrolling.
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

          <View style={styles.motionFrame}>
            <MotionText
              key={`${demo.id}-${replayKey}`}
              style={[styles.motionText, demo.id === 'editorial-rise' && styles.heroTitle]}
            >
              {demo.text}
            </MotionText>
          </View>
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
  motionFrame: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 210,
    paddingHorizontal: 18,
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

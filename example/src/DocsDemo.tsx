import type { SharedValue } from 'react-native-reanimated';

import { useTextMotionControls } from '@react-native-motion-kit/text-motion';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  cancelAnimation,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import demoCatalog from '../../docs/demos.json';
import { readTextMotionSplitterDescriptor } from '../../packages/text-motion/src/recipe/descriptors';
import {
  clampTextMotionProgress,
  createTextMotionControlledTimelineSpan,
  createTextMotionDelaySecondsByItemIndex,
  mapTextMotionControlledProgressToItemProgress,
} from '../../packages/text-motion/src/renderers/rendererMotion';
import {
  docsDemoRecipes,
  typewriterRecipe,
  type DocsDemoId,
  type DocsDemoLanguage,
} from './docsDemoRecipes';

const captureMode = process.env.EXPO_PUBLIC_TEXT_MOTION_CAPTURE === '1';

type DemoTheme = 'dark' | 'light';
type DemoPalette = {
  background: string;
  foreground: string;
  muted: string;
  border: string;
  control: string;
  selected: string;
};

const palettes: Record<DemoTheme, DemoPalette> = {
  dark: {
    background: '#111111',
    foreground: '#f4f4f5',
    muted: '#a1a1aa',
    border: '#303033',
    control: '#18181b',
    selected: '#27272a',
  },
  light: {
    background: '#ffffff',
    foreground: '#18181b',
    muted: '#62626a',
    border: '#dedee1',
    control: '#fafafa',
    selected: '#ededf0',
  },
};

const PaletteContext = createContext<DemoPalette>(palettes.dark);

function initialSelection(): {
  id: DocsDemoId;
  language: DocsDemoLanguage;
  embedded: boolean;
  theme: DemoTheme;
} {
  let requested = process.env.EXPO_PUBLIC_TEXT_MOTION_DEMO_ID;
  let language: DocsDemoLanguage = 'en';
  let embedded = false;
  let theme: DemoTheme =
    captureMode && process.env.EXPO_PUBLIC_TEXT_MOTION_CAPTURE_THEME === 'light' ? 'light' : 'dark';
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const parameters = new URLSearchParams(window.location.search);
    requested = parameters.get('demo') ?? requested;
    language = parameters.get('lang') === 'ko' ? 'ko' : 'en';
    embedded = parameters.get('embedded') === '1';
    theme = parameters.get('theme') === 'light' ? 'light' : 'dark';
  }
  return {
    id: requested && Object.hasOwn(demoCatalog, requested) ? (requested as DocsDemoId) : 'words',
    language,
    embedded,
    theme,
  };
}

const copy = {
  en: {
    replay: 'Replay',
    remount: 'Remount',
    play: 'Play',
    reset: 'Reset',
    stop: 'Stop',
    ready: 'Ready',
    playing: 'Playback requested',
    stopped: 'Stopped · current state kept',
    initial: 'Reset · initial state',
    progress: 'Timeline progress',
    visibleCharacters: 'Visible characters',
    characterCountNote: 'Excludes spaces; includes punctuation and emoji.',
    reducedMotion: 'Reduced motion is enabled. The complete phrase stays visible.',
    controlsNote: 'Play moves toward the final state; stop/play is not an exact pause/resume API.',
    nativeOnly:
      'This renderer measures native text lines. Watch its iOS recording in the documentation.',
  },
  ko: {
    replay: '다시 재생',
    remount: '다시 마운트',
    play: '재생',
    reset: '초기화',
    stop: '정지',
    ready: '준비됨',
    playing: '재생 요청됨',
    stopped: '정지됨 · 현재 상태 유지',
    initial: '초기화됨 · 시작 상태',
    progress: '타임라인 진행률',
    visibleCharacters: '현재 표시된 글자 수',
    characterCountNote: '공백 제외 · 문장부호와 이모지 포함',
    reducedMotion: '모션 줄이기가 켜져 있어 전체 문장을 표시합니다.',
    controlsNote:
      '재생은 최종 상태를 향해 움직입니다. 정지 후 재생은 정확한 일시 정지·이어 재생 API가 아닙니다.',
    nativeOnly: '이 렌더러는 네이티브 텍스트 줄을 측정합니다. 문서의 iOS 녹화 영상을 확인하세요.',
  },
};

type DemoButtonProps = {
  label: string;
  onPress(): void;
  selected?: boolean;
  primary?: boolean;
};

function DemoButton({ label, onPress, selected, primary = false }: DemoButtonProps) {
  const palette = useContext(PaletteContext);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.button,
        { borderColor: palette.border, backgroundColor: palette.control },
        (selected || primary) && { borderColor: palette.foreground },
        selected && { backgroundColor: palette.selected },
        focused && {
          outlineColor: palette.foreground,
          outlineOffset: 2,
          outlineStyle: 'solid',
          outlineWidth: 2,
        },
        pressed && styles.pressedButton,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          { color: palette.foreground },
          (selected || primary) && styles.emphasizedButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ProgressReadout({
  progress,
  language,
  reducedMotion,
  typewriterText,
}: {
  progress: SharedValue<number>;
  language: DocsDemoLanguage;
  reducedMotion: boolean;
  typewriterText?: string;
}) {
  const [snapshot, setSnapshot] = useState({ percent: 0, visible: 0 });
  const palette = useContext(PaletteContext);
  const content = copy[language];
  const plan = useMemo(() => {
    if (typewriterText === undefined) return undefined;

    // This diagnostic lives in the repository example, like the existing layout
    // probes. Reuse the renderer's helpers without adding a public library API.
    const recipe = typewriterRecipe.recipe();
    if (!recipe.splitter) throw new Error('The Typewriter demo requires a splitter.');
    const count = readTextMotionSplitterDescriptor(recipe.splitter)
      .split(typewriterText)
      .filter((token) => token.text.trim().length > 0).length;
    const delays = createTextMotionDelaySecondsByItemIndex(recipe, count);

    return {
      delays,
      span: createTextMotionControlledTimelineSpan(delays),
      reducedMotionFinalState: recipe.accessibility?.reducedMotion === 'final-state',
    };
  }, [typewriterText]);

  useAnimatedReaction(
    () => {
      const value = clampTextMotionProgress(progress.value);
      const revealProgress = reducedMotion && plan?.reducedMotionFinalState ? 1 : value;
      let visible = 0;
      if (plan) {
        for (const delay of plan.delays) {
          if (
            mapTextMotionControlledProgressToItemProgress({
              progress: revealProgress,
              itemDelaySeconds: delay,
              totalTimelineSpan: plan.span,
            }) > 0
          )
            visible++;
        }
      }
      return { percent: Math.round(value * 100), visible };
    },
    (current, previous) => {
      if (
        !previous ||
        current.percent !== previous.percent ||
        current.visible !== previous.visible
      ) {
        scheduleOnRN(setSnapshot, current);
      }
    },
    [progress, plan, reducedMotion],
  );

  return (
    <View style={styles.progressReadout}>
      <Text style={[styles.note, { color: palette.muted }]}>
        {content.progress}: {snapshot.percent}%
      </Text>
      {plan ? (
        <>
          <Text style={[styles.status, { color: palette.foreground }]}>
            {content.visibleCharacters}:{' '}
            {reducedMotion && plan.reducedMotionFinalState ? plan.delays.length : snapshot.visible}{' '}
            / {plan.delays.length}
          </Text>
          <Text style={[styles.note, { color: palette.muted }]}>{content.characterCountNote}</Text>
        </>
      ) : null}
    </View>
  );
}

export default function DocsDemo() {
  const [{ id, language, embedded, theme: initialTheme }] = useState(initialSelection);
  const [theme, setTheme] = useState<DemoTheme>(initialTheme);
  const [mountKey, setMountKey] = useState(0);
  const [status, setStatus] = useState<'ready' | 'playing' | 'stopped' | 'initial'>('ready');
  const [targetProgress, setTargetProgress] = useState(0);
  const controls = useTextMotionControls();
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const content = copy[language];
  const demo = docsDemoRecipes[id];
  const MotionText = demo.Component;
  const isProgress = id === 'progress' || id === 'typewriter-progress';
  const isControls = id === 'controls';
  const nativeOnly = demoCatalog[id].kind === 'native' && Platform.OS === 'web';
  const palette = palettes[theme];

  useEffect(() => {
    if (Platform.OS !== 'web' || !embedded || typeof window === 'undefined') return;

    const updateTheme = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const message: unknown = event.data;
      if (
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        message.type === 'text-motion-theme' &&
        'theme' in message &&
        (message.theme === 'dark' || message.theme === 'light')
      ) {
        setTheme(message.theme);
      }
    };

    window.addEventListener('message', updateTheme);
    return () => window.removeEventListener('message', updateTheme);
  }, [embedded]);

  useEffect(() => {
    if (!captureMode || reducedMotion || nativeOnly) return;
    const initialReplay = setTimeout(controls.replay, 750);
    const replayInterval = setInterval(controls.replay, 3000);
    return () => {
      clearTimeout(initialReplay);
      clearInterval(replayInterval);
    };
  }, [controls, nativeOnly, reducedMotion]);

  useEffect(() => () => cancelAnimation(progress), [progress]);

  const changeProgress = (value: number) => {
    cancelAnimation(progress);
    progress.value = value;
    setTargetProgress(value);
  };

  return (
    <PaletteContext.Provider value={palette}>
      <View
        style={[
          styles.root,
          { backgroundColor: palette.background },
          captureMode && styles.captureRoot,
        ]}
      >
        {!embedded && (
          <Text style={[styles.label, { color: palette.muted }]}>{demoCatalog[id].label}</Text>
        )}
        <View style={styles.stage}>
          {nativeOnly ? (
            <Text style={[styles.note, { color: palette.muted }]}>{content.nativeOnly}</Text>
          ) : isProgress ? (
            <MotionText
              progress={progress}
              style={[styles.motionText, { color: palette.foreground }]}
            >
              {demo.text[language]}
            </MotionText>
          ) : id === 'autoplay' ? (
            <MotionText key={mountKey} style={[styles.motionText, { color: palette.foreground }]}>
              {demo.text[language]}
            </MotionText>
          ) : (
            <MotionText
              controls={controls}
              style={[styles.motionText, { color: palette.foreground }]}
            >
              {demo.text[language]}
            </MotionText>
          )}
        </View>

        {!nativeOnly && !captureMode && (
          <View style={[styles.footer, { borderTopColor: palette.border }]}>
            <View style={styles.actions}>
              {isProgress ? (
                <>
                  {[0, 0.25, 0.5, 0.75, 1].map((value) => (
                    <DemoButton
                      key={value}
                      label={`${value * 100}%`}
                      onPress={() => changeProgress(value)}
                      selected={targetProgress === value}
                    />
                  ))}
                  <DemoButton
                    label={content.play}
                    onPress={() => {
                      progress.value = withTiming(1, { duration: 1800 });
                      setTargetProgress(1);
                    }}
                  />
                  <DemoButton label={content.reset} onPress={() => changeProgress(0)} />
                </>
              ) : id === 'autoplay' ? (
                <DemoButton
                  label={content.remount}
                  onPress={() => setMountKey((value) => value + 1)}
                />
              ) : (
                <>
                  {isControls && (
                    <DemoButton
                      label={content.play}
                      onPress={() => {
                        controls.play();
                        setStatus('playing');
                      }}
                    />
                  )}
                  <DemoButton
                    label={content.replay}
                    onPress={() => {
                      controls.replay();
                      setStatus('playing');
                    }}
                    primary
                  />
                  {isControls && (
                    <>
                      <DemoButton
                        label={content.reset}
                        onPress={() => {
                          controls.reset();
                          setStatus('initial');
                        }}
                      />
                      <DemoButton
                        label={content.stop}
                        onPress={() => {
                          controls.stop();
                          setStatus('stopped');
                        }}
                      />
                    </>
                  )}
                </>
              )}
            </View>
            {isProgress && (
              <ProgressReadout
                progress={progress}
                language={language}
                reducedMotion={reducedMotion}
                typewriterText={id === 'typewriter-progress' ? demo.text[language] : undefined}
              />
            )}
            {isControls && (
              <>
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.status, { color: palette.foreground }]}
                >
                  {content[status]}
                </Text>
                <Text style={[styles.note, { color: palette.muted }]}>{content.controlsNote}</Text>
              </>
            )}
            {reducedMotion && (
              <Text style={[styles.note, { color: palette.muted }]}>{content.reducedMotion}</Text>
            )}
          </View>
        )}
      </View>
    </PaletteContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  captureRoot: { justifyContent: 'center', paddingHorizontal: 30 },
  label: { fontSize: 12, fontWeight: '500' },
  stage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    paddingVertical: 20,
  },
  motionText: {
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 36,
    textAlign: 'center',
    maxWidth: '100%',
  },
  footer: { gap: 8, borderTopWidth: 1, paddingTop: 12 },
  progressReadout: { gap: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  button: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressedButton: { opacity: 0.72 },
  buttonText: { fontSize: 12, fontWeight: '500' },
  emphasizedButtonText: { fontWeight: '600' },
  status: { fontSize: 12, lineHeight: 18 },
  note: { fontSize: 12, lineHeight: 18 },
});

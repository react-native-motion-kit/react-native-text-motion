// oxlint-disable-next-line import/no-unassigned-import -- Styles shared by the documentation preview cards.
import './motion-demo.css';
import { useDark, useLang, withBase } from '@rspress/core/runtime';
import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';

import demoSources from '../.cache/demo-sources.json';
import demos from '../demos.json';

type DemoId = keyof typeof demos;
type SourceTab = 'recipe' | 'player';

const RuntimeCode = lazy(async () => ({
  default: (await import('@rspress/core/theme-original')).CodeBlockRuntime,
}));

function NativeDemoVideo({ theme, lang }: { theme: 'dark' | 'light'; lang: 'en' | 'ko' }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const mediaPath = `/media/line-reveal${theme === 'light' ? '-light' : ''}`;

  // Match the SSG placeholder during hydration, then select the browser theme.
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="motion-demo__video" aria-hidden="true" />;

  return (
    <div className="motion-demo__video-wrap">
      <video
        ref={videoRef}
        className="motion-demo__video"
        controls={started}
        playsInline
        preload="metadata"
        poster={withBase(`${mediaPath}.jpg`)}
        onError={() => {
          setStarted(false);
          setFailed(true);
        }}
        aria-label={
          lang === 'ko'
            ? '실제 iOS 줄 단위 텍스트 애니메이션 녹화'
            : 'Rendered-line animation recorded on iOS'
        }
      >
        <source src={withBase(`${mediaPath}.mp4`)} type="video/mp4" />
        <track
          kind="captions"
          src={withBase(`/media/line-reveal.${lang}.vtt`)}
          srcLang={lang}
          label={lang === 'ko' ? '한국어' : 'English'}
        />
      </video>
      {!started ? (
        <img
          className="motion-demo__video-poster"
          src={withBase(`${mediaPath}.jpg`)}
          alt=""
          aria-hidden="true"
        />
      ) : null}
      {!started ? (
        <button
          className="motion-demo__video-start"
          type="button"
          onClick={async () => {
            setFailed(false);
            setStarted(true);
            try {
              if (videoRef.current?.error) videoRef.current.load();
              await videoRef.current?.play();
            } catch {
              setStarted(false);
              setFailed(true);
            }
          }}
        >
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 3.5v9L12 8 5 3.5Z" />
          </svg>
          {lang === 'ko' ? '영상 재생' : 'Play recording'}
        </button>
      ) : null}
      {failed ? (
        <p className="motion-demo__video-error" role="alert">
          {lang === 'ko'
            ? '영상을 재생하지 못했습니다. 다시 시도해 주세요.'
            : 'The recording could not play. Please try again.'}
        </p>
      ) : null}
    </div>
  );
}

export function MotionDemo({ id }: { id: DemoId }) {
  const lang = useLang() === 'ko' ? 'ko' : 'en';
  const theme = useDark() ? 'dark' : 'light';
  const [playing, setPlaying] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(theme);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceTab, setSourceTab] = useState<SourceTab>('recipe');
  const sourceId = useId();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const demo = demos[id];
  const source = sourceTab === 'recipe' ? demoSources.recipes[id] : demoSources.player;
  const native = demo.kind === 'native';

  useEffect(() => {
    // The sandbox has an opaque origin. Only appearance data is sent.
    frameRef.current?.contentWindow?.postMessage({ type: 'text-motion-theme', theme }, '*');
  }, [theme, playing]);

  return (
    <section
      className="motion-demo"
      data-demo={id}
      data-kind={demo.kind}
      aria-label={`${demo.label} ${lang === 'ko' ? '데모' : 'demo'}`}
    >
      <header className="motion-demo__header">
        <code>{demo.label}</code>
        <span className="motion-demo__platform">
          {native ? (lang === 'ko' ? 'iOS 녹화' : 'iOS recording') : 'React Native Web'}
        </span>
      </header>
      {native ? (
        <NativeDemoVideo key={theme} theme={theme} lang={lang} />
      ) : playing ? (
        <iframe
          ref={frameRef}
          className="motion-demo__frame"
          sandbox="allow-scripts"
          src={withBase(
            `/demos/index.html?demo=${id}&lang=${lang}&embedded=1&theme=${previewTheme}`,
          )}
          title={`${demo.label} ${lang === 'ko' ? '대화형 미리보기' : 'interactive preview'}`}
          loading="lazy"
          onLoad={() =>
            frameRef.current?.contentWindow?.postMessage({ type: 'text-motion-theme', theme }, '*')
          }
        />
      ) : (
        <div className="motion-demo__start">
          <button
            type="button"
            onClick={() => {
              setPreviewTheme(theme);
              setPlaying(true);
            }}
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5 3.5v9L12 8 5 3.5Z" />
            </svg>
            {lang === 'ko' ? '예제 실행' : 'Run example'}
          </button>
        </div>
      )}
      <div className="motion-demo__toolbar">
        <button
          type="button"
          className="motion-demo__source-toggle"
          aria-expanded={sourceOpen}
          aria-controls={sourceId}
          onClick={() => setSourceOpen(!sourceOpen)}
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d={sourceOpen ? 'm4 10 4-4 4 4' : 'm4 6 4 4 4-4'} />
          </svg>
          {sourceOpen
            ? lang === 'ko'
              ? '코드 닫기'
              : 'Hide code'
            : lang === 'ko'
              ? '코드 보기'
              : 'View code'}
        </button>
        {!native && playing ? (
          <button type="button" className="motion-demo__close" onClick={() => setPlaying(false)}>
            {lang === 'ko' ? '미리보기 닫기' : 'Close preview'}
          </button>
        ) : null}
      </div>
      <div id={sourceId} className="motion-demo__source" hidden={!sourceOpen}>
        {sourceOpen ? (
          <div className="motion-demo__source-content">
            <div
              className="motion-demo__source-tabs"
              role="group"
              aria-label={lang === 'ko' ? '코드 종류' : 'Source selection'}
            >
              {(['recipe', 'player'] as const).map((tab) => (
                <button
                  type="button"
                  key={tab}
                  aria-pressed={sourceTab === tab}
                  aria-controls={sourceId}
                  onClick={() => setSourceTab(tab)}
                >
                  {tab === 'recipe'
                    ? lang === 'ko'
                      ? '레시피'
                      : 'Recipe'
                    : lang === 'ko'
                      ? '재생·제어'
                      : 'Player'}
                </button>
              ))}
            </div>
            <p className="motion-demo__source-note">
              {sourceTab === 'recipe'
                ? lang === 'ko'
                  ? '이 예제에서 실행하는 레시피와 기본 설정입니다.'
                  : 'The recipe and shared defaults used by this example.'
                : lang === 'ko'
                  ? '모든 예제가 공유하는 재생·제어 UI의 원본입니다.'
                  : 'The shared player source, including controls and styles.'}
            </p>
            <div>
              <Suspense
                fallback={
                  <pre className="motion-demo__source-fallback">
                    <code>{source}</code>
                  </pre>
                }
              >
                <RuntimeCode
                  key={sourceTab}
                  lang="tsx"
                  title={sourceTab === 'recipe' ? `${id}.tsx` : 'DocsDemo.tsx'}
                  code={source}
                  lineNumbers
                  height={360}
                />
              </Suspense>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// oxlint-disable-next-line import/no-unassigned-import -- Load the global Rspress theme styles.
import './index.css';
import type { ComponentProps } from 'react';

import {
  normalizeHrefInRuntime,
  useHead,
  useLang,
  usePage,
  withBase,
  withSiteOrigin,
} from '@rspress/core/runtime';
import {
  HomeLayout as BasicHomeLayout,
  Layout as BasicLayout,
  PackageManagerTabs,
} from '@rspress/core/theme-original';

import type { AlternateLink } from '../plugins/seo';

function Layout(props: ComponentProps<typeof BasicLayout>) {
  const { page } = usePage();
  const isNotFound = page.pageType === '404';
  const canonical = withSiteOrigin(withBase(normalizeHrefInRuntime(page.routePath)));
  const alternatives = (page.seoAlternates ?? []) as AlternateLink[];

  useHead({
    link: isNotFound ? [] : [{ rel: 'canonical', href: canonical }, ...alternatives],
    meta: isNotFound
      ? [{ name: 'robots', content: 'noindex' }]
      : [
          { property: 'og:url', content: canonical },
          { property: 'og:site_name', content: 'React Native Text Motion' },
          { property: 'og:image', content: withSiteOrigin(withBase('/logo.png')) },
          { property: 'og:image:alt', content: 'React Native Motion Kit logo' },
          { name: 'twitter:card', content: 'summary' },
        ],
  });

  return <BasicLayout {...props} />;
}

function HomeLayout() {
  const lang = useLang();

  return (
    <BasicHomeLayout
      afterHeroActions={
        <div className="rspress-doc text-motion-install">
          <p>
            {lang === 'ko'
              ? '다음 타이틀에 움직임을 더해보세요.'
              : 'Give your next title a little motion.'}
          </p>
          <PackageManagerTabs command="install @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets" />
        </div>
      }
    />
  );
}

export { HomeLayout, Layout };
// oxlint-disable-next-line import/export
export * from '@rspress/core/theme-original';

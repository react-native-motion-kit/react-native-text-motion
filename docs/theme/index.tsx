// oxlint-disable-next-line import/no-unassigned-import -- Load the global Rspress theme styles.
import './index.css';
import { useLang } from '@rspress/core/runtime';
import { HomeLayout as BasicHomeLayout, PackageManagerTabs } from '@rspress/core/theme-original';

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

export { HomeLayout };
// oxlint-disable-next-line import/export
export * from '@rspress/core/theme-original';

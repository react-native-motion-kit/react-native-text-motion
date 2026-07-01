import type { TextProps } from 'react-native';

import type { TextMotionAccessibilityPolicy, TextMotionToken } from '../types';

/** Options for {@link parentLabelPolicy}. */
export type ParentLabelPolicyOptions = {
  /** Reduced-motion behavior. Defaults to `system`. */
  reducedMotion?: TextMotionAccessibilityPolicy['reducedMotion'];
};

/** Make the parent text node accessible and hide decorative animated token nodes. */
export function parentLabelPolicy(
  options: ParentLabelPolicyOptions = {},
): TextMotionAccessibilityPolicy {
  return {
    kind: 'parent-label',
    parentLabel: true,
    hideTokensFromAccessibility: true,
    reducedMotion: options.reducedMotion ?? 'system',
  };
}

export function resolveAccessibleText(
  children: string,
  tokens: readonly TextMotionToken[],
): string {
  if (children.length > 0) {
    return children;
  }

  return tokens.map((token) => token.text).join('');
}

export function createParentAccessibilityProps(
  policy: TextMotionAccessibilityPolicy,
  label: string,
): Pick<TextProps, 'accessibilityLabel' | 'accessible'> {
  if (!policy.parentLabel) {
    return {};
  }

  return {
    accessibilityLabel: label,
    accessible: true,
  };
}

export function createHiddenTokenAccessibilityProps(
  policy: TextMotionAccessibilityPolicy,
): Pick<TextProps, 'accessibilityElementsHidden' | 'accessible' | 'importantForAccessibility'> {
  if (!policy.hideTokensFromAccessibility) {
    return {};
  }

  return {
    accessibilityElementsHidden: true,
    accessible: false,
    importantForAccessibility: 'no-hide-descendants',
  };
}

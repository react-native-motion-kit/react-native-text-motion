import { TextMotionRecipeBuilder } from './recipe';

/** Start a composable text motion recipe. */
export function defineTextMotion(): TextMotionRecipeBuilder {
  return new TextMotionRecipeBuilder();
}

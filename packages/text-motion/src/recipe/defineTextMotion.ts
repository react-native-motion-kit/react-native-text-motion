import { createTextMotionRecipeBuilder, type TextMotionRecipeBuilder } from './recipe';

/** Start a composable text motion recipe. */
export function defineTextMotion(): TextMotionRecipeBuilder {
  return createTextMotionRecipeBuilder();
}

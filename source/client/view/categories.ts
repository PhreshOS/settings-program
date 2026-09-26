import type { SettingsCategory } from "./category"
import appearance from "./categories/appearance"
import desktop from "./categories/desktop"

/** Every category, in navigation order. A new category is one entry here and its folder. */
export const categories: readonly SettingsCategory[] = [appearance, desktop]

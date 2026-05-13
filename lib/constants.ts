export const CARE_EVENT_META: Record<
  string,
  { label: string; emoji: string; tone: string }
> = {
  water: { label: "浇水", emoji: "💧", tone: "bg-sky-100 text-sky-700" },
  fertilize: { label: "施肥", emoji: "🌱", tone: "bg-emerald-100 text-emerald-700" },
  repot: { label: "换盆", emoji: "🪴", tone: "bg-amber-100 text-amber-700" },
  prune: { label: "修剪", emoji: "✂️", tone: "bg-rose-100 text-rose-700" },
  treat: { label: "用药", emoji: "💊", tone: "bg-purple-100 text-purple-700" },
  observe: { label: "观察", emoji: "👀", tone: "bg-slate-100 text-slate-700" },
  rotate: { label: "转盆", emoji: "🔄", tone: "bg-indigo-100 text-indigo-700" },
  move: { label: "搬位", emoji: "📦", tone: "bg-stone-100 text-stone-700" },
  sow: { label: "播种", emoji: "🌰", tone: "bg-yellow-100 text-yellow-700" },
  cutting: { label: "扦插", emoji: "🌿", tone: "bg-lime-100 text-lime-700" },
  growth: { label: "成长", emoji: "📈", tone: "bg-leaf-100 text-leaf-700" },
};

export const SUPPLY_CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  soil: { label: "营养土/介质", emoji: "🪨" },
  pot: { label: "花盆", emoji: "🏺" },
  tool: { label: "工具", emoji: "🛠️" },
  fertilizer: { label: "肥料", emoji: "🌱" },
  pesticide: { label: "药剂", emoji: "🧴" },
  seed: { label: "种子/种球", emoji: "🌰" },
  other: { label: "其他", emoji: "📦" },
};

// 离散类目（盆、工具）：跟踪「总数 / 在用 / 闲置」
// 耗品类目（土、肥、药、种子、其他）：跟踪「剩余 %」
export const DISCRETE_SUPPLY_CATEGORIES = new Set(["pot", "tool"]);

export function isDiscreteSupply(category: string): boolean {
  return DISCRETE_SUPPLY_CATEGORIES.has(category);
}

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

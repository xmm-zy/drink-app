export const cocktails = [
  {
    name: "Whiskey Sour",
    zhName: "威士忌酸",
    category: "classic",
    base: "whiskey",
    image: "/assets/whiskey-sour.png",
    naming: "名字来自酸酒 Sour 家族，以威士忌、柠檬与糖的平衡为核心。",
    story:
      "Whiskey Sour 在 19 世纪的美国酒吧文化中成形，早期酸酒常被水手和旅人用于平衡烈酒口感。它的魅力不在复杂，而在酸、甜、烈三者的准确比例。",
    profile: "Bourbon / 柠檬 / 甜酸 / 酒体饱满",
    method: "摇和 Shake",
    ingredients: ["波本威士忌 45 ml", "新鲜柠檬汁 25 ml", "糖浆 20 ml", "蛋清 20 ml（可选）", "安格斯图拉苦精 1 dash"],
  },
  {
    name: "Margarita",
    zhName: "玛格丽特",
    category: "classic",
    base: "tequila",
    naming: "Margarita 在西班牙语中意为“雏菊”，也被视为 Daisy 酸酒家族的龙舌兰版本。",
    story:
      "关于 Margarita 的起源有多种说法，常见故事发生在 20 世纪上半叶的墨西哥与美国边境。盐边、青柠与龙舌兰共同构成了它极具辨识度的仪式感。",
    profile: "Tequila / 青柠 / 橙香 / 清爽咸口",
    method: "摇和 Shake",
    ingredients: ["100% Agave Tequila 50 ml", "Triple Sec 20 ml", "新鲜青柠汁 15 ml", "杯口盐边"],
  },
  {
    name: "Negroni",
    zhName: "尼格罗尼",
    category: "classic",
    base: "gin",
    naming: "相传以意大利 Count Negroni 伯爵命名，源于对 Americano 的烈度升级。",
    story:
      "Negroni 诞生于佛罗伦萨的酒吧传说中，金酒替代苏打水后，苦甜草本气息更强。它是餐前酒文化的代表，比例简洁却极考验材料品质。",
    profile: "Gin / Campari / Vermouth / 苦甜草本",
    method: "搅拌 Stir",
    ingredients: ["金酒 30 ml", "Campari 30 ml", "甜味美思 30 ml", "橙皮装饰"],
  },
  {
    name: "Mojito",
    zhName: "莫吉托",
    category: "classic",
    base: "rum",
    naming: "名字常被认为与古巴语境中的香料、酱汁或小魔法有关。",
    story:
      "Mojito 与古巴朗姆酒文化密不可分。薄荷、青柠、糖和苏打让朗姆变得明亮，海明威相关传说也让它成为热带酒单上绕不开的经典。",
    profile: "White Rum / 薄荷 / 青柠 / 气泡清爽",
    method: "杯中调制 Build",
    ingredients: ["白朗姆 45 ml", "新鲜青柠汁 20 ml", "细砂糖 2 茶匙", "薄荷叶 6-8 片", "苏打水补满"],
  },
  {
    name: "Cosmopolitan",
    zhName: "大都会",
    category: "signature",
    base: "vodka",
    naming: "Cosmopolitan 指“世界化、都会感”，名字与它的粉红色视觉一样现代。",
    story:
      "Cosmopolitan 在 20 世纪末的纽约酒吧与流行文化中走红。它把伏特加的干净、蔓越莓的酸甜和橙香利口酒结合成优雅的都会风味。",
    profile: "Vodka / 蔓越莓 / 橙香 / 都会酸甜",
    method: "摇和 Shake",
    ingredients: ["柑橘伏特加 40 ml", "Triple Sec 15 ml", "蔓越莓汁 30 ml", "新鲜青柠汁 15 ml"],
  },
  {
    name: "Pina Colada",
    zhName: "椰林飘香",
    category: "signature",
    base: "rum",
    naming: "西班牙语意为“过滤后的菠萝”，直接指向菠萝汁的热带意象。",
    story:
      "Pina Colada 与波多黎各度假文化紧密相连。椰子、菠萝和朗姆带来奶油般的热带口感，是最具画面感的经典长饮之一。",
    profile: "White Rum / 菠萝 / 椰子 / 热带奶油感",
    method: "搅打 Blend",
    ingredients: ["白朗姆 50 ml", "椰浆 30 ml", "新鲜菠萝汁 50 ml", "碎冰适量"],
  },
  {
    name: "Black Russian",
    zhName: "黑俄罗斯",
    category: "signature",
    base: "vodka",
    naming: "Black 来自咖啡利口酒的深色，Russian 则指伏特加基酒。",
    story:
      "Black Russian 通常被认为诞生于 1940 年代布鲁塞尔。它以伏特加和咖啡利口酒构成冷峻而直接的甜苦风味，后来延伸出 White Russian。",
    profile: "Vodka / Coffee Liqueur / 深色甜苦",
    method: "杯中调制 Build",
    ingredients: ["伏特加 50 ml", "咖啡利口酒 20 ml", "大冰块"],
  },
  {
    name: "Virgin Pina Colada",
    zhName: "无酒精椰林飘香",
    category: "nonalcoholic",
    base: "none",
    naming: "沿用 Pina Colada 的热带命名，Virgin 表示无酒精版本。",
    story:
      "这款无酒精版本保留菠萝和椰子的度假感，适合不饮酒用户、下午茶场景或餐厅菜单中的轻饮部分。",
    profile: "菠萝 / 椰子 / 奶油感 / 无酒精",
    method: "搅打 Blend",
    ingredients: ["新鲜菠萝汁 90 ml", "椰浆 45 ml", "淡奶油 15 ml（可选）", "碎冰适量"],
  },
];

export const categoryLabels = {
  classic: { en: "Classic", zh: "经典" },
  signature: { en: "Signature Creations", zh: "特调创作" },
  nonalcoholic: { en: "Non-Alcoholic Options", zh: "无酒精选项" },
};

export const baseSpiritLabels = {
  whiskey: { en: "Whiskey", zh: "威士忌基酒" },
  tequila: { en: "Tequila", zh: "龙舌兰基酒" },
  gin: { en: "Gin", zh: "金酒基酒" },
  rum: { en: "Rum", zh: "朗姆基酒" },
  vodka: { en: "Vodka", zh: "伏特加基酒" },
  none: { en: "No Base Spirit", zh: "无基酒" },
};

export function formatLabel(label) {
  return `${label.en} / ${label.zh}`;
}

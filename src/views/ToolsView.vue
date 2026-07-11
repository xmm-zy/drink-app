<template>
  <div class="tools-page">
    <main class="tools-shell">
      <header class="tools-header">
        <RouterLink to="/menu">返回功能菜单</RouterLink>
        <RouterLink to="/cocktails">查看调酒菜单</RouterLink>
      </header>

      <section class="tools-hero">
        <p class="eyebrow">Bar Tools Guide</p>
        <h1>调酒器具指南<span>Introduction and How to Use</span></h1>
        <p>按「用途、基本步骤、常见误区」整理了入门最常用的调酒器具，方便你按需学习和实操。</p>
      </section>

      <section class="tools-grid" aria-label="调酒器具介绍列表">
        <article v-for="tool in tools" :key="tool.name" class="tools-card">
          <header>
            <h3>{{ tool.name }}</h3>
            <span>{{ tool.english }}</span>
          </header>

          <p>{{ tool.intro }}</p>

          <div class="tools-block">
            <strong>适用场景</strong>
            <ul>
              <li v-for="item in tool.useCases" :key="item">{{ item }}</li>
            </ul>
          </div>

          <div class="tools-block">
            <strong>使用方法</strong>
            <ol>
              <li v-for="step in tool.steps" :key="step">{{ step }}</li>
            </ol>
          </div>

          <div class="tools-block">
            <strong>注意事项</strong>
            <ul>
              <li v-for="tip in tool.tips" :key="tip">{{ tip }}</li>
            </ul>
          </div>
        </article>
      </section>

      <section class="tools-match" aria-label="按酒款反查器具与冰型">
        <header>
          <h2>按酒款反查器具与冰型</h2>
          <p>选择一个常见酒款，快速查看推荐器具、冰型和操作要点。</p>
        </header>

        <div class="tools-match-tabs">
          <button
            v-for="item in drinkMatches"
            :key="item.id"
            type="button"
            :class="{ active: selectedDrinkId === item.id }"
            @click="selectedDrinkId = item.id"
          >
            {{ item.name }}
          </button>
        </div>

        <article v-if="selectedDrink" class="tools-match-result">
          <h3>{{ selectedDrink.name }}</h3>
          <p>{{ selectedDrink.style }}</p>

          <div class="tools-match-grid">
            <div class="tools-block">
              <strong>推荐器具</strong>
              <ul>
                <li v-for="tool in selectedDrink.recommendedTools" :key="tool">{{ tool }}</li>
              </ul>
            </div>
            <div class="tools-block">
              <strong>推荐冰型</strong>
              <ul>
                <li>{{ selectedDrink.iceType }}</li>
                <li>{{ selectedDrink.iceGoal }}</li>
              </ul>
            </div>
            <div class="tools-block">
              <strong>操作要点</strong>
              <ol>
                <li v-for="tip in selectedDrink.keySteps" :key="tip">{{ tip }}</li>
              </ol>
            </div>
          </div>
        </article>
      </section>

      <section class="tools-ice-lab" aria-label="球冰与薄冰制作指南">
        <header>
          <h2>球冰与薄冰实战</h2>
          <p>冰型会直接影响降温速度、稀释量、口感和视觉表现。下面给出在家可复现的做法。</p>
        </header>

        <div class="tools-ice-grid">
          <article class="tools-ice-card">
            <h3>透明球冰（Whiskey Sphere）</h3>
            <div class="tools-block">
              <strong>推荐做法（定向冻结）</strong>
              <ol>
                <li>用小保温箱装水，顶部保持敞开，放入冷冻室 18-30 小时。</li>
                <li>当上层冻结、底部仍有液水时取出，脱模后切掉底部浑浊层。</li>
                <li>将透明冰块切成适合尺寸，再用球冰模压制，或直接雕成球形。</li>
                <li>装入密封袋回冻，避免吸附冷冻室异味。</li>
              </ol>
            </div>
            <div class="tools-block">
              <strong>进阶优化</strong>
              <ul>
                <li>优先用过滤水，减少杂质和异味来源。</li>
                <li>避免“全冻透”后再切，保留底部未冻区更容易得到高透冰层。</li>
                <li>出杯前先用水快速冲洗表面霜层，视觉更通透。</li>
              </ul>
            </div>
            <div class="tools-block">
              <strong>可达到的效果</strong>
              <ul>
                <li>同体积下球体表面积更小，融化更慢，适合慢饮型酒款。</li>
                <li>酒体温度下降稳定，稀释更可控，尾段不会快速变水。</li>
                <li>透明度高，出杯观感明显提升，适合 Old Fashioned / Negroni on rocks。</li>
              </ul>
            </div>
          </article>

          <article class="tools-ice-card">
            <h3>薄冰（碎冰 / Pebble Ice）</h3>
            <div class="tools-block">
              <strong>推荐做法（Lewis Bag 或毛巾敲碎）</strong>
              <ol>
                <li>先用标准冰块冷冻到足够硬，避免半融化状态直接使用。</li>
                <li>放入 Lewis 袋（或厚毛巾包裹），用木槌敲到 4-8mm 颗粒。</li>
                <li>需要更细时再轻敲一次，避免打成雪状导致过快融水。</li>
                <li>立即用于出杯或短时回冻，保持“干爽碎冰”状态。</li>
              </ol>
            </div>
            <div class="tools-block">
              <strong>进阶优化</strong>
              <ul>
                <li>先把杯具预冷，可降低薄冰初始融化速度。</li>
                <li>分层补冰：先铺底冰再堆顶冰，能更持久保持“霜感外观”。</li>
                <li>使用布袋而非塑料袋，能吸掉表面水分，减少“湿塌”口感。</li>
              </ul>
            </div>
            <div class="tools-block">
              <strong>可达到的效果</strong>
              <ul>
                <li>高表面积带来快速降温和更快稀释，能迅速软化酒精刺激感。</li>
                <li>适合 Julep、Swizzle、Tiki、Mojito 等需要“冰感包裹”的配方。</li>
                <li>能增强入口清凉与绵密口感，但不适合需要慢稀释的烈酒型短饮。</li>
              </ul>
            </div>
          </article>
        </div>

        <div class="tools-ice-matrix" aria-label="冰型效果对照">
          <article>
            <h4>球冰（大冰）</h4>
            <ul>
              <li>降温：稳步降温，持续时间长</li>
              <li>稀释：慢，适合烈酒型短饮</li>
              <li>推荐：Old Fashioned、Negroni on rocks</li>
            </ul>
          </article>
          <article>
            <h4>标准方冰</h4>
            <ul>
              <li>降温：中等速度，平衡性好</li>
              <li>稀释：中等，适合大多数 on rocks</li>
              <li>推荐：Highball、Gin &amp; Tonic</li>
            </ul>
          </article>
          <article>
            <h4>薄冰 / 碎冰</h4>
            <ul>
              <li>降温：最快，入口瞬间冰凉</li>
              <li>稀释：快，适合需要“雪感”的配方</li>
              <li>推荐：Mint Julep、Swizzle、Tiki</li>
            </ul>
          </article>
        </div>

        <p class="tools-reference">
          内容依据公开调酒资料整理：定向冻结（Directional Freezing）用于透明冰；薄冰/碎冰用于高降温与高稀释风格。
        </p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";

const tools = [
  {
    name: "波士顿摇壶",
    english: "Boston Shaker",
    intro: "由金属壶和混合杯组成，适合需要快速降温和充分充气的鸡尾酒。",
    useCases: ["Whiskey Sour", "Margarita", "Daiquiri"],
    steps: [
      "将基酒、辅料和冰块依次加入混合杯。",
      "扣上金属壶并轻敲密封。",
      "双手握住上下两端，水平快速摇晃 10-15 秒。",
      "用滤冰器过滤到目标杯中。",
    ],
    tips: ["装冰后再摇，避免提前稀释。", "开壶时敲击壶身侧面最容易脱开。"],
  },
  {
    name: "量酒器",
    english: "Jigger",
    intro: "控制配方比例最关键的器具，常见规格为 15/30ml 或 25/50ml。",
    useCases: ["任何标准配方鸡尾酒", "需要复刻同一风味时"],
    steps: [
      "确认配方单位和量杯刻度一致。",
      "水平持杯，液面与刻度线平齐。",
      "沿壶壁缓慢倒入，减少飞溅和损耗。",
    ],
    tips: ["不要凭手感倒酒，新手误差会明显偏大。", "每次使用后清水冲净，避免味道残留。"],
  },
  {
    name: "吧勺",
    english: "Bar Spoon",
    intro: "主要用于搅拌法鸡尾酒，能精准控制稀释速度和液体融合。",
    useCases: ["Martini", "Negroni", "Old Fashioned"],
    steps: [
      "将冰块和原料放入调酒杯。",
      "吧勺背面贴杯壁，保持稳定圆周搅拌。",
      "持续 20-30 秒，达到目标温度后过滤出杯。",
    ],
    tips: ["重点是稳定而非用力。", "勺背贴壁可减少冰块破碎和浑浊。"],
  },
  {
    name: "滤冰器",
    english: "Strainer",
    intro: "用于分离冰块、果肉和香料碎片，保证酒体口感干净。",
    useCases: ["摇和法过滤", "双重过滤", "澄清口感需求"],
    steps: [
      "将滤冰器扣在摇壶或调酒杯口。",
      "手指压住弹簧位，倾斜慢速出液。",
      "需要更干净口感时，配合细滤网二次过滤。",
    ],
    tips: ["过滤时动作要稳，避免冰块滑出。", "弹簧变形会影响贴合度，需及时更换。"],
  },
  {
    name: "捣棒",
    english: "Muddler",
    intro: "用于压释放香草、水果和糖，常见于清爽型或风味强化鸡尾酒。",
    useCases: ["Mojito", "Caipirinha", "水果特调"],
    steps: [
      "将薄荷/水果放入杯底。",
      "轻压并短促旋转，释放香气与汁液。",
      "加入冰与其余原料后继续调制。",
    ],
    tips: ["薄荷不要猛捣，过度会出苦味。", "先压后摇，香气层次更清晰。"],
  },
  {
    name: "调酒杯",
    english: "Mixing Glass",
    intro: "用于搅拌法，透明杯体便于观察稀释与澄清度。",
    useCases: ["Spirit-forward 鸡尾酒", "不需要打发空气的配方"],
    steps: [
      "先加冰预冷杯体。",
      "倒掉融水后加入原料再次加冰。",
      "吧勺搅拌到杯壁起雾后过滤出杯。",
    ],
    tips: ["使用大冰块可减慢稀释速度。", "先预冷能显著提升出杯稳定度。"],
  },
  {
    name: "柑橘压汁器",
    english: "Citrus Press",
    intro: "用于快速挤取新鲜柠檬/青柠汁，是酸感干净与香气新鲜的关键。",
    useCases: ["Daiquiri", "Margarita", "Whiskey Sour"],
    steps: [
      "柑橘先回温再对半切开，减少出汁损耗。",
      "切面朝下放入压汁器，缓慢均匀施压。",
      "按配方现挤现用，避免提前氧化。",
    ],
    tips: ["酸味原料尽量不提前批量挤。", "压完及时清洗，防止果酸腐蚀。"],
  },
  {
    name: "细滤网",
    english: "Fine Mesh Strainer",
    intro: "与滤冰器配合进行双重过滤，去除冰渣、果肉和香草碎屑。",
    useCases: ["含果汁 Sour", "蛋白类鸡尾酒", "捣压香草配方"],
    steps: [
      "先用 Hawthorne/Julep 做第一道过滤。",
      "再通过细滤网入杯，动作连续避免多余融冰。",
      "若网面堵塞，轻敲网沿让液体继续通过。",
    ],
    tips: ["双重过滤能显著提升口感干净度。", "过滤过慢会导致过度稀释。"],
  },
];

const drinkMatches = [
  {
    id: "old-fashioned",
    name: "Old Fashioned",
    style: "烈酒主导、慢饮型短饮，强调香气层次和低稀释。",
    recommendedTools: ["量酒器", "调酒杯", "吧勺", "滤冰器"],
    iceType: "透明球冰（优先）或大方冰",
    iceGoal: "慢速稀释，保持酒体骨架和尾段香气。",
    keySteps: ["先预冷杯具与冰块。", "搅拌至顺滑但不过度稀释。", "入杯后用橙皮喷油收尾。"],
  },
  {
    id: "negroni",
    name: "Negroni",
    style: "苦甜平衡、酒精感明确，适合较稳的降温曲线。",
    recommendedTools: ["量酒器", "调酒杯", "吧勺", "滤冰器"],
    iceType: "大方冰或透明球冰",
    iceGoal: "控制稀释速度，避免前段过快变薄。",
    keySteps: ["严格等量配比。", "搅拌法 20-30 秒。", "优先使用完整大冰，减少碎冰接触面。"],
  },
  {
    id: "whiskey-sour",
    name: "Whiskey Sour",
    style: "酸甜平衡并带泡沫口感，风味变化快。",
    recommendedTools: ["量酒器", "波士顿摇壶", "滤冰器", "细滤网"],
    iceType: "摇和时标准冰；出杯可无冰或小方冰",
    iceGoal: "快速降温并获得适量稀释，口感更柔和。",
    keySteps: ["先干摇再加冰湿摇（如含蛋白）。", "双重过滤保持细腻口感。", "控制摇壶时间，避免后段过水。"],
  },
  {
    id: "mint-julep",
    name: "Mint Julep",
    style: "高冷感、清凉感强，依赖冰型参与风味构建。",
    recommendedTools: ["量酒器", "捣棒", "吧勺"],
    iceType: "薄冰 / 碎冰（Pebble）",
    iceGoal: "快速降温和高稀释，形成“霜杯”体验。",
    keySteps: ["薄荷轻压不猛捣。", "分层补碎冰并轻压成型。", "顶部继续补冰形成冰帽。"],
  },
  {
    id: "mojito",
    name: "Mojito",
    style: "清爽高球类，强调薄荷与青柠的即时香气。",
    recommendedTools: ["量酒器", "捣棒", "吧勺", "柑橘压汁器"],
    iceType: "薄冰 / 碎冰或小块冰",
    iceGoal: "快速降温，带来高清凉感和轻快口感。",
    keySteps: ["先压出青柠汁再轻压薄荷。", "加入碎冰后短搅拌。", "最后补苏打并顶部再覆一层冰。"],
  },
];

const selectedDrinkId = ref(drinkMatches[0].id);
const selectedDrink = computed(() => drinkMatches.find((item) => item.id === selectedDrinkId.value) || null);
</script>

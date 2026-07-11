<template>
  <main class="cocktail-create-page">
    <header class="cocktail-create-nav">
      <RouterLink to="/cocktails">← 返回调酒菜单</RouterLink>
      <RouterLink to="/menu">功能菜单</RouterLink>
    </header>

    <section class="cocktail-create-hero">
      <p class="eyebrow">Create a Cocktail</p>
      <h1>新增调酒<span>完整填写酒款档案</span></h1>
      <p>所有字段将严格对应酒款详情页中的名称、故事、命名、基酒与风味、图片和调酒配方。</p>
    </section>

    <section class="cocktail-create-layout">
      <form class="cocktail-create-form" @submit.prevent="submitCocktail">
        <div class="cocktail-create-section">
          <div class="cocktail-create-section-title">
            <span>01</span>
            <h2>基本资料</h2>
          </div>
          <div class="cocktail-create-fields cocktail-create-fields--two">
            <label>
              英文名称 / Name
              <input v-model.trim="form.name" type="text" minlength="2" maxlength="60" placeholder="Whiskey Sour" required />
            </label>
            <label>
              中文名称 / Chinese Name
              <input v-model.trim="form.zhName" type="text" minlength="1" maxlength="40" placeholder="威士忌酸" required />
            </label>
            <label>
              酒单分类 / Category
              <select v-model="form.category" required>
                <option value="classic">Classic / 经典</option>
                <option value="signature">Signature / 特调</option>
                <option value="nonalcoholic">No Alcohol / 无酒精</option>
              </select>
            </label>
            <label>
              基酒分类 / Base Spirit
              <select v-model="form.base" required>
                <option value="whiskey">Whiskey / 威士忌</option>
                <option value="gin">Gin / 金酒</option>
                <option value="rum">Rum / 朗姆</option>
                <option value="tequila">Tequila / 龙舌兰</option>
                <option value="vodka">Vodka / 伏特加</option>
                <option value="none">No Base / 无基酒</option>
              </select>
            </label>
          </div>
          <label>
            本地酒款图片 / Image File
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              required
              @change="selectImage"
            />
            <small>支持 JPG、JPEG、PNG，最大 5MB。建议使用竖版图片。</small>
            <small v-if="selectedImageFile">{{ selectedImageFile.name }} · {{ formatFileSize(selectedImageFile.size) }}</small>
          </label>
        </div>

        <div class="cocktail-create-section">
          <div class="cocktail-create-section-title">
            <span>02</span>
            <h2>酒款介绍</h2>
          </div>
          <label>
            酒款故事 / Story
            <textarea
              v-model.trim="form.story"
              rows="5"
              minlength="20"
              maxlength="800"
              placeholder="介绍酒款的诞生背景、文化来源与饮用场景……"
              required
            ></textarea>
            <small>{{ form.story.length }} / 800，至少 20 字。</small>
          </label>
          <label>
            命名 / Naming
            <textarea
              v-model.trim="form.naming"
              rows="3"
              minlength="10"
              maxlength="300"
              placeholder="说明中英文名称的来源与含义……"
              required
            ></textarea>
          </label>
          <label>
            基酒与风味 / Flavor Profile
            <input
              v-model.trim="form.profile"
              type="text"
              minlength="5"
              maxlength="200"
              placeholder="Bourbon / 柠檬 / 甜酸 / 酒体饱满"
              required
            />
          </label>
        </div>

        <div class="cocktail-create-section">
          <div class="cocktail-create-section-title">
            <span>03</span>
            <h2>调酒配方</h2>
          </div>
          <label>
            调制方式 / Method
            <input v-model.trim="form.method" type="text" minlength="2" maxlength="80" placeholder="摇和 Shake" required />
          </label>
          <label>
            配方材料 / Ingredients
            <textarea
              v-model="form.ingredients"
              rows="7"
              maxlength="1000"
              placeholder="波本威士忌 45 ml&#10;新鲜柠檬汁 25 ml&#10;糖浆 20 ml&#10;蛋清 20 ml（可选）"
              required
            ></textarea>
            <small>每行一种材料，必须填写 2–12 行，并写明用量或“适量”等说明。</small>
          </label>
        </div>

        <p class="cocktail-create-notice" :data-type="noticeType" role="status">{{ notice }}</p>
        <button class="cocktail-create-submit" type="submit" :disabled="working">
          {{ working ? "正在保存酒款…" : "发布到调酒菜单" }}
        </button>
      </form>

      <aside class="cocktail-create-preview">
        <p class="eyebrow">Detail Format Preview</p>
        <img
          v-if="imagePreviewUrl"
          class="cocktail-create-preview-image"
          :src="imagePreviewUrl"
          alt="待上传酒款图片预览"
        />
        <h3>{{ form.name || "Cocktail Name" }}<span>{{ form.zhName || "酒款中文名" }}</span></h3>
        <p class="cocktail-create-preview-story">{{ form.story || "酒款故事会显示在这里。" }}</p>
        <div>
          <section>
            <h4>命名</h4>
            <p>{{ form.naming || "名称来源与含义。" }}</p>
          </section>
          <section>
            <h4>基酒与风味</h4>
            <p>{{ form.profile || "基酒 / 香气 / 酸甜 / 口感" }}</p>
          </section>
        </div>
        <section class="cocktail-create-preview-recipe">
          <h4>调酒配方 <span>{{ form.method || "调制方式" }}</span></h4>
          <ul>
            <li v-for="item in previewIngredients" :key="item">{{ item }}</li>
          </ul>
        </section>
      </aside>
    </section>

    <LoginModal :open="loginModalOpen" message="请先登录账号，再新增调酒。" @close="loginModalOpen = false" />
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import LoginModal from "@/components/LoginModal.vue";
import { cocktails as staticCocktails } from "@/data/cocktails";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();
const working = ref(false);
const notice = ref("登录后即可把完整酒款资料发布到菜单。");
const noticeType = ref("info");
const loginModalOpen = ref(false);
const selectedImageFile = ref(null);
const imagePreviewUrl = ref("");
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

const form = reactive({
  name: "",
  zhName: "",
  category: "signature",
  base: "gin",
  story: "",
  naming: "",
  profile: "",
  method: "",
  ingredients: "",
});

const parsedIngredients = computed(() =>
  form.ingredients
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean),
);

const previewIngredients = computed(() =>
  parsedIngredients.value.length ? parsedIngredients.value : ["材料名称与用量", "装饰或辅料"],
);

onBeforeUnmount(clearImagePreview);

function clearImagePreview() {
  if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value);
  imagePreviewUrl.value = "";
}

function selectImage(event) {
  const file = event.target?.files?.[0] || null;
  clearImagePreview();
  selectedImageFile.value = null;

  if (!file) return;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    notice.value = "图片仅支持 JPG、JPEG 或 PNG 格式。";
    noticeType.value = "error";
    event.target.value = "";
    return;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    notice.value = "图片大小不能超过 5MB。";
    noticeType.value = "error";
    event.target.value = "";
    return;
  }

  selectedImageFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
  notice.value = "图片已选择，发布时会自动上传。";
  noticeType.value = "success";
}

function formatFileSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function submitCocktail() {
  if (!supabase) {
    notice.value = "Supabase 未配置，暂时无法发布酒款。";
    noticeType.value = "error";
    return;
  }

  await auth.refreshSession();
  if (!auth.user) {
    loginModalOpen.value = true;
    notice.value = "请先登录账号，再新增调酒。";
    noticeType.value = "error";
    return;
  }

  if (!selectedImageFile.value) {
    notice.value = "请选择一张 JPG 或 PNG 酒款图片。";
    noticeType.value = "error";
    return;
  }

  if (parsedIngredients.value.length < 2 || parsedIngredients.value.length > 12) {
    notice.value = "配方材料必须填写 2–12 行，每行一种材料。";
    noticeType.value = "error";
    return;
  }
  if (parsedIngredients.value.some((item) => item.length < 2 || item.length > 120)) {
    notice.value = "每条配方材料需为 2–120 个字符。";
    noticeType.value = "error";
    return;
  }
  if (staticCocktails.some((item) => item.name.toLowerCase() === form.name.toLowerCase())) {
    notice.value = "该英文名称已存在，请为新酒款使用唯一名称。";
    noticeType.value = "error";
    return;
  }

  working.value = true;
  notice.value = "正在上传酒款图片…";
  noticeType.value = "info";
  const extension = selectedImageFile.value.type === "image/png" ? "png" : "jpg";
  const uniqueName =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const imagePath = `${auth.user.id}/${uniqueName}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("cocktail-images")
    .upload(imagePath, selectedImageFile.value, {
      cacheControl: "31536000",
      contentType: selectedImageFile.value.type,
      upsert: false,
    });

  if (uploadError) {
    working.value = false;
    notice.value = `图片上传失败：${uploadError.message}`;
    noticeType.value = "error";
    return;
  }

  const { data: imageData } = supabase.storage.from("cocktail-images").getPublicUrl(imagePath);
  const imageUrl = imageData?.publicUrl || "";
  if (!imageUrl) {
    await supabase.storage.from("cocktail-images").remove([imagePath]);
    working.value = false;
    notice.value = "图片已上传，但无法获取公开地址。";
    noticeType.value = "error";
    return;
  }

  notice.value = "图片上传完成，正在保存酒款资料…";
  const { data, error } = await supabase
    .from("user_cocktails")
    .insert({
      name: form.name,
      zh_name: form.zhName,
      category: form.category,
      base: form.base,
      image: imageUrl,
      naming: form.naming,
      story: form.story,
      profile: form.profile,
      method: form.method,
      ingredients: parsedIngredients.value,
      user_id: auth.user.id,
      user_name: auth.profile.name,
    })
    .select("id")
    .single();
  working.value = false;

  if (error) {
    await supabase.storage.from("cocktail-images").remove([imagePath]);
    notice.value =
      error.code === "23505"
        ? "该英文名称已被使用，请更换后重试。"
        : `酒款发布失败：${error.message}`;
    noticeType.value = "error";
    return;
  }

  await router.push({ name: "cocktails", query: { created: data.id } });
}
</script>

<style scoped>
.cocktail-create-page {
  min-height: 100vh;
  padding: clamp(18px, 3vw, 42px);
  color: var(--ink);
  background:
    linear-gradient(rgba(251, 242, 223, 0.94), rgba(244, 229, 196, 0.96)),
    url("/assets/parchment-scroll.webp") center / cover fixed;
}

.cocktail-create-nav,
.cocktail-create-hero,
.cocktail-create-layout {
  width: min(1180px, 100%);
  margin-inline: auto;
}

.cocktail-create-nav {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.cocktail-create-nav a {
  color: var(--olive);
  font-weight: 700;
  text-decoration: none;
}

.cocktail-create-hero {
  padding: clamp(36px, 6vw, 72px) 0 30px;
}

.cocktail-create-hero h1 {
  color: var(--coffee);
  font-size: clamp(3.2rem, 7vw, 6.8rem);
}

.cocktail-create-hero h1 span {
  display: block;
  margin-top: 12px;
  color: var(--garlic);
  font-family: "Noto Serif SC", serif;
  font-size: clamp(1rem, 2vw, 1.5rem);
  letter-spacing: 0.12em;
}

.cocktail-create-hero > p:last-child {
  max-width: 760px;
  color: var(--muted);
  line-height: 1.8;
}

.cocktail-create-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);
  gap: 22px;
  align-items: start;
}

.cocktail-create-form,
.cocktail-create-preview {
  border: 1px solid var(--line);
  background: rgba(255, 248, 234, 0.88);
  box-shadow: var(--shadow);
}

.cocktail-create-form {
  display: grid;
  gap: 0;
}

.cocktail-create-section {
  display: grid;
  gap: 16px;
  padding: clamp(20px, 3vw, 34px);
  border-bottom: 1px solid var(--line);
}

.cocktail-create-section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cocktail-create-section-title span {
  color: var(--garlic);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
}

.cocktail-create-section-title h2 {
  color: var(--coffee);
  font-size: 2rem;
}

.cocktail-create-fields {
  display: grid;
  gap: 14px;
}

.cocktail-create-fields--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cocktail-create-form label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-family: "Noto Serif SC", serif;
  line-height: 1.5;
}

.cocktail-create-form input,
.cocktail-create-form select,
.cocktail-create-form textarea {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid rgba(52, 21, 15, 0.22);
  padding: 11px 13px;
  color: var(--ink);
  background: rgba(255, 252, 242, 0.8);
}

.cocktail-create-form textarea {
  resize: vertical;
  line-height: 1.7;
}

.cocktail-create-form small {
  color: var(--garlic);
  font-size: 0.72rem;
}

.cocktail-create-notice {
  margin: 22px 28px 0;
  border: 1px solid var(--line);
  padding: 11px 13px;
  color: var(--muted);
  background: rgba(245, 232, 203, 0.64);
}

.cocktail-create-notice[data-type="error"] {
  color: #9b261b;
  border-color: rgba(155, 38, 27, 0.35);
}

.cocktail-create-submit {
  margin: 16px 28px 28px;
  border: 1px solid var(--olive);
  padding: 14px 18px;
  color: var(--cream);
  font-weight: 800;
  letter-spacing: 0.1em;
  background: var(--olive);
}

.cocktail-create-submit:disabled {
  opacity: 0.55;
}

.cocktail-create-preview {
  position: sticky;
  top: 22px;
  display: grid;
  gap: 24px;
  padding: clamp(24px, 3vw, 38px);
}

.cocktail-create-preview h3 {
  color: var(--coffee);
  font-size: clamp(2.4rem, 4vw, 4rem);
}

.cocktail-create-preview-image {
  width: min(240px, 100%);
  aspect-ratio: 682 / 1024;
  object-fit: cover;
  object-position: center top;
  border: 1px solid var(--line);
  justify-self: center;
}

.cocktail-create-preview h3 span {
  display: block;
  margin-top: 8px;
  color: var(--garlic);
  font-size: 1rem;
  letter-spacing: 0.08em;
}

.cocktail-create-preview-story,
.cocktail-create-preview p {
  color: var(--muted);
  line-height: 1.8;
  white-space: pre-wrap;
}

.cocktail-create-preview > div {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cocktail-create-preview h4 {
  margin-bottom: 8px;
  color: var(--coffee);
  font-size: 1.35rem;
}

.cocktail-create-preview-recipe {
  border-top: 1px solid var(--line);
  padding-top: 20px;
}

.cocktail-create-preview-recipe h4 {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.cocktail-create-preview-recipe h4 span {
  color: var(--garlic);
  font-family: sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}

.cocktail-create-preview-recipe ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cocktail-create-preview-recipe li {
  border-bottom: 1px solid rgba(52, 21, 15, 0.12);
  padding: 7px 0;
  color: var(--muted);
}

@media (max-width: 900px) {
  .cocktail-create-layout {
    grid-template-columns: 1fr;
  }

  .cocktail-create-preview {
    position: relative;
    top: 0;
    order: -1;
  }
}

@media (max-width: 620px) {
  .cocktail-create-fields--two,
  .cocktail-create-preview > div {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <article
    v-if="cocktail"
    class="detail-card has-inline-photo"
    aria-live="polite"
  >
    <div class="detail-copy">
      <p class="eyebrow">
        {{ formatLabel(categoryLabels[cocktail.category]) }} ·
        {{ formatLabel(baseSpiritLabels[cocktail.base]) }}
      </p>

      <div class="detail-main with-photo">
        <div class="detail-text">
          <h3>{{ cocktail.name }}<span>{{ cocktail.zhName }}</span></h3>
          <p class="story">{{ cocktail.story }}</p>

          <div class="info-columns">
            <section>
              <h4>命名</h4>
              <p>{{ cocktail.naming }}</p>
            </section>
            <section>
              <h4>基酒与风味</h4>
              <p>{{ cocktail.profile }}</p>
            </section>
          </div>
        </div>

        <figure class="detail-inline-photo">
          <img
            v-if="cocktail.image"
            class="cocktail-photo"
            :src="cocktail.image"
            :alt="`${cocktail.name} / ${cocktail.zhName}`"
            loading="lazy"
            decoding="async"
          />
          <div v-else class="cocktail-photo-placeholder" aria-hidden="true">
            <span class="placeholder-mark">◇</span>
            <p>IMAGE</p>
            <span>{{ cocktail.zhName }}</span>
          </div>
        </figure>
      </div>

      <section class="recipe-box">
        <div class="section-title">
          <h4>调酒配方</h4>
          <span>{{ cocktail.method }}</span>
        </div>
        <ul>
          <li v-for="item in cocktail.ingredients" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section v-if="isUserCocktail(cocktail)" class="detail-owner-panel">
        <div>
          <p>用户投稿 / Community Recipe</p>
          <span>由 {{ cocktail.userName || "Member" }} 创建 · {{ formatDate(cocktail.createdAt) }}</span>
        </div>
        <div v-if="canEdit || canDelete" class="detail-owner-actions">
          <button v-if="canEdit" class="ghost-button" type="button" :disabled="deleting" @click="goEdit">
            编辑酒款
          </button>
          <button v-if="canDelete" class="review-delete" type="button" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? "正在删除…" : auth.isAdmin && !isOwner ? "管理员删除" : "删除酒款" }}
          </button>
        </div>
        <p v-if="actionNotice" class="detail-owner-notice" :data-type="actionNoticeType" role="status">
          {{ actionNotice }}
        </p>
      </section>

      <ReviewPanel :cocktail="cocktail" @need-login="$emit('need-login', $event)" />
    </div>
  </article>

  <article v-else class="detail-card">
    <div class="detail-copy">
      <p class="eyebrow">No Result</p>
      <h3>No Cocktail<span>暂无酒款</span></h3>
      <p class="story">没有找到匹配的酒款。可以尝试搜索 Whiskey、Gin、柠檬、热带或切换分类。</p>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { baseSpiritLabels, categoryLabels, formatLabel } from "@/data/cocktails";
import ReviewPanel from "@/components/ReviewPanel.vue";
import { supabase } from "@/lib/supabase";
import {
  canDeleteCocktail,
  canEditCocktail,
  deleteUserCocktail,
  isUserCocktail,
  removeCocktailImage,
} from "@/lib/user-cocktails";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  cocktail: { type: Object, default: null },
});

const emit = defineEmits(["deleted", "need-login"]);
const router = useRouter();
const auth = useAuthStore();
const deleting = ref(false);
const actionNotice = ref("");
const actionNoticeType = ref("info");
const isOwner = computed(() => props.cocktail?.userId === auth.user?.id);
const canEdit = computed(() => canEditCocktail(props.cocktail, auth.user));
const canDelete = computed(() => canDeleteCocktail(props.cocktail, auth.user, auth.isAdmin));

function formatDate(value) {
  if (!value) return "日期未知";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

async function goEdit() {
  await auth.refreshSession();
  if (!canEditCocktail(props.cocktail, auth.user)) {
    emit("need-login", "请登录酒款作者账号后再编辑。");
    return;
  }
  await router.push({ name: "cocktail-edit", params: { id: props.cocktail.id } });
}

async function confirmDelete() {
  if (!supabase) {
    actionNotice.value = "Supabase 未配置，暂时无法删除酒款。";
    actionNoticeType.value = "error";
    return;
  }

  await auth.refreshSession();
  if (!canDeleteCocktail(props.cocktail, auth.user, auth.isAdmin)) {
    emit("need-login", "请登录酒款作者账号后再删除。");
    return;
  }
  if (!window.confirm(`确定删除“${props.cocktail.name}”吗？此操作无法撤销。`)) return;

  deleting.value = true;
  actionNotice.value = "正在删除酒款资料…";
  actionNoticeType.value = "info";
  const { error } = await deleteUserCocktail(
    supabase,
    props.cocktail,
    auth.user.id,
    auth.isAdmin,
  );

  if (error) {
    deleting.value = false;
    actionNotice.value = `酒款删除失败：${error.message}`;
    actionNoticeType.value = "error";
    return;
  }

  const storageError = props.cocktail.image
    ? await removeCocktailImage(supabase, props.cocktail.image)
    : null;
  deleting.value = false;
  emit("deleted", {
    id: props.cocktail.id,
    warning: storageError ? "酒款已删除，但原图片清理失败，请稍后在 Storage 中检查。" : "",
  });
}
</script>

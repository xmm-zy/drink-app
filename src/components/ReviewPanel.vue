<template>
  <section class="review-panel" aria-label="酒款评论">
    <div class="section-title">
      <h4>酒友评论</h4>
      <span>{{ summaryText }}</span>
    </div>
    <p class="review-auth-hint" :data-type="hintType">{{ hint }}</p>
    <div v-if="auth.isLoggedIn" class="review-current-user">
      <span class="review-user-chip">
        <img v-if="auth.profile.avatarUrl" :src="auth.profile.avatarUrl" alt="当前账号头像" />
        <span v-else>{{ identityInitial(auth.profile.name) }}</span>
        <em>{{ auth.profile.name }}</em>
      </span>
    </div>

    <form class="review-form" @submit.prevent="submitReview">
      <label>
        评分 / Rating
        <input v-model.number="rating" type="number" min="0" max="10" step="0.1" required />
      </label>
      <label>
        评论 / Comment
        <textarea
          v-model="comment"
          rows="3"
          maxlength="500"
          placeholder="记录这杯酒的口感、香气或调酒心得，最多 500 字"
          required
        ></textarea>
      </label>
      <button type="submit">发布评论</button>
    </form>

    <div class="review-list">
      <article v-for="review in reviews" :key="review.id" class="review-item">
        <div>
          <strong>{{ review.rating.toFixed(1) }} / 10</strong>
          <span>
            <time>{{ formatReviewDate(review.date) }}</time>
            <span class="review-user-chip review-user-chip--small">
              <img v-if="review.userAvatar" :src="review.userAvatar" alt="评论账号头像" />
              <span v-else>{{ identityInitial(review.userName) }}</span>
              <em>{{ review.userName }}</em>
            </span>
            <button
              v-if="auth.user && (auth.isAdmin || review.userId === auth.user.id)"
              type="button"
              class="review-delete"
              @click="deleteReview(review.id)"
            >
              删除
            </button>
          </span>
        </div>
        <p>{{ review.comment }}</p>
        <button
          type="button"
          class="review-like"
          :class="{ liked: review.likedByCurrentUser }"
          @click="toggleLike(review)"
        >
          like · {{ review.likeCount || 0 }}
        </button>
      </article>

      <p v-if="!reviews.length" class="review-empty">还没有评论，成为第一个记录这杯酒的人。</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  cocktail: { type: Object, required: true },
});

const emit = defineEmits(["need-login"]);
const auth = useAuthStore();

const reviews = ref([]);
const rating = ref(8.0);
const comment = ref("");
const hint = ref("登录后可以发布评论和点赞。");
const hintType = ref("info");

const summaryText = computed(() => {
  if (!reviews.value.length) return "0 条评论";
  const average =
    reviews.value.reduce((total, item) => total + item.rating, 0) / reviews.value.length;
  return `${reviews.value.length} 条评论 · 平均 ${average.toFixed(1)} / 10`;
});

function identityInitial(name) {
  return String(name || "G")
    .trim()
    .slice(0, 1)
    .toUpperCase();
}

function formatReviewDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function loadReviews() {
  await auth.refreshSession();
  hint.value = auth.isLoggedIn
    ? "评论和点赞会绑定到当前头像与昵称。"
    : "请先登录账号，再发布评论或点赞。";
  hintType.value = auth.isLoggedIn ? "success" : "info";

  if (!supabase) {
    reviews.value = [];
    hint.value =
      "Supabase 未配置。请在 Cloudflare 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重新部署。";
    hintType.value = "error";
    return;
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("id,cocktail_name,cocktail_zh_name,rating,comment,user_id,user_email,user_name,user_avatar,created_at")
    .eq("cocktail_name", props.cocktail.name)
    .order("created_at", { ascending: false });

  if (error) {
    reviews.value = [];
    hint.value = `Supabase 评论表暂不可用：${error.message}。请先执行 supabase-setup.sql。`;
    hintType.value = "error";
    return;
  }

  const reviewIds = data.map((item) => item.id);
  let likes = [];
  if (reviewIds.length) {
    const { data: likeRows, error: likesError } = await supabase
      .from("review_likes")
      .select("review_id,user_id")
      .in("review_id", reviewIds);
    if (!likesError) likes = likeRows || [];
  }

  reviews.value = data.map((review) => {
    const reviewLikes = likes.filter((like) => like.review_id === review.id);
    return {
      id: review.id,
      rating: Number(review.rating),
      comment: review.comment,
      date: review.created_at,
      userId: review.user_id,
      userName: review.user_name || review.user_email || "Member",
      userAvatar: review.user_avatar || "",
      likeCount: reviewLikes.length,
      likedByCurrentUser: Boolean(
        auth.user && reviewLikes.some((like) => like.user_id === auth.user.id),
      ),
    };
  });
}

async function submitReview() {
  await auth.refreshSession();
  if (!supabase) {
    hint.value =
      "Supabase 未配置。请在 Cloudflare 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重新部署。";
    hintType.value = "error";
    return;
  }
  if (!auth.user) {
    hint.value = "请先登录账号，再发布评论。";
    hintType.value = "error";
    emit("need-login", "请先登录账号，再发布评论。");
    return;
  }

  if (
    !Number.isFinite(rating.value) ||
    rating.value < 0 ||
    rating.value > 10 ||
    !comment.value.trim() ||
    comment.value.trim().length > 500
  ) {
    return;
  }

  const normalizedRating = Math.round(rating.value * 10) / 10;
  const { error } = await supabase.from("reviews").insert({
    cocktail_name: props.cocktail.name,
    cocktail_zh_name: props.cocktail.zhName,
    rating: normalizedRating,
    comment: comment.value.trim(),
    user_id: auth.user.id,
    user_email: auth.user.email,
    user_name: auth.profile.name,
    user_avatar: auth.profile.avatarUrl || "",
  });

  if (error) {
    hint.value = `评论发布失败：${error.message}`;
    hintType.value = "error";
    return;
  }

  rating.value = normalizedRating;
  comment.value = "";
  await loadReviews();
}

async function toggleLike(review) {
  await auth.refreshSession();
  if (!supabase) {
    hint.value =
      "Supabase 未配置。请在 Cloudflare 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重新部署。";
    hintType.value = "error";
    return;
  }
  if (!auth.user) {
    hint.value = "请先登录账号，再点赞。";
    hintType.value = "error";
    emit("need-login", "请先登录账号，再点赞。");
    return;
  }

  const { error } = review.likedByCurrentUser
    ? await supabase
        .from("review_likes")
        .delete()
        .eq("review_id", review.id)
        .eq("user_id", auth.user.id)
    : await supabase.from("review_likes").insert({
        review_id: review.id,
        user_id: auth.user.id,
      });

  if (error) {
    hint.value = `点赞操作失败：${error.message}`;
    hintType.value = "error";
    return;
  }

  await loadReviews();
}

async function deleteReview(reviewId) {
  if (!supabase) {
    hint.value =
      "Supabase 未配置。请在 Cloudflare 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重新部署。";
    hintType.value = "error";
    return;
  }

  await auth.refreshSession();
  const review = reviews.value.find((item) => item.id === reviewId);
  if (!auth.user || !review || (!auth.isAdmin && review.userId !== auth.user.id)) {
    hint.value = "你没有权限删除这条评论。";
    hintType.value = "error";
    return;
  }
  if (!window.confirm("确定删除这条评论吗？此操作无法撤销。")) return;

  let query = supabase.from("reviews").delete().eq("id", reviewId);
  if (!auth.isAdmin) query = query.eq("user_id", auth.user.id);
  const { error } = await query;

  if (error) {
    hint.value = `评论删除失败：${error.message}`;
    hintType.value = "error";
    return;
  }

  await loadReviews();
}

watch(
  () => props.cocktail?.name,
  () => {
    if (props.cocktail) loadReviews();
  },
  { immediate: true },
);
</script>

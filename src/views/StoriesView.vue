<template>
  <div class="stories-forum-page">
    <main class="stories-forum-shell">
      <header class="stories-forum-header">
        <RouterLink to="/menu">返回功能菜单</RouterLink>
        <RouterLink to="/">返回首页</RouterLink>
      </header>

      <section class="stories-forum-hero">
        <p class="eyebrow">Drinking Stories Forum</p>
        <h1>喝酒故事论坛<span>Forum of Glass, City and Memory</span></h1>
        <p>分享酒吧见闻、酒单灵感、城市夜生活和杯中故事。支持发帖、收藏、回复、楼中楼回复与点赞。</p>
      </section>

      <section class="stories-forum-toolbar" aria-label="论坛筛选与排序">
        <nav class="stories-filter-tabs">
          <button
            v-for="item in categoryOptions"
            :key="item.value"
            type="button"
            :class="{ active: activeCategory === item.value }"
            @click="activeCategory = item.value"
          >
            {{ item.label }}
          </button>
        </nav>
        <nav class="stories-view-tabs">
          <button type="button" :class="{ active: viewMode === 'all' }" @click="viewMode = 'all'">全部帖子</button>
          <button type="button" :class="{ active: viewMode === 'mine' }" @click="viewMode = 'mine'">我发布的</button>
          <button type="button" :class="{ active: viewMode === 'favorites' }" @click="viewMode = 'favorites'">
            我收藏的
          </button>
        </nav>
        <label class="stories-sort">
          排序
          <select v-model="sortMode">
            <option value="latest">最新发布</option>
            <option value="hot">热度优先</option>
          </select>
        </label>
      </section>

      <section class="stories-forum-layout">
        <aside class="stories-compose">
          <div class="stories-compose-head">
            <h3>发布新帖</h3>
            <div class="stories-identity">
              <img v-if="actor.avatarUrl" :src="actor.avatarUrl" alt="当前账号头像" />
              <span v-else>{{ identityInitial(actor.name) }}</span>
              <em>{{ actor.name }}</em>
            </div>
          </div>
          <form @submit.prevent="submitPost">
            <label>
              标题
              <input v-model.trim="draftTitle" type="text" maxlength="60" placeholder="例如：东京酒吧巡礼中的三杯必点" required />
            </label>
            <label>
              分类
              <select v-model="draftCategory">
                <option v-for="item in categoryOptions.slice(1)" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </label>
            <label>
              内容
              <textarea
                v-model.trim="draftBody"
                rows="5"
                maxlength="500"
                placeholder="写下这杯酒背后的记忆、人物或城市气息..."
                required
              ></textarea>
            </label>
            <button type="submit" :disabled="isWorking">{{ isWorking ? "处理中..." : "发布帖子" }}</button>
          </form>
          <p class="stories-compose-tip">已接入 Supabase 同步。未登录时可浏览帖子，发帖与互动需要先登录。</p>
          <p class="stories-forum-notice" :data-type="noticeType">{{ notice }}</p>
        </aside>

        <section class="stories-feed" aria-live="polite">
          <article v-for="post in visiblePosts" :key="post.id" class="stories-post-card">
            <header>
              <span class="stories-post-tag">{{ categoryLabel(post.category) }}</span>
              <time>{{ formatDate(post.createdAt) }}</time>
            </header>
            <h3>{{ post.title }}</h3>
            <p>{{ post.body }}</p>
            <p class="stories-post-author">
              <span class="stories-author-chip">
                <img v-if="post.authorAvatarUrl" :src="post.authorAvatarUrl" alt="发布者头像" />
                <span v-else>{{ identityInitial(post.author) }}</span>
                <em>{{ post.author }}</em>
              </span>
            </p>
            <footer>
              <span>回复 {{ post.replies.length }}</span>
              <div>
                <button type="button" :class="{ liked: hasPostLiked(post) }" @click="togglePostLike(post.id)">
                  {{ hasPostLiked(post) ? "已赞" : "点赞" }} · {{ post.likes }}
                </button>
                <button type="button" :class="{ favored: hasPostFavorited(post) }" @click="toggleFavorite(post.id)">
                  {{ hasPostFavorited(post) ? "已收藏" : "收藏" }}
                </button>
                <button v-if="canDeleteContent(post.authorKey)" type="button" @click="deletePost(post)">
                  删除帖子
                </button>
              </div>
            </footer>

            <section class="stories-replies">
              <form class="stories-reply-form" @submit.prevent="submitReply(post.id)">
                <label>
                  {{ replyTargetHint(post.id) }}
                  <textarea
                    v-model.trim="replyDrafts[post.id].body"
                    rows="2"
                    maxlength="280"
                    placeholder="写下你的回复..."
                    required
                  ></textarea>
                </label>
                <div class="stories-reply-form-actions">
                  <button type="submit" :disabled="isWorking">{{ isWorking ? "处理中..." : "回复" }}</button>
                  <button v-if="replyDrafts[post.id].parentId" type="button" @click="clearReplyTarget(post.id)">
                    取消回复对象
                  </button>
                </div>
              </form>

              <div v-if="!post.replies.length" class="stories-reply-empty">还没有回复，来写第一条。</div>

              <div v-for="reply in visibleTopLevelReplies(post)" :key="reply.id" class="stories-reply-item">
                <div class="stories-reply-head">
                  <div class="stories-author-chip stories-author-chip--small">
                    <img v-if="reply.authorAvatarUrl" :src="reply.authorAvatarUrl" alt="回复者头像" />
                    <span v-else>{{ identityInitial(reply.author) }}</span>
                    <strong>{{ reply.author }}</strong>
                  </div>
                  <time>{{ formatDate(reply.createdAt) }}</time>
                </div>
                <p>{{ reply.body }}</p>
                <div class="stories-reply-actions">
                  <button type="button" :class="{ liked: hasReplyLiked(reply) }" @click="toggleReplyLike(reply.id)">
                    {{ hasReplyLiked(reply) ? "已赞" : "点赞" }} · {{ reply.likes }}
                  </button>
                  <button type="button" @click="setReplyTarget(post.id, reply)">回复此条</button>
                  <button v-if="canDeleteContent(reply.authorKey)" type="button" @click="deleteReply(reply)">
                    删除回复
                  </button>
                </div>

                <div v-for="child in childReplies(post, reply.id)" :key="child.id" class="stories-reply-item stories-reply-item--child">
                  <div class="stories-reply-head">
                    <div class="stories-author-chip stories-author-chip--small">
                      <img v-if="child.authorAvatarUrl" :src="child.authorAvatarUrl" alt="回复者头像" />
                      <span v-else>{{ identityInitial(child.author) }}</span>
                      <strong>{{ child.author }}</strong>
                    </div>
                    <time>{{ formatDate(child.createdAt) }}</time>
                  </div>
                  <p>{{ child.body }}</p>
                  <div class="stories-reply-actions">
                    <button type="button" :class="{ liked: hasReplyLiked(child) }" @click="toggleReplyLike(child.id)">
                      {{ hasReplyLiked(child) ? "已赞" : "点赞" }} · {{ child.likes }}
                    </button>
                    <button type="button" @click="setReplyTarget(post.id, child)">回复此条</button>
                    <button v-if="canDeleteContent(child.authorKey)" type="button" @click="deleteReply(child)">
                      删除回复
                    </button>
                  </div>
                </div>
              </div>

              <button
                v-if="topLevelReplies(post).length > 3"
                type="button"
                class="stories-expand-replies"
                @click="toggleRepliesExpanded(post.id)"
              >
                {{ repliesExpanded[post.id] ? "收起额外回复" : `展开其余 ${topLevelReplies(post).length - 3} 条回复` }}
              </button>
            </section>
          </article>

          <p v-if="!visiblePosts.length" class="stories-empty">
            {{
              viewMode === "mine"
                ? "你还没有发布过帖子。"
                : viewMode === "favorites"
                  ? "你还没有收藏帖子。"
                  : "当前分类还没有帖子，成为第一位发帖的人。"
            }}
          </p>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "drink_stories_forum_v2_fallback";
const VISITOR_KEY = "drink_stories_forum_actor_v1";
const auth = useAuthStore();

const categoryOptions = [
  { value: "all", label: "全部主题" },
  { value: "bar", label: "酒吧见闻" },
  { value: "recipe", label: "配方灵感" },
  { value: "city", label: "城市夜生活" },
  { value: "memory", label: "个人记忆" },
];

const activeCategory = ref("all");
const viewMode = ref("all");
const sortMode = ref("latest");
const draftTitle = ref("");
const draftCategory = ref("bar");
const draftBody = ref("");
const posts = ref([]);
const replyDrafts = ref({});
const repliesExpanded = ref({});
const isWorking = ref(false);
const notice = ref("论坛已连接 Supabase，多设备可同步。");
const noticeType = ref("info");

const seedPosts = [
  {
    id: "seed-1",
    title: "我在上海外滩喝到最惊艳的一杯 Negroni",
    body: "酒吧把橙皮提前喷油并做轻微烟熏，入口苦甜层次非常完整，尾段草本感拉得很长。",
    category: "city",
    author: "City Drinker",
    authorKey: "seed-city",
    createdAt: "2026-07-08T20:16:00.000Z",
    likes: 18,
    likedBy: [],
    favoritedBy: [],
    replies: [],
  },
  {
    id: "seed-2",
    title: "Whiskey Sour 里蛋清到底该不该放？",
    body: "我试了不放蛋清、干摇后放蛋清、反向摇和，泡沫稳定性和香气确实有区别，你们更偏好哪种？",
    category: "recipe",
    author: "Sour Lab",
    authorKey: "seed-sour",
    createdAt: "2026-07-09T09:42:00.000Z",
    likes: 25,
    likedBy: [],
    favoritedBy: [],
    replies: [],
  },
];

const actor = computed(() => {
  if (auth.user?.id) {
    return {
      key: auth.user.id,
      name: auth.profile.name || "Member",
      avatarUrl: auth.profile.avatarUrl || "",
    };
  }

  const cached = localStorage.getItem(VISITOR_KEY);
  if (cached) return { key: cached, name: "Guest Bartender", avatarUrl: "" };

  const generated = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  localStorage.setItem(VISITOR_KEY, generated);
  return { key: generated, name: "Guest Bartender", avatarUrl: "" };
});

function identityInitial(name) {
  return String(name || "G")
    .trim()
    .slice(0, 1)
    .toUpperCase();
}

const visiblePosts = computed(() => {
  let list =
    activeCategory.value === "all"
      ? posts.value
      : posts.value.filter((item) => item.category === activeCategory.value);

  if (viewMode.value === "mine") {
    list = list.filter((item) => item.authorKey === actor.value.key);
  } else if (viewMode.value === "favorites") {
    list = list.filter((item) => item.favoritedBy.includes(actor.value.key));
  }

  const sorted = [...list];
  if (sortMode.value === "hot") {
    sorted.sort((a, b) => hotScore(b) - hotScore(a));
  } else {
    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return sorted;
});

function hotScore(post) {
  const replyLikes = post.replies.reduce((total, item) => total + Number(item.likes || 0), 0);
  return post.likes + post.replies.length * 2 + replyLikes;
}

function categoryLabel(value) {
  return categoryOptions.find((item) => item.value === value)?.label || "未分类";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ensureReplyDraft(postId) {
  if (!replyDrafts.value[postId]) {
    replyDrafts.value[postId] = { body: "", parentId: null, targetLabel: "" };
  }
}

function topLevelReplies(post) {
  return [...post.replies]
    .filter((item) => !item.parentId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function visibleTopLevelReplies(post) {
  const all = topLevelReplies(post);
  if (repliesExpanded.value[post.id]) return all;
  return all.slice(0, 3);
}

function childReplies(post, parentId) {
  return [...post.replies]
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function toggleRepliesExpanded(postId) {
  repliesExpanded.value[postId] = !repliesExpanded.value[postId];
}

function setReplyTarget(postId, reply) {
  ensureReplyDraft(postId);
  replyDrafts.value[postId].parentId = reply.id;
  replyDrafts.value[postId].targetLabel = `回复 @${reply.author}`;
}

function clearReplyTarget(postId) {
  ensureReplyDraft(postId);
  replyDrafts.value[postId].parentId = null;
  replyDrafts.value[postId].targetLabel = "";
}

function replyTargetHint(postId) {
  ensureReplyDraft(postId);
  return replyDrafts.value[postId].targetLabel || "回复帖子";
}

function hasPostLiked(post) {
  return post.likedBy.includes(actor.value.key);
}

function hasPostFavorited(post) {
  return post.favoritedBy.includes(actor.value.key);
}

function hasReplyLiked(reply) {
  return reply.likedBy.includes(actor.value.key);
}

function canDeleteContent(authorKey) {
  return Boolean(auth.user && (auth.isAdmin || auth.user.id === authorKey));
}

async function ensureAuth(actionLabel) {
  await auth.refreshSession();
  if (auth.user) return true;
  notice.value = `请先登录账号，再${actionLabel}。`;
  noticeType.value = "error";
  return false;
}

function normalizeReply(raw) {
  return {
    id: raw.id,
    parentId: raw.parent_reply_id || null,
    author: raw.user_name || raw.user_email || "Member",
    authorAvatarUrl: raw.user_avatar || "",
    authorKey: raw.user_id,
    body: raw.body,
    createdAt: raw.created_at,
    likes: Number(raw.likes || 0),
    likedBy: Array.isArray(raw.likedBy) ? raw.likedBy : [],
  };
}

function normalizePost(raw) {
  return {
    id: raw.id,
    title: raw.title,
    body: raw.body,
    category: raw.category,
    author: raw.user_name || raw.user_email || "Member",
    authorAvatarUrl: raw.user_avatar || "",
    authorKey: raw.user_id,
    createdAt: raw.created_at,
    likes: Number(raw.likes || 0),
    likedBy: Array.isArray(raw.likedBy) ? raw.likedBy : [],
    favoritedBy: Array.isArray(raw.favoritedBy) ? raw.favoritedBy : [],
    replies: Array.isArray(raw.replies) ? raw.replies : [],
  };
}

function saveFallback() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts.value));
}

function loadFallback() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    posts.value = seedPosts;
  } else {
    try {
      const parsed = JSON.parse(raw);
      posts.value = Array.isArray(parsed) && parsed.length ? parsed : seedPosts;
    } catch {
      posts.value = seedPosts;
    }
  }
  posts.value.forEach((post) => ensureReplyDraft(post.id));
}

async function loadPostsFromSupabase() {
  if (!supabase) {
    notice.value = "Supabase 未配置，论坛以本地模式运行。";
    noticeType.value = "error";
    loadFallback();
    return;
  }

  isWorking.value = true;
  await auth.refreshSession();
  notice.value = auth.user ? `已连接 Supabase，同步账号：${actor.value.name}` : "已连接 Supabase，登录后可发帖和互动。";
  noticeType.value = "success";

  const { data: postRows, error: postError } = await supabase
    .from("stories_posts")
    .select("id,title,body,category,user_id,user_email,user_name,user_avatar,created_at")
    .order("created_at", { ascending: false });

  if (postError) {
    notice.value = `论坛表不可用：${postError.message}。请先执行 supabase/stories-forum-setup.sql。`;
    noticeType.value = "error";
    posts.value = seedPosts;
    isWorking.value = false;
    return;
  }

  const postIds = postRows.map((item) => item.id);
  const { data: replyRows } = postIds.length
    ? await supabase
        .from("stories_replies")
        .select("id,post_id,parent_reply_id,user_id,user_email,user_name,user_avatar,body,created_at")
        .in("post_id", postIds)
    : { data: [] };

  const replyIds = (replyRows || []).map((item) => item.id);
  const [{ data: postLikeRows }, { data: postFavoriteRows }, { data: replyLikeRows }] = await Promise.all([
    postIds.length
      ? supabase.from("stories_post_likes").select("post_id,user_id").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from("stories_post_favorites").select("post_id,user_id").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    replyIds.length
      ? supabase.from("stories_reply_likes").select("reply_id,user_id").in("reply_id", replyIds)
      : Promise.resolve({ data: [] }),
  ]);

  const mapped = postRows.map((post) => {
    const postLikes = (postLikeRows || []).filter((item) => item.post_id === post.id);
    const postFavorites = (postFavoriteRows || []).filter((item) => item.post_id === post.id);
    const replies = (replyRows || [])
      .filter((item) => item.post_id === post.id)
      .map((reply) => {
        const likes = (replyLikeRows || []).filter((item) => item.reply_id === reply.id);
        return normalizeReply({
          ...reply,
          likes: likes.length,
          likedBy: likes.map((item) => item.user_id),
        });
      });

    return normalizePost({
      ...post,
      likes: postLikes.length,
      likedBy: postLikes.map((item) => item.user_id),
      favoritedBy: postFavorites.map((item) => item.user_id),
      replies,
    });
  });

  posts.value = mapped;
  posts.value.forEach((post) => ensureReplyDraft(post.id));
  isWorking.value = false;
}

async function submitPost() {
  if (!draftTitle.value || !draftBody.value) return;

  if (!supabase) {
    posts.value.push({
      id: `post-${Date.now()}`,
      title: draftTitle.value,
      body: draftBody.value,
      category: draftCategory.value,
      author: actor.value.name,
      authorAvatarUrl: actor.value.avatarUrl,
      authorKey: actor.value.key,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      favoritedBy: [],
      replies: [],
    });
    draftTitle.value = "";
    draftBody.value = "";
    draftCategory.value = "bar";
    saveFallback();
    return;
  }

  if (!(await ensureAuth("发布帖子"))) return;
  isWorking.value = true;
  const { error } = await supabase.from("stories_posts").insert({
    title: draftTitle.value,
    body: draftBody.value,
    category: draftCategory.value,
    user_id: auth.user.id,
    user_email: auth.user.email || "",
    user_name: auth.profile.name,
    user_avatar: auth.profile.avatarUrl || "",
  });
  if (error) {
    notice.value = `发布失败：${error.message}`;
    noticeType.value = "error";
    isWorking.value = false;
    return;
  }
  draftTitle.value = "";
  draftBody.value = "";
  draftCategory.value = "bar";
  await loadPostsFromSupabase();
}

async function deletePost(post) {
  if (!supabase || !(await ensureAuth("删除帖子"))) return;
  if (!canDeleteContent(post.authorKey)) {
    notice.value = "你没有权限删除这个帖子。";
    noticeType.value = "error";
    return;
  }
  if (!window.confirm("确定删除这个帖子及其全部回复吗？此操作无法撤销。")) return;

  isWorking.value = true;
  let query = supabase.from("stories_posts").delete().eq("id", post.id);
  if (!auth.isAdmin) query = query.eq("user_id", auth.user.id);
  const { error } = await query;
  if (error) {
    notice.value = `删除失败：${error.message}`;
    noticeType.value = "error";
    isWorking.value = false;
    return;
  }
  notice.value = "帖子已删除。";
  noticeType.value = "success";
  await loadPostsFromSupabase();
}

async function deleteReply(reply) {
  if (!supabase || !(await ensureAuth("删除回复"))) return;
  if (!canDeleteContent(reply.authorKey)) {
    notice.value = "你没有权限删除这条回复。";
    noticeType.value = "error";
    return;
  }
  if (!window.confirm("确定删除这条回复吗？其楼中楼回复也会一并删除。")) return;

  isWorking.value = true;
  let query = supabase.from("stories_replies").delete().eq("id", reply.id);
  if (!auth.isAdmin) query = query.eq("user_id", auth.user.id);
  const { error } = await query;
  if (error) {
    notice.value = `删除失败：${error.message}`;
    noticeType.value = "error";
    isWorking.value = false;
    return;
  }
  notice.value = "回复已删除。";
  noticeType.value = "success";
  await loadPostsFromSupabase();
}

async function togglePostLike(postId) {
  if (!supabase) return;
  if (!(await ensureAuth("点赞"))) return;

  const target = posts.value.find((item) => item.id === postId);
  if (!target) return;
  const liked = target.likedBy.includes(actor.value.key);
  const { error } = liked
    ? await supabase.from("stories_post_likes").delete().eq("post_id", postId).eq("user_id", actor.value.key)
    : await supabase.from("stories_post_likes").insert({ post_id: postId, user_id: actor.value.key });
  if (error) {
    notice.value = `点赞失败：${error.message}`;
    noticeType.value = "error";
    return;
  }
  await loadPostsFromSupabase();
}

async function toggleFavorite(postId) {
  if (!supabase) return;
  if (!(await ensureAuth("收藏"))) return;
  const target = posts.value.find((item) => item.id === postId);
  if (!target) return;
  const favored = target.favoritedBy.includes(actor.value.key);
  const { error } = favored
    ? await supabase.from("stories_post_favorites").delete().eq("post_id", postId).eq("user_id", actor.value.key)
    : await supabase.from("stories_post_favorites").insert({ post_id: postId, user_id: actor.value.key });
  if (error) {
    notice.value = `收藏失败：${error.message}`;
    noticeType.value = "error";
    return;
  }
  await loadPostsFromSupabase();
}

async function submitReply(postId) {
  ensureReplyDraft(postId);
  const draft = replyDrafts.value[postId];
  if (!draft.body) return;

  if (!supabase) return;
  if (!(await ensureAuth("回复"))) return;

  isWorking.value = true;
  const { error } = await supabase.from("stories_replies").insert({
    post_id: postId,
    parent_reply_id: draft.parentId || null,
    user_id: auth.user.id,
    user_email: auth.user.email || "",
    user_name: auth.profile.name,
    user_avatar: auth.profile.avatarUrl || "",
    body: draft.body,
  });
  if (error) {
    notice.value = `回复失败：${error.message}`;
    noticeType.value = "error";
    isWorking.value = false;
    return;
  }
  replyDrafts.value[postId] = { body: "", parentId: null, targetLabel: "" };
  await loadPostsFromSupabase();
}

async function toggleReplyLike(replyId) {
  if (!supabase) return;
  if (!(await ensureAuth("点赞回复"))) return;
  const reply = posts.value.flatMap((item) => item.replies).find((item) => item.id === replyId);
  if (!reply) return;
  const liked = reply.likedBy.includes(actor.value.key);
  const { error } = liked
    ? await supabase.from("stories_reply_likes").delete().eq("reply_id", replyId).eq("user_id", actor.value.key)
    : await supabase.from("stories_reply_likes").insert({ reply_id: replyId, user_id: actor.value.key });
  if (error) {
    notice.value = `回复点赞失败：${error.message}`;
    noticeType.value = "error";
    return;
  }
  await loadPostsFromSupabase();
}

onMounted(async () => {
  await loadPostsFromSupabase();
});

watch(
  posts,
  (next) => {
    if (supabase) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    next.forEach((post) => ensureReplyDraft(post.id));
  },
  { deep: true },
);
</script>

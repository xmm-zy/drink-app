<template>
  <div class="account-page">
    <img
      class="account-side-image account-side-image--top-left"
      src="/assets/account-top-left.webp"
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
    />
    <img
      class="account-side-image account-side-image--top-right"
      src="/assets/account-top-right.webp"
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
    />
    <img
      class="account-side-image account-side-image--bottom-left"
      src="/assets/account-login-left.webp"
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
    />
    <img
      class="account-side-image account-side-image--bottom-right"
      src="/assets/account-login-right.webp"
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      fetchpriority="low"
    />
    <main class="account-shell">
      <section class="account-card">
        <p class="eyebrow">Luceria Account</p>
        <h1>Member Login<span>账号登录</span></h1>
        <p class="account-intro">
          使用 Supabase 邮箱登录。点击邮件中的魔法链接会回到当前网站；如果邮件模板加入了验证码，也可以直接输入验证码登录。
        </p>

        <form class="account-form" @submit.prevent="onVerify">
          <label>
            邮箱 / Email
            <input v-model="emailInput" type="email" placeholder="请输入邮箱地址" autocomplete="email" required />
          </label>
          <label>
            邮箱验证码 / Email Code
            <input
              v-model="codeInput"
              type="text"
              inputmode="numeric"
              placeholder="可选：邮件模板开启验证码后填写"
              autocomplete="one-time-code"
            />
          </label>
          <div class="account-form-actions">
            <button type="button" :disabled="auth.loading" @click="onSend">发送登录邮件</button>
            <button type="submit" :disabled="auth.loading">确认登录</button>
          </div>
        </form>

        <div class="account-status" :data-type="auth.statusType" role="status">
          {{ auth.status }}
        </div>

        <section v-if="auth.isLoggedIn" class="account-user">
          <span>当前用户 / Current User</span>
          <div class="account-user-profile">
            <img v-if="auth.profile.avatarUrl" :src="auth.profile.avatarUrl" alt="用户头像" />
            <span v-else>{{ profileInitial }}</span>
            <strong>{{ auth.profile.name }}</strong>
          </div>
          <form class="account-profile-form" @submit.prevent="onUpdateProfile">
            <label>
              昵称 / Nickname
              <input v-model.trim="nicknameInput" type="text" maxlength="24" placeholder="请输入昵称" required />
            </label>
            <label>
              头像链接 / Avatar URL
              <input
                v-model.trim="avatarInput"
                type="url"
                maxlength="500"
                placeholder="可选：粘贴头像图片链接"
                autocomplete="url"
              />
            </label>
            <div class="account-avatar-upload">
              <label>
                本地上传头像 / Upload
                <input
                  ref="avatarFileInputRef"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  :disabled="auth.loading || !auth.canUpdateProfile"
                  @change="onSelectAvatarFile"
                />
              </label>
              <button
                type="button"
                :disabled="auth.loading || !selectedAvatarFile || !auth.canUpdateProfile"
                @click="onUploadAvatar"
              >
                上传并填入链接
              </button>
            </div>
            <p class="account-profile-limit" :data-type="auth.canUpdateProfile ? 'ready' : 'locked'">
              {{
                auth.canUpdateProfile
                  ? "本周可修改 1 次资料：当前可以保存。"
                  : `本周修改次数已用完，下次可修改时间：${formatDateTime(auth.profileNextEditableAt)}`
              }}
            </p>
            <button type="submit" :disabled="auth.loading || !auth.canUpdateProfile">保存头像与昵称</button>
          </form>
          <button type="button" :disabled="auth.loading" @click="auth.logout()">退出登录 / Logout</button>
        </section>

        <div class="account-actions">
          <RouterLink to="/menu">返回功能菜单</RouterLink>
          <RouterLink to="/">返回首页</RouterLink>
          <RouterLink to="/cocktails">进入调酒菜单</RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const emailInput = ref("");
const codeInput = ref("");
const nicknameInput = ref("");
const avatarInput = ref("");
const avatarFileInputRef = ref(null);
const selectedAvatarFile = ref(null);
const profileInitial = computed(() => (auth.profile.name || "G").slice(0, 1).toUpperCase());

onMounted(async () => {
  const handled = await auth.handleAuthRedirect();
  if (!handled) await auth.refreshSession();
  syncProfileDraft();
});

async function onSend() {
  await auth.sendMagicLink(emailInput.value);
}

async function onVerify() {
  const ok = await auth.verifyEmailCode(emailInput.value, codeInput.value);
  if (ok) codeInput.value = "";
  syncProfileDraft();
}

function syncProfileDraft() {
  nicknameInput.value = auth.profile.name === "Guest Bartender" && !auth.user ? "" : auth.profile.name;
  avatarInput.value = auth.profile.avatarUrl || "";
  selectedAvatarFile.value = null;
  if (avatarFileInputRef.value) avatarFileInputRef.value.value = "";
}

function formatDateTime(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function onUpdateProfile() {
  const ok = await auth.updateProfile({
    displayName: nicknameInput.value,
    avatarUrl: avatarInput.value,
  });
  if (ok) syncProfileDraft();
}

function onSelectAvatarFile(event) {
  const file = event.target?.files?.[0] || null;
  selectedAvatarFile.value = file;
}

async function onUploadAvatar() {
  if (!selectedAvatarFile.value) return;
  const publicUrl = await auth.uploadAvatarFile(selectedAvatarFile.value);
  if (!publicUrl) return;
  avatarInput.value = publicUrl;
  selectedAvatarFile.value = null;
  if (avatarFileInputRef.value) avatarFileInputRef.value.value = "";
}

watch(
  () => auth.user?.id,
  () => {
    syncProfileDraft();
  },
);
</script>

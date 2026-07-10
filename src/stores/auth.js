import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { supabase } from "@/lib/supabase";

export const useAuthStore = defineStore("auth", () => {
  const PROFILE_UPDATE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
  const user = ref(null);
  const loading = ref(false);
  const status = ref("请先输入邮箱并发送登录邮件。");
  const statusType = ref("info");

  const isLoggedIn = computed(() => Boolean(user.value));
  const email = computed(() => user.value?.email || "");
  const profile = computed(() => {
    const metadata = user.value?.user_metadata || {};
    const name = String(metadata.display_name || "").trim();
    const avatar = String(metadata.avatar_url || "").trim();
    return {
      name: name || "Guest Bartender",
      avatarUrl: avatar,
    };
  });
  const profileLastUpdatedAt = computed(() => {
    const value = user.value?.user_metadata?.profile_updated_at;
    if (!value) return null;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  });
  const profileNextEditableAt = computed(() => {
    if (!profileLastUpdatedAt.value) return null;
    return profileLastUpdatedAt.value + PROFILE_UPDATE_COOLDOWN_MS;
  });
  const canUpdateProfile = computed(() => {
    if (!isLoggedIn.value) return false;
    if (!profileNextEditableAt.value) return true;
    return Date.now() >= profileNextEditableAt.value;
  });

  function setStatus(message, type = "info") {
    status.value = message;
    statusType.value = type;
  }

  function ensureSupabase() {
    if (supabase) return true;
    setStatus(
      "Supabase 未配置。请在 Cloudflare 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重新部署。",
      "error",
    );
    return false;
  }

  async function refreshSession() {
    if (!supabase) {
      user.value = null;
      return null;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setStatus(`读取登录状态失败：${error.message}`, "error");
      return null;
    }
    user.value = data.session?.user || null;
    if (user.value) {
      setStatus("账号已登录。评论和点赞会绑定到你的头像与昵称。", "success");
    }
    return user.value;
  }

  async function handleAuthRedirect() {
    if (!ensureSupabase()) return false;

    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    if (!code) return false;

    loading.value = true;
    setStatus("正在通过邮件链接登录...");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    loading.value = false;

    if (error) {
      setStatus(`邮件链接登录失败：${error.message}`, "error");
      return true;
    }

    window.history.replaceState({}, document.title, window.location.pathname);
    setStatus("已通过邮件链接登录成功。", "success");
    await refreshSession();
    return true;
  }

  async function sendMagicLink(rawEmail) {
    if (!ensureSupabase()) return false;

    const normalized = rawEmail.trim().toLowerCase();
    if (!normalized) {
      setStatus("请先输入邮箱地址。", "error");
      return false;
    }

    loading.value = true;
    setStatus("正在发送登录邮件...");
    const redirectTo = `${window.location.origin}/account`;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    loading.value = false;

    if (error) {
      setStatus(`登录邮件发送失败：${error.message}`, "error");
      return false;
    }

    setStatus(
      `登录邮件已发送到 ${normalized}。请点击邮件中的登录链接，或在模板开启验证码后输入验证码。`,
      "success",
    );
    return true;
  }

  async function verifyEmailCode(rawEmail, token) {
    if (!ensureSupabase()) return false;

    const normalized = rawEmail.trim().toLowerCase();
    const code = token.trim();
    if (!normalized || !code) {
      setStatus("请输入邮箱和邮件中的验证码。", "error");
      return false;
    }

    loading.value = true;
    setStatus("正在验证账号...");
    const { error } = await supabase.auth.verifyOtp({
      email: normalized,
      token: code,
      type: "email",
    });
    loading.value = false;

    if (error) {
      setStatus(`登录失败：${error.message}`, "error");
      return false;
    }

    await refreshSession();
    return true;
  }

  async function logout() {
    if (!ensureSupabase()) return false;

    loading.value = true;
    setStatus("正在退出登录...");
    const { error } = await supabase.auth.signOut();
    loading.value = false;

    if (error) {
      setStatus(`退出失败：${error.message}`, "error");
      return false;
    }

    user.value = null;
    setStatus("已退出登录。", "success");
    return true;
  }

  async function updateProfile({ displayName, avatarUrl }) {
    if (!ensureSupabase()) return false;
    await refreshSession();
    if (!user.value) {
      setStatus("请先登录账号，再修改资料。", "error");
      return false;
    }
    if (!canUpdateProfile.value) {
      const nextDate = new Date(profileNextEditableAt.value);
      const formatted = new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(nextDate);
      setStatus(`资料每周仅可修改一次，请在 ${formatted} 后重试。`, "error");
      return false;
    }

    const normalizedName = String(displayName || "").trim();
    if (!normalizedName) {
      setStatus("昵称不能为空。", "error");
      return false;
    }

    const normalizedAvatar = String(avatarUrl || "").trim();
    loading.value = true;
    setStatus("正在保存资料...");
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: normalizedName.slice(0, 24),
        avatar_url: normalizedAvatar.slice(0, 500),
        profile_updated_at: new Date().toISOString(),
      },
    });
    loading.value = false;

    if (error) {
      setStatus(`资料保存失败：${error.message}`, "error");
      return false;
    }

    await refreshSession();
    setStatus("头像与昵称已更新。", "success");
    return true;
  }

  async function uploadAvatarFile(file) {
    if (!ensureSupabase()) return null;
    await refreshSession();
    if (!user.value) {
      setStatus("请先登录账号，再上传头像。", "error");
      return null;
    }
    if (!canUpdateProfile.value) {
      const nextDate = new Date(profileNextEditableAt.value);
      const formatted = new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(nextDate);
      setStatus(`资料每周仅可修改一次，请在 ${formatted} 后重试。`, "error");
      return null;
    }
    if (!file) {
      setStatus("请选择一张头像图片。", "error");
      return null;
    }

    const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
    if (!allowedTypes.has(file.type)) {
      setStatus("头像仅支持 PNG / JPG / WEBP / GIF。", "error");
      return null;
    }
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setStatus("头像大小不能超过 3MB。", "error");
      return null;
    }

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${user.value.id}/avatar.${ext}`;
    loading.value = true;
    setStatus("正在上传头像...");
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type,
    });
    loading.value = false;

    if (uploadError) {
      setStatus(`头像上传失败：${uploadError.message}`, "error");
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = data?.publicUrl || "";
    if (!publicUrl) {
      setStatus("头像上传成功，但未获取到公开链接。", "error");
      return null;
    }
    setStatus("头像上传成功，请点击保存头像与昵称完成更新。", "success");
    return publicUrl;
  }

  function listenAuthChanges() {
    if (!supabase) return;
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null;
    });
  }

  return {
    user,
    loading,
    status,
    statusType,
    isLoggedIn,
    email,
    profile,
    canUpdateProfile,
    profileLastUpdatedAt,
    profileNextEditableAt,
    setStatus,
    refreshSession,
    handleAuthRedirect,
    sendMagicLink,
    verifyEmailCode,
    logout,
    updateProfile,
    uploadAvatarFile,
    listenAuthChanges,
  };
});

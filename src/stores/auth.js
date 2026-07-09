import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { supabase } from "@/lib/supabase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const loading = ref(false);
  const status = ref("请先输入邮箱并发送登录邮件。");
  const statusType = ref("info");

  const isLoggedIn = computed(() => Boolean(user.value));
  const email = computed(() => user.value?.email || "");

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
      setStatus("账号已登录。评论和点赞会绑定到这个邮箱。", "success");
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
    setStatus,
    refreshSession,
    handleAuthRedirect,
    sendMagicLink,
    verifyEmailCode,
    logout,
    listenAuthChanges,
  };
});

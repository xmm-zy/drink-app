const luceriaAuthClient = window.luceriaSupabase;

const accountForm = document.querySelector("#accountForm");
const emailInput = document.querySelector("#emailInput");
const codeInput = document.querySelector("#codeInput");
const sendCodeButton = document.querySelector("#sendCodeButton");
const verifyCodeButton = document.querySelector("#verifyCodeButton");
const accountStatus = document.querySelector("#accountStatus");
const accountUser = document.querySelector("#accountUser");
const currentUserEmail = document.querySelector("#currentUserEmail");
const logoutButton = document.querySelector("#logoutButton");

const getAccountRedirectUrl = () => `${window.location.origin}/account.html`;

const setStatus = (message, type = "info") => {
  accountStatus.textContent = message;
  accountStatus.dataset.type = type;
};

const setLoading = (isLoading) => {
  sendCodeButton.disabled = isLoading;
  verifyCodeButton.disabled = isLoading;
  logoutButton.disabled = isLoading;
};

const normalizeEmail = () => emailInput.value.trim().toLowerCase();

const clearAuthParamsFromUrl = () => {
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
};

const renderSession = async () => {
  const { data, error } = await luceriaAuthClient.auth.getSession();

  if (error) {
    setStatus(`读取登录状态失败：${error.message}`, "error");
    return;
  }

  const user = data.session?.user;
  accountUser.hidden = !user;
  currentUserEmail.textContent = user?.email || "未登录";

  if (user) {
    setStatus("账号已登录。评论和点赞会绑定到这个邮箱。", "success");
  }
};

const handleAuthRedirect = async () => {
  const query = new URLSearchParams(window.location.search);
  const code = query.get("code");

  if (!code) return false;

  setLoading(true);
  setStatus("正在通过邮件链接登录...");

  const { error } = await luceriaAuthClient.auth.exchangeCodeForSession(code);

  setLoading(false);

  if (error) {
    setStatus(`邮件链接登录失败：${error.message}`, "error");
    return true;
  }

  clearAuthParamsFromUrl();
  setStatus("已通过邮件链接登录成功。", "success");
  await renderSession();
  return true;
};

sendCodeButton.addEventListener("click", async () => {
  const email = normalizeEmail();

  if (!email) {
    setStatus("请先输入邮箱地址。", "error");
    return;
  }

  setLoading(true);
  setStatus("正在发送登录邮件...");

  const { error } = await luceriaAuthClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getAccountRedirectUrl(),
      shouldCreateUser: true,
    },
  });

  setLoading(false);

  if (error) {
    setStatus(`登录邮件发送失败：${error.message}`, "error");
    return;
  }

  setStatus(
    `登录邮件已发送到 ${email}。默认方式是点击邮件中的登录链接，链接会跳转到 ${getAccountRedirectUrl()}。如果邮件里没有验证码，需要在 Supabase 邮件模板中加入 {{ .Token }}。`,
    "success",
  );
  codeInput.focus();
});

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = normalizeEmail();
  const token = codeInput.value.trim();

  if (!email || !token) {
    setStatus("请输入邮箱和邮件中的验证码。如果邮件里没有验证码，请直接点击邮件中的登录链接。", "error");
    return;
  }

  setLoading(true);
  setStatus("正在验证账号...");

  const { error } = await luceriaAuthClient.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  setLoading(false);

  if (error) {
    setStatus(`登录失败：${error.message}`, "error");
    return;
  }

  codeInput.value = "";
  await renderSession();
});

logoutButton.addEventListener("click", async () => {
  setLoading(true);
  setStatus("正在退出登录...");

  const { error } = await luceriaAuthClient.auth.signOut();

  setLoading(false);

  if (error) {
    setStatus(`退出失败：${error.message}`, "error");
    return;
  }

  accountUser.hidden = true;
  currentUserEmail.textContent = "未登录";
  setStatus("已退出登录。", "success");
});

luceriaAuthClient.auth.onAuthStateChange(() => {
  renderSession();
});

(async () => {
  const handledRedirect = await handleAuthRedirect();
  if (!handledRedirect) {
    await renderSession();
  }
})();

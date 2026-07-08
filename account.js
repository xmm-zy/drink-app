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
    setStatus("账号已登录。", "success");
  }
};

sendCodeButton.addEventListener("click", async () => {
  const email = normalizeEmail();

  if (!email) {
    setStatus("请先输入邮箱地址。", "error");
    return;
  }

  setLoading(true);
  setStatus("正在发送确认邮件...");

  const { error } = await luceriaAuthClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href,
      shouldCreateUser: true,
    },
  });

  setLoading(false);

  if (error) {
    setStatus(`确认邮件发送失败：${error.message}`, "error");
    return;
  }

  setStatus("确认邮件已发送，请查看邮箱。可以点击邮件链接，或输入邮件中的验证码。", "success");
  codeInput.focus();
});

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = normalizeEmail();
  const token = codeInput.value.trim();

  if (!email || !token) {
    setStatus("请输入邮箱和邮箱验证码。", "error");
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

renderSession();

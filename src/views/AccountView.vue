<template>
  <div class="account-page">
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
          <strong>{{ auth.email }}</strong>
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
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const emailInput = ref("");
const codeInput = ref("");

onMounted(async () => {
  const handled = await auth.handleAuthRedirect();
  if (!handled) await auth.refreshSession();
});

async function onSend() {
  await auth.sendMagicLink(emailInput.value);
}

async function onVerify() {
  const ok = await auth.verifyEmailCode(emailInput.value, codeInput.value);
  if (ok) codeInput.value = "";
}
</script>

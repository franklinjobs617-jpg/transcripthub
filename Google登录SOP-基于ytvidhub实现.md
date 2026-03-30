# Google 登录 SOP（基于 `ytvidhub` 现有实现）

## 1. 目标

- 使用 **Google OAuth 弹窗**登录（小框）。
- 登录后拿到后端签发的 `jwt token` + `user`。
- 全站页面共享用户信息，不丢失（刷新后仍在）。
- 所有业务 API 自动带 `Authorization: Bearer <token>`。

---

## 2. 参考实现位置（原项目）

- `E:\前端 github\ytvidhub\ytvidhub\src\context\AuthContext.tsx`
- `E:\前端 github\ytvidhub\ytvidhub\src\components\LoginModel.tsx`
- `E:\前端 github\ytvidhub\ytvidhub\src\components\Header.tsx`
- `E:\前端 github\ytvidhub\ytvidhub\src\app\api\sync-user\route.ts`
- `E:\前端 github\ytvidhub\ytvidhub\src\lib\api.ts`

---

## 3. 标准流程（必须一致）

1. 用户点击 `Continue with Google`。
2. 前端 `window.open()` 打开 Google OAuth 授权页（`response_type=code`）。
3. Google 回调到你的后端：`/prod-api/g/callback`。
4. 后端完成：
   - 用 `code` 换 Google token
   - 拉取 Google 用户信息
   - 创建/更新你自己的用户
   - 生成你自己的 JWT
   - 在回调页执行 `window.opener.postMessage(...)`
5. 前端主窗口监听 `message`，拿到 `{ user, token }` 后写入：
   - `localStorage.auth_token`
   - `localStorage.loggedInUser`
6. `AuthContext` 更新内存态 `user`，Header/全页立即生效。
7. 启动时调用 `refreshUser()`，通过 `Bearer token` 拉最新积分与用户信息。

---

## 4. 数据契约（前后端统一）

### 4.1 LocalStorage 键名

- `auth_token`
- `loggedInUser`

### 4.2 `loggedInUser` 结构

```ts
interface User {
  name: string;
  picture: string;
  credits: number;
  googleUserId: string;
  email: string;
}
```

### 4.3 postMessage 数据格式（推荐）

后端 callback 页面发给 opener：

```js
window.opener.postMessage(
  { token: JSON.stringify({ user, token: jwtToken }) },
  "https://你的前端域名"
);
```

前端解析逻辑保持：

- `event.origin` 必须匹配后端域名
- `event.data.token` 必须是字符串 JSON

---

## 5. 实施步骤（下一次直接按这个做）

### Step A：AuthContext

- 建 `AuthContext`，对外提供：
  - `user`
  - `isLoading`
  - `login()`
  - `logout()`
  - `refreshUser()`
- 初始化：
  - 从 `localStorage.loggedInUser` 恢复 `user`
  - 若有 `auth_token`，首屏静默 `refreshUser()`
- `refreshUser()` 调：
  - `GET https://api.yourdomain.com/prod-api/g/getUser`
  - Header: `Authorization: Bearer ${token}`

### Step B：Google OAuth 弹窗登录

- `login()` 构造 URL：
  - `https://accounts.google.com/o/oauth2/v2/auth`
  - 参数：`client_id`、`redirect_uri`、`response_type=code`、`scope=openid email profile`、`prompt=select_account`
- 用 `window.open()` 打开 600x600 弹窗。
- `window.addEventListener("message", handler)` 监听回传。
- 验证 `event.origin === 后端域名` 后存储 token + user。

### Step C：登录弹窗 UI（小框）

- 做 `LoginModal`：
  - `isOpen`
  - `onClose`
  - `Continue with Google` 按钮调用 `login()`
- 登录成功后自动关闭弹窗（监听 `user` 变化）。

### Step D：Header 全局接入

- Header 从 `useAuth()` 读取 `user/isLoading/logout`。
- 未登录：显示 `Sign In` 按钮（打开弹窗）。
- 已登录：显示头像、积分、下拉菜单（History/Billing/Logout）。

### Step E：业务 API 自动带 token

- 做统一 fetch 包装（如 `authenticatedFetch`）：
  - 自动读取 `localStorage.auth_token`
  - 自动加 `Authorization`
- 所有需要登录的 API 统一走这个包装。

### Step F：布局注入 Provider

- 在根布局包裹 `<AuthProvider>{children}</AuthProvider>`。

---

## 6. 验收标准（上线前逐条勾）

- [ ] 点击登录后弹出 Google 小窗口。
- [ ] 登录完成后 Header 立即显示头像/积分。
- [ ] 刷新页面后用户状态仍存在。
- [ ] 任意页面切换用户状态不丢失。
- [ ] `refreshUser()` 能更新最新 `credits`。
- [ ] 需要登录的 API 都带了 `Authorization`。
- [ ] 退出登录后 token 和 user 都被清理。

---

## 7. 避坑清单（重点）

- 不要把 `GOOGLE_CLIENT_ID`、`BASE_URL`、`REDIRECT_URI` 写死在代码里，改环境变量。
- `message` 监听必须在成功/失败/弹窗关闭后移除，避免内存泄漏。
- `event.origin` 必须做严格校验。
- `logout()` 不建议强制 `window.location.reload()`，优先纯状态更新（体验更好）。
- `refreshUser()` 要做防抖或间隔限制（你现有实现已做，保留）。

---

## 8. 推荐环境变量命名（统一）

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_AUTH_BASE_URL`（如 `https://api.yourdomain.com`）
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`（如 `https://api.yourdomain.com/prod-api/g/callback`）

---

## 9. 结论

后续新项目一律按这份 SOP 实施，不再临时拼登录逻辑。  
核心原则：**后端掌控身份、前端只消费 JWT + user，并做全局状态同步。**

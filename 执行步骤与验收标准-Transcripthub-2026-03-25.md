# Transcripthub 执行步骤与验收标准（最终冻结版 v2）

**更新时间**：2026-03-25  
**适用范围**：`transcripthub.net` 全站（MVP 到正式上线）  
**文档性质**：SSOT（Single Source of Truth，唯一真相源）

---

## 0. 文档使用规则（防返工）

1. 任何需求变更，必须先改本文档，再改代码。
2. 未通过当前阶段 DoD，不允许进入下一阶段。
3. 影响转化漏斗/登录/支付/SEO 结构的改动，按 P0 处理，必须评审。
4. 本文档优先级高于临时口头需求。

---

## 1. 已冻结的不可变需求

### 1.1 账号与权限

- 必须支持 `Google Login`（OAuth）。
- 禁止在用户点击 `Generate` 前强制登录。
- 必须遵循漏斗顺序：`先体验 -> 触发截断 -> 点击升级 -> 登录 -> 支付 -> 解锁`。

### 1.2 支付

- 必须支持 `Stripe` 与 `PayPal`。
- 接入顺序：先 Stripe（主闭环），后 PayPal（补全支付偏好）。
- 上线前必须完成真实支付闭环，不接受“仅假门”公开发布。

### 1.3 视觉与品牌

- 禁止 AI 视觉语言（机器人、芯片电路、暗黑霓虹科幻风）。
- 风格：SaaS 效率工具风（干净、可信、可读）。
- 图标：仅用 `Lucide` 或 `Heroicons`（统一一套），禁止 emoji 作结构图标。
- 主题：必须有 `Light / Dark / System` 三模式，且双主题独立验收。

### 1.4 文案与语言

- 全站默认英文，面向海外用户。
- 文案必须兼顾 SEO 与可读性，不堆砌关键词。
- 所有关键交互与错误提示必须“下一步可执行”。

### 1.5 SEO 与站点策略

- 严格执行 Hub & Spoke：
  - Home 承载品牌与主词
  - Hub 承载平台核心词
  - Spoke 承接长尾词并反哺 Hub
- 首页内容必须丰富（至少 7 个模块）且保持首屏转化能力。

---

## 2. 标准用户操作路径（必须符合习惯）

## 2.1 免费体验路径（未登录）

1. 用户打开首页。
2. 看到输入框与 `Generate`（首屏可见）。
3. 粘贴 URL（支持正常链路与短链）。
4. 点击 `Generate`。
5. 进入结果页，看到加载阶段文本反馈。
6. 获得前 1 分钟可读 transcript。
7. 后续内容模糊，看到 `Upgrade` 与 `Export` 价值点。

### 验收标准

- 从首页到看到预览内容，最多 3 次主操作。
- 全程无需登录。
- 失败时有明确“如何修复”的提示，不出现裸 `500`。

## 2.2 升级付费路径（标准转化漏斗）

1. 用户在结果页点击 `Upgrade` / `Export SRT`。
2. 先出现 Plan Sheet（Monthly/Yearly/One-time）。
3. 用户选定套餐后：
   - 未登录：先拉起 Google Login
   - 已登录：直接进入支付渠道选择
4. 用户选择 `Stripe` 或 `PayPal` 完成支付。
5. 回跳 `/result?job=...`，自动刷新权限并解锁全文。

### 验收标准

- 从点击 Upgrade 到支付发起，最多 4 步。
- 支付成功后 3 秒内权益生效并自动解锁。
- 登录后必须回到原任务上下文（保留 transcript/job 状态）。

---

## 3. 执行阶段与输出物

## 阶段 A：产品与设计冻结（不写业务代码）

### Step A1 - 信息架构冻结

输出物：

- 页面地图：`/`、`/instagram-transcript`、`/tiktok-transcript`、`/facebook-transcript`、`/result`、`/pricing`。
- 每页目标：SEO 词、核心 CTA、转化动作。
- 首页模块顺序（建议）：  
  `Hero -> Input Tool -> Supported Platforms -> How It Works -> Why Us -> Use Cases -> FAQ -> Final CTA -> Disclaimer`。

验收标准：

- 无关键词抢词（Cannibalization）。
- 每个页面都能回答“用户为什么继续下一步”。

### Step A2 - 视觉系统冻结（Design Tokens）

输出物：

- 双主题颜色 token（含语义色：primary/success/warn/error/surface）。
- 字体系统（标题/正文/按钮/辅助文案）。
- 8pt 间距体系与栅格。
- 组件状态：`default/hover/focus/disabled/loading/error`。

验收标准：

- 主题切换无闪烁。
- 正文对比度 >= 4.5:1。
- 触控尺寸 >= 44px。
- 小屏移动端无横向滚动。

### Step A3 - 文案系统冻结（英文）

输出物：

- 首页全量英文文案（SEO 友好 + 可读）。
- 结果页、定价页、登录与支付文案。
- 错误与恢复文案：
  - Invalid URL
  - Private/Deleted/Region-restricted
  - Rate limited
  - Network timeout + Retry

验收标准：

- 非技术用户可秒懂。
- 所有错误都有下一步建议（Try another public link / Retry / Contact support）。

### Step A4 - API 合同与反滥用冻结

输出物：

- 前后端接口契约（提交、轮询/SSE、状态码、错误码）。
- URL 规范与短链展开策略：
  - 支持 `instagram.com`、`instagr.am`
  - 支持 `tiktok.com`、`vm.tiktok.com`、`vt.tiktok.com`
- Rate limiting 策略（IP + 指纹）。
- Webhook 幂等策略（支付回调防重复记账）。

验收标准：

- 错误码可被前端精确映射为用户文案。
- 防刷策略可保护 Whisper 成本不被脚本打爆。

---

## 阶段 B：MVP 开发（核心闭环）

### Step B1 - 转录链路

范围：
`URL -> 校验/展开短链 -> 抓取音频 -> Whisper -> 文本输出`

验收标准：

- 公开视频可稳定转录。
- 私密/失效链接友好失败，不抛裸 500。
- 加载时有阶段性反馈文案，避免用户刷新流失。

### Step B2 - 漏斗与登录

范围：

- 免费预览截断（前 1 分钟可读，后续 Blur）。
- 点击升级后先展示套餐选择，再登录，再支付。
- 登录后回跳原任务上下文。

验收标准：

- 未登录用户一定能体验到 Aha Moment。
- 登录不会打断用户任务。
- 支付前用户能清晰看到价格与权益。

### Step B3 - 支付闭环

范围：

- Stripe 订阅 + 一次性。
- PayPal 同档位接入。
- 支付成功回跳 + 权益即时生效 + 失败回退。

验收标准：

- 无“扣款成功但未开通”。
- 支付失败有 Retry 与联系入口。
- 账务状态与用户权限一致。

---

## 阶段 C：SEO 与增长落地

### Step C1 - On-page SEO

范围：

- 每页独立 TDK。
- H1/H2 语义结构。
- FAQ + JSON-LD。
- Hub 与 Spoke 内链闭环。

验收标准：

- 页面标题与目标词一致。
- 长尾词自然覆盖，不硬塞。
- 首页/Hub/Spoke 分工清晰。

### Step C2 - 埋点与漏斗监控

事件：

- `Paste_Click`
- `Generate_Click`
- `Result_Visible`
- `Upgrade_Click`
- `Plan_Selected`
- `Google_Login_Click`
- `Stripe_Checkout_Click`
- `PayPal_Checkout_Click`
- `Payment_Success`
- `Transcript_Copy_Click`

验收标准：

- 可复原完整漏斗：访问 -> 生成 -> 预览 -> 升级 -> 登录 -> 支付。
- 事件含必要参数：来源页、设备、语言、国家、是否登录、套餐类型。

---

## 4. 页面级 DoD（Definition of Done）

## 首页 `/`

- 任意小屏（含 iPhone SE）首屏必须完整展示：输入框 + `Generate`。
- 至少 7 个模块，且不影响首屏转化。
- 提供主题切换入口。
- Footer 含法律免责声明：  
  `Not affiliated with, endorsed, or sponsored by Instagram, Meta, TikTok, or ByteDance.`

## Hub 页面（`/instagram-transcript` 等）

- 顶部保留工具输入能力（不能做成纯文章页）。
- 对应平台词精准匹配，不与首页争抢主词。
- 含平台 FAQ 与反向内链到相关 Spoke。

## 结果页 `/result`

- 有三段以上处理状态文案反馈。
- 免费预览与模糊截断逻辑准确。
- 固定主 CTA：`Copy`（受限）与 `Upgrade`（高亮）。
- 登录/支付回跳后自动恢复并解锁。

## 定价页 `/pricing`

- 套餐、价格、权益、信用消耗规则一致。
- 支持 Stripe 与 PayPal 两入口。
- 展示月付/年付/一次性差异与推荐方案。

---

## 5. 合规、性能、可用性验收

### 合规

- Cookie/隐私提示（覆盖分析、OAuth、支付）。
- 隐私政策、服务条款、版权免责声明可访问。
- No Storage Policy 文案与实际行为一致。

### 性能

- 首页可交互时间合理（移动端优先）。
- 结果页加载过程中不“卡死”，有反馈。
- 避免 CLS，关键区域预留尺寸。

### 可用性

- 键盘可操作、焦点可见。
- 所有 icon-only 按钮有 `aria-label`。
- 动效支持 `prefers-reduced-motion`。
- 错误提示紧邻输入项并可读。

---

## 6. 上线门槛（Go/No-Go）

## 必须全部满足才允许公开上线

1. 首页首屏转化红线通过（移动端）。
2. 免费预览 -> 截断 -> 升级路径可用。
3. Google 登录可用且回跳正确。
4. Stripe 闭环可用（至少一个可付费套餐）。
5. PayPal 入口可用（可在上线后短期灰度，但必须已接入并可测试）。
6. 埋点漏斗完整可看。
7. 法务页与免责声明就位。

---

## 7. 迭代计划（避免与上线目标冲突）

### 迭代 1（内测，不公开投放）

- 完成阶段 A 全部冻结。
- 跑通阶段 B1 + B2（免费体验与登录回跳）。
- 接入 Stripe 沙盒与埋点。
- 目标：验证体验路径与错误边界。

### 迭代 2（可公开上线）

- Stripe 生产闭环。
- PayPal 接入并验证。
- SEO 基础页上线（Home + 3 Hub + 核心 FAQ）。
- 目标：开始获取真实流量与付费数据。

### 迭代 3（放量）

- Spoke 长尾矩阵扩容。
- A/B 测试 Upgrade 区块与价格展示。
- 优化 CAC 与转化率。

---

## 8. 当前执行口令（从今天开始）

- 所有开发任务先引用本文档对应条款。
- 不满足“用户操作路径标准”的实现一律退回。
- 若有新决策（例如新增 Apple 登录/地区定价），先更新本文档再实施。

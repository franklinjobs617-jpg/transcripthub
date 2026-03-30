# Transcripthub 支付后端 SOP（从 0 到 1，小白可落地）

> 适用场景：你要做一个**新的项目后端**，支持 Stripe + PayPal，前端只负责发起支付和展示结果，真正“是否到账、加多少积分”由后端决定。  
> 技术口径：Java + Spring Boot + MySQL（和你现有后端思路一致）。

---

## 1）先理解目标（先别写代码）

你最终要做到 4 件事：

1. 用户点击付费后，后端能创建支付（Stripe/PayPal）。
2. 用户支付完成后，后端能收到 webhook（官方回调）。
3. 后端根据 webhook 给用户发放权益（积分/套餐）。
4. 前端查询到最新用户信息，页面马上显示已到账。

一句话：**webhook 才是真相，前端返回成功不算最终成功。**

---

## 2）整体架构（推荐你就按这个）

```text
前端（Next.js）
   -> 调 /api/pay/create（你前端自己的 BFF）
      -> 转发到支付后端（Java）
支付后端（Java）
   -> 调 Stripe/PayPal 创建订单
用户支付
Stripe/PayPal webhook -> 支付后端
支付后端
   -> 幂等处理 -> 写支付记录 -> 发放积分/套餐
前端 success 页面
   -> 调 /api/pay/verify
   -> refreshUser() 拿最新积分
```

---

## 3）先把数据表建好（最关键）

下面是建议最小表结构（字段可以按你规范调整）：

### 3.1 `pay_order`（支付订单主表）

用途：记录每一笔支付创建、状态变化、渠道信息。

核心字段建议：
- `id`（主键）
- `user_id`（你系统用户 id）
- `site_type`（站点类型，避免多站串号）
- `channel`（`stripe` / `paypal`）
- `plan_code`（如 `pro_monthly` / `pro_yearly` / `payg_150`）
- `billing_cycle`（`monthly` / `yearly` / `once`）
- `amount`、`currency`
- `status`（`pending` / `paid` / `failed` / `canceled` / `refunded`）
- `provider_order_id`（Stripe sessionId 或 PayPal orderId/subscriptionId）
- `provider_customer_id`
- `paid_at`
- `raw_payload`（创建时原始返回，便于排查）
- `created_at`、`updated_at`

索引建议：
- `idx_user_site(user_id, site_type)`
- `uniq_provider_order(channel, provider_order_id)`（唯一，防重复）

### 3.2 `pay_webhook_event`（回调事件表）

用途：保证 webhook 幂等，不重复发放权益。

核心字段：
- `id`
- `channel`
- `event_id`（官方事件 id）
- `event_type`
- `processed`（0/1）
- `raw_payload`
- `created_at`

索引：
- `uniq_event(channel, event_id)`（唯一）

### 3.3 `user_entitlement_log`（权益变更流水）

用途：谁在什么时候加了多少积分，方便对账和售后。

核心字段：
- `id`
- `user_id`
- `site_type`
- `change_type`（`payment_grant` / `manual_fix` / `refund_revoke`）
- `credits_delta`
- `plan_before`、`plan_after`
- `order_id`
- `remark`
- `created_at`

---

## 4）配置项（环境变量必须先准备）

不要写死在代码里，全部放环境变量：

### 4.1 公共
- `APP_BASE_URL`
- `DB_URL` / `DB_USER` / `DB_PASS`
- `JWT_SECRET`

### 4.2 Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`（例如 `https://xxx.com/payment/success?session_id={CHECKOUT_SESSION_ID}`）
- `STRIPE_CANCEL_URL`

### 4.3 PayPal
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_BASE_URL`（sandbox 或 live）
- `PAYPAL_WEBHOOK_ID`

### 4.4 业务映射
- `PLAN_PRO_MONTHLY_PRICE_ID`
- `PLAN_PRO_YEARLY_PRICE_ID`
- `PLAN_PAYG_150_AMOUNT`

---

## 5）接口清单（你照这个写就能跑）

后端建议至少提供这 5 个接口：

### 5.1 `POST /pay/create`

前端入参：
```json
{
  "channel": "stripe",
  "planCode": "pro_yearly",
  "billingCycle": "yearly"
}
```

后端行为：
1. 校验登录用户、site_type、planCode 合法性。  
2. 根据 planCode 查价格映射。  
3. 创建本地订单（status=pending）。  
4. 调 Stripe/PayPal 创建支付。  
5. 把 `provider_order_id` 回写订单。  
6. 返回前端跳转信息。

返回示例：
```json
{
  "ok": true,
  "data": {
    "channel": "stripe",
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

### 5.2 `POST /pay/verify`

用途：支付成功页二次确认（不是最终发放入口，只是查询状态）。

入参：
```json
{
  "channel": "stripe",
  "sessionId": "cs_test_xxx"
}
```

返回：
```json
{
  "ok": true,
  "data": {
    "paymentStatus": "paid",
    "plan": "pro",
    "creditsDelta": 1000
  }
}
```

### 5.3 `POST /pay/portal`

用途：跳转 Stripe 客户门户（管理订阅）。

### 5.4 `GET /pay/orders`

用途：给 `/billing` 页面展示订单列表。

### 5.5 `POST /webhook/stripe`、`POST /webhook/paypal`

用途：处理官方回调，真正发放权益。

---

## 6）权益发放规则（必须后端统一）

做一张配置映射（建议数据库表或配置中心）：

| planCode | 计费类型 | 发放规则 |
|---|---|---|
| free | 免费 | 每月 3 credits |
| pro_monthly | 订阅 | 每月固定 credits |
| pro_yearly | 订阅 | 每年折算 credits（或按月发放） |
| payg_150 | 一次性 | 立即 +150，不过期 |

**重点：前端不允许自己算积分，永远以后端为准。**

---

## 7）webhook 正确写法（避免“付了钱没到账”）

### 7.1 Stripe webhook 基本流程
1. 验签（`STRIPE_WEBHOOK_SECRET`）。  
2. 取 `event.id`，先查 `pay_webhook_event` 是否已处理。  
3. 未处理才进入业务：  
   - 找到本地订单  
   - 更新订单状态为 paid  
   - 发放权益（积分/套餐）  
   - 写 `user_entitlement_log`  
4. 标记 event 已处理。  

### 7.2 PayPal webhook 基本流程
1. 按 PayPal 官方方式验签。  
2. 用 `resource.id` / `event.id` 做幂等。  
3. 只对成功事件发放权益（比如 `PAYMENT.CAPTURE.COMPLETED`）。  
4. 同样写订单状态 + 流水。

---

## 8）幂等（不做这个一定出事故）

必须保证“同一笔支付最多发一次权益”：

1. webhook 事件幂等：`uniq_event(channel, event_id)`  
2. 订单幂等：`uniq_provider_order(channel, provider_order_id)`  
3. 发放幂等：给 `user_entitlement_log` 加 `order_id + change_type` 唯一约束（可选）  

---

## 9）多站点隔离（你之前踩过的坑）

你有多个网站，不要让同邮箱用户混掉权益：

1. 用户查询必须带 `site_type`。  
2. 支付订单必须写 `site_type`。  
3. 发放权益时按 `user_id + site_type` 更新。  
4. 兼容旧站：旧接口不传 `site_type` 时走默认值（不破坏旧前端）。

---

## 10）错误码规范（前端才能显示清楚）

统一返回：

成功：
```json
{ "ok": true, "data": {} }
```

失败：
```json
{
  "ok": false,
  "error": {
    "code": "PAY_CREATE_FAILED",
    "message": "Failed to create checkout session.",
    "details": {}
  }
}
```

建议错误码：
- `AUTH_REQUIRED`
- `PLAN_INVALID`
- `PAY_CREATE_FAILED`
- `PAY_VERIFY_FAILED`
- `WEBHOOK_INVALID_SIGNATURE`
- `WEBHOOK_DUPLICATE`
- `ENTITLEMENT_GRANT_FAILED`
- `ORDER_NOT_FOUND`

---

## 11）最小代码结构建议（Java）

```text
controller/
  PayController.java
  StripeWebhookController.java
  PayPalWebhookController.java
service/
  PayService.java
  StripeService.java
  PayPalService.java
  EntitlementService.java
repository/mapper/
  PayOrderMapper.java
  PayWebhookEventMapper.java
  UserEntitlementLogMapper.java
domain/
  entity + dto + vo
```

职责分层：
- Controller：收参、鉴权、返回统一结构  
- Service：业务编排（创建订单、查状态、发权益）  
- Integration（Stripe/PayPal）：只做第三方 API 调用  
- Repository：只做数据库增删改查  

---

## 12）开发顺序（严格按顺序，最稳）

1. 建表 + 实体 + Mapper。  
2. 写 `POST /pay/create`（先只做 Stripe）。  
3. 写 Stripe webhook 并本地打通（能加积分）。  
4. 写 `POST /pay/verify` 和 `GET /pay/orders`。  
5. 再接 PayPal create + webhook。  
6. 接 `/pay/portal`。  
7. 联调前端 pricing、success、billing。  
8. 压测和回归。  

---

## 13）联调检查清单（你照着点）

### 13.1 正常路径
- 未登录点击购买 -> 提示登录  
- 已登录点击购买 -> 跳转支付  
- 支付成功 -> success 页 verify 成功  
- 用户 credits/plan 立即刷新  

### 13.2 异常路径
- 支付页取消 -> cancel 页可重试  
- webhook 重复推送 -> 不重复发放  
- verify 参数无效 -> 返回明确错误  
- 第三方超时 -> 前端可重试，不重复创建

### 13.3 对账路径
- 支付平台交易数 == 本地 paid 订单数  
- 本地 paid 订单数 == 权益发放流水数  

---

## 14）上线步骤（生产可执行版）

1. 先上测试环境：用 Stripe sandbox / PayPal sandbox 跑通全流程。  
2. 配置生产密钥，先灰度 5% 用户。  
3. 盯 3 个指标 30 分钟：  
   - create 失败率  
   - webhook 失败率  
   - verify 失败率  
4. 无异常再全量。  
5. 准备回滚开关：隐藏付费按钮，但保留 verify/webhook 路由。  

---

## 15）常见问题（小白最常遇到）

### Q1：前端 success 了但没到账？
因为 success 页面只是“支付完成回跳”，最终以 webhook 为准。先查 webhook 是否收到了、是否验签通过。

### Q2：为什么要写那么多日志？
支付是钱，出了问题必须能定位到“哪一步失败”。没日志就没法补单。

### Q3：同一个人多个网站登录，积分会串吗？
只要你全链路按 `user_id + site_type` 隔离，就不会串。

### Q4：能不能先不做 PayPal？
可以。建议先 Stripe 跑通再上 PayPal，风险最低。

---

## 16）给你的一份“明天就能开工”的任务单

### Day 1（后端核心）
- 建 3 张表  
- 完成 Stripe `create + webhook + verify`  
- 跑通本地支付到加积分

### Day 2（补齐渠道）
- 接 PayPal `create + webhook + verify`  
- 接 `/pay/orders` 和 `/pay/portal`

### Day 3（联调上线）
- 前端联调 pricing/success/billing  
- 回归测试 + 灰度上线

---

## 17）验收标准（必须全部满足）

1. 用户可完成 Stripe/PayPal 支付。  
2. 支付成功后 10 秒内看到最新权益。  
3. webhook 重复回调不会重复加积分。  
4. `/billing` 可看到订单历史。  
5. 错误码可读，客服可定位问题。  

---

如果你愿意，我下一步可以直接给你：
1）这 3 张表的可执行 MySQL SQL；  
2）`/pay/create`、`/pay/verify`、`/webhook/stripe` 的 Java Controller + Service 模板骨架。  

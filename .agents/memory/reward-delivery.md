---
name: Reward delivery
description: Durable rules for admin-issued rewards and Reward Assistant chat delivery.
---

Admin-issued rewards should be persisted as a reward record alongside the actual user balance or inventory mutation, a notification, an audit entry, and a Reward Assistant message. Assistant conversations must use the active root conversation schema and user conversation index, not nested legacy conversation paths.

**Why:** The user needs rewards and uploaded images to remain visible consistently across chat, notifications, history, and inventory rather than existing only in admin-page state.

**How to apply:** When adding reward types, extend the persisted payload and recipient renderer together; keep reward messages under `messages/{conversationId}` with `userConvs/{uid}/{conversationId}` indexing.
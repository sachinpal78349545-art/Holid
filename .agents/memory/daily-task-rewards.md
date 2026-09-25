---
name: Daily task rewards
description: Source of truth and reward behavior for daily tasks
---

Daily task progress and diamond rewards are owned by the Firebase-backed user service. UI panels should display the persisted task state and route users to the real action; they must not simulate progress or claim coins locally.

**Why:** Local task increments and a second UI claim flow can show false completion and award duplicate diamonds.

**How to apply:** Use the shared task-progress reader for display, keep action buttons navigational, and let the corresponding real app action update progress and award the reward once.
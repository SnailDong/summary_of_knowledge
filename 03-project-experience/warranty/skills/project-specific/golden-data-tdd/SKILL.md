---
name: golden-data-tdd
description: Generate golden test datasets from real staging data and use them for TDD across all layers (engine/admin/SDK/backend/dagster). Use this skill whenever the task involves writing tests, creating test fixtures, TDD development, adding new SmartPopup scenarios, fixing bugs that need regression tests, integration testing, or any mention of "golden data", "test data", "seed data", or "staging data for tests". Also use when someone says "write a test for X" or "add test coverage for Y" — golden data makes tests realistic and cross-platform consistent.
---

# Golden Data TDD

Generate golden test datasets from **real staging data**, then use them to drive **test-driven development** across all project layers.

Core principle: **AI discovers the data, AI generates the golden dataset, AI writes the tests first.**

## Why Golden Data

Synthetic test data drifts from reality. Golden data is extracted from staging's actual Snowplow events, so tests verify real payload structures, real context schemas, and real user behavior patterns. When all layers (engine, admin, SDK, backend, dagster) share the same golden fixture, cross-platform consistency is guaranteed.

## Workflow

### Phase 1: Discover — Find Real Data from DataHub + Staging

**Three-step discovery: Schema → Data → Payload inspection.**

#### Step 1: Schema Discovery（用 DataHub 找表和字段）

使用 `/datahub-schema-search` skill 搜索目标领域的表和字段：

```
# 按业务场景搜索相关的表
/datahub-schema-search 设备绑定失败
/datahub-schema-search solar panel battery
/datahub-schema-search 直播流异常
```

DataHub 返回的结果包括：
- 表的完整名称（`database.table_name`）
- 字段列表、类型、描述
- 数据血缘关系

从结果中识别：
- **原始事件表**：通常是 `analytics.dwd_event_<event_name>_hi` 或 `analytics.dwd_base_hi`
- **宽表/聚合表**：`analytics.dwm_*` 或 `analytics.dws_*`
- **字段结构**：了解 payload 里有哪些真实字段可用于 fact 条件

#### Step 2: Data Exploration（用 Superset 查实际数据）

基于 DataHub 发现的表结构，用 Superset skill 查询真实数据：

1. **确认事件存在和量级**：查目标事件的数量和用户分布
2. **找多事件用户**：threshold 测试需要同一用户有 2+ 个事件
3. **拉取完整事件行**：包含 unstruct_event、contexts 等原始字段

#### Step 3: Payload Inspection（检查真实数据结构）

**不要假设字段名。** 从拉取的事件数据中检查：

- `unstruct_event.data.data` — 实际的 payload 字段（如 `error_code`, `b_s`, `retry_count`）
- `contexts.data[].schema` — context vendor 和 schema 版本
- `contexts.data[].data` — context 字段（如 `sn`, `model`, `user_id`, `firmware_type`）

这些真实字段名决定了 golden RulesConfig 中 fact 的 `source.path` 和 `where` 条件。

### Phase 2: Generate — Build the Golden Dataset

A golden dataset JSON file contains four sections:

```json
{
  "_meta": {
    "source": "analytics_staging.dwd_base_hi",
    "extracted": "YYYY-MM-DD",
    "description": "What this dataset tests"
  },
  "events": [ /* raw dwd_base_hi rows */ ],
  "rules_config": {
    "schema_version": 3,
    "facts": [ /* EventCounter, BucketedWindowCounter, etc. */ ],
    "scenes": [ /* scene_id, entry_event, recipes with conditions */ ]
  },
  "rules_config_with_fatigue": { /* variant with MaxImpressions/MinInterval */ },
  "multi_user": {
    "users": {
      "user_a": { "user_id": "...", "events": [...], "expected_threshold_hit": true },
      "user_b": { "user_id": "...", "events": [...], "expected_threshold_hit": false }
    }
  },
  "expected": {
    "min_scene_entries": 4,
    "threshold_2_hit_after_event": 2,
    "threshold_4_hit_after_event": 4
  }
}
```

**Design the RulesConfig to match the real event's payload structure.** Inspect the `unstruct_event.data.data` to see what fields are available (e.g., `error_code`, `b_s`, `b_m`). Build facts that reference these real fields.

**Include multi-user data:** Pick 3 users with different event counts (1, 3, 4+) to test threshold boundaries and user isolation.

**Include a fatigue variant:** Same config but with `MaxImpressions(max=1)` to verify fatigue blocking.

### Phase 3: Place — Store and Distribute

```
e2e/golden-data/
  golden_<scenario>.json          ← SSOT

# Copies (not symlinks) for each test layer:
personalization_engine/test/fixtures/golden_<scenario>.json
admin/src/lib/__tests__/fixtures/golden_<scenario>.json
# dbt repo (separate):
dbt/tests/customer_care/fixtures/golden_<scenario>.json
```

### Phase 4: TDD — Red → Green → Refactor

**Strict TDD cycle. Never write implementation before the test.**

#### L1 Tests to Write (per golden dataset)

**Engine (JS)** — `personalization_engine/test/golden_<scenario>.test.js`
```
- Event parsing: all golden events have required fields
- Payload preservation: domain-specific fields survive round-trip
- Context extraction: base-schema sn/model present
- Engine initialize: subscribed_events includes entry event
- Dispatch all events: no fatal errors
- Threshold hit timing: hits on correct event number
- Multi-user isolation: independent counters per engine instance
- Fatigue blocking: MaxImpressions(1) blocks after first show
- Edge cases: empty payload, unknown event, null contexts
```

**Dagster Helpers (Python)** — `dbt/tests/customer_care/test_dryrun_golden.py`
```
- dwd_row_to_event: real rows parse correctly
- extract_base_context_fields: vendor matching works
- build_event_query: environment-aware schema
- dispatch_to_funnel_rows: correct row assembly
- Funnel column completeness
- Multi-user independent counters
- Fatigue suppression
- Malformed event handling
```

**Admin Mode A (TS)** — `admin/src/lib/__tests__/dryrun-engine.test.ts`
```
- runDryrun with golden config: no fatal errors
- Threshold hits after correct events
- Fatigue blocks after first show
- Single-event user doesn't hit threshold
```

**Admin Routes (TS)** — `admin/src/app/api/dryrun/**/__tests__/`
```
- Golden config passes route validation
- Payload/context structure preserved through JSON round-trip
- Multi-user events all pass validation
- Fatigue config variant passes validation
- Status polling maps terminal/non-terminal states
```

#### L2 Tests to Write

**L2-1 Contract Tests:**
- Admin → Dagster launch mutation: golden config reaches Dagster correctly
- Dagster config deserialization matches Admin serialization
- Funnel output schema matches expected columns

**L2-2 Integration Tests:**
- Admin POST → Dagster staging launch → run_id returned
- Admin GET → Dagster staging poll → terminal status reached

### Phase 5: Seed — Align Local Dev Data

Update `e2e/seed/002_local_dev_seed.sql` to match the golden dataset:
- Facts/Scenes/Recipes must use the same event names and condition structures
- No fictional fields (e.g., don't use `error_type` if staging events lack it)
- No AB variant conditions (dryrun bypasses GrowthBook)
- Window sizes should match golden dataset expectations

## Rules

1. **Data first, tests second, code third.** Always discover real data before writing tests. Always write tests before writing implementation.
2. **One golden file per scenario.** Don't mix unrelated event types in one fixture.
3. **Golden data is SSOT.** All test layers read from the same fixture structure. When updating golden data, update all copies.
4. **Inspect before assuming.** Always look at `unstruct_event.data.data` to see real payload fields. Don't assume field names.
5. **Multi-user is mandatory.** Every golden dataset must include 3+ users with different event counts for isolation testing.
6. **Fatigue variant is mandatory.** Every golden dataset must include a `rules_config_with_fatigue` section.
7. **Expected outcomes are mandatory.** Every golden dataset must specify concrete expected values (hit counts, threshold events).
8. **Tolerate conflict resolution warnings.** Engine produces "multiple popup hits" warnings when multiple recipes match — filter these in assertions, they're not errors.

## Examples

### Good: TDD with golden data

```
User: "Add a new scene for cloud_ai_upload_fail"

1. Query staging: SELECT ... FROM analytics_staging.dwd_base_hi WHERE event_name = 'cloud_ai_upload_fail' ...
2. Inspect payload: {"error_type": "timeout", "retry_count": 3, ...}
3. Create golden_cloud_ai_fail.json with 3 users (1/3/5 events)
4. Write RED tests: threshold_3 should hit on 3rd event
5. Write implementation to make tests GREEN
6. Update seed data
```

### Bad: Manual test data

```
User: "Add a test for the new feature"

❌ Manually craft synthetic events with guessed field names
❌ Write implementation first, then tests
❌ Use hardcoded values that don't match staging data
```

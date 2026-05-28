# Demo Generation — 半自动化生成流程

## 整体流程

```
CSV 数据
  ↓
generate_combinations.py   → combinations.json（所有组合列表）
  ↓
generate_prompts.py        → prompts/[slug].txt（每个组合的提示词）
  ↓
人工：每天打开若干 .txt，丢给 Claude chat，保存输出 HTML
  ↓
extract_css.py             → 从 HTML 提取核心 CSS，更新 MASTER.md 模板
```

---

## scripts/generate_combinations.py

从 styles.csv × products.csv 自动生成组合，按优先级排序：

优先级规则：
1. 官方推荐组合（product.csv 的 Primary Style Recommendation 匹配）优先
2. 热门风格 × 热门产品类型次之
3. 其余组合按需生成

热门风格（MVP 阶段优先覆盖）：
- Glassmorphism、Claymorphism、Minimalism、Brutalism
- Dark Mode、Bento Grid、Neumorphism、Aurora UI

热门产品类型（MVP 阶段优先覆盖）：
- SaaS、Fintech、E-commerce、Education
- Healthcare、Portfolio、Dashboard、AI Platform

输出：`combinations.json`，字段包含 query、filename、style、product、is_recommended、priority

---

## scripts/generate_prompts.py

为每个组合生成提示词文件，保存到 `prompts/[slug].txt`。

提示词模板结构：
1. 角色定义：专业 HTML/CSS 开发者
2. 设计系统参数：来自 search.py 的 markdown 输出
3. 页面要求：区块结构、技术限制
4. 输出要求：只输出 HTML，不要解释

已存在对应 HTML 文件的组合自动跳过。

---

## 人工操作步骤

每天的工作流程：

```
1. 打开 prompts/ 目录，挑选几个 .txt 文件
2. 复制内容，粘贴到 Claude chat
3. 复制输出的 HTML 内容
4. 保存为 public/demos/official/[slug].html
5. 创建对应的 public/meta/[slug].json
```

建议每天生成 5-10 个，保证质量比数量更重要。

---

## scripts/extract_css.py

从生成的 HTML 文件中提取核心 CSS，用于：
1. 验证 HTML 文件的 CSS 质量
2. 更新 MASTER.md 生成模板中的组件 CSS 参考

提取逻辑：
- 提取 `<style>` 标签内容
- 提取 `:root` CSS 变量
- 提取核心组件类（.card、.btn、.input、.modal、.nav）

---

## scripts/convert_csv.py

把官方 CSV 文件转为 JSON，一次性运行：

```bash
cd scripts
python3 convert_csv.py
```

输出到 `public/data/*.json`，字段名与 CSV 列名完全一致。

---

## 质量检查清单

每个 HTML 文件保存前检查：

- [ ] 浏览器打开无报错
- [ ] 风格视觉效果明显（能看出是哪种风格）
- [ ] 配色和设计系统参数一致
- [ ] 页面所有区块都有内容
- [ ] 响应式布局在 375px 宽度下正常显示

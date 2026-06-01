#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
uimaster.cc — 数据处理脚本集合

包含：
  - convert_csv.py    CSV 转 JSON
  - generate_combinations.py  生成组合列表
  - generate_prompts.py       生成提示词文件
  - extract_css.py            从 HTML 提取核心 CSS

使用方式：
  python3 scripts.py convert
  python3 scripts.py combinations
  python3 scripts.py prompts
  python3 scripts.py extract
  python3 scripts.py all
"""

import csv
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from bs4 import BeautifulSoup

# ============ 路径配置 ============

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "public" / "data"
DEMOS_DIR = ROOT / "public" / "demos" / "official"
META_DIR = ROOT / "public" / "meta"
PROMPTS_DIR = ROOT / "prompts"
SCRIPTS_DIR = ROOT / "scripts"

# ui-ux-pro-max search.py 路径（自动查找）
def find_search_py():
    result = subprocess.run(
        ['find', os.path.expanduser('~'), '-name', 'search.py',
         '-path', '*/ui-ux-pro-max/*'],
        capture_output=True, text=True
    )
    paths = [p for p in result.stdout.strip().split('\n') if p]
    return paths[0] if paths else None

SEARCH_PY = find_search_py()

# 热门风格（MVP 优先覆盖）
TOP_STYLES = [
    'Glassmorphism', 'Claymorphism', 'Minimalism', 'Brutalism',
    'Dark Mode', 'Bento Grid', 'Neumorphism', 'Aurora UI',
    'Flat Design', 'Skeuomorphism'
]

# 热门产品类型（MVP 优先覆盖）
TOP_PRODUCTS = [
    'SaaS', 'Fintech', 'E-commerce', 'Education',
    'Healthcare', 'Portfolio', 'Dashboard', 'AI Platform',
    'Restaurant', 'Mobile App', 'Crypto', 'Fitness'
]


# ============ 工具函数 ============

def load_csv(filepath):
    with open(filepath, encoding='utf-8') as f:
        return list(csv.DictReader(f))

def to_slug(s):
    return re.sub(r'[-\s]+', '-',
           re.sub(r'[^a-z0-9\s-]', '',
           s.lower().strip()))

def ensure_dirs():
    for d in [DATA_DIR, DEMOS_DIR, META_DIR, PROMPTS_DIR]:
        d.mkdir(parents=True, exist_ok=True)


# ============ 1. CSV 转 JSON ============

def convert_csv():
    """把官方 CSV 文件全部转为 JSON，输出到 public/data/"""
    ensure_dirs()

    # 查找官方 CSV 所在目录
    csv_search = subprocess.run(
        ['find', os.path.expanduser('~'), '-name', 'styles.csv',
         '-path', '*/ui-ux-pro-max/*'],
        capture_output=True, text=True
    )
    csv_paths = [p for p in csv_search.stdout.strip().split('\n') if p]
    if not csv_paths:
        print("❌ 找不到官方 CSV 文件，请确认 ui-ux-pro-max 已安装")
        return

    csv_dir = Path(csv_paths[0]).parent
    print(f"✓ 找到 CSV 目录：{csv_dir}")

    files = [
        'styles', 'colors', 'typography', 'products',
        'landing', 'ui-reasoning', 'charts', 'icons',
        'app-interface', 'ux-guidelines'
    ]

    for name in files:
        csv_file = csv_dir / f"{name}.csv"
        if not csv_file.exists():
            print(f"  ⚠ 跳过 {name}.csv（文件不存在）")
            continue

        data = load_csv(csv_file)
        out_file = DATA_DIR / f"{name}.json"
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✓ {name}.json（{len(data)} 条）")

    print(f"\n✅ CSV 转换完成，输出到 {DATA_DIR}")


# ============ 2. 生成组合列表 ============

def generate_combinations():
    """从 styles.json × products.json 生成组合列表"""
    ensure_dirs()

    styles_file = DATA_DIR / "styles.json"
    products_file = DATA_DIR / "products.json"

    if not styles_file.exists() or not products_file.exists():
        print("❌ 请先运行 convert 命令")
        return

    with open(styles_file, encoding='utf-8') as f:
        styles = json.load(f)
    with open(products_file, encoding='utf-8') as f:
        products = json.load(f)

    combinations = []
    existing_slugs = {f.stem for f in DEMOS_DIR.glob('*.html')}

    for style in styles:
        style_name = style.get('Style Category', '').strip()
        if not style_name:
            continue

        style_is_top = any(
            s.lower() in style_name.lower() for s in TOP_STYLES
        )

        for product in products:
            product_type = product.get('Product Type', '').strip()
            if not product_type:
                continue

            product_is_top = any(
                p.lower() in product_type.lower() for p in TOP_PRODUCTS
            )

            # MVP 阶段只生成热门组合
            if not (style_is_top and product_is_top):
                continue

            # 检查官方推荐
            primary_rec = product.get('Primary Style Recommendation', '')
            is_recommended = style_name.lower() in primary_rec.lower()

            style_slug = to_slug(style_name)
            product_slug = to_slug(product_type)
            filename = f"{style_slug}-{product_slug}"

            combinations.append({
                "query": f"{product_type} {style.get('AI Prompt Keywords', style_name)}",
                "filename": filename,
                "style": style_name,
                "product": product_type,
                "is_recommended": is_recommended,
                "priority": 1 if is_recommended else 2,
                "exists": filename in existing_slugs
            })

    # 按优先级排序，已存在的放最后
    combinations.sort(key=lambda x: (
        1 if x['exists'] else 0,
        x['priority']
    ))

    out_file = ROOT / "combinations.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(combinations, f, ensure_ascii=False, indent=2)

    total = len(combinations)
    existing = sum(1 for c in combinations if c['exists'])
    recommended = sum(1 for c in combinations if c['is_recommended'])

    print(f"✅ 生成组合列表完成")
    print(f"   总计：{total} 个组合")
    print(f"   官方推荐：{recommended} 个")
    print(f"   已有 demo：{existing} 个")
    print(f"   待生成：{total - existing} 个")
    print(f"   输出：{out_file}")


# ============ 3. 生成提示词文件 ============

PROMPT_TEMPLATE = """你是一个专业的 HTML/CSS 开发者，请根据以下设计系统参数，生成一个完整的单文件 HTML 落地页。

## 设计系统参数（严格遵守，不要修改色值和风格核心参数）

{design_system}

## 页面要求

- 产品类型：{product}
- 所有 CSS 写在 <style> 标签里，不使用外部 CSS 文件
- Google Fonts 用 @import 引入
- 页面区块（按顺序）：
  1. 导航栏：Logo + 菜单链接 + 行动按钮
  2. Hero 区域：大标题 + 副标题 + 2 个 CTA 按钮 + 配图
  3. 功能卡片 ×3：每张有图标 + 标题 + 描述
  4. 用户评价 ×2：头像 + 姓名 + 职位 + 评价内容 + 星级
  5. 底部 CTA：标题 + 注册/行动按钮
  6. 页脚：版权信息 + 链接
- 占位图片使用：https://placehold.co/600x400
- 不使用任何 JS 框架（Vue / React / Alpine 等）
- 视觉效果要精美，达到可以直接展示给客户的水准
- 严格按照设计系统的色值、字体、风格实现
- 只输出完整的 HTML 代码，不要任何解释文字
"""

def generate_prompts():
    """为每个待生成的组合创建提示词文件"""
    ensure_dirs()

    if not SEARCH_PY:
        print("❌ 找不到 search.py，请确认 ui-ux-pro-max 已安装")
        return

    combinations_file = ROOT / "combinations.json"
    if not combinations_file.exists():
        print("❌ 请先运行 combinations 命令")
        return

    with open(combinations_file, encoding='utf-8') as f:
        combinations = json.load(f)

    pending = [c for c in combinations if not c['exists']]
    print(f"待生成提示词：{len(pending)} 个\n")

    for i, combo in enumerate(pending, 1):
        prompt_file = PROMPTS_DIR / f"{combo['filename']}.txt"

        # 跳过已有提示词文件的
        if prompt_file.exists():
            print(f"  ⏭ [{i}/{len(pending)}] 跳过 {combo['filename']}（提示词已存在）")
            continue

        print(f"  ⏳ [{i}/{len(pending)}] 生成 {combo['filename']} ...")

        # 调用 search.py 获取设计系统参数
        result = subprocess.run(
            ['python3', SEARCH_PY, combo['query'],
             '--design-system', '-f', 'markdown'],
            capture_output=True, text=True
        )

        if result.returncode != 0:
            print(f"     ⚠ search.py 返回错误，跳过")
            continue

        design_system = result.stdout.strip()
        prompt = PROMPT_TEMPLATE.format(
            design_system=design_system,
            product=combo['product']
        )

        prompt_file.write_text(prompt, encoding='utf-8')
        print(f"     ✓ {combo['filename']}.txt")

    print(f"\n✅ 提示词文件保存在 {PROMPTS_DIR}")
    print(f"   每天打开几个 .txt 文件，复制内容丢给 Claude chat")
    print(f"   把输出的 HTML 保存到 public/demos/official/[filename].html")


# ============ 4. 从 HTML 提取核心 CSS ============

def extract_css():
    """从生成的 HTML 文件提取核心 CSS，用于 MASTER.md 模板"""
    ensure_dirs()

    html_files = list(DEMOS_DIR.glob('*.html'))
    if not html_files:
        print("❌ public/demos/official/ 目录下没有 HTML 文件")
        return

    print(f"处理 {len(html_files)} 个 HTML 文件\n")

    css_dir = ROOT / "public" / "css-extracts"
    css_dir.mkdir(exist_ok=True)

    for html_file in html_files:
        content = html_file.read_text(encoding='utf-8')
        soup = BeautifulSoup(content, 'html.parser')

        style_tag = soup.find('style')
        if not style_tag:
            print(f"  ⚠ {html_file.name}：没有找到 <style> 标签")
            continue

        css = style_tag.string or ''

        # 提取 :root 变量
        root_match = re.search(r':root\s*\{([^}]+)\}', css, re.DOTALL)
        css_vars = root_match.group(1).strip() if root_match else ''

        # 提取核心组件
        component_patterns = [
            r'\.btn[^{]*\{[^}]+\}(\s*\.btn[^{]*:[^{]*\{[^}]+\})*',
            r'\.card[^{]*\{[^}]+\}(\s*\.card[^{]*:[^{]*\{[^}]+\})*',
            r'\.input[^{]*\{[^}]+\}(\s*\.input[^{]*:[^{]*\{[^}]+\})*',
            r'\.modal[^{]*\{[^}]+\}(\s*\.modal[^{]*:[^{]*\{[^}]+\})*',
            r'\.nav[^{]*\{[^}]+\}(\s*\.nav[^{]*:[^{]*\{[^}]+\})*',
        ]

        components = []
        for pattern in component_patterns:
            matches = re.findall(pattern, css, re.DOTALL)
            if matches:
                components.extend([m[0] if isinstance(m, tuple) else m
                                   for m in matches])

        # 输出提取结果
        out = {
            "source": html_file.name,
            "css_variables": css_vars,
            "components": components,
            "full_css": css
        }

        out_file = css_dir / f"{html_file.stem}.json"
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, indent=2)

        print(f"  ✓ {html_file.stem}（"
              f"{len(css_vars.split(chr(10)))} 个 CSS 变量，"
              f"{len(components)} 个组件）")

    print(f"\n✅ CSS 提取完成，输出到 {css_dir}")


# ============ 入口 ============

COMMANDS = {
    'convert':      (convert_csv,            "CSV 转 JSON"),
    'combinations': (generate_combinations,  "生成组合列表"),
    'prompts':      (generate_prompts,       "生成提示词文件"),
    'extract':      (extract_css,            "提取核心 CSS"),
}

def main():
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS and sys.argv[1] != 'all':
        print("使用方式：")
        for cmd, (_, desc) in COMMANDS.items():
            print(f"  python3 scripts.py {cmd:<15} {desc}")
        print(f"  python3 scripts.py all             全部执行")
        return

    if sys.argv[1] == 'all':
        for cmd, (fn, desc) in COMMANDS.items():
            print(f"\n{'='*50}")
            print(f"▶ {desc}")
            print('='*50)
            fn()
    else:
        fn, desc = COMMANDS[sys.argv[1]]
        print(f"▶ {desc}\n")
        fn()

if __name__ == '__main__':
    main()

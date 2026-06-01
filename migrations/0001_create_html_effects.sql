-- migrations/0001_create_html_effects.sql
-- HTML Effects Gallery — D1 数据库迁移文件

CREATE TABLE IF NOT EXISTS html_effects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  scene TEXT,
  tags TEXT,                        -- JSON 数组字符串
  source_url TEXT,                  -- R2 HTML 文件地址
  cover_url TEXT,                   -- R2 动图地址（640×400 WebP）
  cover_static_url TEXT,            -- R2 静图地址（首帧）
  og_image_url TEXT,                -- R2 OG Image 地址（1200×630）
  date TEXT,                        -- 入库日期 YYYY-MM-DD
  is_featured INTEGER DEFAULT 0,    -- 是否推荐（0/1）
  view_count INTEGER DEFAULT 0,
  export_count INTEGER DEFAULT 0,
  last_exported_at TEXT,
  share_count INTEGER DEFAULT 0,
  share_unlock_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS share_records (
  id TEXT PRIMARY KEY,
  effect_id TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  unlocked_at TEXT,                 -- NULL = 未解锁
  visitor_count INTEGER DEFAULT 0,
  FOREIGN KEY (effect_id) REFERENCES html_effects(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_effects_category ON html_effects(category);
CREATE INDEX IF NOT EXISTS idx_effects_scene ON html_effects(scene);
CREATE INDEX IF NOT EXISTS idx_effects_view_count ON html_effects(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_effects_featured ON html_effects(is_featured);
CREATE INDEX IF NOT EXISTS idx_effects_date ON html_effects(date DESC);
CREATE INDEX IF NOT EXISTS idx_share_token ON share_records(share_token);
CREATE INDEX IF NOT EXISTS idx_share_effect_id ON share_records(effect_id);

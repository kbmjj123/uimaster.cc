/**
 * GET /api/effects
 * 列表查询，支持：
 *   ?category=canvas
 *   ?scene=landing-page
 *   ?sort=view_count | date          （默认 date DESC）
 *   ?page=1  &limit=20               （默认第1页，每页20条）
 *   ?q=keyword                       （标题/描述/标签关键词搜索）
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  // ── 参数解析 ──────────────────────────────────────────────
  const category = (query.category || '').trim();
  const scene    = (query.scene    || '').trim();
  const sort     = query.sort === 'view_count' ? 'view_count' : 'date';
  const q        = (query.q || '').trim();
  const page     = Math.max(1, parseInt(query.page  || '1',  10));
  const limit    = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset   = (page - 1) * limit;

  // ── 构建 WHERE 子句 ────────────────────────────────────────
  const conditions = [];
  const params     = [];

  if (category) { conditions.push('category = ?'); params.push(category); }
  if (scene)    { conditions.push('scene = ?');    params.push(scene);    }
  if (q) {
    conditions.push('(title LIKE ? OR description LIKE ? OR tags LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const order = sort === 'view_count'
    ? 'ORDER BY is_featured DESC, view_count DESC, date DESC'
    : 'ORDER BY is_featured DESC, date DESC';

  // ── 查询总数 ───────────────────────────────────────────────
  const countSql = `SELECT COUNT(*) AS total FROM html_effects ${where}`;
  const countRow = await d1First(countSql, params);
  const total    = countRow?.total ?? 0;

  // ── 查询列表 ───────────────────────────────────────────────
  const listSql = `
    SELECT id, title, description, category, scene, tags,
           cover_url, cover_static_url, og_image_url,
           date, is_featured, view_count, export_count, share_count
    FROM html_effects
    ${where}
    ${order}
    LIMIT ? OFFSET ?
  `;
  const rows = await d1All(listSql, [...params, limit, offset]);

  // tags 字段反序列化
  const items = rows.map((r) => ({
    ...r,
    tags: (() => { try { return JSON.parse(r.tags || '[]'); } catch { return []; } })(),
  }));

  return {
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
});

/**
 * GET /api/effects/:id
 * 返回单条效果详情（含所有字段）
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, message: '缺少 id 参数' });
  }

  const row = await d1First(
    'SELECT * FROM html_effects WHERE id = ? LIMIT 1',
    [id]
  );

  if (!row) {
    throw createError({ statusCode: 404, message: `效果不存在：${id}` });
  }

  // tags 反序列化
  const item = {
    ...row,
    tags: (() => { try { return JSON.parse(row.tags || '[]'); } catch { return []; } })(),
  };

  return { success: true, data: item };
});

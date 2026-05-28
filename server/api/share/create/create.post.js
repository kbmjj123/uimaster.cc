/**
 * POST /api/share/create
 * Body: { effect_id: string }
 *
 * 生成唯一 share_token，写入 share_records，
 * 返回完整分享链接供前端复制
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const effectId = (body?.effect_id || '').trim();

  if (!effectId) {
    throw createError({ statusCode: 400, message: '缺少 effect_id 参数' });
  }

  // 确认效果存在
  const effect = await d1First(
    'SELECT id, title FROM html_effects WHERE id = ? LIMIT 1',
    [effectId]
  );
  if (!effect) {
    throw createError({ statusCode: 404, message: `效果不存在：${effectId}` });
  }

  const config     = useRuntimeConfig();
  const siteBase   = config.public?.siteBase || 'https://html-effects.gallery';
  const shareId    = generateId();
  // token: 8位随机字符，短且易分享
  const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const ts         = nowIso();

  // 写入 share_records
  await d1Run(
    `INSERT INTO share_records (id, effect_id, share_token, created_at, visitor_count)
     VALUES (?, ?, ?, ?, 0)`,
    [shareId, effectId, shareToken, ts]
  );

  // share_count +1
  await d1Run(
    'UPDATE html_effects SET share_count = share_count + 1, updated_at = ? WHERE id = ?',
    [ts, effectId]
  );

  const shareUrl = `${siteBase}/share/${shareToken}`;

  return {
    success:      true,
    share_id:     shareId,
    share_token:  shareToken,
    share_url:    shareUrl,
    effect_id:    effectId,
    effect_title: effect.title,
    created_at:   ts,
  };
});

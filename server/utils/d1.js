/**
 * server/utils/d1.js
 * Cloudflare D1 REST API 封装
 * 在 Nuxt server handlers 中通过 useD1() 调用
 */

/**
 * 执行一条 D1 SQL（支持参数化查询）
 * @param {string}   sql
 * @param {any[]}    params
 * @returns {Promise<{ results: any[], success: boolean, meta: object }>}
 */
export async function d1Query(sql, params = []) {
  const config = useRuntimeConfig();
  const { cfAccountId, cfD1DatabaseId, cfApiToken } = config;

  if (!cfAccountId || !cfD1DatabaseId || !cfApiToken) {
    throw createError({
      statusCode: 503,
      message: 'D1 配置缺失：请在 runtimeConfig 中设置 cfAccountId / cfD1DatabaseId / cfApiToken',
    });
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database/${cfD1DatabaseId}/query`;

  const resp = await $fetch(url, {
    method:  'POST',
    headers: {
      Authorization: `Bearer ${cfApiToken}`,
      'Content-Type': 'application/json',
    },
    body: { sql, params },
  }).catch((err) => {
    throw createError({ statusCode: 502, message: `D1 请求失败: ${err.message}` });
  });

  if (!resp.success) {
    const msg = (resp.errors || []).map((e) => e.message).join('; ');
    throw createError({ statusCode: 502, message: `D1 错误: ${msg}` });
  }

  return resp.result?.[0] ?? { results: [], success: true };
}

/**
 * 快捷：查询多行
 */
export async function d1All(sql, params = []) {
  const r = await d1Query(sql, params);
  return r.results ?? [];
}

/**
 * 快捷：查询单行（不存在时返回 null）
 */
export async function d1First(sql, params = []) {
  const rows = await d1All(sql, params);
  return rows[0] ?? null;
}

/**
 * 快捷：执行写操作（INSERT / UPDATE / DELETE）
 */
export async function d1Run(sql, params = []) {
  return d1Query(sql, params);
}

/**
 * 生成唯一 ID（使用 crypto.randomUUID，Node 18+）
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * 当前 ISO 时间戳
 */
export function nowIso() {
  return new Date().toISOString();
}

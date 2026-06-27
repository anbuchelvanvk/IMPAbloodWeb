export function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export function makeResponders({ actionRef, uidRef, ip, ok, fail }) {
  const startedAt = Date.now();
  const respondOk = (data) => {
    const ms = Date.now() - startedAt;
    if (process.env.API_LOG_ALL === 'true' || ms > 1200) {
      console.info(`[api/v1] ok action=${actionRef.current} uid=${uidRef.current} ip=${ip} ms=${ms}`);
    }
    return ok(data);
  };

  const respondFail = (status, message) => {
    const ms = Date.now() - startedAt;
    if (status >= 429 || status >= 500 || process.env.API_LOG_ALL === 'true' || ms > 1200) {
      console.warn(`[api/v1] fail action=${actionRef.current} uid=${uidRef.current} ip=${ip} status=${status} ms=${ms}`);
    }
    return fail(status, message);
  };

  return { respondOk, respondFail };
}

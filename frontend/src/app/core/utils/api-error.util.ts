export function getApiErrorMessage(error: unknown, fallback: string): string {
  const response = error as {
    error?: unknown;
    message?: unknown;
    name?: unknown;
  } | null;

  if (typeof response?.error === 'object' && response.error !== null) {
    const payload = response.error as { message?: unknown };
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  }

  if (typeof response?.error === 'string' && response.error.trim()) {
    return response.error;
  }

  if (response?.name === 'TimeoutError') {
    return 'Máy chủ phản hồi quá lâu. Vui lòng thử lại sau ít phút.';
  }

  if (typeof response?.message === 'string' && response.message.trim()) {
    return response.message;
  }

  return fallback;
}

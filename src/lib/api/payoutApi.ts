const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function readJson(res: Response) {
  try { return await res.json(); } catch { return { success: false }; }
}

export async function fetchPayoutMethods() {
  const res = await fetch(`${API_URL}/api/payout/methods`, { credentials: 'include' });
  return readJson(res);
}

export async function addPayoutMethod(data: {
  methodType: string; accountName: string; accountNumber: string; extra?: string;
}) {
  const res = await fetch(`${API_URL}/api/payout/methods`, {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return readJson(res);
}

export async function deletePayoutMethod(id: string) {
  const res = await fetch(`${API_URL}/api/payout/methods/${id}`, {
    method: 'DELETE', credentials: 'include',
  });
  return readJson(res);
}

export async function setDefaultPayoutMethod(id: string) {
  const res = await fetch(`${API_URL}/api/payout/methods/${id}/default`, {
    method: 'POST', credentials: 'include',
  });
  return readJson(res);
}

export async function fetchEarnings(limit = 20) {
  const res = await fetch(`${API_URL}/api/payout/earnings?limit=${limit}`, { credentials: 'include' });
  return readJson(res);
}

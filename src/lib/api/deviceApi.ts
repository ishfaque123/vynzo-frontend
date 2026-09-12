const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchDevices() {
  const res = await fetch(`${API_URL}/api/devices`, { credentials: 'include' });
  return res.json();
}

export async function logoutDevice(id: string) {
  const res = await fetch(`${API_URL}/api/devices/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
}

export async function logoutOtherDevices() {
  const res = await fetch(`${API_URL}/api/devices/others`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.json();
}

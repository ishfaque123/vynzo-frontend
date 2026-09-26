const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchSeoSettings() {
  try {
    const res = await fetch(`${API_URL}/api/settings/seo`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const result = await res.json();
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

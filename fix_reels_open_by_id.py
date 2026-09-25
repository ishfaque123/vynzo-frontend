with open('src/app/reels/page.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import { useEffect, useRef, useState } from 'react';",
    "import { Suspense, useEffect, useRef, useState } from 'react';"
)
content = content.replace(
    "import { useRouter } from 'next/navigation';",
    "import { useRouter, useSearchParams } from 'next/navigation';"
)
content = content.replace(
    "import { fetchReelsConfig, fetchReelFeed, fetchMyReelStatus, toggleReelLike, toggleReelFavorite, deleteReel, recordReelView } from '@/lib/api/reelApi';",
    "import { fetchReelsConfig, fetchReelFeed, fetchReelById, fetchMyReelStatus, toggleReelLike, toggleReelFavorite, deleteReel, recordReelView } from '@/lib/api/reelApi';"
)

content = content.replace(
    "export default function ReelsPage() {\n  const router = useRouter();",
    "function ReelsPageInner() {\n  const router = useRouter();\n  const searchParams = useSearchParams();"
)

old_effect = """  useEffect(() => { let cancelled = false; (async () => { const [feed, status, config] = await Promise.all([fetchReelFeed(), fetchMyReelStatus(), fetchReelsConfig()]); if (cancelled) return; if (feed.success) { setReels(feed.data.reels || []); setHasMore(!!feed.data.hasMore); } const enabled = !!(config.success && config.data?.enabled); const remaining = status.success ? Number(status.data?.remaining) : 0; setReelsEnabled(enabled); setUploadMaxDuration(Number(config.data?.maxDurationSec) > 0 ? Number(config.data.maxDurationSec) : 60); setUploadReady(enabled && status.success && Number.isFinite(remaining) && remaining > 0); setLoading(false); })(); return () => { cancelled = true; }; }, []);"""

new_effect = """  useEffect(() => { let cancelled = false; (async () => {
    const targetId = searchParams.get('id');
    const [feed, status, config] = await Promise.all([fetchReelFeed(), fetchMyReelStatus(), fetchReelsConfig()]);
    if (cancelled) return;
    let list = feed.success ? (feed.data.reels || []) : [];
    if (targetId) {
      const idx = list.findIndex((r: Reel) => r.id === targetId);
      if (idx > 0) {
        const [item] = list.splice(idx, 1);
        list = [item, ...list];
      } else if (idx === -1) {
        const single = await fetchReelById(targetId);
        if (!cancelled && single.success && single.data?.reel) {
          list = [single.data.reel, ...list];
        }
      }
    }
    setReels(list);
    if (feed.success) setHasMore(!!feed.data.hasMore);
    const enabled = !!(config.success && config.data?.enabled);
    const remaining = status.success ? Number(status.data?.remaining) : 0;
    setReelsEnabled(enabled);
    setUploadMaxDuration(Number(config.data?.maxDurationSec) > 0 ? Number(config.data.maxDurationSec) : 60);
    setUploadReady(enabled && status.success && Number.isFinite(remaining) && remaining > 0);
    setLoading(false);
  })(); return () => { cancelled = true; }; }, []);"""

assert old_effect in content, "effect pattern not found - file may have changed"
content = content.replace(old_effect, new_effect)

tail_anchor = "if (file) handleFilePicked(file); }} /></div>;\n}"
assert tail_anchor in content, "tail anchor not found - file may have changed"
content = content.replace(
    tail_anchor,
    tail_anchor + "\n\nexport default function ReelsPage() {\n  return (\n    <Suspense fallback={<div className=\"absolute inset-0 bg-black\" />}>\n      <ReelsPageInner />\n    </Suspense>\n  );\n}\n"
)

with open('src/app/reels/page.tsx', 'w') as f:
    f.write(content)

print("Reels open-by-id fix applied.")

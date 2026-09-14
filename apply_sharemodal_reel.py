import pathlib, sys

path = pathlib.Path("src/components/ShareModal.tsx")
text = path.read_text()

edits = [
    (
        '''interface ShareModalProps {
  onClose: () => void;
  postId?: string;
  profileUsername?: string;
  profileId?: string;
}''',
        '''interface ShareModalProps {
  onClose: () => void;
  postId?: string;
  reelId?: string;
  profileUsername?: string;
  profileId?: string;
}''',
    ),
    (
        "export default function ShareModal({ postId, profileUsername, profileId, onClose }: ShareModalProps) {",
        "export default function ShareModal({ postId, reelId, profileUsername, profileId, onClose }: ShareModalProps) {",
    ),
    (
        '''  const fallbackUrl = profileUsername
    ? `${origin}/u/${profileUsername}`
    : `${origin}/post/${postId}`;
  const url = shareCode ? `${origin}/s/${shareCode}` : fallbackUrl;

  useEffect(() => {
    const targetType = profileUsername ? 'profile' : 'post';
    const targetId = profileUsername ? profileId : postId;
    if (!targetId) return;
    createShareLink(targetType, targetId).then((result) => {
      if (result.success) setShareCode(result.data.code);
    });
  }, [profileUsername, profileId, postId]);''',
        '''  const fallbackUrl = profileUsername
    ? `${origin}/u/${profileUsername}`
    : reelId
    ? `${origin}/s/reel-${reelId}`
    : `${origin}/post/${postId}`;
  const url = shareCode ? `${origin}/s/${shareCode}` : fallbackUrl;

  useEffect(() => {
    const targetType = profileUsername ? 'profile' : reelId ? 'reel' : 'post';
    const targetId = profileUsername ? profileId : reelId || postId;
    if (!targetId) return;
    createShareLink(targetType, targetId).then((result) => {
      if (result.success) setShareCode(result.data.code);
    });
  }, [profileUsername, profileId, reelId, postId]);''',
    ),
]

errors = []
for i, (old, new) in enumerate(edits, start=1):
    count = text.count(old)
    if count != 1:
        errors.append(f"Edit {i}: expected 1 match, found {count}")
        continue
    text = text.replace(old, new)

if errors:
    print("FAILED:")
    for e in errors:
        print(" -", e)
    sys.exit(1)

path.write_text(text)
print("ShareModal.tsx patched successfully.")

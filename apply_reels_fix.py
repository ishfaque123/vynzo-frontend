import pathlib, sys

edits_by_file = {
    "src/components/Shell.tsx": [
        (
            "  const hideChrome = pathname === '/login' || pathname === '/profile-setup' || pathname === '/compose' || pathname.startsWith('/s/') || isChatThread;",
            "  const hideChrome = pathname === '/login' || pathname === '/profile-setup' || pathname === '/compose' || pathname === '/reels' || pathname.startsWith('/s/') || isChatThread;",
        ),
    ],
    "src/app/reels/page.tsx": [
        (
            "import { useAuth } from '@/lib/auth/useAuth';",
            "import { useRouter } from 'next/navigation';\nimport { useAuth } from '@/lib/auth/useAuth';",
        ),
        (
            "function CloseIcon() {",
            "function BackIcon() {\n  return (\n    <svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" strokeWidth=\"2.5\">\n      <path d=\"M15 18l-6-6 6-6\" />\n    </svg>\n  );\n}\nfunction CloseIcon() {",
        ),
        (
            "  const { user } = useAuth();\n  const [config, setConfig] = useState",
            "  const { user } = useAuth();\n  const router = useRouter();\n  const [config, setConfig] = useState",
        ),
        (
            '''      <button
        onClick={openUpload}
        aria-label="Post a reel"
        className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur"
      >
        <PlusIcon />
      </button>''',
            '''      <button
        onClick={() => router.back()}
        aria-label="Back"
        className="absolute left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur"
      >
        <BackIcon />
      </button>

      <button
        onClick={openUpload}
        aria-label="Post a reel"
        className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur"
      >
        <PlusIcon />
      </button>''',
        ),
    ],
}

any_error = False
for filename, edits in edits_by_file.items():
    path = pathlib.Path(filename)
    text = path.read_text()
    errors = []
    for i, (old, new) in enumerate(edits, start=1):
        count = text.count(old)
        if count != 1:
            errors.append(f"{filename} edit {i}: expected 1 match, found {count}")
            continue
        text = text.replace(old, new)
    if errors:
        any_error = True
        print("FAILED in", filename)
        for e in errors:
            print(" -", e)
        continue
    path.write_text(text)
    print(filename, "patched successfully.")

if any_error:
    print("\nSome files were NOT changed due to mismatches above.")
    sys.exit(1)

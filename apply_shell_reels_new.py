import pathlib, sys

path = pathlib.Path("src/components/Shell.tsx")
text = path.read_text()

old = "  const hideChrome = pathname === '/login' || pathname === '/profile-setup' || pathname === '/compose' || pathname === '/reels' || pathname.startsWith('/s/') || isChatThread;"
new = "  const hideChrome = pathname === '/login' || pathname === '/profile-setup' || pathname === '/compose' || pathname === '/reels' || pathname === '/reels/new' || pathname.startsWith('/s/') || isChatThread;"

count = text.count(old)
if count != 1:
    print(f"FAILED: expected 1 match, found {count}")
    sys.exit(1)

text = text.replace(old, new)
path.write_text(text)
print("Shell.tsx patched successfully.")

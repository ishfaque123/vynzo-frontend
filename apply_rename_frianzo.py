import pathlib, sys

edits_by_file = {
    "src/app/layout.tsx": [
        (
            "  title: 'Friendzo',\n  description: 'Friendzo — share your moments',",
            "  title: 'Frianzo',\n  description: 'Frianzo — share your moments',",
        ),
    ],
    "src/app/login/page.tsx": [
        ("function FriendzoLogo() {", "function FrianzoLogo() {"),
        ('<img src="/logo.png" alt="Friendzo" className="h-20 w-20 object-contain" />',
         '<img src="/logo.png" alt="Frianzo" className="h-20 w-20 object-contain" />'),
        ('<h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Friendzo</h1>',
         '<h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Frianzo</h1>'),
        ("<FriendzoLogo />", "<FrianzoLogo />"),
        ("By continuing, you agree to Friendzo&apos;s{' '}", "By continuing, you agree to Frianzo&apos;s{' '}"),
    ],
    "src/app/about/page.tsx": [
        ("export const metadata = { title: 'About - Friendzo' };",
         "export const metadata = { title: 'About - Frianzo' };"),
        ('<h1 className="mb-4 text-2xl font-bold">About Friendzo</h1>',
         '<h1 className="mb-4 text-2xl font-bold">About Frianzo</h1>'),
        ("Friendzo is a social platform where people connect",
         "Frianzo is a social platform where people connect"),
    ],
    "src/app/privacy/page.tsx": [
        ("export const metadata = { title: 'Privacy Policy - Friendzo' };",
         "export const metadata = { title: 'Privacy Policy - Frianzo' };"),
        ('Friendzo ("we", "our", "us") operates the frianzo.online website',
         'Frianzo ("we", "our", "us") operates the frianzo.online website'),
    ],
    "src/app/terms/page.tsx": [
        ("export const metadata = { title: 'Terms of Service - Friendzo' };",
         "export const metadata = { title: 'Terms of Service - Frianzo' };"),
        ("By using Friendzo, you agree to these Terms of Service.",
         "By using Frianzo, you agree to these Terms of Service."),
        ("You must be at least 13 years old to use Friendzo.",
         "You must be at least 13 years old to use Frianzo."),
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
else:
    print("\nAll 5 files renamed Friendzo -> Frianzo successfully.")

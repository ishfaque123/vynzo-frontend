f = 'src/app/page.tsx'
c = open(f).read()

old1 = "import AdUnit from '@/components/AdUnit';"
new1 = "import AdUnit from '@/components/AdUnit';\nimport { setPendingComposeImage } from '@/lib/pendingComposeImage';"
assert old1 in c, 'STEP1 NOT FOUND'
c = c.replace(old1, new1)

old2 = "  const sentinelRef = useRef<HTMLDivElement>(null);"
new2 = "  const sentinelRef = useRef<HTMLDivElement>(null);\n  const galleryInputRef = useRef<HTMLInputElement>(null);"
assert old2 in c, 'STEP2 NOT FOUND'
c = c.replace(old2, new2)

old3 = """      <button onClick={() => router.push('/compose')} className="mb-3 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
        <Avatar url={user.profilePictureUrl} name={user.displayName} />
        <span className="flex-1 text-slate-400">What's on your mind?</span>
        <span className="rounded-full bg-slate-100 p-1.5 text-slate-600"><PlusIcon /></span>
      </button>"""

new3 = """      <div className="mb-3 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <button onClick={() => router.push('/compose')} className="flex flex-1 items-center gap-3 text-left">
          <Avatar url={user.profilePictureUrl} name={user.displayName} />
          <span className="flex-1 text-slate-400">What's on your mind?</span>
        </button>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPendingComposeImage(file);
              router.push('/compose');
            }
            e.target.value = '';
          }}
        />
        <button
          onClick={() => galleryInputRef.current?.click()}
          aria-label="Add a photo"
          className="rounded-full bg-slate-100 p-1.5 text-slate-600"
        >
          <PlusIcon />
        </button>
      </div>"""

assert old3 in c, 'STEP3 NOT FOUND'
c = c.replace(old3, new3)

open(f, 'w').write(c)
print('DONE')

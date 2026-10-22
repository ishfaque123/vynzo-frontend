/**
 * Adsterra ad snippets for frianzo.online
 * ========================================
 * All five units below were approved by Adsterra on 2026-10-23, and the
 * REAL publisher codes were pasted in verbatim on 2026-10-23 — the slots
 * wired up in src/components/Adsterra.tsx are now LIVE (they render and
 * inject these snippets wherever the components are placed).
 *
 * Approved units (do NOT add popunders or any other format):
 *   Native Banner   placement 31872373 -> nativeBanner   (blog article pages)
 *   Social Bar      placement 31872374 -> socialBar      (root layout; public routes + home feed + /reels)
 *   Banner 728x90   placement 31872375 -> banner728x90   (landing + blog index)
 *   Banner 300x250  placement 31872376 -> banner300x250  (blog article + about + home feed)
 *   Banner 320x50   placement 31872377 -> banner320x50   (help page + reels page)
 */
export const ADSTERRA_SNIPPETS = {
  /** Native Banner — placement 31872373. */
  nativeBanner: `<script async="async" data-cfasync="false" src="https://bicea.org/21/bd53bf64edbd2d4a41d2dce1586ecebb"></script>
<div id="container-bd53bf64edbd2d4a41d2dce1586ecebb"></div>`,

  /** Social Bar — placement 31872374. */
  socialBar: `<script data-cfasync="false" src="https://bicea.org/14/08c7d5ffbc80298d685e1ff9c33e248f"></script>`,

  /** Banner 728x90 — placement 31872375. */
  banner728x90: `<script>
  atOptions = {
    'key' : 'd15ff7f4f39d0e5fcc7c764763540f4d',
    'format' : 'iframe',
    'height' : 90,
    'width' : 728,
    'params' : {}
  };
</script>
<script src="https://bicea.org/22/d15ff7f4f39d0e5fcc7c764763540f4d"></script>`,

  /** Banner 300x250 — placement 31872376. */
  banner300x250: `<script>
  atOptions = {
    'key' : '0f8a8ecafd2aea2a640608284746f1df',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script src="https://bicea.org/22/0f8a8ecafd2aea2a640608284746f1df"></script>`,

  /** Banner 320x50 — placement 31872377. */
  banner320x50: `<script>
  atOptions = {
    'key' : '102a0e7a9a62c8ec91979d4b1c6d88e9',
    'format' : 'iframe',
    'height' : 50,
    'width' : 320,
    'params' : {}
  };
</script>
<script src="https://bicea.org/22/102a0e7a9a62c8ec91979d4b1c6d88e9"></script>`,
} as const;

export type AdsterraSnippetKey = keyof typeof ADSTERRA_SNIPPETS;

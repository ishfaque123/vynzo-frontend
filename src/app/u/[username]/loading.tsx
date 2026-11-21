// No skeleton shell for profile navigation: the previous screen stays
// visible until the profile is ready, and ProfileClient paints the
// last saved copy of the profile instantly on cold starts. Showing a
// full-page grey skeleton on every profile tap felt slow.
export default function ProfileLoading() {
  return null;
}

let pendingPost: any | null = null;

export function setPendingNewPost(post: any | null) {
  pendingPost = post;
}

export function takePendingNewPost(): any | null {
  const post = pendingPost;
  pendingPost = null;
  return post;
}

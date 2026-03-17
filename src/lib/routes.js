export function avatarUrl(user) {
  if (!user?._id) {
    return "";
  }

  const version = user.updatedAt || user.joinedAt || "";
  return `/api/users/${user._id}/avatar?v=${encodeURIComponent(version)}`;
}

export function postImageUrl(post) {
  if (!post?.hasImage) {
    return "";
  }

  const version = post.updatedAt || post.createdAt || "";
  return `/api/posts/${post._id}/image?v=${encodeURIComponent(version)}`;
}

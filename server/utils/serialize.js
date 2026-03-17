function toId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }

  return value.toString();
}

function isPopulatedUser(value) {
  return value && typeof value === "object" && value.name;
}

export function serializeUserReference(value) {
  if (!isPopulatedUser(value)) {
    return {
      _id: toId(value),
    };
  }

  return {
    _id: toId(value),
    name: value.name,
    about: value.about || "",
    hasAvatar: Boolean(value.avatar?.data?.length),
  };
}

export function serializeUser(user, viewerId = null) {
  const followerIds = Array.isArray(user.followers) ? user.followers.map(toId).filter(Boolean) : [];
  const followingIds = Array.isArray(user.following) ? user.following.map(toId).filter(Boolean) : [];
  const currentViewerId = viewerId ? viewerId.toString() : null;

  return {
    _id: toId(user),
    name: user.name,
    email: user.email,
    about: user.about || "",
    joinedAt: user.createdAt,
    updatedAt: user.updatedAt,
    hasAvatar: Boolean(user.avatar?.data?.length),
    followerCount: followerIds.length,
    followingCount: followingIds.length,
    followerIds,
    followingIds,
    followers: Array.isArray(user.followers)
      ? user.followers.filter(isPopulatedUser).map(serializeUserReference)
      : [],
    following: Array.isArray(user.following)
      ? user.following.filter(isPopulatedUser).map(serializeUserReference)
      : [],
    isFollowing: currentViewerId ? followerIds.includes(currentViewerId) : false,
    isSelf: currentViewerId ? toId(user) === currentViewerId : false,
  };
}

export function serializePost(post, viewerId = null) {
  const likeIds = Array.isArray(post.likes) ? post.likes.map(toId).filter(Boolean) : [];
  const currentViewerId = viewerId ? viewerId.toString() : null;

  return {
    _id: toId(post),
    text: post.text,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    hasImage: Boolean(post.image?.data?.length),
    likeCount: likeIds.length,
    likedByViewer: currentViewerId ? likeIds.includes(currentViewerId) : false,
    commentCount: Array.isArray(post.comments) ? post.comments.length : 0,
    postedBy: serializeUserReference(post.postedBy),
    comments: Array.isArray(post.comments)
      ? post.comments.map((comment) => ({
          _id: toId(comment),
          text: comment.text,
          createdAt: comment.createdAt,
          postedBy: serializeUserReference(comment.postedBy),
        }))
      : [],
  };
}

'use client';

import Link from 'next/link';
import ReactionButton, { REACTIONS } from './ReactionButton';
import PostMenu from './PostMenu';
import FollowButton from './FollowButton';
import PostContent from './PostContent';

function Avatar({ url, name, size = 8 }: { url?: string; name?: string; size?: number }) {
  const sizeClass = size === 8 ? 'h-8 w-8 text-xs' : 'h-6 w-6 text-[10px]';
  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 bg-cover bg-center font-semibold text-slate-600`} style={url ? { backgroundImage: `url(${url})` } : {}}>
      {!url && (name?.[0]?.toUpperCase() || '?')}
    </div>
  );
}
function CommentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
      <line x1="8.3" y1="10.7" x2="15.7" y2="6.3" /><line x1="8.3" y1="13.3" x2="15.7" y2="17.7" />
    </svg>
  );
}
function RepostIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
export function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}

function ReactionSummary({ post }: { post: any }) {
  const topReactions = post.reactionCounts
    ? Object.entries(post.reactionCounts as Record<string, number>)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type)
    : [];

  const hasAny = (post.likeCount > 0) || (post.commentCount > 0) || (post.shareCount > 0);
  if (!hasAny) return null;

  return (
    <div className="mt-3 flex items-center justify-between border-b pb-2 text-xs text-slate-500">
      <div className="flex items-center">
        {topReactions.map((type, i) => (
          <span
            key={type}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-slate-50 text-[11px]"
            style={{ marginLeft: i === 0 ? 0 : -6, zIndex: topReactions.length - i }}
          >
            {REACTIONS[type]?.emoji}
          </span>
        ))}
        {post.likeCount > 0 && <span className="ml-1.5">{post.likeCount}</span>}
      </div>
      <div className="flex gap-3">
        {post.commentCount > 0 && <span>{post.commentCount} comments</span>}
        {post.shareCount > 0 && <span>{post.shareCount} shares</span>}
      </div>
    </div>
  );
}

export default function PostCard({ post, currentUser, onReactionChange, onToggleComments, onShare, onUpdated, onDeleted }: any) {
  const isOwner = currentUser?.username === post.author.username;
  return (
    <div className="w-full border-y py-4">
      <div className="flex items-start justify-between">
        {post.originalPost ? (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <RepostIcon />
            <Link href={`/u/${post.author.username}`} className="font-medium hover:underline">{post.author.displayName}</Link>
            <span>reposted</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar url={post.author.profilePictureUrl} name={post.author.displayName} />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <Link href={`/u/${post.author.username}`} className="font-medium hover:underline">{post.author.displayName}</Link>
                {!isOwner && <FollowButton userId={post.author.id} status={post.friendStatus} />}
              </div>
              {post.taggedUsers?.length > 0 && (
                <span className="block text-xs text-slate-500">
                  with {post.taggedUsers.map((t: any, i: number) => (
                    <span key={t.id} className="font-medium text-slate-700">{t.displayName}{i < post.taggedUsers.length - 1 ? ', ' : ''}</span>
                  ))}
                </span>
              )}
              <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        )}
        <PostMenu postId={post.id} authorId={post.author.id} isOwner={isOwner} content={post.content} commentAudience={post.commentAudience}
          onUpdated={(content: string, commentAudience: string) => onUpdated(post.id, content, commentAudience)}
          onDeleted={() => onDeleted(post.id)} />
      </div>

      {post.content && <PostContent text={post.content} className="mt-2 whitespace-pre-wrap" />}
      {post.imageUrl && <img src={post.imageUrl} alt="" className="mt-2 w-full rounded-lg" />}

      {post.originalPost && (
        <div className="mt-2 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Avatar url={post.originalPost.author.profilePictureUrl} name={post.originalPost.author.displayName} />
            <div className="leading-tight">
              <Link href={`/u/${post.originalPost.author.username}`} className="block font-medium hover:underline">{post.originalPost.author.displayName}</Link>
              <span className="text-xs text-slate-400">{timeAgo(post.originalPost.createdAt)}</span>
            </div>
          </div>
          {post.originalPost.content && <PostContent text={post.originalPost.content} className="mt-2 whitespace-pre-wrap text-sm" />}
          {post.originalPost.imageUrl && <img src={post.originalPost.imageUrl} alt="" className="mt-2 w-full rounded-lg" />}
        </div>
      )}

      <ReactionSummary post={post} />

      <div className="mt-1 flex items-center">
        <ReactionButton postId={post.id} myReaction={post.myReaction} likeCount={post.likeCount} onChange={(reaction: string | null, count: number) => onReactionChange(post.id, reaction, count)} />
        <button onClick={() => onToggleComments(post.id)} className="flex flex-1 items-center justify-center py-1.5 text-slate-600">
          <CommentIcon />
        </button>
        <button onClick={() => onShare(post.id)} className="flex flex-1 items-center justify-center py-1.5 text-slate-600">
          <ShareIcon />
        </button>
      </div>
    </div>
  );
}

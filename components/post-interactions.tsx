"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import {
  addComment,
  deleteComment,
  toggleLike,
  type CommentWithAuthor,
} from "@/app/actions";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";

export interface PostInteractionsProps {
  postId: number;
  isOwner: boolean;
  initialLikeCount: number;
  initialLiked: boolean;
  initialComments: CommentWithAuthor[];
  currentUser: {
    id: number;
    name: string;
    username: string;
    image: string;
  } | null;
}

export function PostInteractions({
  postId,
  isOwner,
  initialLikeCount,
  initialLiked,
  initialComments,
  currentUser,
}: PostInteractionsProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [comments, setComments] = useState(initialComments);
  const [liking, setLiking] = useState(false);
  const [posting, setPosting] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleLike() {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (liking) return;
    setLiking(true);
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      const result = await toggleLike(postId);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(initialLiked);
      setLikeCount(initialLikeCount);
    } finally {
      setLiking(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    const content = body.trim();
    if (!content || posting) return;
    setPosting(true);
    setError(null);
    try {
      const result = await addComment(postId, content);
      setComments((prev) => [result.comment, ...prev]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPosting(false);
      formRef.current?.reset();
    }
  }

  async function handleDelete(commentId: number) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // ignore
    }
  }

  return (
    <section className="no-print mx-auto mt-16 max-w-[680px] border-t border-border pt-8">
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={handleLike}
          aria-pressed={liked}
          disabled={liking}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-60",
            liked && "border-transparent bg-foreground text-background hover:bg-foreground/90",
          )}
        >
          <Heart
            className={cn(
              "size-4 transition-transform group-active:scale-125",
              liked ? "fill-current" : "text-muted-foreground group-hover:text-foreground",
            )}
          />
          {likeCount > 0 ? likeCount : "Like"}
        </button>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="size-4" />
          {comments.length === 0
            ? "No comments yet"
            : `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`}
        </span>
      </div>

      {currentUser ? (
        <form ref={formRef} onSubmit={handleSubmit} className="mt-8 flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-semibold">
            {currentUser.image ? (
              <Image
                src={currentUser.image}
                alt=""
                width={32}
                height={32}
                className="size-8 object-cover"
                unoptimized
              />
            ) : (
              (currentUser.name || currentUser.username).slice(0, 1).toUpperCase()
            )}
          </span>
          <div className="flex-1">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={`Comment as ${currentUser.name || currentUser.username}…`}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/40"
            />
            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={posting || !body.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              >
                {posting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Comment
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80">
            Sign in
          </Link>{" "}
          to like and leave a comment.
        </p>
      )}

      {comments.length > 0 && (
        <ul className="mt-8 space-y-6">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-semibold">
                {comment.author.image ? (
                  <Image
                    src={comment.author.image}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 object-cover"
                    unoptimized
                  />
                ) : (
                  (comment.author.name || comment.author.username)
                    .slice(0, 1)
                    .toUpperCase()
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <Link
                    href={`/${comment.author.username}`}
                    className="truncate font-medium transition-colors hover:underline"
                  >
                    {comment.author.name || comment.author.username}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {relativeTime(comment.createdAt)}
                  </span>
                  {currentUser?.id === comment.author.id || isOwner ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      aria-label="Delete comment"
                      className="ml-auto shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[0.925rem] leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

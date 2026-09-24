"use client";

import { useTransition, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/app/actions";

export function DeletePostButton({ postId }: { postId: number }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);

  const handleDelete = () => {
    startTransition(() => {
      deletePost(postId, false);
      setShowModal(false);
    });
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          setShowModal(true);
        }}
        disabled={isPending}
        className="shrink-0 rounded p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 z-10"
        aria-label="Delete post"
        title="Delete post"
      >
        <Trash2 className="size-4" />
      </button>

      {showModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg sm:max-w-[425px]">
              <h2 className="text-lg font-semibold text-foreground">Delete Post</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isPending}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

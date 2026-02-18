"use client";

import type { Bookmark } from "@/types/bookmark";
import { useState } from "react";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => Promise<void>;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }

    setDeleting(true);
    try {
      await onDelete(bookmark.id);
    } catch {
      setDeleting(false);
    }
  };

  const domain = getDomain(bookmark.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200 ${
        deleting ? "opacity-50 scale-98" : ""
      }`}
    >
      {/* Favicon */}
      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl}
          alt=""
          className="w-5 h-5"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-gray-900 hover:text-indigo-600 transition-colors truncate block"
          title={bookmark.title}
        >
          {bookmark.title}
        </a>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 truncate">{domain}</span>
          <span className="text-gray-200">•</span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatDate(bookmark.created_at)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Open link"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`p-1.5 rounded-lg transition-colors ${
            confirmDelete
              ? "text-red-600 bg-red-50 hover:bg-red-100"
              : "text-gray-400 hover:text-red-500 hover:bg-red-50"
          } disabled:opacity-50`}
          title={confirmDelete ? "Click again to confirm" : "Delete bookmark"}
        >
          {deleting ? (
            <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Bookmark } from "@/types/bookmark";
import AddBookmarkForm from "./AddBookmarkForm";
import BookmarkCard from "./BookmarkCard";

interface BookmarkManagerProps {
  initialBookmarks: Bookmark[];
  userId: string;
}

export default function BookmarkManager({
  initialBookmarks,
  userId,
}: BookmarkManagerProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "error">("connecting");

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchBookmarks = useCallback(async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setBookmarks(data as Bookmark[]);
  }, [supabase]);

  useEffect(() => {
    // Channel 1: postgres_changes — listens to DB events (works great for DELETE)
    const dbChannel = supabase
      .channel(`db-changes-${userId}`)
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bookmarks" },
        (payload) => {
          console.log("[Realtime] DELETE received", payload.old);
          const deletedId = payload.old?.id;
          if (deletedId) {
            setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        console.log("[DB Channel] status:", status);
        if (status === "SUBSCRIBED") setRealtimeStatus("connected");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setRealtimeStatus("error");
      });

    // Channel 2: Broadcast — used to ping OTHER tabs when THIS tab adds a bookmark
    // Broadcast works even when postgres_changes INSERT is unreliable
    const broadcastChannel = supabase
      .channel(`bookmark-broadcast-${userId}`, {
        config: { broadcast: { self: false } }, // don't receive your own broadcasts
      })
      .on("broadcast", { event: "bookmark-added" }, () => {
        console.log("[Broadcast] bookmark-added received — fetching...");
        fetchBookmarks();
      })
      .subscribe((status) => {
        console.log("[Broadcast Channel] status:", status);
      });

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [supabase, userId, fetchBookmarks]);

  const handleAdd = async (url: string, title: string) => {
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ url, title, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    // 1. Update THIS tab immediately (optimistic)
    if (data) {
      setBookmarks((prev) => {
        if (prev.some((b) => b.id === data.id)) return prev;
        return [data as Bookmark, ...prev];
      });
    }

    // 2. Broadcast to ALL OTHER open tabs so they fetch fresh data
    await supabase.channel(`bookmark-broadcast-${userId}`).send({
      type: "broadcast",
      event: "bookmark-added",
      payload: { id: data?.id },
    });
  };

  const handleDelete = async (id: string) => {
    // Optimistic remove — postgres_changes DELETE will also fire in other tabs
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      await fetchBookmarks();
      throw error;
    }
  };

  const statusConfig = {
    connecting: { color: "bg-yellow-400", text: "Connecting to real-time..." },
    connected: { color: "bg-green-400 animate-pulse", text: "Real-time sync active" },
    error: { color: "bg-red-400", text: "Real-time error — check console" },
  };
  const status = statusConfig[realtimeStatus];

  return (
    <div className="space-y-6">
      <AddBookmarkForm onAdd={handleAdd} />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Saved Bookmarks
          </h2>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
            {bookmarks.length} {bookmarks.length === 1 ? "item" : "items"}
          </span>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No bookmarks yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first bookmark above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
        {status.text}
      </p>
    </div>
  );
}

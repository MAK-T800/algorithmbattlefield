import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import type { Tables } from "@/integrations/supabase/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Room = Tables<"rooms">;
type Participant = Tables<"room_participants">;

interface ChatMessage {
  user: string;
  message: string;
  time: string;
}

export function useRoom(roomCode: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myParticipant, setMyParticipant] = useState<Participant | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sessionId = getSessionId();

  // Fetch room and participants
  const fetchRoom = useCallback(async () => {
    if (!roomCode) return;
    const { data: roomData, error: roomErr } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (roomErr || !roomData) {
      setError("Room not found");
      setLoading(false);
      return;
    }
    setRoom(roomData);

    const { data: parts } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", roomData.id)
      .order("score", { ascending: false });

    if (parts) {
      setParticipants(parts);
      setMyParticipant(parts.find((p) => p.session_id === sessionId) || null);
    }
    setLoading(false);
  }, [roomCode, sessionId]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!roomCode) return;
    fetchRoom();

    // Subscribe to DB changes on room_participants and rooms
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            setRoom(payload.new as Room);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_participants" },
        () => {
          // Re-fetch all participants on any change
          if (room?.id) {
            supabase
              .from("room_participants")
              .select("*")
              .eq("room_id", room.id)
              .order("score", { ascending: false })
              .then(({ data }) => {
                if (data) {
                  setParticipants(data);
                  setMyParticipant(data.find((p) => p.session_id === sessionId) || null);
                }
              });
          }
        }
      )
      .on("broadcast", { event: "chat" }, (payload) => {
        setChatMessages((prev) => [...prev, payload.payload as ChatMessage]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, fetchRoom]);

  // Re-subscribe to participant changes when room ID is known
  useEffect(() => {
    if (!room?.id || !channelRef.current) return;
    // Refresh participants
    supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", room.id)
      .order("score", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setParticipants(data);
          setMyParticipant(data.find((p) => p.session_id === sessionId) || null);
        }
      });
  }, [room?.id, sessionId]);

  const sendChat = useCallback(
    (message: string, userName: string) => {
      if (!channelRef.current) return;
      const msg: ChatMessage = {
        user: userName,
        message,
        time: "now",
      };
      channelRef.current.send({ type: "broadcast", event: "chat", payload: msg });
      setChatMessages((prev) => [...prev, msg]);
    },
    []
  );

  const startBattle = useCallback(async () => {
    if (!room) return;
    await supabase
      .from("rooms")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", room.id);
  }, [room]);

  const updateParticipant = useCallback(
    async (updates: Partial<Participant>) => {
      if (!myParticipant) return;
      await supabase
        .from("room_participants")
        .update(updates)
        .eq("id", myParticipant.id);
    },
    [myParticipant]
  );

  return {
    room,
    participants,
    myParticipant,
    chatMessages,
    loading,
    error,
    sendChat,
    startBattle,
    updateParticipant,
    refetch: fetchRoom,
  };
}

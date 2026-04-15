import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Room = Tables<"rooms">;

interface RoomWithCount extends Room {
  participant_count: number;
}

export function useRoomsList() {
  const [rooms, setRooms] = useState<RoomWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    const { data: roomsData } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (!roomsData) {
      setLoading(false);
      return;
    }

    // Fetch participant counts
    const roomsWithCounts: RoomWithCount[] = await Promise.all(
      roomsData.map(async (room) => {
        const { count } = await supabase
          .from("room_participants")
          .select("*", { count: "exact", head: true })
          .eq("room_id", room.id);
        return { ...room, participant_count: count || 0 };
      })
    );

    setRooms(roomsWithCounts);
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel("rooms-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => fetchRooms()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_participants" },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { rooms, loading, refetch: fetchRooms };
}

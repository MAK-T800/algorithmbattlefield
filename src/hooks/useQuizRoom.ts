import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Participant {
  id: string;
  user_name: string;
  session_id: string;
  is_host: boolean;
  score: number;
  status: string;
}

interface RoomData {
  id: string;
  room_code: string;
  host_name: string;
  topic: string;
  status: string;
  current_question_index: number;
  quiz_started: boolean;
  question_started_at: string | null;
  room_password: string;
  max_participants: number;
  quiz_mode: "mcq" | "program" | "mixed";
  time_per_question_sec: number;
}

interface AnswerRecord {
  participant_id: string;
  question_index: number;
  selected_option: number;
  is_correct: boolean;
  time_taken_ms: number;
}

interface Reaction {
  user: string;
  emoji: string;
}

export function useQuizRoom(roomCode: string | null) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myParticipant, setMyParticipant] = useState<Participant | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sessionId = getSessionId();

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
    setRoom(roomData as unknown as RoomData);

    const { data: parts } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", roomData.id)
      .order("score", { ascending: false });

    if (parts) {
      setParticipants(parts);
      setMyParticipant(parts.find((p) => p.session_id === sessionId) || null);
    }

    // Fetch answers for this room
    const { data: ans } = await supabase
      .from("room_answers")
      .select("*")
      .eq("room_id", roomData.id);
    if (ans) setAnswers(ans as unknown as AnswerRecord[]);

    setLoading(false);
  }, [roomCode, sessionId]);

  useEffect(() => {
    if (!roomCode) return;
    fetchRoom();

    const channel = supabase
      .channel(`quiz-${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `room_code=eq.${roomCode}` },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            setRoom(payload.new as unknown as RoomData);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_participants" },
        () => fetchRoom()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_answers" },
        () => {
          // Refetch answers on change
          if (room?.id) {
            supabase
              .from("room_answers")
              .select("*")
              .eq("room_id", room.id)
              .then(({ data }) => {
                if (data) setAnswers(data as unknown as AnswerRecord[]);
              });
          }
        }
      )
      .on("broadcast", { event: "reaction" }, (payload) => {
        setReactions((prev) => [...prev.slice(-50), payload.payload as Reaction]);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, fetchRoom]);

  // Refetch answers when room ID becomes available
  useEffect(() => {
    if (!room?.id) return;
    supabase
      .from("room_answers")
      .select("*")
      .eq("room_id", room.id)
      .then(({ data }) => {
        if (data) setAnswers(data as unknown as AnswerRecord[]);
      });
  }, [room?.id, room?.current_question_index]);

  const startQuiz = useCallback(async () => {
    if (!room) return;
    await supabase
      .from("rooms")
      .update({
        status: "active",
        quiz_started: true,
        current_question_index: 0,
        question_started_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
      })
      .eq("id", room.id);
  }, [room]);

  const nextQuestion = useCallback(async () => {
    if (!room) return;
    await supabase
      .from("rooms")
      .update({
        current_question_index: room.current_question_index + 1,
        question_started_at: new Date().toISOString(),
      })
      .eq("id", room.id);
  }, [room]);

  const endQuiz = useCallback(async () => {
    if (!room) return;
    await supabase
      .from("rooms")
      .update({ status: "finished" })
      .eq("id", room.id);
  }, [room]);

  const submitAnswer = useCallback(
    async (
      questionIndex: number,
      selectedOption: number,
      isCorrect: boolean,
      timeTakenMs: number,
      payload?: Record<string, unknown>,
    ) => {
      if (!room || !myParticipant) return;

      await supabase.from("room_answers").insert({
        room_id: room.id,
        participant_id: myParticipant.id,
        question_index: questionIndex,
        selected_option: selectedOption,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
        ...(payload ? { answer_payload: payload as never } : {}),
      } as never);

      // Update participant score
      const points = isCorrect ? Math.max(10, 100 - Math.floor(timeTakenMs / 1000)) : 0;
      await supabase
        .from("room_participants")
        .update({ score: myParticipant.score + points })
        .eq("id", myParticipant.id);
    },
    [room, myParticipant]
  );

  const sendReaction = useCallback(
    (emoji: string, userName: string) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: "broadcast",
        event: "reaction",
        payload: { user: userName, emoji },
      });
      setReactions((prev) => [...prev.slice(-50), { user: userName, emoji }]);
    },
    []
  );

  const leaveRoom = useCallback(async () => {
    if (!myParticipant) return;
    await supabase.from("room_participants").delete().eq("id", myParticipant.id);
  }, [myParticipant]);

  return {
    room,
    participants,
    myParticipant,
    answers,
    reactions,
    loading,
    error,
    startQuiz,
    nextQuestion,
    endQuiz,
    submitAnswer,
    sendReaction,
    leaveRoom,
    refetch: fetchRoom,
  };
}

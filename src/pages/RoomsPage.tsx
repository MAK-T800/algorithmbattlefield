import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, Plus, ArrowRight, LogIn, Loader2, Lock, BookOpen, Timer, Layers, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, getUsername, setUsername, generateRoomCode } from "@/lib/session";
import { useRoomsList } from "@/hooks/useRoomsList";
import { TOPICS } from "@/lib/mcqQuestions";
import { useToast } from "@/hooks/use-toast";
import JoinRoomModal from "@/components/quiz/JoinRoomModal";
import ConfirmDeleteModal from "@/components/quiz/ConfirmDeleteModal";

const MAX_PARTICIPANTS = 120;

type QuizMode = "mcq" | "program" | "mixed";
const MODES: Array<{ id: QuizMode; label: string; desc: string }> = [
  { id: "mcq", label: "MCQ", desc: "Concept questions" },
  { id: "program", label: "Program", desc: "Fill-in code blanks" },
  { id: "mixed", label: "Mixed", desc: "MCQ + Program" },
];
const TIMER_OPTIONS = [30, 45, 60];

const sanitizeName = (s: string) => s.replace(/[<>"'`]/g, "").slice(0, 40).trim();

export default function RoomsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { rooms, loading } = useRoomsList();
  const sessionId = getSessionId();

  const [showCreate, setShowCreate] = useState(false);
  const [joinModal, setJoinModal] = useState<{ open: boolean; code?: string }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; roomId?: string; roomCode?: string }>({ open: false });

  const [userName, setUserName] = useState(getUsername() || "");
  const [selectedTopic, setSelectedTopic] = useState("dsa");
  const [roomPassword, setRoomPassword] = useState("");
  const [quizMode, setQuizMode] = useState<QuizMode>("mcq");
  const [timePerQ, setTimePerQ] = useState<number>(60);

  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [createError, setCreateError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleCreate = async () => {
    const cleanName = sanitizeName(userName);
    if (!cleanName) { setCreateError("Enter your display name"); return; }
    if (!roomPassword.trim()) { setCreateError("Set a room password"); return; }
    setBusy(true);
    setCreateError("");
    setUsername(cleanName);
    const code = generateRoomCode();

    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .insert({
        room_code: code,
        host_name: cleanName,
        problem_id: 1,
        topic: selectedTopic,
        room_password: roomPassword.trim(),
        quiz_mode: quizMode,
        time_per_question_sec: timePerQ,
        max_participants: MAX_PARTICIPANTS,
      } as never)
      .select()
      .single();

    if (roomErr || !room) {
      setCreateError("Failed to create room");
      setBusy(false);
      return;
    }

    await supabase.from("room_participants").insert({
      room_id: room.id,
      user_name: cleanName,
      session_id: sessionId,
      is_host: true,
    });

    setBusy(false);
    setShowCreate(false);
    navigate(`/quiz/${code}`);
  };

  const openJoinModal = (code?: string) => {
    setJoinError("");
    setJoinModal({ open: true, code });
  };

  const handleJoin = async (cleanName: string, password: string, code: string) => {
    setBusy(true);
    setJoinError("");
    setUsername(cleanName);

    // Backend lookup + password check + capacity check
    const { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", code)
      .maybeSingle();

    if (!room) {
      setJoinError("Room no longer exists");
      setBusy(false);
      return;
    }

    if ((room as { room_password?: string }).room_password !== password) {
      setJoinError("Incorrect password");
      setBusy(false);
      return;
    }

    // Capacity check
    const { count } = await supabase
      .from("room_participants")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id);

    const { data: existing } = await supabase
      .from("room_participants")
      .select("id")
      .eq("room_id", room.id)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (!existing && (count || 0) >= (room.max_participants ?? MAX_PARTICIPANTS)) {
      setJoinError("Room is full");
      setBusy(false);
      return;
    }

    if (!existing) {
      await supabase.from("room_participants").insert({
        room_id: room.id,
        user_name: cleanName,
        session_id: sessionId,
      });
    }

    setBusy(false);
    setJoinModal({ open: false });
    navigate(`/quiz/${code}`);
  };

  const handleDelete = async () => {
    if (!deleteModal.roomId) return;
    setDeleteBusy(true);
    // Cascade: delete answers, participants, then room
    await supabase.from("room_answers").delete().eq("room_id", deleteModal.roomId);
    await supabase.from("submissions").delete().eq("room_id", deleteModal.roomId);
    await supabase.from("room_participants").delete().eq("room_id", deleteModal.roomId);
    const { error: delErr } = await supabase.from("rooms").delete().eq("id", deleteModal.roomId);
    setDeleteBusy(false);
    if (delErr) {
      toast({ title: "Failed to delete room", description: delErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "Room deleted", description: `Room ${deleteModal.roomCode} has been removed.` });
    setDeleteModal({ open: false });
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Quiz <span className="text-primary neon-text-blue">Battles</span>
            </h1>
            <p className="text-muted-foreground mt-1">Create or join a real-time quiz arena</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openJoinModal()} className="glass-panel flex items-center gap-2 px-5 py-3 text-primary hover:bg-primary/10 transition-all font-semibold">
              <LogIn className="w-4 h-4" /> Join Room
            </button>
            <button onClick={() => { setShowCreate((v) => !v); setCreateError(""); }} className="glass-panel flex items-center gap-2 px-5 py-3 text-primary hover:bg-primary/10 transition-all font-semibold">
              <Plus className="w-4 h-4" /> Create Room
            </button>
          </div>
        </motion.div>

        {/* Create Dialog */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel-strong p-6 mb-6">
              <h2 className="text-lg font-display font-bold text-foreground mb-4">Create a Room</h2>
              {createError && <p className="text-destructive text-sm mb-3">{createError}</p>}
              <div className="grid gap-3 max-w-md">
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={40}
                  className="bg-muted/50 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-border focus:border-primary/50 transition-colors"
                />
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Select Topic</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TOPICS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTopic(t.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg text-sm text-left transition-all ${
                          selectedTopic === t.id
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span className="font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> Quiz Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setQuizMode(m.id)}
                        className={`p-2 rounded-lg text-xs text-left transition-all ${
                          quizMode === m.id
                            ? "bg-secondary/15 text-secondary border border-secondary/40 neon-glow-purple"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <div className="font-semibold text-sm">{m.label}</div>
                        <div className="text-[10px] opacity-70">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Timer className="w-3 h-3" /> Time per question
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIMER_OPTIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimePerQ(t)}
                        className={`p-2 rounded-lg text-sm font-mono font-semibold transition-all ${
                          timePerQ === t
                            ? "bg-neon-orange/15 text-neon-orange border border-neon-orange/40"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="Room Password (required)"
                    type="password"
                    className="bg-muted/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-border focus:border-primary/50 transition-colors w-full"
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create & Enter
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Room List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">No active rooms yet</p>
            <p className="text-sm mt-1">Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {rooms.map((room, i) => {
                const roomData = room as { topic?: string; max_participants?: number };
                const topicConfig = TOPICS.find((t) => t.id === roomData.topic);
                const cap = roomData.max_participants ?? MAX_PARTICIPANTS;
                const isFull = room.participant_count >= cap;
                const isMine = (room as { host_name: string }).host_name && room.host_name === (getUsername() || "");
                // Host detection by session: check participant rows is async; we approximate via name match.
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-panel p-5 hover:border-primary/30 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {room.status === "active" && (
                          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-glow" />
                        )}
                        <span className="text-lg">{topicConfig?.icon || "📚"}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          {topicConfig?.label || "General"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          room.status === "active" ? "bg-neon-cyan/15 text-neon-cyan" :
                          room.status === "finished" ? "bg-muted/50 text-muted-foreground" :
                          "bg-primary/15 text-primary"
                        }`}>
                          {room.status}
                        </span>
                        {isMine && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, roomId: room.id, roomCode: room.room_code }); }}
                            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Delete room"
                            title="Delete room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-display font-semibold text-foreground mb-1">
                      {topicConfig?.label || "Quiz"} Battle
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Host: <span className="text-foreground">{room.host_name}</span>
                      <span className="ml-2 font-mono text-primary">{room.room_code}</span>
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className={isFull ? "text-destructive font-semibold" : ""}>
                          {room.participant_count} / {cap}
                        </span>
                        {isFull && <span className="text-xs text-destructive">FULL</span>}
                      </div>
                      <button
                        onClick={() => !isFull && openJoinModal(room.room_code)}
                        disabled={isFull}
                        className="flex items-center gap-1 text-primary opacity-70 group-hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed hover:underline"
                      >
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-semibold">{isFull ? "Full" : "Join"}</span>
                        {!isFull && <ArrowRight className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? "bg-destructive" : "bg-gradient-to-r from-primary to-secondary"}`}
                        style={{ width: `${Math.min(100, (room.participant_count / cap) * 100)}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <JoinRoomModal
        open={joinModal.open}
        onClose={() => { setJoinModal({ open: false }); setJoinError(""); }}
        onSubmit={(name, password, code) => handleJoin(name, password, joinModal.code || code)}
        defaultName={userName}
        defaultCode={joinModal.code || ""}
        lockedCode={!!joinModal.code}
        busy={busy}
        error={joinError}
      />

      <ConfirmDeleteModal
        open={deleteModal.open}
        busy={deleteBusy}
        onCancel={() => setDeleteModal({ open: false })}
        onConfirm={handleDelete}
      />
    </div>
  );
}

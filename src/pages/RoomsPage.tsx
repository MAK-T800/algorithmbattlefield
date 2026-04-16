import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, Plus, ArrowRight, LogIn, Loader2, Lock, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, getUsername, setUsername, generateRoomCode } from "@/lib/session";
import { useRoomsList } from "@/hooks/useRoomsList";
import { TOPICS } from "@/lib/mcqQuestions";

const difficultyColor: Record<string, string> = {
  Easy: "text-neon-cyan",
  Medium: "text-neon-orange",
  Hard: "text-destructive",
};

export default function RoomsPage() {
  const navigate = useNavigate();
  const { rooms, loading } = useRoomsList();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [userName, setUserName] = useState(getUsername() || "");
  const [selectedTopic, setSelectedTopic] = useState("dsa");
  const [roomPassword, setRoomPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ensureUsername = (): boolean => {
    if (!userName.trim()) {
      setError("Enter your name first");
      return false;
    }
    setUsername(userName.trim());
    return true;
  };

  const handleCreate = async () => {
    if (!ensureUsername()) return;
    if (!roomPassword.trim()) { setError("Set a room password"); return; }
    setBusy(true);
    setError("");
    const code = generateRoomCode();
    const sessionId = getSessionId();

    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .insert({
        room_code: code,
        host_name: userName.trim(),
        problem_id: 1,
        topic: selectedTopic,
        room_password: roomPassword.trim(),
      })
      .select()
      .single();

    if (roomErr || !room) {
      setError("Failed to create room");
      setBusy(false);
      return;
    }

    await supabase.from("room_participants").insert({
      room_id: room.id,
      user_name: userName.trim(),
      session_id: sessionId,
      is_host: true,
    });

    navigate(`/quiz/${code}`);
  };

  const handleJoin = async (code?: string) => {
    if (!ensureUsername()) return;
    const roomCode = (code || joinCode).trim().toUpperCase();
    if (!roomCode) { setError("Enter a room code"); return; }
    setBusy(true);
    setError("");
    const sessionId = getSessionId();

    const { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (!room) {
      setError("Room not found");
      setBusy(false);
      return;
    }

    // Verify password (check against DB value)
    const roomData = room as any;
    if (roomData.room_password && roomData.room_password !== joinPassword.trim() && !code) {
      setError("Wrong password");
      setBusy(false);
      return;
    }

    const { data: existing } = await supabase
      .from("room_participants")
      .select("id")
      .eq("room_id", room.id)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("room_participants").insert({
        room_id: room.id,
        user_name: userName.trim(),
        session_id: sessionId,
      });
    }

    navigate(`/quiz/${roomCode}`);
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Quiz <span className="text-primary neon-text-blue">Battles</span>
            </h1>
            <p className="text-muted-foreground mt-1">Create or join a real-time quiz arena</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }} className="glass-panel flex items-center gap-2 px-5 py-3 text-primary hover:bg-primary/10 transition-all font-semibold">
              <LogIn className="w-4 h-4" /> Join Room
            </button>
            <button onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }} className="glass-panel flex items-center gap-2 px-5 py-3 text-primary hover:bg-primary/10 transition-all font-semibold">
              <Plus className="w-4 h-4" /> Create Room
            </button>
          </div>
        </motion.div>

        {/* Create / Join Dialogs */}
        <AnimatePresence>
          {(showCreate || showJoin) && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel-strong p-6 mb-6">
              <h2 className="text-lg font-display font-bold text-foreground mb-4">
                {showCreate ? "Create a Room" : "Join a Room"}
              </h2>
              {error && <p className="text-destructive text-sm mb-3">{error}</p>}
              <div className="grid gap-3 max-w-md">
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your display name"
                  className="bg-muted/50 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-border focus:border-primary/50 transition-colors"
                />
                {showJoin && (
                  <>
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Room Code (e.g. ABC123)"
                      maxLength={6}
                      className="bg-muted/50 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-border focus:border-primary/50 transition-colors font-mono tracking-widest"
                    />
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        value={joinPassword}
                        onChange={(e) => setJoinPassword(e.target.value)}
                        placeholder="Room Password"
                        type="password"
                        className="bg-muted/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-border focus:border-primary/50 transition-colors w-full"
                      />
                    </div>
                  </>
                )}
                {showCreate && (
                  <>
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
                  </>
                )}
                <button
                  onClick={showCreate ? handleCreate : () => handleJoin()}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-semibold disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : showCreate ? <Plus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {showCreate ? "Create & Enter" : "Join Room"}
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
                const roomData = room as any;
                const topicConfig = TOPICS.find((t) => t.id === roomData.topic);
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-panel p-5 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
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
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        room.status === "active" ? "bg-neon-cyan/15 text-neon-cyan" :
                        room.status === "finished" ? "bg-muted/50 text-muted-foreground" :
                        "bg-primary/15 text-primary"
                      }`}>
                        {room.status}
                      </span>
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
                        <span>{room.participant_count}/{room.max_participants}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-semibold">Join</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                        style={{ width: `${(room.participant_count / room.max_participants) * 100}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

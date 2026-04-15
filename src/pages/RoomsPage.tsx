import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, Plus, ArrowRight, LogIn, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, getUsername, setUsername, generateRoomCode } from "@/lib/session";
import { useRoomsList } from "@/hooks/useRoomsList";
import { PROBLEMS } from "@/lib/problems";

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
  const [userName, setUserName] = useState(getUsername() || "");
  const [selectedProblem, setSelectedProblem] = useState(1);
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
    setBusy(true);
    setError("");
    const code = generateRoomCode();
    const sessionId = getSessionId();

    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .insert({ room_code: code, host_name: userName.trim(), problem_id: selectedProblem })
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

    navigate(`/arena/${code}`);
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

    // Check if already joined
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

    navigate(`/arena/${roomCode}`);
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Battle <span className="text-primary neon-text-blue">Rooms</span>
            </h1>
            <p className="text-muted-foreground mt-1">Create or join a real-time coding arena</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowJoin(true); setShowCreate(false); }} className="glass-panel flex items-center gap-2 px-5 py-3 text-primary hover:bg-primary/10 transition-all font-semibold">
              <LogIn className="w-4 h-4" /> Join Room
            </button>
            <button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="glass-panel flex items-center gap-2 px-5 py-3 text-primary hover:bg-primary/10 transition-all font-semibold">
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
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Room Code (e.g. ABC123)"
                    maxLength={6}
                    className="bg-muted/50 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground border border-border focus:border-primary/50 transition-colors font-mono tracking-widest"
                  />
                )}
                {showCreate && (
                  <select
                    value={selectedProblem}
                    onChange={(e) => setSelectedProblem(Number(e.target.value))}
                    className="bg-muted/50 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none border border-border focus:border-primary/50 transition-colors"
                  >
                    {PROBLEMS.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} ({p.difficulty})</option>
                    ))}
                  </select>
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
            <p className="text-lg">No active rooms yet</p>
            <p className="text-sm mt-1">Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {rooms.map((room, i) => {
                const problem = PROBLEMS.find((p) => p.id === room.problem_id);
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => handleJoin(room.room_code)}
                    className="glass-panel p-5 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {room.status === "active" && (
                          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-glow" />
                        )}
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          {problem?.category || "General"}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold ${difficultyColor[problem?.difficulty || "Easy"]}`}>
                        {problem?.difficulty || "Easy"}
                      </span>
                    </div>
                    <h3 className="text-lg font-display font-semibold text-foreground mb-1">
                      {problem?.title || "Unknown"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3 font-mono">
                      Code: <span className="text-primary">{room.room_code}</span>
                      <span className="ml-2 px-2 py-0.5 rounded bg-muted text-xs">
                        {room.status}
                      </span>
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

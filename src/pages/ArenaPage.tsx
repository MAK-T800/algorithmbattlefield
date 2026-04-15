import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Send, Users, Clock, Trophy, MessageSquare, Loader2, Zap, Copy } from "lucide-react";
import { useRoom } from "@/hooks/useRoom";
import { getProblem } from "@/lib/problems";
import { simulateExecution, calculateScore } from "@/lib/codeExecution";
import { getSessionId, getUsername } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ArenaPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { room, participants, myParticipant, chatMessages, loading, error, sendChat, startBattle, updateParticipant } = useRoom(roomCode || null);

  const problem = useMemo(() => getProblem(room?.problem_id || 1), [room?.problem_id]);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userName = getUsername() || "Anonymous";

  // Set starter code on problem load
  useEffect(() => {
    if (problem) setCode(problem.starterCode);
  }, [problem]);

  // Battle timer
  useEffect(() => {
    if (room?.status !== "active" || !room.started_at) return;
    const start = new Date(room.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.status, room?.started_at]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleRun = async () => {
    if (!problem || !room || !myParticipant) return;
    setRunning(true);
    setOutput("Running...");

    // Simulate a brief delay
    await new Promise((r) => setTimeout(r, 800));

    const result = simulateExecution(code, problem);
    setOutput(result.output);

    // Calculate solve time
    const solveTimeMs = room.started_at
      ? Date.now() - new Date(room.started_at).getTime()
      : 0;
    const score = calculateScore(result, solveTimeMs);

    // Submit to DB
    await supabase.from("submissions").insert({
      room_id: room.id,
      participant_id: myParticipant.id,
      code,
      is_correct: result.passed,
      execution_time_ms: result.executionTimeMs,
      efficiency_score: result.efficiencyScore,
    });

    // Update participant score
    await updateParticipant({
      score: Math.max(myParticipant.score, score),
      solve_time_ms: solveTimeMs,
      submitted_at: new Date().toISOString(),
      status: "submitted",
    });

    setRunning(false);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput.trim(), userName);
    setChatInput("");
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || "");
    toast({ title: "Copied!", description: `Room code ${roomCode} copied to clipboard` });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative z-10 gap-4">
        <p className="text-destructive text-lg">{error || "Room not found"}</p>
        <button onClick={() => navigate("/")} className="glass-panel px-5 py-2 text-primary">Back to Rooms</button>
      </div>
    );
  }

  const leaderboard = [...participants].sort((a, b) => b.score - a.score || (a.solve_time_ms || Infinity) - (b.solve_time_ms || Infinity));

  return (
    <div className="min-h-screen pt-20 px-2 pb-4 relative z-10">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-6rem)]">
        {/* Problem Panel */}
        <div className="lg:col-span-3 glass-panel p-4 overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-glow" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {room.status === "active" ? "Live Battle" : room.status === "waiting" ? "Waiting" : "Finished"}
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-1">{problem.title}</h2>
          <span className={`text-xs font-semibold ${problem.difficulty === "Easy" ? "text-neon-cyan" : problem.difficulty === "Medium" ? "text-neon-orange" : "text-destructive"}`}>
            {problem.difficulty} · {problem.category}
          </span>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{problem.description}</p>
          <div className="mt-4 space-y-3">
            <div className="glass-panel p-3">
              <p className="text-xs text-muted-foreground mb-1">Input</p>
              <code className="text-xs font-mono text-neon-cyan">{problem.input}</code>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-muted-foreground mb-1">Output</p>
              <code className="text-xs font-mono text-neon-cyan">{problem.output}</code>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-muted-foreground mb-1">Constraints</p>
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{problem.constraints}</pre>
            </div>
            <div className="text-xs text-muted-foreground">Expected: <span className="text-secondary font-mono">{problem.complexity}</span></div>
          </div>

          {/* Host controls */}
          {myParticipant?.is_host && room.status === "waiting" && (
            <button onClick={startBattle} className="mt-6 w-full py-2.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors font-semibold flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /> Start Battle
            </button>
          )}
        </div>

        {/* Code Editor */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="glass-panel-strong flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive/60" />
                <span className="w-3 h-3 rounded-full bg-neon-orange/60" />
                <span className="w-3 h-3 rounded-full bg-neon-cyan/60" />
                <span className="text-xs text-muted-foreground ml-2 font-mono">solution.cpp</span>
              </div>
              <button
                onClick={handleRun}
                disabled={running || room.status === "waiting"}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {running ? "Running..." : "Submit"}
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent p-4 font-mono text-sm text-foreground resize-none outline-none leading-6 scrollbar-hide"
              spellCheck={false}
              disabled={room.status === "waiting"}
            />
          </div>
          {/* Output */}
          <div className="glass-panel p-4 h-32 overflow-y-auto scrollbar-hide">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Output</p>
            {output ? (
              <pre className="text-xs font-mono text-neon-cyan whitespace-pre-wrap">{output}</pre>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {room.status === "waiting" ? "Waiting for host to start the battle..." : "Submit your code to see output..."}
              </p>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Room Info & Timer */}
          <div className="glass-panel p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neon-orange" />
              <span className="font-mono text-lg text-foreground">
                {room.status === "active" ? formatTime(elapsed) : "--:--"}
              </span>
            </div>
            <button onClick={copyRoomCode} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Copy className="w-3.5 h-3.5" />
              <span className="font-mono">{roomCode}</span>
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{participants.length}</span>
            </div>
          </div>

          {/* Live Leaderboard */}
          <div className="glass-panel p-4 flex-1 overflow-y-auto scrollbar-hide">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-neon-orange" />
              <span className="text-sm font-semibold text-foreground">Live Leaderboard</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No participants yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const isMe = entry.session_id === getSessionId();
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                        isMe ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-mono font-bold ${i < 3 ? "text-neon-orange" : "text-muted-foreground"}`}>
                          #{i + 1}
                        </span>
                        <span className="text-sm text-foreground">{entry.user_name}</span>
                        {entry.status === "submitted" && (
                          <span className="w-2 h-2 rounded-full bg-neon-cyan" />
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono text-primary">{entry.score}</span>
                        {entry.solve_time_ms && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatTime(Math.floor(entry.solve_time_ms / 1000))}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="glass-panel p-4 h-56 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Chat</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 mb-2">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No messages yet</p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-primary font-semibold">{msg.user}</span>
                    <span className="text-muted-foreground ml-1">{msg.time}</span>
                    <p className="text-foreground/80">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Type..."
                className="flex-1 bg-muted/50 rounded-lg px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button onClick={handleSendChat} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

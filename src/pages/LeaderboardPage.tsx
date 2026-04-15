import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Medal, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlayerStats {
  user_name: string;
  total_score: number;
  battles_played: number;
  best_score: number;
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("room_participants")
        .select("user_name, score, room_id")
        .gt("score", 0)
        .order("score", { ascending: false });

      if (!data) { setLoading(false); return; }

      // Aggregate by user_name
      const map = new Map<string, PlayerStats>();
      data.forEach((p) => {
        const existing = map.get(p.user_name);
        if (existing) {
          existing.total_score += p.score;
          existing.battles_played += 1;
          existing.best_score = Math.max(existing.best_score, p.score);
        } else {
          map.set(p.user_name, {
            user_name: p.user_name,
            total_score: p.score,
            battles_played: 1,
            best_score: p.score,
          });
        }
      });

      setPlayers(Array.from(map.values()).sort((a, b) => b.total_score - a.total_score));
      setLoading(false);
    };

    fetchLeaderboard();

    const channel = supabase
      .channel("global-leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants" }, () => fetchLeaderboard())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const rankColor = (rank: number) => {
    if (rank === 1) return "text-neon-orange neon-text-purple";
    if (rank === 2) return "text-muted-foreground";
    if (rank === 3) return "text-neon-orange";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-8 relative z-10">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Global <span className="text-primary neon-text-blue">Rankings</span>
          </h1>
          <p className="text-muted-foreground mt-2">Live rankings from real battles — no fake data</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : players.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No battles completed yet</p>
            <p className="text-sm mt-1">Create a room and compete to appear here!</p>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {players.length >= 3 && (
              <div className="flex items-end justify-center gap-4 mb-10">
                {[players[1], players[0], players[2]].map((entry, i) => {
                  const heights = ["h-28", "h-36", "h-24"];
                  const ranks = [2, 1, 3];
                  const emojis = ["🥈", "🥇", "🥉"];
                  return (
                    <motion.div key={entry.user_name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15 }}
                      className="flex flex-col items-center">
                      <span className="text-3xl mb-2">{emojis[i]}</span>
                      <span className="text-sm font-semibold text-foreground mb-1">{entry.user_name}</span>
                      <span className="text-xs text-primary font-mono mb-2">{entry.total_score}</span>
                      <div className={`${heights[i]} w-24 glass-panel-strong rounded-t-xl flex items-center justify-center`}>
                        <span className={`text-2xl font-display font-bold ${rankColor(ranks[i])}`}>#{ranks[i]}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div className="glass-panel overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <span className="col-span-1">Rank</span>
                <span className="col-span-4">Player</span>
                <span className="col-span-3 text-right">Total Score</span>
                <span className="col-span-2 text-right">Best</span>
                <span className="col-span-2 text-right">Battles</span>
              </div>
              {players.map((entry, i) => (
                <motion.div key={entry.user_name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-12 items-center px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/50 last:border-0">
                  <span className={`col-span-1 font-mono font-bold text-sm ${rankColor(i + 1)}`}>
                    {i < 3 ? <Medal className="w-4 h-4 inline" /> : `#${i + 1}`}
                  </span>
                  <span className="col-span-4 text-sm font-semibold text-foreground">{entry.user_name}</span>
                  <span className="col-span-3 text-right text-sm font-mono text-primary">{entry.total_score}</span>
                  <span className="col-span-2 text-right text-sm text-muted-foreground flex items-center justify-end gap-1">
                    <Zap className="w-3 h-3 text-neon-cyan" />{entry.best_score}
                  </span>
                  <span className="col-span-2 text-right text-sm text-muted-foreground flex items-center justify-end gap-1">
                    <Flame className="w-3 h-3 text-neon-orange" />{entry.battles_played}
                  </span>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

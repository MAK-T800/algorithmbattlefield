import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Medal } from "lucide-react";

const LEADERBOARD = [
  { rank: 1, name: "CodeNinja", score: 4820, solved: 142, streak: 28, avatar: "🥷" },
  { rank: 2, name: "AlgoMaster", score: 4650, solved: 138, streak: 21, avatar: "🧙" },
  { rank: 3, name: "ByteWarrior", score: 4510, solved: 131, streak: 19, avatar: "⚔️" },
  { rank: 4, name: "DataHero", score: 4200, solved: 125, streak: 15, avatar: "🦸" },
  { rank: 5, name: "GraphGuru", score: 3980, solved: 118, streak: 12, avatar: "🌐" },
  { rank: 6, name: "StackOverflow", score: 3750, solved: 112, streak: 10, avatar: "📚" },
  { rank: 7, name: "TreeTraverser", score: 3600, solved: 105, streak: 8, avatar: "🌳" },
  { rank: 8, name: "RecursiveRex", score: 3420, solved: 99, streak: 7, avatar: "🦖" },
  { rank: 9, name: "BinaryBoss", score: 3100, solved: 92, streak: 5, avatar: "💻" },
  { rank: 10, name: "HeapHero", score: 2900, solved: 85, streak: 3, avatar: "🏔️" },
];

const rankColor = (rank: number) => {
  if (rank === 1) return "text-neon-orange neon-text-purple";
  if (rank === 2) return "text-muted-foreground";
  if (rank === 3) return "text-neon-orange";
  return "text-muted-foreground";
};

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen pt-24 px-4 pb-8 relative z-10">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Global <span className="text-primary neon-text-blue">Rankings</span>
          </h1>
          <p className="text-muted-foreground mt-2">Top performers across all battles</p>
        </motion.div>

        {/* Top 3 podium */}
        <div className="flex items-end justify-center gap-4 mb-10">
          {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((entry, i) => {
            const heights = ["h-28", "h-36", "h-24"];
            const order = [1, 0, 2];
            return (
              <motion.div key={entry.rank} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + order[i] * 0.15 }}
                className="flex flex-col items-center">
                <span className="text-3xl mb-2">{entry.avatar}</span>
                <span className="text-sm font-semibold text-foreground mb-1">{entry.name}</span>
                <span className="text-xs text-primary font-mono mb-2">{entry.score}</span>
                <div className={`${heights[i]} w-24 glass-panel-strong rounded-t-xl flex items-center justify-center`}>
                  <span className={`text-2xl font-display font-bold ${rankColor(entry.rank)}`}>#{entry.rank}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full list */}
        <div className="glass-panel overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
            <span className="col-span-1">Rank</span>
            <span className="col-span-4">Player</span>
            <span className="col-span-2 text-right">Score</span>
            <span className="col-span-2 text-right">Solved</span>
            <span className="col-span-3 text-right">Streak</span>
          </div>
          {LEADERBOARD.map((entry, i) => (
            <motion.div key={entry.rank} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="grid grid-cols-12 items-center px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/50 last:border-0">
              <span className={`col-span-1 font-mono font-bold text-sm ${rankColor(entry.rank)}`}>
                {entry.rank <= 3 ? <Medal className="w-4 h-4 inline" /> : `#${entry.rank}`}
              </span>
              <span className="col-span-4 flex items-center gap-2">
                <span className="text-lg">{entry.avatar}</span>
                <span className="text-sm font-semibold text-foreground">{entry.name}</span>
              </span>
              <span className="col-span-2 text-right text-sm font-mono text-primary">{entry.score}</span>
              <span className="col-span-2 text-right text-sm text-muted-foreground flex items-center justify-end gap-1">
                <Zap className="w-3 h-3 text-neon-cyan" />{entry.solved}
              </span>
              <span className="col-span-3 text-right text-sm text-muted-foreground flex items-center justify-end gap-1">
                <Flame className="w-3 h-3 text-neon-orange" />{entry.streak} days
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, Plus, ArrowRight } from "lucide-react";

interface Room {
  id: string;
  name: string;
  participants: number;
  maxParticipants: number;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  isLive: boolean;
}

const MOCK_ROOMS: Room[] = [
  { id: "1", name: "Sorting Showdown", participants: 12, maxParticipants: 20, topic: "Arrays", difficulty: "Medium", isLive: true },
  { id: "2", name: "Graph Explorers", participants: 8, maxParticipants: 15, topic: "Graphs", difficulty: "Hard", isLive: true },
  { id: "3", name: "Stack Masters", participants: 5, maxParticipants: 10, topic: "Stacks & Queues", difficulty: "Easy", isLive: false },
  { id: "4", name: "Tree Traversals", participants: 14, maxParticipants: 20, topic: "Trees", difficulty: "Medium", isLive: true },
  { id: "5", name: "Linked List Lab", participants: 3, maxParticipants: 10, topic: "Linked Lists", difficulty: "Easy", isLive: false },
  { id: "6", name: "DP Champions", participants: 18, maxParticipants: 20, topic: "Arrays", difficulty: "Hard", isLive: true },
];

const difficultyColor = {
  Easy: "text-neon-cyan",
  Medium: "text-neon-orange",
  Hard: "text-destructive",
};

export default function RoomsPage() {
  const [rooms] = useState(MOCK_ROOMS);

  return (
    <div className="min-h-screen pt-24 px-4 pb-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Battle <span className="text-primary neon-text-blue">Rooms</span>
            </h1>
            <p className="text-muted-foreground mt-1">Join a room or create your own arena</p>
          </div>
          <button className="glass-panel flex items-center gap-2 px-5 py-3 text-primary hover:bg-primary/10 transition-all font-semibold">
            <Plus className="w-4 h-4" />
            Create Room
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-panel p-5 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {room.isLive && (
                      <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-glow" />
                    )}
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{room.topic}</span>
                  </div>
                  <span className={`text-xs font-semibold ${difficultyColor[room.difficulty]}`}>
                    {room.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-3">{room.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{room.participants}/{room.maxParticipants}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-semibold">Join</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                    style={{ width: `${(room.participants / room.maxParticipants) * 100}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

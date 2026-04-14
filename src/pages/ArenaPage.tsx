import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Send, Users, Clock, Trophy, MessageSquare } from "lucide-react";

const SAMPLE_PROBLEMS = [
  { id: 1, title: "Two Sum", difficulty: "Easy" as const, category: "Arrays", description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.", input: "nums = [2,7,11,15], target = 9", output: "[0,1]", constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9", complexity: "O(n)" },
  { id: 2, title: "Reverse Linked List", difficulty: "Easy" as const, category: "Linked Lists", description: "Given the head of a singly linked list, reverse the list, and return the reversed list.", input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]", constraints: "0 <= Number of nodes <= 5000", complexity: "O(n)" },
  { id: 3, title: "Valid Parentheses", difficulty: "Easy" as const, category: "Stacks & Queues", description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.", input: 's = "()"', output: "true", constraints: "1 <= s.length <= 10^4", complexity: "O(n)" },
];

const SAMPLE_CODE = `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (mp.find(complement) != mp.end()) {
                return {mp[complement], i};
            }
            mp[nums[i]] = i;
        }
        return {};
    }
};`;

const LEADERBOARD = [
  { rank: 1, name: "CodeNinja", score: 980, time: "2:34" },
  { rank: 2, name: "AlgoMaster", score: 945, time: "3:01" },
  { rank: 3, name: "ByteWarrior", score: 920, time: "3:15" },
  { rank: 4, name: "DataHero", score: 890, time: "3:45" },
  { rank: 5, name: "You", score: 0, time: "--:--" },
];

const CHAT_MESSAGES = [
  { user: "CodeNinja", message: "GL everyone! 🔥", time: "2m ago" },
  { user: "AlgoMaster", message: "Using hash map approach", time: "1m ago" },
  { user: "ByteWarrior", message: "Nice one!", time: "30s ago" },
];

export default function ArenaPage() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [selectedProblem, setSelectedProblem] = useState(SAMPLE_PROBLEMS[0]);
  const [output, setOutput] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(CHAT_MESSAGES);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRun = () => {
    setOutput("Running...");
    setTimeout(() => {
      setOutput("✅ Test Case 1: Passed [0, 1]\n✅ Test Case 2: Passed [1, 2]\n\nAll test cases passed!\nExecution Time: 4ms (simulated)\nEfficiency: Optimal O(n)");
    }, 1200);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { user: "You", message: chatInput, time: "now" }]);
    setChatInput("");
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [code]);

  return (
    <div className="min-h-screen pt-20 px-2 pb-4 relative z-10">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-6rem)]">
        {/* Problem Panel */}
        <div className="lg:col-span-3 glass-panel p-4 overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-glow" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Live Problem</span>
          </div>
          {/* Problem tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
            {SAMPLE_PROBLEMS.map(p => (
              <button key={p.id} onClick={() => setSelectedProblem(p)} className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-all ${selectedProblem.id === p.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {p.title}
              </button>
            ))}
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-1">{selectedProblem.title}</h2>
          <span className={`text-xs font-semibold ${selectedProblem.difficulty === "Easy" ? "text-neon-cyan" : selectedProblem.difficulty === "Medium" ? "text-neon-orange" : "text-destructive"}`}>
            {selectedProblem.difficulty} · {selectedProblem.category}
          </span>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{selectedProblem.description}</p>
          <div className="mt-4 space-y-3">
            <div className="glass-panel p-3">
              <p className="text-xs text-muted-foreground mb-1">Input</p>
              <code className="text-xs font-mono text-neon-cyan">{selectedProblem.input}</code>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-muted-foreground mb-1">Output</p>
              <code className="text-xs font-mono text-neon-cyan">{selectedProblem.output}</code>
            </div>
            <div className="glass-panel p-3">
              <p className="text-xs text-muted-foreground mb-1">Constraints</p>
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{selectedProblem.constraints}</pre>
            </div>
            <div className="text-xs text-muted-foreground">Expected: <span className="text-neon-purple font-mono">{selectedProblem.complexity}</span></div>
          </div>
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
              <button onClick={handleRun} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors text-sm font-semibold">
                <Play className="w-3.5 h-3.5" /> Run
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              className="flex-1 bg-transparent p-4 font-mono text-sm text-foreground resize-none outline-none leading-6 scrollbar-hide"
              spellCheck={false}
            />
          </div>
          {/* Output */}
          <div className="glass-panel p-4 h-32 overflow-y-auto scrollbar-hide">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Output</p>
            {output ? (
              <pre className="text-xs font-mono text-neon-cyan whitespace-pre-wrap">{output}</pre>
            ) : (
              <p className="text-xs text-muted-foreground italic">Run your code to see output...</p>
            )}
          </div>
        </div>

        {/* Right Panel - Leaderboard & Chat */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Timer */}
          <div className="glass-panel p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neon-orange" />
              <span className="font-mono text-lg text-foreground">14:32</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">12 online</span>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="glass-panel p-4 flex-1 overflow-y-auto scrollbar-hide">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-neon-orange" />
              <span className="text-sm font-semibold text-foreground">Leaderboard</span>
            </div>
            <div className="space-y-2">
              {LEADERBOARD.map(entry => (
                <motion.div key={entry.rank} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: entry.rank * 0.1 }}
                  className={`flex items-center justify-between p-2 rounded-lg ${entry.name === "You" ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/30"} transition-colors`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-mono font-bold ${entry.rank <= 3 ? "text-neon-orange" : "text-muted-foreground"}`}>#{entry.rank}</span>
                    <span className="text-sm text-foreground">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono text-primary">{entry.score}</span>
                    <span className="text-xs text-muted-foreground ml-2">{entry.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="glass-panel p-4 h-56 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Chat</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 mb-2">
              {messages.map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className="text-primary font-semibold">{msg.user}</span>
                  <span className="text-muted-foreground ml-1">{msg.time}</span>
                  <p className="text-foreground/80">{msg.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type..." className="flex-1 bg-muted/50 rounded-lg px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground" />
              <button onClick={sendMessage} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

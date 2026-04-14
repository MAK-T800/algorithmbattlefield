import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Gauge } from "lucide-react";

type AlgoCategory = "sorting" | "linkedlist" | "stack" | "tree" | "graph";

interface VisualizationStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  label: string;
}

const CATEGORIES: { key: AlgoCategory; label: string; algorithms: string[] }[] = [
  { key: "sorting", label: "Arrays & Sorting", algorithms: ["Bubble Sort", "Selection Sort", "Insertion Sort", "Merge Sort", "Quick Sort"] },
  { key: "linkedlist", label: "Linked Lists", algorithms: ["Insert Node", "Delete Node", "Reverse List"] },
  { key: "stack", label: "Stacks & Queues", algorithms: ["Push/Pop", "Enqueue/Dequeue"] },
  { key: "tree", label: "Trees", algorithms: ["Inorder", "Preorder", "Postorder", "BFS"] },
  { key: "graph", label: "Graphs", algorithms: ["BFS", "DFS", "Dijkstra"] },
];

function generateBubbleSortSteps(arr: number[]): VisualizationStep[] {
  const steps: VisualizationStep[] = [];
  const a = [...arr];
  const sorted: number[] = [];
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [], label: "Initial array" });

  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      steps.push({ array: [...a], comparing: [j, j + 1], swapping: [], sorted: [...sorted], label: `Comparing ${a[j]} and ${a[j + 1]}` });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ array: [...a], comparing: [], swapping: [j, j + 1], sorted: [...sorted], label: `Swapped ${a[j + 1]} and ${a[j]}` });
      }
    }
    sorted.push(a.length - 1 - i);
  }
  sorted.push(0);
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [...sorted], label: "Sorted!" });
  return steps;
}

function generateSelectionSortSteps(arr: number[]): VisualizationStep[] {
  const steps: VisualizationStep[] = [];
  const a = [...arr];
  const sorted: number[] = [];
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [], label: "Initial array" });

  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      steps.push({ array: [...a], comparing: [minIdx, j], swapping: [], sorted: [...sorted], label: `Finding minimum: comparing ${a[minIdx]} and ${a[j]}` });
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      steps.push({ array: [...a], comparing: [], swapping: [i, minIdx], sorted: [...sorted], label: `Swapped ${a[minIdx]} to position ${i}` });
    }
    sorted.push(i);
  }
  sorted.push(a.length - 1);
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [...sorted], label: "Sorted!" });
  return steps;
}

function generateInsertionSortSteps(arr: number[]): VisualizationStep[] {
  const steps: VisualizationStep[] = [];
  const a = [...arr];
  const sorted: number[] = [0];
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [0], label: "Initial array" });

  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0 && a[j - 1] > a[j]) {
      steps.push({ array: [...a], comparing: [j - 1, j], swapping: [], sorted: [...sorted], label: `Comparing ${a[j - 1]} and ${a[j]}` });
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      steps.push({ array: [...a], comparing: [], swapping: [j - 1, j], sorted: [...sorted], label: `Inserted ${a[j]} into correct position` });
      j--;
    }
    sorted.push(i);
  }
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: a.map((_, i) => i), label: "Sorted!" });
  return steps;
}

// Linked List visualization
interface LLNode { value: number; id: number; }

function LinkedListViz() {
  const [nodes, setNodes] = useState<LLNode[]>([
    { value: 10, id: 0 }, { value: 20, id: 1 }, { value: 30, id: 2 }, { value: 40, id: 3 }
  ]);
  const [highlight, setHighlight] = useState<number>(-1);
  const [label, setLabel] = useState("Linked List ready");
  const nextId = useRef(4);

  const insertAtEnd = () => {
    const val = Math.floor(Math.random() * 90) + 10;
    setHighlight(nodes.length);
    setLabel(`Inserting ${val} at end...`);
    setTimeout(() => {
      setNodes(prev => [...prev, { value: val, id: nextId.current++ }]);
      setLabel(`Inserted ${val}`);
      setTimeout(() => setHighlight(-1), 500);
    }, 400);
  };

  const deleteFirst = () => {
    if (nodes.length === 0) return;
    setHighlight(0);
    setLabel(`Deleting ${nodes[0].value} from head...`);
    setTimeout(() => {
      setNodes(prev => prev.slice(1));
      setLabel("Deleted head node");
      setHighlight(-1);
    }, 600);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              layout
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0, boxShadow: highlight === i ? "0 0 20px hsl(200 100% 55% / 0.6)" : "none" }}
              exit={{ opacity: 0, scale: 0.5, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex items-center gap-2"
            >
              <div className={`w-16 h-16 rounded-xl glass-panel flex flex-col items-center justify-center border-2 transition-colors duration-300 ${highlight === i ? "border-primary" : "border-glass-border/50"}`}>
                <span className="text-lg font-mono font-bold text-foreground">{node.value}</span>
                <span className="text-[10px] text-muted-foreground">node</span>
              </div>
              {i < nodes.length - 1 && (
                <motion.div className="text-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  →
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="w-12 h-12 rounded-lg border-2 border-dashed border-muted flex items-center justify-center text-muted-foreground text-xs">
          null
        </div>
      </div>
      <p className="text-sm text-primary font-mono neon-text-blue">{label}</p>
      <div className="flex gap-3">
        <button onClick={insertAtEnd} className="glass-panel px-4 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/10 transition-colors font-semibold">Insert</button>
        <button onClick={deleteFirst} className="glass-panel px-4 py-2 text-sm text-neon-orange hover:bg-neon-orange/10 transition-colors font-semibold">Delete Head</button>
      </div>
    </div>
  );
}

// Stack visualization
function StackViz() {
  const [stack, setStack] = useState<{ value: number; id: number }[]>([
    { value: 5, id: 0 }, { value: 12, id: 1 }, { value: 8, id: 2 }
  ]);
  const [label, setLabel] = useState("Stack ready");
  const nextId = useRef(3);

  const push = () => {
    const val = Math.floor(Math.random() * 90) + 10;
    setLabel(`Pushing ${val}...`);
    setStack(prev => [...prev, { value: val, id: nextId.current++ }]);
    setTimeout(() => setLabel(`Pushed ${val}`), 300);
  };

  const pop = () => {
    if (stack.length === 0) return;
    const val = stack[stack.length - 1].value;
    setLabel(`Popping ${val}...`);
    setTimeout(() => {
      setStack(prev => prev.slice(0, -1));
      setLabel(`Popped ${val}`);
    }, 300);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col-reverse items-center gap-1 min-h-[200px]">
        <div className="w-32 h-2 bg-muted rounded-full" />
        <AnimatePresence mode="popLayout">
          {stack.map((item, i) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.5, y: -30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`w-32 h-12 rounded-lg glass-panel flex items-center justify-center font-mono font-bold text-foreground ${i === stack.length - 1 ? "border-primary neon-glow-blue" : ""}`}
            >
              {item.value}
              {i === stack.length - 1 && <span className="ml-2 text-[10px] text-primary">← top</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className="text-sm text-primary font-mono neon-text-blue">{label}</p>
      <div className="flex gap-3">
        <button onClick={push} className="glass-panel px-4 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/10 transition-colors font-semibold">Push</button>
        <button onClick={pop} className="glass-panel px-4 py-2 text-sm text-neon-orange hover:bg-neon-orange/10 transition-colors font-semibold">Pop</button>
      </div>
    </div>
  );
}

// Tree visualization
interface TreeNode { value: number; left?: TreeNode; right?: TreeNode; }

const SAMPLE_TREE: TreeNode = {
  value: 50,
  left: { value: 30, left: { value: 20 }, right: { value: 40 } },
  right: { value: 70, left: { value: 60 }, right: { value: 80 } },
};

function TreeViz() {
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [visited, setVisited] = useState<number[]>([]);
  const [label, setLabel] = useState("Binary Search Tree ready");
  const [running, setRunning] = useState(false);

  const inorder = (node: TreeNode | undefined, result: number[]) => {
    if (!node) return;
    inorder(node.left, result);
    result.push(node.value);
    inorder(node.right, result);
  };

  const runTraversal = async (type: "inorder" | "preorder" | "postorder") => {
    if (running) return;
    setRunning(true);
    setVisited([]);
    setHighlighted([]);
    const order: number[] = [];

    const traverse = (node: TreeNode | undefined) => {
      if (!node) return;
      if (type === "preorder") order.push(node.value);
      traverse(node.left);
      if (type === "inorder") order.push(node.value);
      traverse(node.right);
      if (type === "postorder") order.push(node.value);
    };
    traverse(SAMPLE_TREE);

    for (let i = 0; i < order.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setHighlighted([order[i]]);
      setVisited(prev => [...prev, order[i]]);
      setLabel(`${type}: Visiting ${order[i]}`);
    }
    await new Promise(r => setTimeout(r, 400));
    setHighlighted([]);
    setLabel(`${type} complete: [${order.join(", ")}]`);
    setRunning(false);
  };

  const renderNode = (node: TreeNode | undefined, x: number, y: number, spread: number): JSX.Element | null => {
    if (!node) return null;
    const isHighlighted = highlighted.includes(node.value);
    const isVisited = visited.includes(node.value);
    return (
      <g key={node.value}>
        {node.left && (
          <line x1={x} y1={y + 15} x2={x - spread} y2={y + 60} stroke={isVisited && visited.includes(node.left.value) ? "hsl(200 100% 55%)" : "hsl(230 20% 25%)"} strokeWidth={2} />
        )}
        {node.right && (
          <line x1={x} y1={y + 15} x2={x + spread} y2={y + 60} stroke={isVisited && visited.includes(node.right.value) ? "hsl(200 100% 55%)" : "hsl(230 20% 25%)"} strokeWidth={2} />
        )}
        {renderNode(node.left, x - spread, y + 60, spread / 2)}
        {renderNode(node.right, x + spread, y + 60, spread / 2)}
        <circle cx={x} cy={y} r={20} fill={isHighlighted ? "hsl(200 100% 55%)" : isVisited ? "hsl(270 80% 60%)" : "hsl(230 25% 15%)"} stroke={isHighlighted ? "hsl(200 100% 65%)" : "hsl(230 20% 30%)"} strokeWidth={2}>
          {isHighlighted && <animate attributeName="r" values="20;24;20" dur="0.5s" repeatCount="indefinite" />}
        </circle>
        <text x={x} y={y + 5} textAnchor="middle" fill={isHighlighted || isVisited ? "hsl(230 25% 5%)" : "hsl(210 40% 90%)"} fontSize={12} fontFamily="JetBrains Mono" fontWeight="bold">
          {node.value}
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 400 250" className="w-full max-w-lg">
        {renderNode(SAMPLE_TREE, 200, 30, 80)}
      </svg>
      <p className="text-sm text-primary font-mono neon-text-blue">{label}</p>
      <div className="flex gap-2 flex-wrap justify-center">
        {(["inorder", "preorder", "postorder"] as const).map(t => (
          <button key={t} onClick={() => runTraversal(t)} disabled={running} className="glass-panel px-4 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/10 transition-colors font-semibold capitalize disabled:opacity-40">
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// Graph visualization
function GraphViz() {
  const nodes = [
    { id: 0, x: 200, y: 40, label: "A" },
    { id: 1, x: 80, y: 120, label: "B" },
    { id: 2, x: 320, y: 120, label: "C" },
    { id: 3, x: 40, y: 220, label: "D" },
    { id: 4, x: 160, y: 220, label: "E" },
    { id: 5, x: 280, y: 220, label: "F" },
  ];
  const edges = [[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[3,4],[4,5]];
  const adj: number[][] = Array.from({ length: 6 }, () => []);
  edges.forEach(([a,b]) => { adj[a].push(b); adj[b].push(a); });

  const [visited, setVisited] = useState<number[]>([]);
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [activeEdges, setActiveEdges] = useState<string[]>([]);
  const [label, setLabel] = useState("Graph ready");
  const [running, setRunning] = useState(false);

  const runBFS = async () => {
    if (running) return;
    setRunning(true);
    setVisited([]); setHighlighted([]); setActiveEdges([]);
    const queue = [0];
    const seen = new Set([0]);
    while (queue.length) {
      const curr = queue.shift()!;
      setHighlighted([curr]);
      setVisited(prev => [...prev, curr]);
      setLabel(`BFS: Visiting ${nodes[curr].label}`);
      await new Promise(r => setTimeout(r, 700));
      for (const nb of adj[curr]) {
        if (!seen.has(nb)) {
          seen.add(nb);
          queue.push(nb);
          setActiveEdges(prev => [...prev, `${Math.min(curr,nb)}-${Math.max(curr,nb)}`]);
        }
      }
    }
    setHighlighted([]);
    setLabel("BFS complete!");
    setRunning(false);
  };

  const runDFS = async () => {
    if (running) return;
    setRunning(true);
    setVisited([]); setHighlighted([]); setActiveEdges([]);
    const seen = new Set<number>();
    const dfs = async (node: number) => {
      seen.add(node);
      setHighlighted([node]);
      setVisited(prev => [...prev, node]);
      setLabel(`DFS: Visiting ${nodes[node].label}`);
      await new Promise(r => setTimeout(r, 700));
      for (const nb of adj[node]) {
        if (!seen.has(nb)) {
          setActiveEdges(prev => [...prev, `${Math.min(node,nb)}-${Math.max(node,nb)}`]);
          await dfs(nb);
        }
      }
    };
    await dfs(0);
    setHighlighted([]);
    setLabel("DFS complete!");
    setRunning(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 400 270" className="w-full max-w-lg">
        {edges.map(([a,b]) => {
          const edgeKey = `${Math.min(a,b)}-${Math.max(a,b)}`;
          const isActive = activeEdges.includes(edgeKey);
          return (
            <line key={edgeKey} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
              stroke={isActive ? "hsl(200 100% 55%)" : "hsl(230 20% 25%)"} strokeWidth={isActive ? 3 : 1.5}
              style={{ transition: "stroke 0.3s, stroke-width 0.3s" }} />
          );
        })}
        {nodes.map(n => {
          const isHigh = highlighted.includes(n.id);
          const isVis = visited.includes(n.id);
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={22}
                fill={isHigh ? "hsl(200 100% 55%)" : isVis ? "hsl(270 80% 60%)" : "hsl(230 25% 15%)"}
                stroke={isHigh ? "hsl(200 100% 65%)" : "hsl(230 20% 30%)"} strokeWidth={2}
                style={{ transition: "fill 0.3s" }}>
                {isHigh && <animate attributeName="r" values="22;26;22" dur="0.5s" repeatCount="indefinite" />}
              </circle>
              <text x={n.x} y={n.y + 5} textAnchor="middle" fill={isHigh || isVis ? "hsl(230 25% 5%)" : "hsl(210 40% 90%)"} fontSize={14} fontFamily="JetBrains Mono" fontWeight="bold">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-sm text-primary font-mono neon-text-blue">{label}</p>
      <div className="flex gap-3">
        <button onClick={runBFS} disabled={running} className="glass-panel px-4 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/10 transition-colors font-semibold disabled:opacity-40">BFS</button>
        <button onClick={runDFS} disabled={running} className="glass-panel px-4 py-2 text-sm text-neon-orange hover:bg-neon-orange/10 transition-colors font-semibold disabled:opacity-40">DFS</button>
      </div>
    </div>
  );
}

export default function VisualizePage() {
  const [category, setCategory] = useState<AlgoCategory>("sorting");
  const [selectedAlgo, setSelectedAlgo] = useState("Bubble Sort");
  const [steps, setSteps] = useState<VisualizationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(300);
  const intervalRef = useRef<number | null>(null);

  const generateArray = useCallback(() => {
    const arr = Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 10);
    let newSteps: VisualizationStep[];
    if (selectedAlgo === "Bubble Sort") newSteps = generateBubbleSortSteps(arr);
    else if (selectedAlgo === "Selection Sort") newSteps = generateSelectionSortSteps(arr);
    else newSteps = generateInsertionSortSteps(arr);
    setSteps(newSteps);
    setCurrentStep(0);
    setPlaying(false);
  }, [selectedAlgo]);

  useEffect(() => { if (category === "sorting") generateArray(); }, [generateArray, category]);

  useEffect(() => {
    if (playing && steps.length > 0) {
      intervalRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, steps.length]);

  const currentData = steps[currentStep];
  const maxVal = currentData ? Math.max(...currentData.array) : 1;

  const renderSortingViz = () => {
    if (!currentData) return null;
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-end gap-1 h-64 px-4">
          {currentData.array.map((val, i) => {
            const isComparing = currentData.comparing.includes(i);
            const isSwapping = currentData.swapping.includes(i);
            const isSorted = currentData.sorted.includes(i);
            let bg = "bg-primary/60";
            if (isComparing) bg = "bg-neon-cyan";
            else if (isSwapping) bg = "bg-neon-orange";
            else if (isSorted) bg = "bg-neon-purple";
            return (
              <motion.div
                key={i}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`rounded-t-md ${bg} transition-colors duration-200 relative flex-1 min-w-[24px] max-w-[48px]`}
                style={{ height: `${(val / maxVal) * 100}%`, boxShadow: isComparing || isSwapping ? "0 0 15px hsl(200 100% 55% / 0.5)" : "none" }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-mono text-foreground">{val}</span>
              </motion.div>
            );
          })}
        </div>
        <p className="text-sm text-primary font-mono neon-text-blue">{currentData.label}</p>
        {/* Controls */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setCurrentStep(0); setPlaying(false); }} className="glass-panel p-2 hover:bg-muted/50 transition-colors"><RotateCcw className="w-4 h-4 text-foreground" /></button>
          <button onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} className="glass-panel p-2 hover:bg-muted/50 transition-colors"><SkipBack className="w-4 h-4 text-foreground" /></button>
          <button onClick={() => setPlaying(!playing)} className="glass-panel p-3 hover:bg-primary/10 transition-colors neon-glow-blue">
            {playing ? <Pause className="w-5 h-5 text-primary" /> : <Play className="w-5 h-5 text-primary" />}
          </button>
          <button onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))} className="glass-panel p-2 hover:bg-muted/50 transition-colors"><SkipForward className="w-4 h-4 text-foreground" /></button>
          <div className="flex items-center gap-2 ml-4">
            <Gauge className="w-4 h-4 text-muted-foreground" />
            <input type="range" min={50} max={1000} step={50} value={1050 - speed} onChange={e => setSpeed(1050 - Number(e.target.value))} className="w-24 accent-primary" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Step {currentStep + 1} / {steps.length}
        </div>
        {/* Legend */}
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-cyan" /> Comparing</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-orange" /> Swapping</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-purple" /> Sorted</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-display font-bold text-foreground mb-6">
          Concept <span className="text-primary neon-text-blue">Visualizer</span>
        </motion.h1>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); if (cat.key === "sorting") { setSelectedAlgo(cat.algorithms[0]); } }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${category === cat.key ? "bg-primary/15 text-primary neon-glow-blue" : "glass-panel text-muted-foreground hover:text-foreground"}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Algorithm selector for sorting */}
        {category === "sorting" && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {CATEGORIES[0].algorithms.map(algo => (
              <button
                key={algo}
                onClick={() => { setSelectedAlgo(algo); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${selectedAlgo === algo ? "bg-secondary/20 text-secondary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {algo}
              </button>
            ))}
            <button onClick={generateArray} className="px-3 py-1.5 rounded-md text-xs font-semibold text-neon-orange hover:bg-neon-orange/10 transition-colors ml-auto">
              New Array
            </button>
          </div>
        )}

        {/* Visualization area */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel-strong p-8 min-h-[400px] flex items-center justify-center">
          {category === "sorting" && renderSortingViz()}
          {category === "linkedlist" && <LinkedListViz />}
          {category === "stack" && <StackViz />}
          {category === "tree" && <TreeViz />}
          {category === "graph" && <GraphViz />}
        </motion.div>
      </div>
    </div>
  );
}

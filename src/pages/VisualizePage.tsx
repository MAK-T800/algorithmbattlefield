import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Gauge } from "lucide-react";

const ALGO_CODE: Record<string, string> = {
  "Bubble Sort": `void bubbleSort(int arr[], int n) {
  // Edit the data here:
  int arr[] = {10, 30, 20, 50, 40, 70, 60};
  int n = 7;

  for (int i = 0; i < n-1; i++) {
    for (int j = 0; j < n-i-1; j++) {
      if (arr[j] > arr[j+1]) { // Use < for descending
        swap(arr[j], arr[j+1]);
      }
    }
  }
}`,
  "Selection Sort": `void selectionSort(int arr[], int n) {
  // Edit the data here:
  int arr[] = {10, 30, 20, 50, 40, 70, 60};
  int n = 7;

  for (int i = 0; i < n-1; i++) {
    int min_idx = i;
    for (int j = i+1; j < n; j++)
      if (arr[j] < arr[min_idx]) // Use > for descending
        min_idx = j;
    swap(arr[min_idx], arr[i]);
  }
}`,
  "Insertion Sort": `void insertionSort(int arr[], int n) {
  // Edit the data here:
  int arr[] = {10, 30, 20, 50, 40, 70, 60};
  int n = 7;

  for (int i = 1; i < n; i++) {
    int key = arr[i], j = i - 1;
    while (j >= 0 && arr[j] > key) { // Use < for descending
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
}`,
  "Merge Sort": `void mergeSort(int arr[], int l, int r) {
  // Edit the data here:
  int arr[] = {10, 30, 20, 50, 40, 70, 60};
  int n = 7;

  if (l < r) {
    int m = l + (r - l) / 2;
    mergeSort(arr, l, m);
    mergeSort(arr, m + 1, r);
    merge(arr, l, m, r);
  }
}`,
  "Quick Sort": `void quickSort(int arr[], int low, int high) {
  // Edit the data here:
  int arr[] = {10, 30, 20, 50, 40, 70, 60};
  int n = 7;

  if (low < high) {
    int pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}`,
  "LinkedList": `// Edit initial nodes here:
int data[] = {10, 20, 30, 40};

// Variables for Visualizer Actions
int insert_val = 50;
int insert_pos = 2; // 0-indexed position
int delete_val = 30;

// Insert at Position
void insertAtPosition(Node** head, int val, int pos) {
  Node* newNode = new Node(val);
  if (pos == 0) { newNode->next = *head; *head = newNode; return; }
  Node* temp = *head;
  for (int i = 0; temp && i < pos - 1; i++) temp = temp->next;
  if (!temp) return;
  newNode->next = temp->next;
  temp->next = newNode;
}`,
  "Stack": `// Edit initial data here:
int MAX_CAPACITY = 10;
int data[] = {5, 12, 8};
int push_val = 15;

void push(int val) {
  if (top >= MAX_CAPACITY-1) return;
  stack[++top] = val;
}

int pop() {
  if (top < 0) return -1;
  return stack[top--];
}
`,
  "Queue": `
int MAX_CAPACITY = 10;
int data[] = {10, 20, 30};
int enqueue_val = 40;

void enqueue(int val) {
  if (rear == MAX_CAPACITY-1) return;
  queue[++rear] = val;
}

int dequeue() {
  if (front > rear) return -1;
  return queue[front++];
}`,
  "Tree": `// Inorder Traversal
void inorder(Node* root) {
  if (!root) return;
  inorder(root->left);
  cout << root->val << " ";
  inorder(root->right);
}

// Preorder Traversal
void preorder(Node* root) {
  if (!root) return;
  cout << root->val << " ";
  preorder(root->left);
  preorder(root->right);
}

// Postorder Traversal
void postorder(Node* root) {
  if (!root) return;
  postorder(root->left);
  postorder(root->right);
  cout << root->val << " ";
}`,
  "Graph": `
void BFS(int s) {
  queue<int> q;
  visited[s] = true; q.push(s);
  while(!q.empty()) {
    s = q.front(); q.pop();
    for(auto i : adj[s]) {
      if(!visited[i]) {
        visited[i] = true; q.push(i);
      }
    }
  }
}`,
  "DFS": `// DFS Traversal
void DFS(int v) {
  visited[v] = true;
  for (auto i : adj[v])
    if (!visited[i]) DFS(i);
}`,
  "Dijkstra": `// Dijkstra's Shortest Path
void dijkstra(int src) {
  vector<int> dist(n, INT_MAX);
  priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;
  
  dist[src] = 0;
  pq.push({0, src});
  
  while (!pq.empty()) {
    int d = pq.top().first;
    int u = pq.top().second;
    pq.pop();
    
    if (d > dist[u]) continue;
    
    for (auto &edge : adj[u]) {
      int v = edge.first;
      int w = edge.second;
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        pq.push({dist[v], v});
      }
    }
  }
}`,
};

function CodeBlock({ code, onChange }: { code: string; onChange: (val: string) => void | React.Dispatch<React.SetStateAction<string>> }) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 mb-2 px-1 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Live Implementation Editor
      </div>
      <div className="relative group flex-1">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full glass-panel p-2 md:p-4 font-mono text-xs md:text-sm leading-relaxed text-primary overflow-x-auto whitespace-pre outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none scrollbar-hide"
          spellCheck={false}
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] md:text-[9px] bg-primary/20 text-primary px-2 py-1 rounded">Editable</span>
        </div>
      </div>
    </div>
  );
}

type AlgoCategory = "sorting" | "linkedlist" | "stack" | "queue" | "tree" | "graph";

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
  { key: "stack", label: "Stacks", algorithms: ["Push/Pop"] },
  { key: "queue", label: "Queues", algorithms: ["Enqueue/Dequeue"] },
  { key: "tree", label: "Trees", algorithms: ["Inorder", "Preorder", "Postorder", "BFS"] },
  { key: "graph", label: "Graphs", algorithms: ["BFS", "DFS", "Dijkstra"] },
];

function generateBubbleSortSteps(arr: number[], descending: boolean = false): VisualizationStep[] {
  const steps: VisualizationStep[] = [];
  const a = [...arr];
  const sorted: number[] = [];
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [], label: "Initial array" });

  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      steps.push({ array: [...a], comparing: [j, j + 1], swapping: [], sorted: [...sorted], label: `Comparing ${a[j]} and ${a[j + 1]}` });
      const shouldSwap = descending ? a[j] < a[j + 1] : a[j] > a[j + 1];
      if (shouldSwap) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ array: [...a], comparing: [], swapping: [j, j + 1], sorted: [...sorted], label: `Swapped ${a[j + 1]} and ${a[j]}` });
      }
    }
    if (!descending) sorted.push(a.length - 1 - i);
  }
  if (!descending) {
    sorted.push(0);
    steps.push({ array: [...a], comparing: [], swapping: [], sorted: [...sorted], label: "Sorted!" });
  } else {
    steps.push({ array: [...a], comparing: [], swapping: [], sorted: a.map((_, idx) => idx), label: "Sorted Descending!" });
  }
  return steps;
}

function generateSelectionSortSteps(arr: number[], descending: boolean = false): VisualizationStep[] {
  const steps: VisualizationStep[] = [];
  const a = [...arr];
  const sorted: number[] = [];
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [], label: "Initial array" });

  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      steps.push({ array: [...a], comparing: [minIdx, j], swapping: [], sorted: [...sorted], label: `Finding minimum: comparing ${a[minIdx]} and ${a[j]}` });
      const shouldUpdate = descending ? a[j] > a[minIdx] : a[j] < a[minIdx];
      if (shouldUpdate) minIdx = j;
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      steps.push({ array: [...a], comparing: [], swapping: [i, minIdx], sorted: [...sorted], label: `Swapped ${a[minIdx]} to position ${i}` });
    }
    sorted.push(i);
  }
  if (!descending) {
    sorted.push(a.length - 1);
    steps.push({ array: [...a], comparing: [], swapping: [], sorted: [...sorted], label: "Sorted!" });
  } else {
    steps.push({ array: [...a], comparing: [], swapping: [], sorted: a.map((_, idx) => idx), label: "Sorted Descending!" });
  }
  return steps;
}

function generateInsertionSortSteps(arr: number[], descending: boolean = false): VisualizationStep[] {
  const steps: VisualizationStep[] = [];
  const a = [...arr];
  const sorted: number[] = [];
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: [0], label: "Initial array" });

  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0) {
      steps.push({ array: [...a], comparing: [j - 1, j], swapping: [], sorted: [...sorted], label: `Comparing ${a[j - 1]} and ${a[j]}` });
      const shouldSwap = descending ? a[j - 1] < a[j] : a[j - 1] > a[j];
      if (shouldSwap) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        steps.push({ array: [...a], comparing: [], swapping: [j - 1, j], sorted: [...sorted], label: `Inserted ${a[j]} into correct position` });
      } else {
        break;
      }
      j--;
    }
    sorted.push(i);
  }
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: a.map((_, i) => i), label: descending ? "Sorted Descending!" : "Sorted!" });
  return steps;
}

// Linked List visualization
interface LLNode { value: number; id: number; }

function LinkedListViz({ code, setLabel, syncTrigger, commandText, commandId, speed }: { code: string; setLabel: (l: string) => void; syncTrigger: number; commandText: string; commandId: number; speed: number }) {
  const [nodes, setNodes] = useState<LLNode[]>([]);
  const [highlight, setHighlight] = useState<number>(-1);
  const nextId = useRef(nodes.length);

  const insertAtEnd = (value?: number) => {
    const match = code.match(/insert_val\s*=\s*(\d+)/);
    const val = value ?? (match ? parseInt(match[1]) : 50);

    setHighlight(nodes.length);
    setLabel(`Inserting ${val} at end...`);
    setTimeout(() => {
      setNodes(prev => [...prev, { value: val, id: nextId.current++ }]);
      setLabel(`Inserted ${val}`);
      setTimeout(() => setHighlight(-1), speed);
    }, speed);
  };

  const insertAtPosition = (pos?: number, value?: number) => {
    const valMatch = code.match(/insert_val\s*=\s*(\d+)/);
    const posMatch = code.match(/insert_pos\s*=\s*(\d+)/);
    const val = value ?? (valMatch ? parseInt(valMatch[1]) : 50);
    const position = pos ?? (posMatch ? parseInt(posMatch[1]) : 2);

    if (position < 0 || position > nodes.length) {
      setLabel(`Invalid position ${position}`);
      return;
    }

    setHighlight(position);
    setLabel(`Inserting ${val} at position ${position}...`);
    setTimeout(() => {
      setNodes(prev => {
        const newNodes = [...prev];
        newNodes.splice(position, 0, { value: val, id: nextId.current++ });
        return newNodes;
      });
      setLabel(`Inserted ${val} at position ${position}`);
      setTimeout(() => setHighlight(-1), speed);
    }, speed);
  };

  const deleteByValue = (value?: number) => {
    if (nodes.length === 0) {
      setLabel("List is empty.");
      return;
    }

    const match = code.match(/delete_val\s*=\s*(\d+)/);
    const val = value ?? (match ? parseInt(match[1]) : nodes[0].value);

    const index = nodes.findIndex(n => n.value === val);
    if (index === -1) {
      setLabel(`Value ${val} not found in list`);
      return;
    }

    setHighlight(index);
    setLabel(`Deleting node with value ${val}...`);
    setTimeout(() => {
      setNodes(prev => prev.filter((_, i) => i !== index));
      setLabel(`Deleted node with value ${val}`);
      setHighlight(-1);
    }, speed);
  };

  useEffect(() => {
    const dataMatch = code.match(/data\[\]\s*=\s*\{([^}]+)\}/);
    if (dataMatch) {
      const vals = dataMatch[1].split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      setNodes(vals.map((v, i) => ({ value: v, id: i })));
      nextId.current = vals.length;
    }
  }, [syncTrigger]); // Triggered on Sync & Build

  useEffect(() => {
    if (!commandText) return;
    const command = commandText.trim().toLowerCase();
    const insertAtMatch = command.match(/^insert\s+(\d+)\s+at\s+(\d+)$/);
    const insertMatch = command.match(/^insert\s+(\d+)$/);
    const deleteMatch = command.match(/^delete\s+(\d+)$/);
    
    if (insertAtMatch) {
      insertAtPosition(Number(insertAtMatch[2]), Number(insertAtMatch[1]));
    } else if (insertMatch) {
      insertAtEnd(Number(insertMatch[1]));
    } else if (deleteMatch) {
      deleteByValue(Number(deleteMatch[1]));
    } else {
      setLabel("Invalid command. Use insert <value>, insert <value> at <pos>, or delete <value>.");
    }
  }, [commandId]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-4 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {nodes.length === 0 ? (
            <div className="w-full flex items-center justify-center text-sm text-muted-foreground/50 italic min-h-[100px]">Linked List is empty</div>
          ) : (
            <>
              {nodes.map((node, i) => (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 0, scale: 0.5, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0, boxShadow: highlight === i ? "0 0 20px hsl(var(--primary) / 0.6)" : "none" }}
                  exit={{ opacity: 0, scale: 0.5, x: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-1"
                >
                  <div className={`rounded-lg glass-panel border-2 transition-colors duration-300 ${highlight === i ? "border-primary neon-glow-blue" : "border-border/50"}`}>
                    <div className="grid grid-cols-2 gap-0 divide-x divide-border/50">
                      <div className="px-3 py-2 flex flex-col items-center justify-center border-b border-border/50">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Data</span>
                        <span className="text-lg font-mono font-bold text-foreground">{node.value}</span>
                      </div>
                      <div className="px-3 py-2 flex flex-col items-center justify-center border-b border-border/50">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Next</span>
                        <span className="text-[11px] font-mono text-primary">
                          {i < nodes.length - 1 ? `0x${(nodes[i + 1].id + 1).toString(16).toUpperCase().padStart(4, "0")}` : "NULL"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {i < nodes.length - 1 && <span className="text-primary font-bold text-lg">→</span>}
                </motion.div>
              ))}
              <div className="flex items-center gap-1">
                <span className="text-primary font-bold text-lg">→</span>
                <div className="rounded-lg glass-panel border-2 border-border/50 px-3 py-2">
                  <span className="text-xs font-mono text-muted-foreground font-bold">null</span>
                </div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => insertAtEnd()} className="glass-panel px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-semibold">Insert</button>
        <button onClick={() => insertAtPosition()} className="glass-panel px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-semibold">Insert at Position</button>
        <button onClick={() => deleteByValue()} className="glass-panel px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors font-semibold">Delete Node</button>
      </div>
    </div>
  );
}


// Doubly Linked List visualization
function DoublyLinkedListViz({ code, setLabel, syncTrigger, commandText, commandId, speed }: { code: string; setLabel: (l: string) => void; syncTrigger: number; commandText: string; commandId: number; speed: number }) {
  const [nodes, setNodes] = useState<LLNode[]>([]);
  const [highlight, setHighlight] = useState<number>(-1);
  const nextId = useRef(nodes.length);

  const insertAtEnd = (value?: number) => {
    const match = code.match(/insert_val\s*=\s*(\d+)/);
    const val = value ?? (match ? parseInt(match[1]) : 50);

    setHighlight(nodes.length);
    setLabel(`Inserting ${val} at end...`);
    setTimeout(() => {
      setNodes(prev => [...prev, { value: val, id: nextId.current++ }]);
      setLabel(`Inserted ${val}`);
      setTimeout(() => setHighlight(-1), speed);
    }, speed);
  };

  const insertAtPosition = (pos?: number, value?: number) => {
    const valMatch = code.match(/insert_val\s*=\s*(\d+)/);
    const posMatch = code.match(/insert_pos\s*=\s*(\d+)/);
    const val = value ?? (valMatch ? parseInt(valMatch[1]) : 50);
    const position = pos ?? (posMatch ? parseInt(posMatch[1]) : 2);

    if (position < 0 || position > nodes.length) {
      setLabel(`Invalid position ${position}`);
      return;
    }

    setHighlight(position);
    setLabel(`Inserting ${val} at position ${position}...`);
    setTimeout(() => {
      setNodes(prev => {
        const newNodes = [...prev];
        newNodes.splice(position, 0, { value: val, id: nextId.current++ });
        return newNodes;
      });
      setLabel(`Inserted ${val} at position ${position}`);
      setTimeout(() => setHighlight(-1), speed);
    }, speed);
  };

  const deleteByValue = (value?: number) => {
    if (nodes.length === 0) {
      setLabel("List is empty.");
      return;
    }

    const match = code.match(/delete_val\s*=\s*(\d+)/);
    const val = value ?? (match ? parseInt(match[1]) : nodes[0].value);

    const index = nodes.findIndex(n => n.value === val);
    if (index === -1) {
      setLabel(`Value ${val} not found in list`);
      return;
    }

    setHighlight(index);
    setLabel(`Deleting node with value ${val}...`);
    setTimeout(() => {
      setNodes(prev => prev.filter((_, i) => i !== index));
      setLabel(`Deleted node with value ${val}`);
      setHighlight(-1);
    }, speed);
  };

  useEffect(() => {
    const dataMatch = code.match(/data\[\]\s*=\s*\{([^}]+)\}/);
    if (dataMatch) {
      const vals = dataMatch[1].split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      setNodes(vals.map((v, i) => ({ value: v, id: i })));
      nextId.current = vals.length;
    }
  }, [syncTrigger]); // Triggered on Sync & Build

  useEffect(() => {
    if (!commandText) return;
    const command = commandText.trim().toLowerCase();
    const insertAtMatch = command.match(/^insert\s+(\d+)\s+at\s+(\d+)$/);
    const insertMatch = command.match(/^insert\s+(\d+)$/);
    const deleteMatch = command.match(/^delete\s+(\d+)$/);
    
    if (insertAtMatch) {
      insertAtPosition(Number(insertAtMatch[2]), Number(insertAtMatch[1]));
    } else if (insertMatch) {
      insertAtEnd(Number(insertMatch[1]));
    } else if (deleteMatch) {
      deleteByValue(Number(deleteMatch[1]));
    } else {
      setLabel("Invalid command. Use insert <value>, insert <value> at <pos>, or delete <value>.");
    }
  }, [commandId]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-4 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {nodes.length === 0 ? (
            <div className="w-full flex items-center justify-center text-sm text-muted-foreground/50 italic min-h-[100px]">Linked List is empty</div>
          ) : (
            <>
              {nodes.map((node, i) => (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 0, scale: 0.5, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0, boxShadow: highlight === i ? "0 0 20px hsl(var(--primary) / 0.6)" : "none" }}
                  exit={{ opacity: 0, scale: 0.5, x: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-1"
                >
                  <div className={`rounded-lg glass-panel border-2 transition-colors duration-300 ${highlight === i ? "border-primary neon-glow-blue" : "border-border/50"}`}>
                    <div className="grid grid-cols-3 gap-0 divide-x divide-border/50">
                      <div className="px-2 py-2 flex flex-col items-center justify-center border-b border-border/50">
                        <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">Prev</span>
                        <span className="text-[10px] font-mono text-primary">
                          {i > 0 ? `0x${(nodes[i - 1].id + 1).toString(16).toUpperCase().padStart(4, "0")}` : "NULL"}
                        </span>
                      </div>
                      <div className="px-3 py-2 flex flex-col items-center justify-center border-b border-border/50">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Data</span>
                        <span className="text-lg font-mono font-bold text-foreground">{node.value}</span>
                      </div>
                      <div className="px-2 py-2 flex flex-col items-center justify-center border-b border-border/50">
                        <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">Next</span>
                        <span className="text-[10px] font-mono text-primary">
                          {i < nodes.length - 1 ? `0x${(nodes[i + 1].id + 1).toString(16).toUpperCase().padStart(4, "0")}` : "NULL"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {i < nodes.length - 1 && <span className="text-primary font-bold text-lg">↔</span>}
                </motion.div>
              ))}
              <div className="flex items-center gap-1">
                <span className="text-primary font-bold text-lg">↔</span>
                <div className="rounded-lg glass-panel border-2 border-border/50 px-3 py-2">
                  <span className="text-xs font-mono text-muted-foreground font-bold">null</span>
                </div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => insertAtEnd()} className="glass-panel px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-semibold">Insert</button>
        <button onClick={() => insertAtPosition()} className="glass-panel px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-semibold">Insert at Position</button>
        <button onClick={() => deleteByValue()} className="glass-panel px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors font-semibold">Delete Node</button>
      </div>
    </div>
  );
}


// Circular Linked List visualization
function CircularLinkedListViz({ code, setLabel, syncTrigger, commandText, commandId, speed }: { code: string; setLabel: (l: string) => void; syncTrigger: number; commandText: string; commandId: number; speed: number }) {
  const [nodes, setNodes] = useState<LLNode[]>([]);
  const [highlight, setHighlight] = useState<number>(-1);
  const nextId = useRef(nodes.length);

  const insertAtEnd = (value?: number) => {
    const match = code.match(/insert_val\s*=\s*(\d+)/);
    const val = value ?? (match ? parseInt(match[1]) : 50);

    setHighlight(nodes.length);
    setLabel(`Inserting ${val} at end...`);
    setTimeout(() => {
      setNodes(prev => [...prev, { value: val, id: nextId.current++ }]);
      setLabel(`Inserted ${val}`);
      setTimeout(() => setHighlight(-1), speed);
    }, speed);
  };

  const insertAtPosition = (pos?: number, value?: number) => {
    const valMatch = code.match(/insert_val\s*=\s*(\d+)/);
    const posMatch = code.match(/insert_pos\s*=\s*(\d+)/);
    const val = value ?? (valMatch ? parseInt(valMatch[1]) : 50);
    const position = pos ?? (posMatch ? parseInt(posMatch[1]) : 2);

    if (position < 0 || position > nodes.length) {
      setLabel(`Invalid position ${position}`);
      return;
    }

    setHighlight(position);
    setLabel(`Inserting ${val} at position ${position}...`);
    setTimeout(() => {
      setNodes(prev => {
        const newNodes = [...prev];
        newNodes.splice(position, 0, { value: val, id: nextId.current++ });
        return newNodes;
      });
      setLabel(`Inserted ${val} at position ${position}`);
      setTimeout(() => setHighlight(-1), speed);
    }, speed);
  };

  const deleteByValue = (value?: number) => {
    if (nodes.length === 0) {
      setLabel("List is empty.");
      return;
    }

    const match = code.match(/delete_val\s*=\s*(\d+)/);
    const val = value ?? (match ? parseInt(match[1]) : nodes[0].value);

    const index = nodes.findIndex(n => n.value === val);
    if (index === -1) {
      setLabel(`Value ${val} not found in list`);
      return;
    }

    setHighlight(index);
    setLabel(`Deleting node with value ${val}...`);
    setTimeout(() => {
      setNodes(prev => prev.filter((_, i) => i !== index));
      setLabel(`Deleted node with value ${val}`);
      setHighlight(-1);
    }, speed);
  };

  useEffect(() => {
    const dataMatch = code.match(/data\[\]\s*=\s*\{([^}]+)\}/);
    if (dataMatch) {
      const vals = dataMatch[1].split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      setNodes(vals.map((v, i) => ({ value: v, id: i })));
      nextId.current = vals.length;
    }
  }, [syncTrigger]); // Triggered on Sync & Build

  useEffect(() => {
    if (!commandText) return;
    const command = commandText.trim().toLowerCase();
    const insertAtMatch = command.match(/^insert\s+(\d+)\s+at\s+(\d+)$/);
    const insertMatch = command.match(/^insert\s+(\d+)$/);
    const deleteMatch = command.match(/^delete\s+(\d+)$/);
    
    if (insertAtMatch) {
      insertAtPosition(Number(insertAtMatch[2]), Number(insertAtMatch[1]));
    } else if (insertMatch) {
      insertAtEnd(Number(insertMatch[1]));
    } else if (deleteMatch) {
      deleteByValue(Number(deleteMatch[1]));
    } else {
      setLabel("Invalid command. Use insert <value>, insert <value> at <pos>, or delete <value>.");
    }
  }, [commandId]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-4 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {nodes.length === 0 ? (
            <div className="w-full flex items-center justify-center text-sm text-muted-foreground/50 italic min-h-[100px]">Linked List is empty</div>
          ) : (
            <>
              {nodes.map((node, i) => (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 0, scale: 0.5, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0, boxShadow: highlight === i ? "0 0 20px hsl(var(--primary) / 0.6)" : "none" }}
                  exit={{ opacity: 0, scale: 0.5, x: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-1"
                >
                  <div className={`rounded-lg glass-panel border-2 transition-colors duration-300 ${highlight === i ? "border-primary neon-glow-blue" : "border-border/50"}`}>
                    <div className="grid grid-cols-2 gap-0 divide-x divide-border/50">
                      <div className="px-3 py-2 flex flex-col items-center justify-center border-b border-border/50">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Data</span>
                        <span className="text-lg font-mono font-bold text-foreground">{node.value}</span>
                      </div>
                      <div className="px-3 py-2 flex flex-col items-center justify-center border-b border-border/50">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Next</span>
                        <span className="text-[11px] font-mono text-primary">
                          {i < nodes.length - 1 ? `0x${(nodes[i + 1].id + 1).toString(16).toUpperCase().padStart(4, "0")}` : `0x${(nodes[0]?.id + 1 || 1).toString(16).toUpperCase().padStart(4, "0")}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {i < nodes.length - 1 && <span className="text-primary font-bold text-lg">→</span>}
                </motion.div>
              ))}
              <div className="flex items-center gap-1">
                <span className="text-primary font-bold text-lg">→</span>
                <div className="rounded-lg glass-panel border-2 border-border/50 px-3 py-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Loops to</span>
                  <span className="text-xs font-mono text-primary font-bold">Head (0x{(nodes[0]?.id + 1 || 1).toString(16).toUpperCase().padStart(4, "0")})</span>
                </div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => insertAtEnd()} className="glass-panel px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-semibold">Insert</button>
        <button onClick={() => insertAtPosition()} className="glass-panel px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-semibold">Insert at Position</button>
        <button onClick={() => deleteByValue()} className="glass-panel px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors font-semibold">Delete Node</button>
      </div>
    </div>
  );
}


// Stack visualization
function StackViz({ code, setLabel, syncTrigger, commandText, commandId, speed }: { code: string; setLabel: (l: string) => void; syncTrigger: number; commandText: string; commandId: number; speed: number }) {
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [stack, setStack] = useState<{ value: number; id: number }[]>([
    { value: 5, id: 0 }, { value: 12, id: 1 }, { value: 8, id: 2 }
  ]);
  const nextId = useRef(stack.length);

  useEffect(() => {
    const capacityMatch = code.match(/MAX_CAPACITY\s*=\s*(\d+)/);
    if (capacityMatch) {
      const capacity = parseInt(capacityMatch[1]);
      setMaxCapacity(capacity);
      setLabel(`Stack capacity set to ${capacity}`);
    }
    const dataMatch = code.match(/data\[\]\s*=\s*\{([^}]+)\}/);
    if (dataMatch) {
      const vals = dataMatch[1].split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      setStack(vals.map((v, i) => ({ value: v, id: i })));
      nextId.current = vals.length;
    }
  }, [syncTrigger]);

  const push = () => {
    if (stack.length >= maxCapacity) {
      setLabel(`Stack Overflow! Maximum capacity (${maxCapacity}) reached`);
      return;
    }
    // Parse value from code marker
    const match = code.match(/push_val\s*=\s*(\d+)/);
    const val = match ? parseInt(match[1]) : 15;

    setLabel(`Pushing ${val}...`);
    setStack(prev => [...prev, { value: val, id: nextId.current++ }]);
    setTimeout(() => setLabel(`Pushed ${val}`), speed);
  };

  const pop = () => {
    if (stack.length === 0) {
      setLabel("Stack Underflow! Stack is empty");
      return;
    }
    const val = stack[stack.length - 1].value;
    setLabel(`Popping ${val}...`);
    setTimeout(() => {
      setStack(prev => prev.slice(0, -1));
      setLabel(`Popped ${val}`);
    }, speed);
  };

  useEffect(() => {
    if (!commandText) return;
    const command = commandText.trim().toLowerCase();
    const pushMatch = command.match(/^push\s+(\d+)$/);
    if (pushMatch) {
      const val = Number(pushMatch[1]);
      if (stack.length >= maxCapacity) {
        setLabel(`Stack Overflow! Maximum capacity (${maxCapacity}) reached`);
        return;
      }
      setLabel(`Pushing ${val}...`);
      setStack(prev => [...prev, { value: val, id: nextId.current++ }]);
      setTimeout(() => setLabel(`Pushed ${val}`), speed);
    } else if (command === "pop") {
      pop();
    } else {
      setLabel("Invalid command. Use push <value> or pop.");
    }
  }, [commandId]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col-reverse items-center gap-1 min-h-[240px] p-4 glass-panel rounded-lg border border-border/30">
        <div className="w-32 h-2 bg-muted rounded-full" />
        <AnimatePresence mode="popLayout">
          {stack.length === 0 ? (
            <div className="text-sm text-muted-foreground/50 italic font-mono py-12">Stack is empty</div>
          ) : (
            stack.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.5, y: -30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -30 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`w-32 h-12 rounded-lg glass-panel flex items-center justify-center font-mono font-bold text-foreground border-2 transition-colors ${i === stack.length - 1 ? "border-primary neon-glow-blue" : "border-border/50"}`}
              >
                {item.value}
                {i === stack.length - 1 && <span className="ml-2 text-[10px] text-primary">← top</span>}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      <div className="text-xs text-muted-foreground text-center">Capacity: {stack.length}/{maxCapacity}</div>
      <div className="flex items-center gap-3">
        <button onClick={push} className="glass-panel px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-semibold">Push</button>
        <button onClick={pop} className="glass-panel px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors font-semibold">Pop</button>
      </div>
    </div>
  );
}

// Queue visualization
function QueueViz({ code, onStep, onComplete, syncTrigger, commandText, commandId, speed }: { code: string; onStep: (l: string) => void; onComplete: (l: string | ((prev: string) => string)) => void; syncTrigger: number; commandText: string; commandId: number; speed: number }) {
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [queue, setQueue] = useState<{ value: number; id: number }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const capacityMatch = code.match(/MAX_CAPACITY\s*=\s*(\d+)/);
    if (capacityMatch) {
      const capacity = parseInt(capacityMatch[1]);
      setMaxCapacity(capacity);
      onComplete(`Queue capacity set to ${capacity}`);
    }
    const dataMatch = code.match(/data\[\]\s*=\s*\{([^}]+)\}/);
    if (dataMatch) {
      const vals = dataMatch[1].split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      setQueue(vals.map((v, i) => ({ value: v, id: i })));
      nextId.current = vals.length;
      onComplete("Queue synced from code");
    }
  }, [syncTrigger, code]);

  const enqueue = () => {
    if (queue.length >= maxCapacity) {
      onComplete(`Queue Overflow! Maximum capacity (${maxCapacity}) reached`);
      return;
    }
    const match = code.match(/enqueue_val\s*=\s*(\d+)/);
    const val = match ? parseInt(match[1]) : 40;
    onStep(`Enqueuing ${val}...`);
    setQueue(prev => [...prev, { value: val, id: nextId.current++ }]);
    setTimeout(() => { onStep("Visualizer Ready"); onComplete(`Enqueued ${val}`); }, speed);
  };

  const dequeue = () => {
    if (queue.length === 0) {
      onComplete("Queue Underflow! Queue is empty");
      return;
    }
    const val = queue[0].value;
    onStep(`Dequeuing ${val}...`);
    setTimeout(() => {
      setQueue(prev => prev.slice(1));
      onStep("Visualizer Ready");
      onComplete(`Dequeued ${val}`);
    }, speed);
  };

  useEffect(() => {
    if (!commandText) return;
    const command = commandText.trim().toLowerCase();
    const enqueueMatch = command.match(/^enqueue\s+(\d+)$/);
    if (enqueueMatch) {
      if (queue.length >= maxCapacity) {
        onComplete(`Queue Overflow! Maximum capacity (${maxCapacity}) reached`);
        return;
      }
      const val = Number(enqueueMatch[1]);
      onStep(`Enqueuing ${val}...`);
      setQueue(prev => [...prev, { value: val, id: nextId.current++ }]);
      setTimeout(() => { onStep("Visualizer Ready"); onComplete(`Enqueued ${val}`); }, speed);
    } else if (command === "dequeue") {
      dequeue();
    } else {
      onComplete("Invalid command. Use enqueue <value> or dequeue.");
    }
  }, [commandId]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-1 min-h-[140px] p-4 glass-panel rounded-xl border border-border/30 relative w-full">
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-primary rotate-90">Front</div>
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-destructive -rotate-90">Rear</div>
        <AnimatePresence mode="popLayout">
          {queue.length === 0 ? (
            <div className="w-full flex items-center justify-center text-muted-foreground/50 font-mono text-sm italic">Queue is empty</div>
          ) : (
            queue.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.5, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: -50 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`w-16 h-16 rounded-lg glass-panel flex items-center justify-center font-mono font-bold text-foreground border-2 transition-colors flex-shrink-0 ${i === 0 ? "border-primary neon-glow-blue" : i === queue.length - 1 ? "border-destructive neon-glow-red" : "border-border/50"}`}
              >
                {item.value}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      <div className="text-xs text-muted-foreground text-center">Capacity: {queue.length}/{maxCapacity}</div>
      <div className="flex items-center gap-3">
        <button onClick={enqueue} className="glass-panel px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-semibold">Enqueue</button>
        <button onClick={dequeue} className="glass-panel px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors font-semibold">Dequeue</button>
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

function TreeViz({ onStep, onComplete, speed }: { onStep: (l: string) => void; onComplete: (l: string) => void; speed: number }) {
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [visited, setVisited] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [localStatus, setLocalStatus] = useState("Visualizer Ready");

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
    setLocalStatus("Running...");
    onStep(`${type} traversal started`);
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
      await new Promise(r => setTimeout(r, speed));
      setHighlighted([order[i]]);
      setVisited(prev => [...prev, order[i]]);
      onStep(`${type}: Visiting ${order[i]}`);
      setLocalStatus(`Visiting ${order[i]}`);
    }
    await new Promise(r => setTimeout(r, speed));
    setHighlighted([]);
    onComplete(`${type} complete: [${order.join(", ")}]`);
    onStep("Visualizer Ready");
    setLocalStatus("Complete");
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
      <p className="text-sm text-primary font-mono neon-text-blue">{localStatus}</p>
      <div className="flex gap-2 flex-wrap justify-center">
        {(["inorder", "preorder", "postorder"] as const).map(t => (
          <button key={t} onClick={() => runTraversal(t)} disabled={running} className="glass-panel px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors font-semibold capitalize disabled:opacity-40">
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

const PREDEFINED_GRAPHS = [
  {
    nodes: [
      { id: 0, x: 200, y: 40, label: "A" },
      { id: 1, x: 80, y: 120, label: "B" },
      { id: 2, x: 320, y: 120, label: "C" },
      { id: 3, x: 40, y: 220, label: "D" },
      { id: 4, x: 160, y: 220, label: "E" },
      { id: 5, x: 280, y: 220, label: "F" },
    ],
    unweightedEdges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 4], [4, 5]],
    weightedEdges: [[0, 1, 4], [0, 2, 2], [1, 3, 5], [1, 4, 10], [2, 4, 3], [2, 5, 8], [3, 4, 2], [4, 5, 6]]
  },
  {
    nodes: [
      { id: 0, x: 200, y: 135, label: "A" },
      { id: 1, x: 200, y: 40, label: "B" },
      { id: 2, x: 310, y: 90, label: "C" },
      { id: 3, x: 310, y: 180, label: "D" },
      { id: 4, x: 200, y: 230, label: "E" },
      { id: 5, x: 90, y: 180, label: "F" },
      { id: 6, x: 90, y: 90, label: "G" },
    ],
    unweightedEdges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1]],
    weightedEdges: [[0, 1, 2], [0, 2, 5], [0, 3, 3], [0, 4, 1], [0, 5, 4], [0, 6, 2], [1, 2, 7], [2, 3, 2], [3, 4, 8], [4, 5, 3], [5, 6, 6], [6, 1, 4]]
  },
  {
    nodes: [
      { id: 0, x: 60, y: 135, label: "A" },
      { id: 1, x: 150, y: 135, label: "B" },
      { id: 2, x: 240, y: 135, label: "C" },
      { id: 3, x: 330, y: 135, label: "D" },
      { id: 4, x: 195, y: 50, label: "E" },
      { id: 5, x: 195, y: 220, label: "F" },
    ],
    unweightedEdges: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 3], [1, 5], [5, 3]],
    weightedEdges: [[0, 1, 3], [1, 2, 2], [2, 3, 4], [0, 4, 15], [4, 3, 6], [1, 5, 8], [5, 3, 1]]
  }
];

// Graph visualization
function GraphViz({ selectedAlgo, onStep, onComplete, commandText, commandId, speed }: { selectedAlgo: string; onStep: (l: string) => void; onComplete: (l: string | ((prev: string) => string)) => void; commandText: string; commandId: number; speed: number }) {
  const [graphIdx, setGraphIdx] = useState(0);
  const currentGraph = PREDEFINED_GRAPHS[graphIdx];
  const nodes = currentGraph.nodes;
  
  // Build adjacency list based on algorithm
  const isUsingWeights = selectedAlgo === "Dijkstra";
  const edges = isUsingWeights ? currentGraph.weightedEdges : currentGraph.unweightedEdges.map(([a, b]) => [a, b, 0]);
  
  const adj: { node: number; weight: number }[][] = Array.from({ length: nodes.length }, () => []);
  edges.forEach(([a, b, w]) => { adj[a].push({ node: b as number, weight: (w as number) || 1 }); adj[b].push({ node: a as number, weight: (w as number) || 1 }); });

  const [visited, setVisited] = useState<number[]>([]);
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [activeEdges, setActiveEdges] = useState<string[]>([]);
  const [localStatus, setLocalStatus] = useState("Ready");
  const [running, setRunning] = useState(false);
  const [startNode, setStartNode] = useState(0);
  const [goalNode, setGoalNode] = useState(5);
  const [queueState, setQueueState] = useState<number[]>([]);
  const [stackState, setStackState] = useState<number[]>([]);

  const generateNewGraph = () => {
    if (running) return;
    const nextIdx = (graphIdx + 1) % PREDEFINED_GRAPHS.length;
    setGraphIdx(nextIdx);
    setStartNode(PREDEFINED_GRAPHS[nextIdx].nodes[0].id);
    setGoalNode(PREDEFINED_GRAPHS[nextIdx].nodes[PREDEFINED_GRAPHS[nextIdx].nodes.length - 1].id);
    setVisited([]); setHighlighted([]); setActiveEdges([]); setLocalStatus("Ready");
  };

  useEffect(() => {
    if (!commandText) return;
    const command = commandText.trim().toUpperCase();
    const startMatch = command.match(/^START\s+([A-F])$/);
    const goalMatch = command.match(/^GOAL\s+([A-F])$/);
    if (startMatch) {
      const nodeLabel = startMatch[1];
      const nodeIdx = nodes.findIndex(n => n.label === nodeLabel);
      if (nodeIdx !== -1) {
        setStartNode(nodeIdx);
        setLocalStatus(`Start node set to ${nodeLabel}`);
      }
    } else if (goalMatch) {
      const nodeLabel = goalMatch[1];
      const nodeIdx = nodes.findIndex(n => n.label === nodeLabel);
      if (nodeIdx !== -1) {
        setGoalNode(nodeIdx);
        setLocalStatus(`Goal node set to ${nodeLabel}`);
      }
    }
  }, [commandId]);

  const runBFS = async () => {
    if (running) return;
    setRunning(true);
    setVisited([]); setHighlighted([]); setActiveEdges([]); setQueueState([]); setLocalStatus("BFS Running...");
    const queue = [startNode];
    const seen = new Set([startNode]);
    const prevMap: Record<number, number | null> = { [startNode]: null };
    let finalPathStr = "";
    setQueueState([startNode]);
    
    let foundGoal = false;

    if (startNode === goalNode) {
      setLocalStatus(`Goal ${nodes[goalNode].label} reached!`);
      finalPathStr = nodes[startNode].label;
      foundGoal = true;
    }

    while (queue.length && !foundGoal) {
      const curr = queue.shift()!;
      setQueueState([...queue]);
      setHighlighted([curr]);
      setVisited(prev => [...prev, curr]);
      onStep(`BFS: Visiting ${nodes[curr].label}`);
      setLocalStatus(`Visiting ${nodes[curr].label}`);

      await new Promise(r => setTimeout(r, speed));
      for (const edge of adj[curr]) {
        const nb = edge.node;
        if (!seen.has(nb)) {
          seen.add(nb);
          prevMap[nb] = curr;
          queue.push(nb);
          setQueueState([...queue]);
          setActiveEdges(prev => [...prev, `${Math.min(curr, nb)}-${Math.max(curr, nb)}`]);
          
          if (nb === goalNode) {
            setLocalStatus(`Goal ${nodes[goalNode].label} reached!`);
            setHighlighted([nb]);
            setVisited(prev => [...prev, nb]);
            const path = [];
            const pathEdgeSet: string[] = [];
            const pathNodeSet: number[] = [];
            let p: number | null = goalNode;
            while (p !== null && p !== undefined) {
              path.push(nodes[p].label);
              pathNodeSet.push(p);
              const parent: number | null = prevMap[p];
              if (parent !== null && parent !== undefined) {
                pathEdgeSet.push(`${Math.min(parent, p)}-${Math.max(parent, p)}`);
              }
              p = parent;
            }
            finalPathStr = path.reverse().join("->");
            setActiveEdges(pathEdgeSet);
            setVisited(pathNodeSet);
            setHighlighted([goalNode]);
            foundGoal = true;
            break;
          }
        }
      }
    }
    if (!foundGoal) setHighlighted([]);
    setQueueState([]);
    onComplete(finalPathStr ? `BFS complete! Path: ${finalPathStr}` : "BFS complete! No path found.");
    onStep("Visualizer Ready");
    setLocalStatus("Complete");
    setRunning(false);
  };

  const runDFS = async () => {
    if (running) return;
    setRunning(true);
    setVisited([]); setHighlighted([]); setActiveEdges([]); setStackState([]); setLocalStatus("DFS Running...");
    const seen = new Set<number>();
    const stack: number[] = [];
    let finalPathStr = "";
    const dfs = async (node: number): Promise<boolean> => {
      seen.add(node);
      stack.push(node);
      setStackState([...stack]);
      setHighlighted([node]);
      setVisited(prev => [...prev, node]);
      onStep(`DFS: Visiting ${nodes[node].label}`);
      setLocalStatus(`Visiting ${nodes[node].label}`);

      if (node === goalNode) {
        setLocalStatus(`Goal ${nodes[goalNode].label} reached!`);
        finalPathStr = stack.map(id => nodes[id].label).join("->");
        const pathEdgeSet: string[] = [];
        for (let i = 0; i < stack.length - 1; i++) {
          pathEdgeSet.push(`${Math.min(stack[i], stack[i+1])}-${Math.max(stack[i], stack[i+1])}`);
        }
        setActiveEdges(pathEdgeSet);
        setVisited([...stack]);
        setHighlighted([goalNode]);
        return true;
      }

      await new Promise(r => setTimeout(r, speed));
      for (const edge of adj[node]) {
        const nb = edge.node;
        if (!seen.has(nb)) {
          setActiveEdges(prev => [...prev, `${Math.min(node, nb)}-${Math.max(node, nb)}`]);
          const found = await dfs(nb);
          if (found) return true;
        }
      }
      stack.pop();
      setStackState([...stack]);
      return false;
    };
    const found = await dfs(startNode);
    if (!found) setHighlighted([]);
    setStackState([]);
    onComplete(finalPathStr ? `DFS complete! Path: ${finalPathStr}` : "DFS complete! No path found.");
    onStep("Visualizer Ready");
    setLocalStatus("Complete");
    setRunning(false);
  };

  const runDijkstra = async () => {
    if (running) return;
    setRunning(true);
    setVisited([]); setHighlighted([]); setActiveEdges([]); setLocalStatus("Dijkstra Running...");
    const dist = Array(nodes.length).fill(Number.MAX_SAFE_INTEGER);
    const prev: (number | null)[] = Array(nodes.length).fill(null);
    dist[startNode] = 0;
    const unvisited = new Set(nodes.map(n => n.id));

    while (unvisited.size) {
      let current = -1;
      let best = Number.MAX_SAFE_INTEGER;
      for (const nodeId of unvisited) {
        if (dist[nodeId] < best) {
          best = dist[nodeId];
          current = nodeId;
        }
      }
      if (current === -1 || best === Number.MAX_SAFE_INTEGER) break;
      unvisited.delete(current);
      setHighlighted([current]);
      setVisited(prevState => [...prevState, current]);
      onStep(`Dijkstra: Visiting ${nodes[current].label}`);
      setLocalStatus(`Visiting ${nodes[current].label}`);
      
      if (current === goalNode) {
        setLocalStatus(`Goal ${nodes[goalNode].label} reached!`);
        break;
      }

      await new Promise(r => setTimeout(r, speed));
      for (const edge of adj[current]) {
        const nb = edge.node;
        const weight = edge.weight;
        const alt = dist[current] + weight;
        if (alt < dist[nb]) {
          dist[nb] = alt;
          prev[nb] = current;
          setActiveEdges(prevEdges => [...prevEdges, `${Math.min(current, nb)}-${Math.max(current, nb)}`]);
        }
      }
    }

    const path = [];
    const pathEdgeSet: string[] = [];
    const pathNodeSet: number[] = [];
    if (dist[goalNode] !== Number.MAX_SAFE_INTEGER) {
      let curr: number | null = goalNode;
      while (curr !== null) {
        path.push(nodes[curr].label);
        pathNodeSet.push(curr);
        const parent = prev[curr];
        if (parent !== null) {
          pathEdgeSet.push(`${Math.min(parent, curr)}-${Math.max(parent, curr)}`);
        }
        curr = parent;
      }
      setActiveEdges(pathEdgeSet);
      setVisited(pathNodeSet);
      setHighlighted([goalNode]);
    } else {
      setHighlighted([]);
    }
    const pathStr = path.length ? path.reverse().join("->") : "No path";
    onComplete(`Dijkstra complete! Path: ${pathStr}, Cost: ${dist[goalNode]}`);
    onStep("Visualizer Ready");
    setLocalStatus("Complete");
    setRunning(false);
  };

  const runSelectedAlgo = () => {
    if (selectedAlgo === "BFS") runBFS();
    else if (selectedAlgo === "DFS") runDFS();
    else runDijkstra();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <svg viewBox="0 0 400 270" className="w-full max-w-lg">
        {edges.map(([a, b, w]) => {
          const edgeKey = `${Math.min(a as number, b as number)}-${Math.max(a as number, b as number)}`;
          const isActive = activeEdges.includes(edgeKey);
          const midX = (nodes[a as number].x + nodes[b as number].x) / 2;
          const midY = (nodes[a as number].y + nodes[b as number].y) / 2;
          return (
            <g key={edgeKey}>
              <line x1={nodes[a as number].x} y1={nodes[a as number].y} x2={nodes[b as number].x} y2={nodes[b as number].y}
                stroke={isActive ? "hsl(200 100% 55%)" : "hsl(230 20% 25%)"} strokeWidth={isActive ? 3 : 1.5}
                style={{ transition: "stroke 0.3s, stroke-width 0.3s" }} />
              {isUsingWeights && (
                <text x={midX} y={midY - 5} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={10} className="font-mono">
                  {w}
                </text>
              )}
            </g>
          );
        })}
        {nodes.map(n => {
          const isHigh = highlighted.includes(n.id);
          const isVis = visited.includes(n.id);
          const isStart = n.id === startNode;
          const isGoal = n.id === goalNode;
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={22}
                fill={isHigh ? "hsl(200 100% 55%)" : isVis ? "hsl(270 80% 60%)" : "hsl(230 25% 15%)"}
                stroke={isStart ? "hsl(120 100% 40%)" : isGoal ? "hsl(0 100% 50%)" : isHigh ? "hsl(200 100% 65%)" : "hsl(230 20% 30%)"}
                strokeWidth={isStart || isGoal ? 4 : 2}
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
      
      {/* Queue display for BFS */}
      {selectedAlgo === "BFS" && (
        <div className="w-full max-w-lg px-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 mb-2">Queue</div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <span className="text-[9px] uppercase font-bold text-primary min-w-10">Front</span>
              <div className="flex items-center gap-1 flex-1 min-h-[50px] p-3 glass-panel rounded-lg border border-primary/20 overflow-x-auto">
                {queueState.length > 0 ? (
                  queueState.map((nodeId, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg glass-panel flex items-center justify-center font-mono font-bold text-foreground text-sm border border-primary/30 flex-shrink-0">
                      {nodes[nodeId].label}
                    </div>
                  ))
                ) : (
                  <span className="text-muted-foreground/40 text-xs italic">Empty</span>
                )}
              </div>
              <span className="text-[9px] uppercase font-bold text-destructive min-w-10">Rear</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Stack display for DFS */}
      {selectedAlgo === "DFS" && (
        <div className="w-full max-w-lg px-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 mb-2">Stack</div>
          <div className="flex flex-col-reverse items-center gap-1 min-h-[60px] p-3 glass-panel rounded-lg border border-primary/20">
            {stackState.length > 0 ? (
              stackState.map((nodeId, i) => (
                <div key={i} className={`w-10 h-10 rounded-lg glass-panel flex items-center justify-center font-mono font-bold text-foreground text-sm border ${i === stackState.length - 1 ? "border-primary" : "border-primary/30"} ${i === stackState.length - 1 ? "neon-glow-blue" : ""}`}>
                  {nodes[nodeId].label}
                  {i === stackState.length - 1 && <span className="ml-1 text-[8px] text-primary">top</span>}
                </div>
              ))
            ) : (
              <span className="text-muted-foreground/40 text-xs italic">Stack Empty</span>
            )}
          </div>
        </div>
      )}
      
      <div className="flex gap-4 flex-wrap justify-center w-full px-4">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          Start:
          <select value={startNode} onChange={e => setStartNode(Number(e.target.value))} disabled={running} className="bg-background border border-border/50 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-50 cursor-pointer">
            {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          Goal:
          <select value={goalNode} onChange={e => setGoalNode(Number(e.target.value))} disabled={running} className="bg-background border border-border/50 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-50 cursor-pointer">
            {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-primary font-mono neon-text-blue">{localStatus}</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button onClick={runSelectedAlgo} disabled={running} className="glass-panel px-6 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors font-bold disabled:opacity-40">
          Run {selectedAlgo}
        </button>
        <button onClick={generateNewGraph} disabled={running} className="glass-panel px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-semibold disabled:opacity-40">
          Generate New Graph
        </button>
      </div>
    </div>
  );
}

export default function VisualizePage() {
  const [category, setCategory] = useState<AlgoCategory>("sorting");
  const [selectedAlgo, setSelectedAlgo] = useState("Bubble Sort");
  const [selectedGraphAlgo, setSelectedGraphAlgo] = useState("BFS");
  const [steps, setSteps] = useState<VisualizationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(300);
  const [editableCode, setEditableCode] = useState(ALGO_CODE["Bubble Sort"]);
  const [consoleLabel, setConsoleLabel] = useState("Visualizer Ready");
  const [stepLabel, setStepLabel] = useState("Visualizer Ready");
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [consoleInput, setConsoleInput] = useState("");
  const [commandText, setCommandText] = useState("");
  const [commandId, setCommandId] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const triggerSync = () => { setSyncTrigger(v => v + 1); setConsoleLabel("Synced data from code"); };

  const submitConsoleCommand = () => {
    const trimmed = consoleInput.trim();
    if (!trimmed) return;
    setCommandText(trimmed);
    setCommandId(prev => prev + 1);
    setConsoleInput("");
    setConsoleLabel(`Command: ${trimmed}`);
    setStepLabel(`Command entered`);
  };

  const generateArray = useCallback(() => {
    // Parse data directly from code
    let arr: number[] = [];
    const arrMatch = editableCode.match(/arr\[\]\s*=\s*\{([^}]+)\}/);
    const nMatch = editableCode.match(/n\s*=\s*(\d+)/);

    if (arrMatch) {
      arr = arrMatch[1].split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      if (nMatch) {
        const n = parseInt(nMatch[1]);
        arr = arr.slice(0, n);
      }
    } else {
      // Default fallback
      arr = [10, 30, 20, 50, 40, 70, 60];
    }
    
    // Logic Reflection: Check if the user changed the comparison in the code
    const isDescending = editableCode.includes("< arr[j+1]") || editableCode.includes("> arr[min_idx]") || editableCode.includes("< key");
    
    const output = `Number of elements ${arr.length}\nArray - {${arr.join(",")},}`;
    setConsoleLabel(output);
    
    let newSteps: VisualizationStep[];
    if (selectedAlgo === "Bubble Sort") newSteps = generateBubbleSortSteps(arr, isDescending);
    else if (selectedAlgo === "Selection Sort") newSteps = generateSelectionSortSteps(arr, isDescending);
    else newSteps = generateInsertionSortSteps(arr, isDescending);
    setSteps(newSteps);
    setCurrentStep(0);
    setPlaying(false);
  }, [selectedAlgo, editableCode]);

  useEffect(() => { 
    if (category === "sorting") {
      setEditableCode(ALGO_CODE[selectedAlgo]);
      setConsoleLabel(`${selectedAlgo} implementation loaded.`);
      generateArray(); 
    } else if (category === "graph") {
      const codeKey = selectedGraphAlgo === "BFS" ? "Graph" : selectedGraphAlgo;
      setEditableCode(ALGO_CODE[codeKey as keyof typeof ALGO_CODE]);
      setConsoleLabel(`${selectedGraphAlgo} implementation loaded.`);
      setStepLabel("Visualizer Ready");
    } else {
      setStepLabel("Visualizer Ready");
      if (category === "tree") setConsoleLabel("Binary Search Tree initialized.");
      if (category === "linkedlist") setConsoleLabel("Linked List ready.");
      if (category === "stack") setConsoleLabel("Stack ready.");
      if (category === "queue") setConsoleLabel("Queue ready.");
    }
  }, [category, selectedAlgo, selectedGraphAlgo]);

  useEffect(() => {
    if (category === "sorting" && steps[currentStep]) {
      setStepLabel(steps[currentStep].label);
    }
  }, [category, currentStep, steps]);

  useEffect(() => {
    if (category === "sorting" && steps.length > 0 && currentStep === steps.length - 1) {
      const finalArr = steps[steps.length - 1].array;
      setConsoleLabel(prev => {
        if (prev.includes("Sorted array")) return prev;
        return prev + `\nSorted array - {${finalArr.join(",")}}`;
      });
    }
  }, [currentStep, steps, category]);

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
      <div className="flex flex-col items-center gap-3 md:gap-6 w-full">
        <div className="flex items-end gap-0.5 md:gap-1 h-40 md:h-64 w-full px-2 md:px-4">
          {currentData.array.map((val, i) => {
            const isComparing = currentData.comparing.includes(i);
            const isSwapping = currentData.swapping.includes(i);
            const isSorted = currentData.sorted.includes(i);
            let bg = "bg-primary/60";
            if (isComparing) bg = "bg-primary";
            else if (isSwapping) bg = "bg-destructive";
            else if (isSorted) bg = "bg-secondary";
            return (
              <motion.div
                key={i}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`rounded-t-md ${bg} transition-colors duration-200 relative flex-1 min-w-[16px] md:min-w-[24px] max-w-[32px] md:max-w-[48px]`}
                style={{ height: `${(val / maxVal) * 100}%`, boxShadow: isComparing || isSwapping ? "0 0 15px hsl(var(--primary) / 0.5)" : "none" }}
              >
                <span className="absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-mono text-foreground">{val}</span>
              </motion.div>
            );
          })}
        </div>
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-1 md:gap-3">
          <button onClick={() => { setCurrentStep(0); setPlaying(false); }} className="glass-panel p-1.5 md:p-2 hover:bg-muted/50 transition-colors"><RotateCcw className="w-3 h-3 md:w-4 md:h-4 text-foreground" /></button>
          <button onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} className="glass-panel p-1.5 md:p-2 hover:bg-muted/50 transition-colors"><SkipBack className="w-3 h-3 md:w-4 md:h-4 text-foreground" /></button>
          <button onClick={() => setPlaying(!playing)} className="glass-panel p-2 md:p-3 hover:bg-primary/10 transition-colors neon-glow-blue">
            {playing ? <Pause className="w-4 h-4 md:w-5 md:h-5 text-primary" /> : <Play className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
          </button>
          <button onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))} className="glass-panel p-1.5 md:p-2 hover:bg-muted/50 transition-colors"><SkipForward className="w-3 h-3 md:w-4 md:h-4 text-foreground" /></button>
        </div>
        <div className="text-[11px] md:text-xs text-muted-foreground">
          Step {currentStep + 1} / {steps.length}
        </div>
        {/* Legend */}
        <div className="flex gap-2 md:gap-4 text-[10px] md:text-xs flex-wrap justify-center">
          <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded bg-primary" /> Comparing</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded bg-destructive" /> Swapping</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 md:w-3 md:h-3 rounded bg-secondary" /> Sorted</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-20 md:pt-24 px-3 md:px-4 pb-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4 md:mb-6">
          Concept <span className="text-primary neon-text-blue">Visualizer</span>
        </motion.h1>

        {/* Category tabs */}
        <div className="flex gap-1 md:gap-2 mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => { 
                setCategory(cat.key); 
                if (cat.key === "sorting") { 
                  setSelectedAlgo(cat.algorithms[0]); 
                } else {
                  setEditableCode(ALGO_CODE[cat.key === "linkedlist" ? "LinkedList" : cat.key === "stack" ? "Stack" : cat.key === "queue" ? "Queue" : cat.key === "tree" ? "Tree" : "Graph"]);
                }
              }}
              className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${category === cat.key ? "bg-primary/15 text-primary neon-glow-blue" : "glass-panel text-muted-foreground hover:text-foreground"}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Algorithm selector for sorting */}
        {category === "sorting" && (
          <div className="flex gap-1 md:gap-2 mb-4 md:mb-6 flex-wrap">
            {CATEGORIES[0].algorithms.map(algo => (
              <button
                key={algo}
                onClick={() => { setSelectedAlgo(algo); }}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-xs font-semibold transition-all ${selectedAlgo === algo ? "bg-secondary/20 text-secondary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {algo}
              </button>
            ))}
          </div>
        )}

        {category === "graph" && (
          <div className="flex gap-1 md:gap-2 mb-4 md:mb-6 flex-wrap">
            {CATEGORIES[5].algorithms.map(algo => (
              <button
                key={algo}
                onClick={() => setSelectedGraphAlgo(algo)}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-xs font-semibold transition-all ${selectedGraphAlgo === algo ? "bg-secondary/20 text-secondary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {algo}
              </button>
            ))}
          </div>
        )}

        {/* Global Controls */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1 md:gap-2 w-full sm:w-auto justify-center sm:justify-start bg-card/40 border border-border/50 rounded-lg px-3 py-1.5">
            <Gauge className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-[10px] md:text-xs font-semibold text-muted-foreground mr-1">Speed</span>
            <input type="range" min={50} max={1000} step={50} value={1050 - speed} onChange={e => setSpeed(1050 - Number(e.target.value))} className="w-24 md:w-32 accent-primary cursor-pointer" />
          </div>
        </div>

        {/* IDE Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Left: Editor */}
          <div className="lg:col-span-5 flex flex-col min-h-[500px] md:min-h-[600px] overflow-hidden">
            <CodeBlock code={editableCode} onChange={setEditableCode} />
            <div className="mt-3 md:mt-4 flex gap-2">
              <button 
                onClick={category === "sorting" ? generateArray : triggerSync} 
                className="flex-1 glass-panel py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2 border-primary/20"
              >
                <RotateCcw className="w-3 h-3 md:w-4 md:h-4" /> 
                <span className="hidden sm:inline">{category === "sorting" ? "Sync & Execute Sort" : "Sync Data & Rebuild"}</span>
                <span className="sm:hidden">{category === "sorting" ? "Execute" : "Rebuild"}</span>
              </button>
            </div>
          </div>

          {/* Right: Output + Visualization */}
          <div className="lg:col-span-7 flex flex-col gap-3 md:gap-4 min-h-[500px] md:min-h-[600px]">
            {/* Output Screen */}
            <div className="glass-panel-strong p-3 md:p-4 flex-shrink-0">
              <div className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Console Output
              </div>
              <div className="font-mono text-xs md:text-sm text-primary neon-text-blue min-h-[1.5rem] whitespace-pre-line leading-relaxed max-h-[120px] md:max-h-none overflow-y-auto">
                <div className="flex items-center gap-2 mb-2 border-b border-primary/10 pb-2">
                  <span className="opacity-50">{">"}</span>
                <span className="font-bold">{stepLabel}</span>
                </div>
                {consoleLabel}
                {(category === "linkedlist" || category === "stack" || category === "queue" || category === "graph") && (
                  <div className="mt-3 md:mt-4 flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={consoleInput}
                        onChange={(e) => setConsoleInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitConsoleCommand(); } }}
                        placeholder={category === "linkedlist" ? "insert 10 or delete 10" : category === "stack" ? "push 10 or pop" : category === "queue" ? "enqueue 10 or dequeue" : "start A or goal F"}
                        className="flex-1 rounded-xl border border-primary/20 bg-card/40 px-2 md:px-3 py-2 text-xs md:text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <button onClick={submitConsoleCommand} className="rounded-xl bg-primary/15 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold text-primary transition hover:bg-primary/25 whitespace-nowrap">
                        Send
                      </button>
                    </div>
                    <p className="text-[10px] md:text-[11px] text-muted-foreground">Enter a command in the console area to control the current visualizer.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Visualization Stage */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="glass-panel-strong p-3 md:p-8 flex-1 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-2 md:top-4 right-2 md:right-4 text-[8px] md:text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">Stage</div>
              {category === "sorting" && renderSortingViz()}
              {category === "linkedlist" && <LinkedListViz code={editableCode} setLabel={setConsoleLabel} syncTrigger={syncTrigger} commandText={commandText} commandId={commandId} speed={speed} />}
              {category === "stack" && <StackViz code={editableCode} setLabel={setConsoleLabel} syncTrigger={syncTrigger} commandText={commandText} commandId={commandId} speed={speed} />}
              {category === "queue" && <QueueViz code={editableCode} onStep={setStepLabel} onComplete={setConsoleLabel} syncTrigger={syncTrigger} commandText={commandText} commandId={commandId} speed={speed} />}
              {category === "tree" && <TreeViz onStep={setStepLabel} onComplete={setConsoleLabel} speed={speed} />}
              {category === "graph" && <GraphViz selectedAlgo={selectedGraphAlgo} onStep={setStepLabel} onComplete={setConsoleLabel} commandText={commandText} commandId={commandId} speed={speed} />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

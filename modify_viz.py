import re

with open('c:/Users/mak/algorithmbattlefield/src/pages/VisualizePage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract LinkedListViz code
match = re.search(r'(function LinkedListViz.*?)(?=\n// Stack visualization)', content, re.DOTALL)
if not match:
    print('Failed to find LinkedListViz')
    exit(1)

base_code = match.group(1)

# Generate DoublyLinkedListViz
dll_code = base_code.replace('function LinkedListViz', 'function DoublyLinkedListViz')
# Replace the node UI
old_ui = """<div className="grid grid-cols-2 gap-0 divide-x divide-border/50">
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
                    </div>"""

new_dll_ui = """<div className="grid grid-cols-3 gap-0 divide-x divide-border/50">
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
                    </div>"""
dll_code = dll_code.replace(old_ui, new_dll_ui)

# Replace arrow
dll_code = dll_code.replace('<span className="text-primary font-bold text-lg">→</span>', '<span className="text-primary font-bold text-lg">↔</span>')


# Generate CircularLinkedListViz
cll_code = base_code.replace('function LinkedListViz', 'function CircularLinkedListViz')

old_cll_ui = """{i < nodes.length - 1 ? `0x${(nodes[i + 1].id + 1).toString(16).toUpperCase().padStart(4, "0")}` : "NULL"}"""
new_cll_ui = """{i < nodes.length - 1 ? `0x${(nodes[i + 1].id + 1).toString(16).toUpperCase().padStart(4, "0")}` : `0x${(nodes[0]?.id + 1 || 1).toString(16).toUpperCase().padStart(4, "0")}`}"""
cll_code = cll_code.replace(old_cll_ui, new_cll_ui)

old_cll_tail = """<div className="flex items-center gap-1">
                <span className="text-primary font-bold text-lg">→</span>
                <div className="rounded-lg glass-panel border-2 border-border/50 px-3 py-2">
                  <span className="text-xs font-mono text-muted-foreground font-bold">null</span>
                </div>
              </div>"""
new_cll_tail = """<div className="flex items-center gap-1">
                <span className="text-primary font-bold text-lg">→</span>
                <div className="rounded-lg glass-panel border-2 border-border/50 px-3 py-2 flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Loops to</span>
                  <span className="text-xs font-mono text-primary font-bold">Head (0x{(nodes[0]?.id + 1 || 1).toString(16).toUpperCase().padStart(4, "0")})</span>
                </div>
              </div>"""
cll_code = cll_code.replace(old_cll_tail, new_cll_tail)

# Combine and insert
insertion_point = content.find('// Stack visualization')
new_content = content[:insertion_point] + '\n// Doubly Linked List visualization\n' + dll_code + '\n\n// Circular Linked List visualization\n' + cll_code + '\n\n' + content[insertion_point:]

with open('c:/Users/mak/algorithmbattlefield/src/pages/VisualizePage.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Success')

import React, { useEffect, useRef, useState, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { ethers } from "ethers";
import ENSProfile from "./profile";
import { NetworkIcon, TrashIcon, EditIcon, EyeIcon, LinkAddIcon } from "./icons";

// Default example data
const DEFAULT_EXAMPLE = `vitalik.eth, balajis.eth
vitalik.eth, santi.eth
lfield.eth, vitalik.eth
chancellor.eth, vitalik.eth
balajis.eth, santi.eth`;

const STORAGE_KEY = "ens-custom-edges";

export default function ENSGraph() {
  const fgRef = useRef();
  const [inputText, setInputText] = useState(DEFAULT_EXAMPLE);
  const [selectedENS, setSelectedENS] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  
  // Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [customEdges, setCustomEdges] = useState([]);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // Load custom edges from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomEdges(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load custom edges:", e);
    }
  }, []);

  // Save custom edges to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customEdges));
    } catch (e) {
      console.error("Failed to save custom edges:", e);
    }
  }, [customEdges]);

  // Get provider for ENS validation
  function getProvider() {
    const rpc = "https://eth-mainnet.g.alchemy.com/v2/kWmBAEH1C7Nbe5LWMf09iNWBWogbREw2";
    if (rpc) return new ethers.JsonRpcProvider(rpc);
    return ethers.getDefaultProvider("mainnet");
  }

  const pairs = useMemo(() => {
    if (!inputText.trim()) return [];
    
    const errors = [];
    const validPairs = [];
    
    const lines = inputText
      .split("\n")
      .map((line, idx) => ({ line: line.trim(), lineNum: idx + 1 }))
      .filter((item) => item.line);

    for (const { line, lineNum } of lines) {
      const parts = line.split(",").map((p) => p.trim());
      
      if (parts.length !== 2) {
        errors.push(`Line ${lineNum}: Invalid format. Use "name1.eth, name2.eth"`);
        continue;
      }

      const [a, b] = parts;
      
      if (!a || !b) {
        errors.push(`Line ${lineNum}: Both ENS names are required`);
        continue;
      }

      if (a.toLowerCase() === b.toLowerCase()) {
        errors.push(`Line ${lineNum}: Cannot connect "${a}" to itself`);
        continue;
      }

      if (!a.includes('.') || !b.includes('.')) {
        errors.push(`Line ${lineNum}: Invalid ENS format (must include domain like .eth)`);
        continue;
      }

      validPairs.push([a, b]);
    }

    setValidationErrors(errors);
    return validPairs;
  }, [inputText]);

  // Merge pairs from textarea with custom edges
  const allPairs = useMemo(() => {
    return [...pairs, ...customEdges];
  }, [pairs, customEdges]);

  const graphData = useMemo(() => {
    const nodeMap = new Map();
    const links = [];
    
    allPairs.forEach(([a, b]) => {
      if (!nodeMap.has(a)) nodeMap.set(a, { id: a, name: a });
      if (!nodeMap.has(b)) nodeMap.set(b, { id: b, name: b });
      links.push({ source: a, target: b });
    });
    
    return { nodes: [...nodeMap.values()], links };
  }, [allPairs]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force("charge").strength(-220);
      fgRef.current.d3Force("link").distance(70);
    }
  }, []);

  // Handle node click
  function handleNodeClick(node) {
    if (!node) return;
    
    if (editMode) {
      // Edit mode: select nodes to create edge
      handleNodeClickInEditMode(node);
    } else {
      // View mode: navigate to profile
      const ens = node.id || node.name;
      setSelectedENS(ens);
      setShowProfile(true);
    }
  }

  // Handle node click in edit mode
  function handleNodeClickInEditMode(node) {
    if (selectedNodes.length === 0) {
      // First node selected
      setSelectedNodes([node.id]);
    } else if (selectedNodes.length === 1) {
      const [first] = selectedNodes;
      
      if (first === node.id) {
        // Clicked same node - deselect
        setSelectedNodes([]);
        return;
      }
      
      // Check if edge already exists
      const edgeExists = allPairs.some(([a, b]) => 
        (a === first && b === node.id) || (a === node.id && b === first)
      );
      
      if (edgeExists) {
        alert(`Connection already exists between ${first} and ${node.id}`);
        setSelectedNodes([]);
        return;
      }
      
      // Create new edge
      setCustomEdges([...customEdges, [first, node.id]]);
      setSelectedNodes([]);
    }
  }

  // Handle link right-click
  function handleLinkRightClick(link) {
    if (!editMode) return;
    
    const source = typeof link.source === 'object' ? link.source.id : link.source;
    const target = typeof link.target === 'object' ? link.target.id : link.target;
    
    // Check if this is a custom edge
    const customEdgeIndex = customEdges.findIndex(([a, b]) => 
      (a === source && b === target) || (a === target && b === source)
    );
    
    if (customEdgeIndex === -1) {
      alert("Can only delete custom edges. This edge is from the textarea input.");
      return;
    }
    
    const confirmed = window.confirm(
      `Delete connection: ${source} ↔ ${target}?`
    );
    
    if (confirmed) {
      const newCustomEdges = [...customEdges];
      newCustomEdges.splice(customEdgeIndex, 1);
      setCustomEdges(newCustomEdges);
    }
  }

  function handleClear() {
    setInputText("");
    setValidationErrors([]);
  }

  function handleLoadExample() {
    setInputText(DEFAULT_EXAMPLE);
    setValidationErrors([]);
  }

  function handleClearCustomEdges() {
    if (customEdges.length === 0) return;
    
    const confirmed = window.confirm(
      `Delete all ${customEdges.length} custom edge(s)?`
    );
    
    if (confirmed) {
      setCustomEdges([]);
      setSelectedNodes([]);
    }
  }

  function toggleEditMode() {
    setEditMode(!editMode);
    setSelectedNodes([]);
  }

  // Handle escape key to cancel selection
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setSelectedNodes([]);
      }
    }
    
    if (editMode) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [editMode]);

  if (showProfile && selectedENS) {
    return (
      <div style={styles.profileContainer}>
        <button style={styles.backButton} onClick={() => setShowProfile(false)}>
          ← Back to Graph
        </button>
        <ENSProfile initialENS={selectedENS} />
      </div>
    );
  }

  const hasData = allPairs.length > 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <NetworkIcon size={32} />
          <h1 style={styles.title}>ENS Social Graph</h1>
        </div>
        <p style={styles.subtitle}>Visualize ENS name relationships</p>
      </div>

      {/* Edit Mode Banner */}
      {editMode && (
        <div style={styles.editBanner} className="fade-in">
          <div style={styles.editBannerContent}>
            <LinkAddIcon size={18} />
            <div>
              <strong>EDIT MODE</strong>
              <p style={styles.editInstructions}>
                Click two nodes to connect • Right-click edge to delete • Press ESC to cancel
              </p>
            </div>
          </div>
          <button onClick={toggleEditMode} style={styles.exitEditBtn}>
            Exit
          </button>
        </div>
      )}

      <div style={styles.inputSection}>
        <div style={styles.labelRow}>
          <label style={styles.label}>Enter ENS pairs (one per line)</label>
          <div style={styles.buttonGroup}>
            <button 
              onClick={toggleEditMode} 
              style={{
                ...styles.secondaryBtn,
                ...(editMode ? styles.editModeActive : {})
              }}
              title={editMode ? "Exit edit mode" : "Enter edit mode"}
            >
              {editMode ? <EyeIcon size={14} /> : <EditIcon size={14} />}
              {editMode ? "View" : "Edit"}
            </button>
            <button 
              onClick={handleLoadExample} 
              style={styles.secondaryBtn}
              title="Load example data"
            >
              <EditIcon size={14} /> Example
            </button>
            <button 
              onClick={handleClear} 
              style={styles.secondaryBtn}
              disabled={!inputText.trim()}
              title="Clear all"
            >
              <TrashIcon size={14} /> Clear
            </button>
          </div>
        </div>
        
        <textarea
          style={styles.textarea}
          placeholder={"vitalik.eth, balajis.eth\nsanti.eth, vitalik.eth\nlfield.eth, vitalik.eth"}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={editMode}
        />

        {validationErrors.length > 0 && (
          <div style={styles.errorBox}>
            <h4 style={styles.errorTitle}>⚠ Validation Errors:</h4>
            {validationErrors.map((error, idx) => (
              <p key={idx} style={styles.errorText}>{error}</p>
            ))}
          </div>
        )}

        {hasData && validationErrors.length === 0 && (
          <div style={styles.successBox}>
            ✓ {allPairs.length} total connection{allPairs.length !== 1 ? 's' : ''} 
            ({pairs.length} from input, {customEdges.length} custom) • {graphData.nodes.length} unique node{graphData.nodes.length !== 1 ? 's' : ''}
            {customEdges.length > 0 && (
              <button onClick={handleClearCustomEdges} style={styles.clearCustomBtn}>
                Clear Custom
              </button>
            )}
          </div>
        )}
      </div>

      <div style={styles.graphContainer}>
        {!hasData ? (
          <div style={styles.emptyState}>
            <NetworkIcon size={48} />
            <h3 style={styles.emptyTitle}>No Graph Data</h3>
            <p style={styles.emptyText}>
              {inputText.trim() 
                ? "Fix the errors above to see the graph" 
                : "Enter ENS pairs above or load the example to get started"}
            </p>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeAutoColorBy="id"
            linkColor={(link) => {
              if (!editMode) return "rgba(160,160,160,0.3)";
              
              const source = typeof link.source === 'object' ? link.source.id : link.source;
              const target = typeof link.target === 'object' ? link.target.id : link.target;
              
              // Check if custom edge
              const isCustom = customEdges.some(([a, b]) => 
                (a === source && b === target) || (a === target && b === source)
              );
              
              return isCustom ? "rgba(100, 100, 255, 0.5)" : "rgba(160,160,160,0.3)";
            }}
            linkWidth={(link) => {
              if (!editMode) return 1;
              
              const source = typeof link.source === 'object' ? link.source.id : link.source;
              const target = typeof link.target === 'object' ? link.target.id : link.target;
              
              const isCustom = customEdges.some(([a, b]) => 
                (a === source && b === target) || (a === target && b === source)
              );
              
              return isCustom ? 2 : 1;
            }}
            nodeLabel={(node) => node.name}
            onNodeClick={handleNodeClick}
            onLinkRightClick={handleLinkRightClick}
            cooldownTime={1200}
            backgroundColor="var(--bg)"
            nodeCanvasObject={(node, ctx) => {
              const label = node.name;
              const fontSize = 11;
              const isSelected = selectedNodes.includes(node.id);
              const nodeRadius = isSelected ? 9 : 6;
              
              // Draw node circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
              
              if (isSelected) {
                ctx.fillStyle = "#4CAF50";
                ctx.strokeStyle = "#2E7D32";
                ctx.lineWidth = 2.5;
              } else {
                ctx.fillStyle = node.color || "#000000";
                ctx.strokeStyle = "var(--border)";
                ctx.lineWidth = 1.5;
              }
              
              ctx.fill();
              ctx.stroke();
              
              // Draw label
              ctx.font = `${fontSize}px Inter, sans-serif`;
              ctx.fillStyle = "var(--text)";
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillText(label, node.x + 10, node.y);
              
              // Draw selection indicator
              if (isSelected) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, nodeRadius + 3, 0, 2 * Math.PI, false);
                ctx.strokeStyle = "#4CAF50";
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                ctx.setLineDash([]);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// Styles matching futuristic aesthetic
const styles = {
  container: {
    minHeight: "100vh",
    padding: "var(--s-8) var(--s-6)",
    backgroundColor: "var(--bg)",
  },
  header: {
    textAlign: "center",
    marginBottom: "var(--s-6)",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--s-3)",
    marginBottom: "var(--s-2)",
  },
  title: {
    fontSize: "40px",
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  subtitle: {
    fontSize: "15px",
    color: "var(--text-secondary)",
  },
  editBanner: {
    maxWidth: "700px",
    margin: "0 auto var(--s-6)",
    padding: "var(--s-4)",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    border: "1.5px solid rgba(76, 175, 80, 0.3)",
    borderRadius: "var(--r-md)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editBannerContent: {
    display: "flex",
    gap: "var(--s-3)",
    alignItems: "flex-start",
  },
  editInstructions: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginTop: "var(--s-1)",
  },
  exitEditBtn: {
    padding: "var(--s-2) var(--s-4)",
    fontSize: "13px",
    fontWeight: 600,
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    backgroundColor: "var(--bg)",
    color: "var(--text)",
    cursor: "pointer",
    transition: "all var(--base) var(--ease)",
  },
  inputSection: {
    maxWidth: "700px",
    margin: "0 auto var(--s-8)",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "var(--s-2)",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    color: "var(--text-tertiary)",
  },
  buttonGroup: {
    display: "flex",
    gap: "var(--s-2)",
  },
  secondaryBtn: {
    padding: "var(--s-1) var(--s-3)",
    fontSize: "12px",
    fontWeight: 600,
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    backgroundColor: "transparent",
    color: "var(--text)",
    cursor: "pointer",
    transition: "all var(--base) var(--ease)",
    display: "flex",
    alignItems: "center",
    gap: "var(--s-1)",
  },
  editModeActive: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderColor: "rgba(76, 175, 80, 0.5)",
    color: "#2E7D32",
  },
  textarea: {
    width: "100%",
    height: "120px",
    padding: "var(--s-4)",
    fontSize: "14px",
    fontFamily: "var(--font)",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--r-md)",
    backgroundColor: "var(--bg)",
    color: "var(--text)",
    resize: "vertical",
    transition: "all var(--base) var(--ease)",
  },
  errorBox: {
    marginTop: "var(--s-3)",
    padding: "var(--s-4)",
    backgroundColor: "rgba(255, 0, 0, 0.05)",
    border: "1.5px solid rgba(255, 0, 0, 0.2)",
    borderRadius: "var(--r-md)",
  },
  errorTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text)",
    marginBottom: "var(--s-2)",
  },
  errorText: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginBottom: "var(--s-1)",
    fontFamily: "monospace",
  },
  successBox: {
    marginTop: "var(--s-3)",
    padding: "var(--s-3)",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    textAlign: "center",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--s-3)",
  },
  clearCustomBtn: {
    padding: "var(--s-1) var(--s-2)",
    fontSize: "11px",
    fontWeight: 600,
    border: "1px solid var(--border)",
    borderRadius: "var(--r-sm)",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "all var(--base) var(--ease)",
  },
  graphContainer: {
    width: "100%",
    height: "600px",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--r-lg)",
    overflow: "hidden",
    backgroundColor: "var(--bg)",
    position: "relative",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "var(--s-4)",
    color: "var(--text-tertiary)",
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  emptyText: {
    fontSize: "14px",
    color: "var(--text-tertiary)",
    textAlign: "center",
    maxWidth: "400px",
  },
  profileContainer: {
    minHeight: "100vh",
  },
  backButton: {
    margin: "var(--s-6)",
    padding: "var(--s-3) var(--s-6)",
    fontSize: "15px",
    fontWeight: 600,
    border: "1.5px solid var(--text)",
    borderRadius: "var(--r-md)",
    backgroundColor: "var(--text)",
    color: "var(--bg)",
    cursor: "pointer",
    transition: "all var(--base) var(--ease)",
  },
};
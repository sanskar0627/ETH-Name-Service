import { useEffect, useRef, useState, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import ENSProfile from "./profile";

/*
    INPUT FORMAT: 
        vitalik.eth, balajis.eth
        vitalik.eth, santi.eth
        lfield.eth, vitalik.eth
        chancellor.eth, vitalik.eth
*/

export default function ENSGraph() {
  const fgRef = useRef();
  const [inputText, setInputText] = useState("");
  const [selectedENS, setSelectedENS] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const pairs = useMemo(() => {
    if (!inputText.trim()) return [];
    return inputText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => {
        const [a, b] = line.split(",").map((p) => p.trim());
        if (!a || !b) return null;
        return [a, b];
      })
      .filter(Boolean);
  }, [inputText]);

  const graphData = useMemo(() => {
    const nodeMap = new Map();
    const links = [];
    pairs.forEach(([a, b]) => {
      if (!nodeMap.has(a)) nodeMap.set(a, { id: a, name: a });
      if (!nodeMap.has(b)) nodeMap.set(b, { id: b, name: b });
      links.push({ source: a, target: b });
    });
    return { nodes: [...nodeMap.values()], links };
  }, [pairs]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force("charge").strength(-220);
      fgRef.current.d3Force("link").distance(70);
    }
  }, []);

  function handleNodeClick(node) {
    if (!node) return;
    const ens = node.id || node.name;
    setSelectedENS(ens);
    setShowProfile(true);
  }

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>ENS Social Graph</h1>
        <p style={styles.subtitle}>Visualize ENS name relationships</p>
      </div>

      <div style={styles.inputSection}>
        <label style={styles.label}>Enter ENS pairs (one per line)</label>
        <textarea
          style={styles.textarea}
          placeholder={"vitalik.eth, balajis.eth\nsanti.eth, vitalik.eth\nlfield.eth, vitalik.eth"}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </div>

      <div style={styles.graphContainer}>
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeAutoColorBy="id"
          linkColor={() => "rgba(160,160,160,0.3)"}
          nodeLabel={(node) => node.name}
          onNodeClick={handleNodeClick}
          cooldownTime={1200}
          backgroundColor="var(--bg)"
          nodeCanvasObject={(node, ctx) => {
            const label = node.name;
            const fontSize = 11;
            const nodeRadius = 6;
            
            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color || "#000000";
            ctx.fill();
            ctx.strokeStyle = "var(--border)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Draw label
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = "var(--text)";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(label, node.x + 10, node.y);
          }}
        />
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
    marginBottom: "var(--s-8)",
  },
  title: {
    fontSize: "40px",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    marginBottom: "var(--s-2)",
  },
  subtitle: {
    fontSize: "15px",
    color: "var(--text-secondary)",
  },
  inputSection: {
    maxWidth: "700px",
    margin: "0 auto var(--s-8)",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    color: "var(--text-tertiary)",
    marginBottom: "var(--s-2)",
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
  graphContainer: {
    width: "100%",
    height: "600px",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--r-lg)",
    overflow: "hidden",
    backgroundColor: "var(--bg)",
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
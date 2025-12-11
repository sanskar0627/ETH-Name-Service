import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ETH_REGISTRAR_ADDRESS = "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85";

const COMMON_TEXT_KEYS = [
  "name",
  "description",
  "url",
  "avatar",
  "email",
  "com.twitter",
  "com.github",
  "com.discord",
  "notice",
  "org.telegram",
  "vnd.twitter",
];

export default function ENSProfile({ initialENS = "" }) {
  const [ens, setEns] = useState(initialENS);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [owner, setOwner] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [resolverAddress, setResolverAddress] = useState(null);
  const [textRecords, setTextRecords] = useState({});
  const [contentHash, setContentHash] = useState(null);
  const [coinAddresses, setCoinAddresses] = useState({});
  const [expiry, setExpiry] = useState(null);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  function getProvider() {
    const rpc = "https://eth-mainnet.g.alchemy.com/v2/kWmBAEH1C7Nbe5LWMf09iNWBWogbREw2";
    if (rpc) return new ethers.JsonRpcProvider(rpc);
    return ethers.getDefaultProvider("mainnet");
  }

  async function fetchENSProfile(name) {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setOwner(null);
    setResolvedAddress(null);
    setResolverAddress(null);
    setTextRecords({});
    setContentHash(null);
    setCoinAddresses({});
    setExpiry(null);

    try {
      const provider = getProvider();
      const resolvedAddr = await provider.resolveName(name);
      setResolvedAddress(resolvedAddr);

      const resolver = await provider.getResolver(name);
      if (!resolver) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setResolverAddress(resolver.address);

      try {
        const namehash = ethers.namehash(name);
        const registry = new ethers.Contract(
          ENS_REGISTRY_ADDRESS,
          ["function owner(bytes32) view returns (address)"],
          provider
        );
        const ownerAddr = await registry.owner(namehash);
        setOwner(ownerAddr);
      } catch (e) {
        console.warn("owner fetch failed", e);
      }

      try {
        if (typeof resolver.getContentHash === "function") {
          const cHash = await resolver.getContentHash();
          setContentHash(cHash);
        } else if (typeof resolver.contentHash === "function") {
          const cHash = await resolver.contentHash();
          setContentHash(cHash);
        }
      } catch (e) {
        console.warn("contenthash fetch failed", e);
      }

      const texts = {};
      for (const key of COMMON_TEXT_KEYS) {
        try {
          if (typeof resolver.getText === "function") {
            const val = await resolver.getText(key);
            if (val) texts[key] = val;
          } else if (typeof resolver.text === "function") {
            const val = await resolver.text(key);
            if (val) texts[key] = val;
          }
        } catch (e) {
          // skip missing
        }
      }
      setTextRecords(texts);

      const coinsToTry = { ETH: 60, BTC: 0, LTC: 2 };
      const coinResults = {};
      for (const [label, coinType] of Object.entries(coinsToTry)) {
        try {
          let addr = null;
          if (typeof resolver.getAddress === "function") {
            if (coinType === 60) {
              addr = await resolver.getAddress();
            } else {
              try {
                addr = await resolver.getAddress(coinType);
              } catch (e) {
                // fallback
              }
            }
          }

          if (!addr && typeof resolver.getAddr === "function") {
            addr = await resolver.getAddr(coinType);
          }

          if (!addr && typeof resolver.addr === "function") {
            addr = await resolver.addr(coinType);
          }

          if (addr) coinResults[label] = addr;
        } catch (e) {
          // ignore
        }
      }
      setCoinAddresses(coinResults);

      if (name.toLowerCase().endsWith(".eth")) {
        try {
          const label = name.split(".")[0];
          const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label));
          const registrar = new ethers.Contract(
            ETH_REGISTRAR_ADDRESS,
            ["function nameExpires(uint256) view returns (uint256)"],
            provider
          );
          const exp = await registrar.nameExpires(labelHash);
          if (exp && exp > 0)
            setExpiry(new Date(Number(exp) * 1000).toISOString());
        } catch (e) {
          console.warn("expiry fetch failed", e);
        }
      }
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialENS) fetchENSProfile(initialENS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialENS]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasData = owner || resolvedAddress || Object.keys(textRecords).length > 0;

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.title}>ENS Profile Viewer</h1>
          <p style={styles.subtitle}>
            Discover Ethereum Name Service profiles on the blockchain
          </p>

          <div style={styles.searchContainer}>
            <input
              value={ens}
              onChange={(e) => setEns(e.target.value)}
              placeholder="Enter ENS name (e.g., vitalik.eth)"
              style={styles.input}
              onKeyPress={(e) => e.key === "Enter" && ens && !loading && fetchENSProfile(ens)}
            />
            <button
              onClick={() => fetchENSProfile(ens)}
              disabled={!ens || loading}
              style={styles.button}
            >
              {loading ? (
                <span style={styles.loadingDots}>
                  <span>.</span><span>.</span><span>.</span>
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div style={styles.content}>
        {error && (
          <div style={styles.errorCard} className="fade-in">
            <div style={styles.errorIcon}>⚠️</div>
            <div>
              <h3 style={styles.errorTitle}>Error</h3>
              <p style={styles.errorMessage}>{error}</p>
            </div>
          </div>
        )}

        {notFound && (
          <div style={styles.notFoundCard} className="fade-in">
            <div style={styles.notFoundIcon}>🔍</div>
            <h3 style={styles.notFoundTitle}>No Record Found</h3>
            <p style={styles.notFoundMessage}>
              This ENS name doesn't have a resolver or record on the blockchain.
            </p>
          </div>
        )}

        {loading && (
          <div style={styles.loadingContainer} className="fade-in">
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Fetching data from Ethereum...</p>
          </div>
        )}

        {!loading && !error && !notFound && hasData && (
          <div style={styles.grid} className="fade-in">
            {/* Basic Info Card */}
            <GlassCard title="Basic Information">
              {textRecords.avatar && (
                <div style={styles.avatarContainer}>
                  <img
                    src={textRecords.avatar}
                    alt="Avatar"
                    style={styles.avatar}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}
              <InfoRow
                label="ENS Name"
                value={ens}
                icon="🏷️"
                copyable
                onCopy={() => copyToClipboard(ens, "ens")}
                copied={copiedField === "ens"}
              />
              <InfoRow
                label="Owner"
                value={owner}
                icon="👤"
                copyable
                onCopy={() => copyToClipboard(owner, "owner")}
                copied={copiedField === "owner"}
              />
              <InfoRow
                label="Resolved Address"
                value={resolvedAddress}
                icon="📍"
                copyable
                onCopy={() => copyToClipboard(resolvedAddress, "resolved")}
                copied={copiedField === "resolved"}
              />
              <InfoRow
                label="Resolver"
                value={resolverAddress}
                icon="⚙️"
                copyable
                onCopy={() => copyToClipboard(resolverAddress, "resolver")}
                copied={copiedField === "resolver"}
              />
              {expiry && (
                <InfoRow
                  label="Expiry Date"
                  value={new Date(expiry).toLocaleDateString()}
                  icon="📅"
                />
              )}
            </GlassCard>

            {/* Text Records Card */}
            {Object.keys(textRecords).length > 0 && (
              <GlassCard title="Profile Details">
                {Object.entries(textRecords).map(([key, value]) => (
                  <InfoRow
                    key={key}
                    label={formatLabel(key)}
                    value={value}
                    icon={getIconForKey(key)}
                    copyable={key !== "avatar"}
                    onCopy={() => copyToClipboard(value, key)}
                    copied={copiedField === key}
                  />
                ))}
              </GlassCard>
            )}

            {/* Coin Addresses Card */}
            {Object.keys(coinAddresses).length > 0 && (
              <GlassCard title="Cryptocurrency Addresses">
                {Object.entries(coinAddresses).map(([coin, address]) => (
                  <InfoRow
                    key={coin}
                    label={coin}
                    value={address}
                    icon={getCoinIcon(coin)}
                    copyable
                    onCopy={() => copyToClipboard(address, coin)}
                    copied={copiedField === coin}
                  />
                ))}
              </GlassCard>
            )}

            {/* Content Hash Card */}
            {contentHash && (
              <GlassCard title="Content">
                <InfoRow
                  label="Content Hash"
                  value={contentHash}
                  icon="🔗"
                  copyable
                  onCopy={() => copyToClipboard(contentHash, "contentHash")}
                  copied={copiedField === "contentHash"}
                />
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Glass Card Component
function GlassCard({ title, children }) {
  return (
    <div style={styles.card} className="glass">
      <h3 style={styles.cardTitle}>{title}</h3>
      <div style={styles.cardContent}>{children}</div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value, icon, copyable, onCopy, copied }) {
  if (!value) return null;

  const displayValue = typeof value === "string" && value.length > 42
    ? `${value.slice(0, 20)}...${value.slice(-20)}`
    : value;

  return (
    <div style={styles.infoRow}>
      <div style={styles.infoLabel}>
        {icon && <span style={styles.infoIcon}>{icon}</span>}
        <span>{label}</span>
      </div>
      <div style={styles.infoValueContainer}>
        <div style={styles.infoValue} title={value}>
          {displayValue}
        </div>
        {copyable && (
          <button
            onClick={onCopy}
            style={{
              ...styles.copyButton,
              ...(copied ? styles.copyButtonCopied : {}),
            }}
            title="Copy to clipboard"
          >
            {copied ? "✓" : "📋"}
          </button>
        )}
      </div>
    </div>
  );
}

// Helper Functions
function formatLabel(key) {
  const labels = {
    "com.twitter": "Twitter",
    "com.github": "GitHub",
    "com.discord": "Discord",
    "org.telegram": "Telegram",
    "vnd.twitter": "Twitter",
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function getIconForKey(key) {
  const icons = {
    name: "👤",
    description: "📝",
    url: "🌐",
    avatar: "🖼️",
    email: "📧",
    "com.twitter": "🐦",
    "vnd.twitter": "🐦",
    "com.github": "💻",
    "com.discord": "💬",
    "org.telegram": "✈️",
    notice: "📢",
  };
  return icons[key] || "📄";
}

function getCoinIcon(coin) {
  const icons = {
    ETH: "Ξ",
    BTC: "₿",
    LTC: "Ł",
  };
  return icons[coin] || "💰";
}

// Styles
const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
  },
  hero: {
    background: "var(--gradient-hero)",
    padding: "var(--space-3xl) var(--space-lg)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
    position: "relative",
    overflow: "hidden",
  },
  heroContent: {
    maxWidth: "800px",
    width: "100%",
    textAlign: "center",
    zIndex: 1,
  },
  title: {
    fontSize: "var(--font-size-4xl)",
    fontWeight: 700,
    color: "white",
    marginBottom: "var(--space-md)",
    letterSpacing: "-0.03em",
  },
  subtitle: {
    fontSize: "var(--font-size-lg)",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: "var(--space-2xl)",
    fontWeight: 400,
  },
  searchContainer: {
    display: "flex",
    gap: "var(--space-md)",
    maxWidth: "600px",
    margin: "0 auto",
  },
  input: {
    flex: 1,
    fontSize: "var(--font-size-lg)",
    padding: "var(--space-lg)",
  },
  button: {
    minWidth: "120px",
    fontSize: "var(--font-size-lg)",
    fontWeight: 600,
  },
  loadingDots: {
    display: "inline-flex",
    gap: "2px",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "var(--space-2xl) var(--space-lg)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "var(--space-lg)",
  },
  card: {
    borderRadius: "var(--radius-xl)",
    padding: "var(--space-xl)",
    boxShadow: "var(--shadow-lg)",
    transition: "all var(--transition-base)",
  },
  cardTitle: {
    fontSize: "var(--font-size-xl)",
    fontWeight: 600,
    marginBottom: "var(--space-lg)",
    color: "var(--color-text-primary)",
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-md)",
  },
  avatarContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "var(--space-lg)",
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "var(--radius-full)",
    objectFit: "cover",
    border: "4px solid var(--color-border)",
    boxShadow: "var(--shadow-md)",
  },
  infoRow: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-xs)",
    padding: "var(--space-md)",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--color-surface)",
    transition: "all var(--transition-fast)",
  },
  infoLabel: {
    fontSize: "var(--font-size-sm)",
    color: "var(--color-text-secondary)",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "var(--space-xs)",
  },
  infoIcon: {
    fontSize: "var(--font-size-base)",
  },
  infoValueContainer: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-sm)",
    justifyContent: "space-between",
  },
  infoValue: {
    fontSize: "var(--font-size-base)",
    color: "var(--color-text-primary)",
    fontWeight: 500,
    wordBreak: "break-all",
    flex: 1,
  },
  copyButton: {
    padding: "var(--space-xs) var(--space-sm)",
    background: "transparent",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontSize: "var(--font-size-sm)",
    transition: "all var(--transition-fast)",
    minWidth: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  copyButtonCopied: {
    background: "var(--color-success)",
    borderColor: "var(--color-success)",
    color: "white",
  },
  errorCard: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-lg)",
    padding: "var(--space-xl)",
    borderRadius: "var(--radius-xl)",
    backgroundColor: "var(--color-surface)",
    border: "2px solid var(--color-error)",
    boxShadow: "var(--shadow-lg)",
  },
  errorIcon: {
    fontSize: "48px",
  },
  errorTitle: {
    fontSize: "var(--font-size-xl)",
    color: "var(--color-error)",
    marginBottom: "var(--space-xs)",
  },
  errorMessage: {
    fontSize: "var(--font-size-base)",
    color: "var(--color-text-secondary)",
  },
  notFoundCard: {
    textAlign: "center",
    padding: "var(--space-3xl)",
    borderRadius: "var(--radius-xl)",
    backgroundColor: "var(--color-surface)",
    boxShadow: "var(--shadow-lg)",
  },
  notFoundIcon: {
    fontSize: "64px",
    marginBottom: "var(--space-lg)",
  },
  notFoundTitle: {
    fontSize: "var(--font-size-2xl)",
    marginBottom: "var(--space-sm)",
  },
  notFoundMessage: {
    fontSize: "var(--font-size-base)",
    color: "var(--color-text-secondary)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "var(--space-3xl)",
    gap: "var(--space-lg)",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid var(--color-border)",
    borderTop: "4px solid var(--color-primary)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "var(--font-size-lg)",
    color: "var(--color-text-secondary)",
  },
};

// Add spinner animation to index.css via inline style tag
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

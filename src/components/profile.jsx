import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  TwitterIcon, GithubIcon, CopyIcon, CheckIcon,
  SearchIcon, AlertCircleIcon
} from "./icons";

const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ETH_REGISTRAR_ADDRESS = "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85";

const COMMON_TEXT_KEYS = [
  "name", "description", "url", "avatar", "email",
  "com.twitter", "com.github", "com.discord", "notice", "org.telegram", "vnd.twitter",
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
    <div style={styles.app}>
      {/* Compact Header */}
      <header style={styles.header}>
        <div className="container" style={styles.headerInner}>
          <h1 style={styles.logo}>ENS</h1>
          <div style={styles.search}>
            <input
              value={ens}
              onChange={(e) => setEns(e.target.value)}
              placeholder="vitalik.eth"
              style={styles.input}
              onKeyDown={(e) => e.key === "Enter" && ens && !loading && fetchENSProfile(ens)}
            />
            <button
              onClick={() => fetchENSProfile(ens)}
              disabled={!ens || loading}
              style={styles.btn}
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={styles.main}>
        {/* Hero Section - Show when no search has been made */}
        {!loading && !error && !notFound && !hasData && (
          <HeroSection />
        )}

        {error && <ErrorCard message={error} />}
        {notFound && <NotFoundCard />}
        {loading && <LoadingCard />}

        {!loading && !error && !notFound && hasData && (
          <>
            {/* Profile Header - Compact */}
            {(textRecords.name || textRecords.avatar) && (
              <div style={styles.profile} className="card fade-in">
                {textRecords.avatar && (
                  <img src={textRecords.avatar} alt="Avatar" style={styles.avatar} onError={(e) => (e.target.style.display = "none")} />
                )}
                <div>
                  <h2 style={styles.profileName}>{textRecords.name || ens}</h2>
                  <p style={styles.profileEns} className="mono">{ens}</p>
                  {textRecords.description && <p style={styles.profileDesc}>{textRecords.description}</p>}
                </div>
              </div>
            )}

            {/* Two-Column Compact Grid */}
            <div style={styles.grid}>
              {/* Identity */}
              <Card title="Identity" delay={0.05}>
                <Row label="ENS" value={ens} copy={() => copyToClipboard(ens, "ens")} copied={copiedField === "ens"} />
                <Row label="Owner" value={owner} mono copy={() => copyToClipboard(owner, "owner")} copied={copiedField === "owner"} />
                <Row label="Address" value={resolvedAddress} mono copy={() => copyToClipboard(resolvedAddress, "addr")} copied={copiedField === "addr"} />
                <Row label="Resolver" value={resolverAddress} mono copy={() => copyToClipboard(resolverAddress, "resolver")} copied={copiedField === "resolver"} />
                {expiry && <Row label="Expiry" value={new Date(expiry).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} />}
              </Card>

              {/* Contact */}
              {(textRecords.email || textRecords["com.twitter"] || textRecords["com.github"] || textRecords.url) && (
                <Card title="Contact" delay={0.1}>
                  {textRecords.url && <Row label="Website" value={textRecords.url} copy={() => copyToClipboard(textRecords.url, "url")} copied={copiedField === "url"} />}
                  {textRecords.email && <Row label="Email" value={textRecords.email} copy={() => copyToClipboard(textRecords.email, "email")} copied={copiedField === "email"} />}
                  {(textRecords["com.twitter"] || textRecords["vnd.twitter"]) && (
                    <Row 
                      label={<span className="twitter-icon"><TwitterIcon size={14} /></span>} 
                      value={textRecords["com.twitter"] || textRecords["vnd.twitter"]} 
                      copy={() => copyToClipboard(textRecords["com.twitter"] || textRecords["vnd.twitter"], "twitter")} 
                      copied={copiedField === "twitter"} 
                    />
                  )}
                  {textRecords["com.github"] && (
                    <Row 
                      label={<GithubIcon size={14} />} 
                      value={textRecords["com.github"]} 
                      copy={() => copyToClipboard(textRecords["com.github"], "github")} 
                      copied={copiedField === "github"} 
                    />
                  )}
                </Card>
              )}

              {/* Addresses */}
              {Object.keys(coinAddresses).length > 0 && (
                <Card title="Addresses" delay={0.15}>
                  {Object.entries(coinAddresses).map(([coin, address]) => (
                    <Row
                      key={coin}
                      label={coin}
                      value={address}
                      mono
                      copy={() => copyToClipboard(address, coin)}
                      copied={copiedField === coin}
                    />
                  ))}
                </Card>
              )}

              {/* Content */}
              {contentHash && (
                <Card title="Content" delay={0.2}>
                  <Row label="Hash" value={contentHash} mono copy={() => copyToClipboard(contentHash, "hash")} copied={copiedField === "hash"} />
                </Card>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>Powered by Ethereum Name Service</p>
      </footer>
    </div>
  );
}

// Components
function Card({ title, children, delay = 0 }) {
  return (
    <div style={{...styles.card, animationDelay: `${delay}s`}} className="card fade-in">
      <h3 style={styles.cardTitle}>{title}</h3>
      <div style={styles.cardContent}>{children}</div>
    </div>
  );
}

function Row({ label, value, mono, copy, copied }) {
  if (!value) return null;
  const display = typeof value === "string" && value.length > 45 ? `${value.slice(0, 20)}...${value.slice(-20)}` : value;
  
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <div style={styles.valueWrap}>
        <span style={{...styles.value, ...(mono ? {fontFamily: 'monospace', fontSize: '13px'} : {})}} title={value}>
          {display}
        </span>
        {copy && (
          <button onClick={copy} style={{...styles.copyBtn, ...(copied ? styles.copyBtnActive : {})}} title="Copy">
            {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}

function ErrorCard({ message }) {
  return (
    <div style={styles.msg} className="card fade-in">
      <AlertCircleIcon size={20} />
      <div>
        <h4>Error</h4>
        <p style={styles.msgText}>{message}</p>
      </div>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div style={styles.msg} className="card fade-in">
      <SearchIcon size={20} />
      <div>
        <h4>Not Found</h4>
        <p style={styles.msgText}>No record found for this ENS name.</p>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div style={styles.loading} className="fade-in">
      <div style={styles.spinner}></div>
      <p>Loading...</p>
    </div>
  );
}

function HeroSection() {
  return (
    <div style={styles.hero} className="fade-in">
      <div style={styles.heroIcon}>
        <svg width="80" height="80" viewBox="0 0 32 32" style={{filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))'}}>
          <path fill="#627EEA" d="M16 0l-1 3.4v18.2l1 1 8-4.7z"/>
          <path fill="#8A92B2" d="M16 0L8 17.9l8 4.7V0z"/>
          <path fill="#627EEA" d="M16 24.6l-.6.7v6.1l.6 1.6 8-11.3z"/>
          <path fill="#8A92B2" d="M16 32.9v-8.3L8 21.3z"/>
          <path fill="#454A75" d="M16 22.6l8-4.7-8-3.6z"/>
          <path fill="#8A92B2" d="M8 17.9l8 4.7v-8.3z"/>
        </svg>
      </div>
      <h2 style={styles.heroTitle}>Explore Ethereum Name Service</h2>
      <p style={styles.heroSubtitle}>Search any .eth name to view comprehensive blockchain data, social profiles, and cryptocurrency addresses</p>
      <div style={styles.heroExamples}>
        <p style={styles.heroExamplesLabel}>Try searching:</p>
        <div style={styles.heroChips}>
          <span style={styles.chip} className="mono">vitalik.eth</span>
          <span style={styles.chip} className="mono">nick.eth</span>
          <span style={styles.chip} className="mono">brantly.eth</span>
        </div>
      </div>
      <div style={styles.heroFeatures}>
        <div style={styles.feature} className="stagger-1">
          <div style={styles.featureIcon}>👤</div>
          <div style={styles.featureText}>
            <h4>Profile Data</h4>
            <p>Owner, resolver, and resolved addresses</p>
          </div>
        </div>
        <div style={styles.feature} className="stagger-2">
          <div style={styles.featureIcon}>💬</div>
          <div style={styles.featureText}>
            <h4>Social Records</h4>
            <p>Twitter, GitHub, Discord, and more</p>
          </div>
        </div>
        <div style={styles.feature} className="stagger-3">
          <div style={styles.featureIcon}>💰</div>
          <div style={styles.featureText}>
            <h4>Crypto Addresses</h4>
            <p>ETH, BTC, LTC and other chains</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles - Ultra Compact
const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    borderBottom: '1px solid var(--border)',
    padding: 'var(--s-5) 0',
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--s-6)',
  },
  logo: {
    fontSize: '32px',
    fontWeight: 900,
    letterSpacing: '-0.03em',
  },
  search: {
    display: 'flex',
    gap: 'var(--s-2)',
    flex: 1,
    maxWidth: '500px',
  },
  input: {
    flex: 1,
  },
  btn: {
    minWidth: '60px',
    fontSize: '18px',
  },
  main: {
    flex: 1,
    paddingTop: 'var(--s-8)',
    paddingBottom: 'var(--s-10)',
  },
  profile: {
    display: 'flex',
    gap: 'var(--s-5)',
    alignItems: 'center',
    marginBottom: 'var(--s-6)',
    padding: 'var(--s-5)',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: 'var(--r-md)',
    objectFit: 'cover',
    border: '1px solid var(--border)',
  },
  profileName: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: 'var(--s-1)',
  },
  profileEns: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--s-2)',
  },
  profileDesc: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 'var(--s-4)',
  },
  card: {
    padding: 'var(--s-5)',
    opacity: 0,
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: 'var(--s-4)',
    paddingBottom: 'var(--s-3)',
    borderBottom: '1px solid var(--border)',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--s-3)',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--s-3)',
    fontSize: '14px',
  },
  label: {
    color: 'var(--text-tertiary)',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    minWidth: '80px',
  },
  valueWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--s-2)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  value: {
    color: 'var(--text)',
    fontSize: '14px',
    wordBreak: 'break-all',
    textAlign: 'right',
  },
  copyBtn: {
    padding: 'var(--s-1)',
    minWidth: '24px',
    height: '24px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copyBtnActive: {
    background: 'var(--text)',
    color: 'var(--bg)',
    borderColor: 'var(--text)',
  },
  msg: {
    display: 'flex',
    gap: 'var(--s-4)',
    alignItems: 'flex-start',
    padding: 'var(--s-6)',
  },
  msgText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: 'var(--s-1)',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--s-4)',
    padding: 'var(--s-10)',
    opacity: 0,
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid var(--border)',
    borderTop: '3px solid var(--text)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  footer: {
    borderTop: '1px solid var(--border)',
    padding: 'var(--s-5) 0',
    marginTop: 'var(--s-10)',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  hero: {
    textAlign: 'center',
    padding: 'var(--s-10) 0',
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroIcon: {
    marginBottom: 'var(--s-6)',
    animation: 'float 3s ease-in-out infinite',
  },
  heroTitle: {
    fontSize: '40px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    marginBottom: 'var(--s-4)',
  },
  heroSubtitle: {
    fontSize: '17px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: 'var(--s-8)',
  },
  heroExamples: {
    marginBottom: 'var(--s-8)',
  },
  heroExamplesLabel: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 'var(--s-3)',
  },
  heroChips: {
    display: 'flex',
    gap: 'var(--s-3)',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  chip: {
    padding: 'var(--s-2) var(--s-4)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    transition: 'all var(--fast) var(--ease)',
    cursor: 'default',
  },
  heroFeatures: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--s-6)',
    marginTop: 'var(--s-8)',
  },
  feature: {
    textAlign: 'left',
    padding: 'var(--s-5)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    transition: 'all var(--base) var(--ease)',
    opacity: 0,
  },
  featureIcon: {
    fontSize: '32px',
    marginBottom: 'var(--s-3)',
  },
  featureText: {
    h4: {
      fontSize: '15px',
      fontWeight: 600,
      marginBottom: 'var(--s-2)',
    },
    p: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
      lineHeight: 1.5,
    },
  },
};

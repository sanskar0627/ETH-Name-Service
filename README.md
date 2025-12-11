# 🌐 ETH Name Service - ENS Profile Viewer

A premium, Apple-inspired ENS (Ethereum Name Service) Profile Viewer built with React and ethers.js. This application allows you to search for any ENS name and view all associated blockchain data in a beautiful, minimalistic interface.

![ENS Profile Viewer](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?style=for-the-badge&logo=vite)
![ethers.js](https://img.shields.io/badge/ethers.js-6.16.0-2535A0?style=for-the-badge)

## ✨ Features

- 🔍 **ENS Name Resolution** - Search and resolve any .eth name
- 👤 **Profile Information** - Display owner, resolved address, and resolver details
- 🖼️ **Avatar Display** - Show ENS avatars in a circular frame
- 📝 **Text Records** - View all text records (name, description, URL, social media)
- 💰 **Cryptocurrency Addresses** - Display ETH, BTC, LTC addresses
- 📋 **Copy-to-Clipboard** - One-click copy for all addresses and data
- 🎨 **Apple-Inspired Design** - Premium glassmorphism UI with smooth animations
- 🌓 **Light & Dark Mode** - Automatic theme switching based on system preference
- 📱 **Responsive Design** - Works beautifully on all screen sizes

## 🎯 Design Principles

- **Minimalism**: Clean, uncluttered interface with ample whitespace
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Smooth Animations**: Subtle, fluid transitions (60fps)
- **Premium Typography**: Inter font (SF Pro alternative)
- **Consistent Spacing**: 8px grid system throughout
- **Perfect Alignment**: Everything aligned to grid

## 🚀 Tech Stack

- **React 19** - Latest React with modern hooks
- **Vite 7** - Lightning-fast build tool
- **ethers.js 6** - Ethereum blockchain interaction
- **Alchemy RPC** - Reliable Ethereum node provider
- **Inter Font** - Premium typography
- **CSS Variables** - Comprehensive design system

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/sanskar0627/ETH-Name-Service.git
cd ETH-Name-Service
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## 🎮 Usage

1. Enter any ENS name (e.g., `vitalik.eth`) in the search bar
2. Click "Search" or press Enter
3. View all associated blockchain data in beautiful cards
4. Click the 📋 icon next to any field to copy it to clipboard

## 🏗️ Project Structure

```
client/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   └── profile.jsx      # Main ENS Profile component
│   ├── App.css              # App-specific styles
│   ├── App.jsx              # Main App component
│   ├── index.css            # Design system & global styles
│   └── main.jsx             # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 Design System

The application uses a comprehensive CSS design system with:

- **Colors**: Apple-inspired palette with primary blue (#007AFF)
- **Spacing**: 8px grid system (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px)
- **Border Radius**: sm: 8px, md: 12px, lg: 16px, xl: 24px, full: 9999px
- **Shadows**: Layered shadows (sm, md, lg, xl) for depth
- **Typography**: 8 size scales from xs (12px) to 4xl (40px)
- **Transitions**: Fast (150ms), Base (250ms), Slow (350ms)

## 🔧 Configuration

### Ethereum RPC Provider

The app uses Alchemy as the RPC provider. The API key is currently hardcoded in `profile.jsx`:

```javascript
const rpc = "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY";
```

For production, consider moving this to environment variables.

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Flexible grid layout (auto-fit, minmax(350px, 1fr))
- Adaptive spacing and typography
- Touch-friendly buttons and inputs

## 🌟 Key Components

### ENSProfile Component
Main component that handles:
- ENS name resolution
- Blockchain data fetching
- State management
- UI rendering

### GlassCard Component
Reusable card component with glassmorphism effect

### InfoRow Component
Displays individual data fields with:
- Icon
- Label
- Value
- Copy-to-clipboard button

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

### Deploy to Vercel/Netlify

1. Push your code to GitHub
2. Connect your repository to Vercel or Netlify
3. Deploy with default settings (Vite preset)

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 👨‍💻 Author

**Sanskar**
- GitHub: [@sanskar0627](https://github.com/sanskar0627)

## 🙏 Acknowledgments

- [Ethereum Name Service](https://ens.domains/)
- [ethers.js](https://docs.ethers.org/)
- [Alchemy](https://www.alchemy.com/)
- [Inter Font](https://rsms.me/inter/)

## 📝 Part 1 Completion

This project successfully completes **Part 1** of the ENS exam requirements:
- ✅ Takes any ENS name input
- ✅ Renders a simple profile page
- ✅ Displays all populated fields from Ethereum blockchain
- ✅ Professional MVP-quality design

---

**Made with ❤️ using React, Vite, and ethers.js**

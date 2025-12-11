import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import ENSProfile from "./components/profile";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <ENSProfile />
    </>
  );
}

export default App;

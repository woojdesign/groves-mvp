
  import { createRoot } from "react-dom/client";
  import { BrowserRouter, Routes, Route } from "react-router-dom";
  import App from "./App.tsx";
  import ShowcaseListen from "./showcase/ShowcaseListen.tsx";
  import ShowcaseLearn from "./showcase/ShowcaseLearn.tsx";
  import ShowcaseConnect from "./showcase/ShowcaseConnect.tsx";
  import "./index.css";
  import "./styles/components.css";

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/showcase/listen" element={<ShowcaseListen />} />
        <Route path="/showcase/learn" element={<ShowcaseLearn />} />
        <Route path="/showcase/connect" element={<ShowcaseConnect />} />
      </Routes>
    </BrowserRouter>
  );
  
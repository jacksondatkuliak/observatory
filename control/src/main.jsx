import { createRoot } from "react-dom/client";
import ControlContent from "./control";
import InfoContent from "./info";
import Common from "./common";
import { BrowserRouter, Routes, Route } from "react-router";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Common />}>
        <Route index element={<InfoContent />} />
        <Route path="/control" element={<ControlContent />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

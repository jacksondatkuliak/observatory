import { Outlet } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Header from "./components/header";
import "./main.css";
import { io } from "socket.io-client";
import { useEffect } from "react";
import config from "../config.json";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

/**
 * Common wrapper for pages. Handles websocket data
 */
function Common() {
  return (
    <>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Header />
        <main>
          <div className="pageClass">
            <Outlet />
          </div>
        </main>
      </ThemeProvider>
    </>
  );
}

export default Common;

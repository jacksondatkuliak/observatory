import { Outlet } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Header from "./components/header";
import "./main.css";
import { io } from "socket.io-client";
import { useEffect } from "react";
import config from "../config.json";
import axios from "axios";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

/**
 * Common wrapper for pages. Handles websocket data
 */
function Common() {
  // open websocket
  const socket = io(config.socketUrl + "/events/v1");
  useEffect(() => {
    socket.on("connect", () => {
      // authenticate
      console.log("authenticating with NINA API");
      socket.emit(JSON.stringify({ ApiKey: config.key }));
    });
    socket.on("CameraStatusResponse", (data) => {
      console.log(data);
    });
    socket.on("eventData", (data) => {
      console.log("Received from server:", data);
    });

    return () => {
      socket.off("connect");
    };
  }, []);
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

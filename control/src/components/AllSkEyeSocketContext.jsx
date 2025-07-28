import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import config from "../../config.json";

const AllSkEyeSocketContext = createContext();

export function AllSkEyeSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    const newSocket = io(config.allskeyeUrl, {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => console.log("AllSkEye connected"));
    newSocket.on("disconnect", () => console.log("AllSkEye disconnected"));

    newSocket.on("new_image", (data) => {
      if (data) {
        const blob = new Blob([data], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setImage(url);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <AllSkEyeSocketContext.Provider value={{ socket, image }}>
      {children}
    </AllSkEyeSocketContext.Provider>
  );
}

export function useAllSkEyeSocket() {
  return useContext(AllSkEyeSocketContext);
}

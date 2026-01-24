import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import config from "../../config.json";

const SocketContext = createContext();

const INITIAL_ESP32_STATE = {
  temp: "N/A",
  humidity: "N/A",
  dewpoint: "N/A",
  fan: "N/A",
  dew: "N/A",
  wait_time: "N/A",
  toggle_wait_time: "N/A",
  cooling_fan_threshold: "N/A",
  cooling_fan_abs_threshold: "N/A",
  dew_heater_threshold: "N/A",
  dew_heater_abs_threshold: "N/A",
  mode: "N/A",
};

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [image, setImage] = useState(null);
  const [esp32Data, setEsp32Data] = useState(INITIAL_ESP32_STATE);

  const [dht11, setDHT11] = useState(null);
  const [roof, setRoof] = useState(null);

  useEffect(() => {
    const newSocket = io(`${config.allskeyeUrl}:3002`, {
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

    newSocket.on("esp32_data", (data) => {
      data["temp"] = data["temp"].toFixed(1);
      data["humidity"] = data["humidity"].toFixed(1);
      data["dewpoint"] = data["dewpoint"].toFixed(1);
      setEsp32Data((prev) => ({
        ...prev,
        ...data,
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const newSocket2 = io(`${config.controlUrl}:3002`, {
      transports: ["websocket"],
    });
    setSocket(newSocket2);

    newSocket2.on("connect", () => console.log("Control connected"));
    newSocket2.on("disconnect", () => console.log("Control disconnected"));

    newSocket2.on("dht11", (data) => {
      setDHT11((prev) => ({
        ...prev,
        ...data,
      }));
    });

    newSocket2.on("roof", (data) => {
      setRoof((prev) => ({
        ...prev,
        ...data,
      }));
    });

    return () => {
      newSocket2.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, image, esp32Data, dht11, roof }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

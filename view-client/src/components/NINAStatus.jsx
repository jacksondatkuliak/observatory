import { useEffect, useState } from "react";
import config from "../../config.json";
import axios from "axios";
import { Box } from "@mui/material";

function NINAStatus() {
  const [NINAScreenshot, setNINAScreenshot] = useState(null);
  const [NINAState, setNINAState] = useState(null);

  useEffect(() => {
    const NINAInstance = axios.create({
      baseURL: config.NINAUrl,
    });

    const fetchScreenshot = () => {
      NINAInstance.get("/v2/api/application/screenshot").then((response) => {
        setNINAScreenshot(response.data["Response"]);
      });
    };

    const fetchState = () => {
      NINAInstance.get("/v2/api/equipment/info").then((response) => {
        setNINAState(response.data["Response"]);
        console.log(response.data["Response"]);
      });
    };

    const interval = setInterval(fetchScreenshot, 1800000);
    const stateInterval = setInterval(fetchState, 30000);
    fetchScreenshot();
    fetchState();

    const clearIntervals = () => {
      clearInterval(stateInterval);
      clearInterval(interval);
    };

    return () => clearIntervals();
  }, []);

  return (
    <>
      {NINAScreenshot && (
        <Box
          sx={{
            width: { xs: "100%" }, // final displayed size
            height: "auto",
          }}
          component="img"
          src={`data:image/png;base64, ${NINAScreenshot}`}
        ></Box>
      )}
      {NINAState && (
        <>
          <p></p>
        </>
      )}
    </>
  );
}

export default NINAStatus;

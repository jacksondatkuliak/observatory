//import Button from "@mui/material/Button";
import config from "../config.json";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import { useAllSkEyeSocket } from "./components/AllSkEyeSocketContext";
/**
 * Shows info about the observatory
 */
function InfoContent() {
  const { image } = useAllSkEyeSocket();
  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid size={6}>
            {image == null ? (
              <p>No AllSkEye image</p>
            ) : (
              <>
                <img
                  src={image}
                  alt="Latest Image"
                  style={{ width: "100%", padding: "1rem" }}
                />
              </>
            )}
          </Grid>
          <Grid size={6}>
            <p>NINA</p>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

export default InfoContent;

import { Paper, Chip, Stack, Typography, Grid, Box } from "@mui/material";
import { useSocket } from "./SocketContext";
import config from "../../config.json";
import axios from "axios";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useState } from "react";

function ObservatoryStatus() {
  const { esp32Data, dht11, roof, deviceStatus, image } = useSocket();

  function change_mode() {
    if (esp32Data.mode == "auto") {
      axios.get(`${config.allskeyeUrl}:3001/update?output=mode&state=manual`);
    } else if (esp32Data.mode == "manual") {
      axios.get(`${config.allskeyeUrl}:3001/update?output=mode&state=auto`);
    }
  }

  function change_fan() {
    if (esp32Data.fan == "on") {
      axios.get(`${config.allskeyeUrl}:3001/update?output=fan&state=off`);
    } else if (esp32Data.fan == "off") {
      axios.get(`${config.allskeyeUrl}:3001/update?output=fan&state=on`);
    }
  }

  function change_dew() {
    if (esp32Data.dew == "on") {
      axios.get(`${config.allskeyeUrl}:3001/update?output=dew&state=off`);
    } else if (esp32Data.dew == "off") {
      axios.get(`${config.allskeyeUrl}:3001/update?output=dew&state=on`);
    }
  }

  const [locked, setLocked] = useState(false);

  const changeLocked = () => {
    setLocked(!locked);
  };

  function cToF(temp) {
    return (temp * 9) / 5 + 32;
  }

  function DHT11({ label, tempC, tempF, humidity }) {
    return (
      <>
        <Stack direction="row" spacing={1} alignItems="center">
          <Paper
            elevation={1}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1.5,
              py: 0.75,
              borderRadius: "9px",
              gap: 1,
            }}
          >
            <Typography variant="body2" fontFamily="monospace">
              {label}
            </Typography>
            <Stack direction="column" spacing={0}>
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" fontFamily="monospace">
                  {`${tempC}°C`}
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {`/`}
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {`${tempF}°F`}
                </Typography>
              </Stack>
              <Typography variant="body2" fontFamily="monospace">
                {`${humidity}% RH`}
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </>
    );
  }

  function SHT4X({ label, tempC, tempF, humidity, dewpoint }) {
    return (
      <>
        <Stack direction="row" spacing={1} alignItems="center">
          <Paper
            elevation={1}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1.5,
              py: 0.75,
              borderRadius: "5px",
              border: 1,
              borderColor: "gray",
              gap: 1,
            }}
          >
            {label != "" ? (
              <Typography variant="body2">{label}</Typography>
            ) : null}

            <Stack direction="column" spacing={0}>
              <Stack direction="row" spacing={0.75}>
                <Typography variant="body2">{`${tempC}°C`}</Typography>
                <Typography variant="body2">{`/`}</Typography>
                <Typography variant="body2">{`${tempF}°F`}</Typography>
                <Typography variant="body2">{`/`}</Typography>
                <Typography variant="body2">{`${humidity}% RH`}</Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Typography variant="body2">{`DP: ${dewpoint}°C`}</Typography>
                <Typography variant="body2">{`ΔT: ${(tempC - dewpoint).toFixed(1)}°C`}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </>
    );
  }

  return (
    <>
      <Box
        sx={{
          width: { xs: "100%" }, // final displayed size
          height: "auto",
        }}
      >
        {/* render allsky camera image */}
        {image === null ? (
          <p>No AllSkEye image</p>
        ) : (
          <>
            <img
              src={image}
              alt="Latest Image"
              style={{
                width: "100%",
              }}
            />
          </>
        )}
      </Box>

      <Stack spacing={{ xs: 0 }}>
        <div>
          <Stack
            direction={{ lg: "column", xl: "row" }}
            spacing={0.5}
            sx={{ marginTop: "0.2em" }}
          >
            <h3 style={{ margin: "0.25rem" }}>AllSky</h3>
            {esp32Data.temp !== "N/A" ? (
              <SHT4X
                label=""
                tempC={esp32Data.temp}
                tempF={cToF(esp32Data.temp).toFixed(1)}
                humidity={esp32Data.humidity}
                dewpoint={esp32Data.dewpoint}
              />
            ) : null}
            <div>
              <Stack direction="row" spacing={0.5} sx={{ marginTop: "0.2em" }}>
                <Chip
                  onClick={
                    esp32Data.mode === "manual" && locked ? change_fan : null
                  }
                  sx={{ borderRadius: "5px" }}
                  label={
                    `Fan: ${
                      String(esp32Data.fan).charAt(0).toUpperCase() +
                      String(esp32Data.fan).slice(1)
                    }` ?? "Unknown"
                  }
                  color={
                    esp32Data.fan === "on"
                      ? "success"
                      : esp32Data.fan === "off"
                        ? "error"
                        : "default"
                  }
                  size="small"
                  variant="filled"
                />
                <Chip
                  onClick={
                    esp32Data.mode === "manual" && locked ? change_dew : null
                  }
                  sx={{ borderRadius: "5px" }}
                  label={
                    `Dew Heater: ${
                      String(esp32Data.dew).charAt(0).toUpperCase() +
                      String(esp32Data.dew).slice(1)
                    }` ?? "Unknown"
                  }
                  color={
                    esp32Data.dew === "on"
                      ? "success"
                      : esp32Data.dew === "off"
                        ? "error"
                        : "default"
                  }
                  size="small"
                  variant="filled"
                />
              </Stack>
              <Stack direction="row" spacing={0.5} sx={{ marginTop: "0.2em" }}>
                <Chip
                  onClick={locked ? change_mode : null}
                  sx={{ borderRadius: "5px" }}
                  label={
                    `Mode: ${
                      String(esp32Data.mode).charAt(0).toUpperCase() +
                      String(esp32Data.mode).slice(1)
                    }` ?? "Unknown"
                  }
                  color={
                    esp32Data.mode === "auto"
                      ? "info"
                      : esp32Data.mode === "manual"
                        ? "warning"
                        : "default"
                  }
                  size="small"
                  variant="filled"
                />
                <Chip
                  onClick={changeLocked}
                  sx={{
                    borderRadius: "5px",
                    alignItems: "center",
                  }}
                  label="Lock"
                  icon={locked ? <LockOpenIcon /> : <LockOutlineIcon />}
                  color={"secondary"}
                  size="small"
                  variant="filled"
                />
              </Stack>
            </div>
          </Stack>
        </div>

        <div>
          <Grid
            container
            spacing={1}
            sx={{
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: "0.25rem" }}>Roof</h3>
            <Chip
              sx={{ borderRadius: "5px" }}
              label={
                roof?.status === "open"
                  ? "Open"
                  : roof?.status === "closed"
                    ? "Closed"
                    : "Unknown"
              }
              color={
                roof?.status === "open"
                  ? "success"
                  : roof?.status === "closed"
                    ? "error"
                    : "default"
              }
              size="small"
              variant="filled"
            />
          </Grid>
          {/*
          <Grid container>
            {dht11?.temp != null ? (
              <DHT11
                label="RoofPi (DHT11)"
                name="RoofPi"
                tempC={dht11.temp}
                tempF={cToF(dht11.temp).toFixed(1)}
                humidity={dht11.humidity}
              />
            ) : null}
          </Grid>
          */}
          <Stack
            direction={{ xs: "row" }}
            sx={{
              justifyContent: "flex-start",
              alignItems: "center",
            }}
            spacing={1}
          >
            <h3 style={{ margin: "0.25rem" }}>Devices</h3>
            {deviceStatus !== null ? (
              Object.entries(deviceStatus).map(([key, value]) => (
                <Chip
                  sx={{ borderRadius: "5px" }}
                  key={key}
                  label={key}
                  color={value ? "success" : "error"}
                  size="small"
                />
              ))
            ) : (
              <Chip label="Unknown" color="default" size="small" />
            )}
          </Stack>
        </div>
      </Stack>
    </>
  );
}

export default ObservatoryStatus;

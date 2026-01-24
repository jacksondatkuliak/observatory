import { Paper, Chip, Stack, Typography, Grid } from "@mui/material";
import { useSocket } from "./SocketContext";

function ObservatoryStatus() {
  const { esp32Data, dht11, roof } = useSocket();

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

              <Typography variant="body2" fontFamily="monospace">
                {`DP: ${dewpoint}°C`}
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </>
    );
  }

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
        <div>
          <Grid
            container
            spacing={1}
            sx={{
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <h3>Roof</h3>
            <Chip
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
        </div>

        <div>
          <h3>AllSky ESP32</h3>
          {esp32Data.temp !== "N/A" ? (
            <SHT4X
              label="AllSky (SHT45)"
              tempC={esp32Data.temp}
              tempF={cToF(esp32Data.temp).toFixed(1)}
              humidity={esp32Data.humidity}
              dewpoint={esp32Data.dewpoint}
            />
          ) : null}
          <Stack direction="row" spacing={0.5}>
            <Chip
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
            <Chip
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
          </Stack>
        </div>
      </Stack>
    </>
  );
}

export default ObservatoryStatus;

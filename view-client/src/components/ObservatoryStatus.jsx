import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config.json";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";

function ObservatoryStatus() {
  // get new temp/humidity reading every minute
  const [tempC, setTempC] = useState(null);
  const [tempC5min, setTempC5min] = useState(null);
  const [tempF, setTempF] = useState(null);
  const [tempF5min, setTempF5min] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [humidity5min, setHumidity5min] = useState(null);
  const [roof, setRoof] = useState(null);

  const fetchRoof = async () => {
    try {
      const response = await axios.get(`${config.controlUrl}/roofhistory/1`);
      if (response.data?.[0]?.status === "open") {
        setRoof(`Open`);
      } else if (response.data?.[0]?.status === "closed") {
        setRoof(`Closed`);
      }
    } catch (err) {
      console.error(err);
    }
  };
  fetchRoof();
  useEffect(() => {
    // make get request and update temp/humidity
    // define async function inside useEffect
    const fetchData = async () => {
      try {
        // get current readings
        const response = await axios.get(
          `${config.controlUrl}/dht11_readings/1`
        );
        setTempC(response.data?.[0]?.temperature.toFixed(1));
        setTempF((response.data?.[0]?.temperature * (9 / 5) + 32).toFixed(1));
        setHumidity(response.data?.[0]?.humidity.toFixed(0));
        // get 5 min averages
        const average = await axios.get(`${config.controlUrl}/dht11_5minavg`);
        setTempC5min(average.data?.avg_temperature.toFixed(1));
        setTempF5min((average.data?.avg_temperature * (9 / 5) + 32).toFixed(1));
        setHumidity5min(average.data?.avg_humidity.toFixed(0));
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 600000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <h3>Status</h3>
        <Button
          variant="outlined"
          style={{ maxHeight: "2.5em" }}
          onClick={() => {
            setRoof(null);
            fetchRoof();
          }}
        >
          Refresh
        </Button>
      </Grid>
      <Grid container spacing={6} rowSpacing={2}>
        {tempC !== null ? (
          <span>
            Current: {tempC}°C {tempF}°F {humidity}% RH
          </span>
        ) : null}
        {tempC5min !== null ? (
          <span>
            5 Min Avg: {tempC5min}°C {tempF5min}°F {humidity5min}% RH
          </span>
        ) : null}
      </Grid>
      <p>Roof: {roof !== null ? `${roof}` : "Unknown"}</p>
    </>
  );
}

export default ObservatoryStatus;

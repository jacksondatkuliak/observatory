import config from "../../config.json";
import {
  Link,
  NativeSelect,
  Select,
  FormControl,
  MenuItem,
  InputLabel,
  Box,
  Button,
} from "@mui/material";
import { useState, useEffect } from "react";

/**
 * Displays and crops a GOES image to see current weather
 */
function GOESImage() {
  // make the URL EXTENT3 by default
  const [channel, setChannel] = useState("EXTENT3");
  const [url, setURL] = useState(
    `${config.GOESUrlGLM}EXTENT3/2400x2400.jpg?t=${Date.now()}`,
  );
  // helper to build URL based on current channel
  const buildURL = (ch) => {
    const base = ch === "EXTENT3" ? config.GOESUrlGLM : config.GOESUrlABI;
    return `${base}${ch}/2400x2400.jpg?t=${Date.now()}`;
  };
  // handle user changing image
  const handleChange = (event) => {
    const value = event.target.value;
    setChannel(value);
    setURL(buildURL(value));
  };
  // refresh image every 5 minutes (300000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setURL(buildURL(channel));
    }, 300000);

    return () => clearInterval(interval);
  }, [channel]); // re-register timer if channel changes

  return (
    <>
      {/* image */}
      <Box
        sx={{
          width: { xs: "100%", sm: 600, md: 750 }, // final displayed size
          height: "auto",
          aspectRatio: "1 / 1",
          overflow: "hidden", // crop
          position: "relative",
        }}
      >
        <Box
          component="img"
          src={url}
          alt="cropped"
          sx={{
            position: "absolute",
            top: config.GOEStop,
            left: config.GOESleft,
            width: config.GOESwidth,
            height: "auto",
            objectFit: "cover",
          }}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1, // space between dropdown and text
        }}
      >
        <Button variant="contained" color="inherit" sx={{ margin: "0.2em" }}>
          <Link
            href="https://www.star.nesdis.noaa.gov/goes/sector.php?sat=G16&sector=cgl"
            underline="none"
            target="_blank"
            color="white"
          >
            GOESViewer
          </Link>
        </Button>

        {/* channel selector dropdown */}
        <Box>
          <FormControl
            sx={{ m: 1, minWidth: 120 }}
            size="small"
            variant="standard"
          >
            <InputLabel>Channel</InputLabel>
            <NativeSelect
              defaultValue={channel}
              label="Channel"
              onChange={handleChange}
            >
              <option value="GEOCOLOR">GeoColor</option>
              <option value="EXTENT3">GLM FED3+GeoColor</option>
              <option value="AirMass">AirMass RGB</option>
              <option value="Sandwich">Sandwich RGB</option>
              <option value="DayNightCloudMicroCombo">
                Cloud Micro Combo RGB
              </option>
            </NativeSelect>
          </FormControl>
        </Box>
      </Box>
    </>
  );
}

export default GOESImage;

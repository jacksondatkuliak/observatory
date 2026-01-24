import config from "../../config.json";
import {
  Link,
  NativeSelect,
  Select,
  FormControl,
  MenuItem,
  InputLabel,
  Box,
} from "@mui/material";
import { useState, useEffect } from "react";

/**
 * Displays and crops a GOES image to see current weather
 */
function GOESImage() {
  // make the URL EXTENT3 by default
  const [channel, setChannel] = useState("EXTENT3");
  const [url, setURL] = useState(
    `${config.GOESUrlGLM}EXTENT3/2400x2400.jpg?t=${Date.now()}`
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
            // TODO: put these in the config file
            top: "-45%", // shift crop area vertically
            left: "-57%", // shift crop area horizontally
            width: "200%", // zoom: increase to scale up
            height: "auto",
            objectFit: "cover",
            maxWidth: "none",
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
        {/* channel selector dropdown */}
        <Box>
          <FormControl
            sx={{ m: 1, minWidth: 120 }}
            size="small"
            variant="standard"
          >
            <InputLabel>Channel</InputLabel>
            <Select
              defaultValue={channel}
              label="Channel"
              onChange={handleChange}
            >
              <MenuItem value="GEOCOLOR">GeoColor</MenuItem>
              <MenuItem value="EXTENT3">GLM FED3+GeoColor</MenuItem>
              <MenuItem value="AirMass">AirMass RGB</MenuItem>
              <MenuItem value="Sandwich">Sandwich RGB</MenuItem>
              <MenuItem value="DayNightCloudMicroCombo">
                Cloud Micro Combo RGB
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Link
          href="https://www.star.nesdis.noaa.gov/goes/sector.php?sat=G16&sector=cgl"
          underline="none"
          target="_blank"
        >
          GOESViewer
        </Link>
      </Box>
    </>
  );
}

export default GOESImage;

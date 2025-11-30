import { useAllSkEyeSocket } from "./components/AllSkEyeSocketContext";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import GOESImage from "./components/GOESImage";
import ObservatoryStatus from "./components/ObservatoryStatus";
//import config from "../config.json";

/**
 * Observatory viewer entry point
 */
function App() {
  // allsky image
  const { image } = useAllSkEyeSocket();

  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{ maxWidth: 1 }}
        style={{ padding: "0.5rem" }}
      >
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box>
            {/* render allsky camera image */}
            {image === null ? (
              <p>No AllSkEye image</p>
            ) : (
              <>
                <img src={image} alt="Latest Image" style={{ width: "100%" }} />
              </>
            )}
          </Box>
          {/* temperature/humidity/roofstatus readings */}
          <ObservatoryStatus />
        </Grid>
        {/* GOES image viewer */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <GOESImage />
        </Grid>
      </Grid>
    </>
  );
}

export default App;

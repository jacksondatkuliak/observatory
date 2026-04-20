import Grid from "@mui/material/Grid";
import GOESImage from "./components/GOESImage";
import ObservatoryStatus from "./components/ObservatoryStatus";
import Forecast from "./components/Forecast";
import NINAStatus from "./components/NINAStatus";

/**
 * Observatory viewer entry point
 */
function App() {
  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{ maxWidth: 1 }}
        style={{ padding: "0.5rem" }}
      >
        <Grid size={{ sm: 12, md: 6 }}>
          <ObservatoryStatus />
          <NINAStatus />
        </Grid>
        {/* GOES image viewer */}
        <Grid size={{ sm: 12, md: 6 }}>
          <GOESImage />
          <Forecast />
        </Grid>
      </Grid>
    </>
  );
}

export default App;

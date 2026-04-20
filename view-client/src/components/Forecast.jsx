import { useEffect, useState } from "react";
import config from "../../config.json";

import { Box, Button, Link, Stack } from "@mui/material";

function Forecast() {
  useEffect(() => {
    setInterval(() => {
      setUrl(`${config.clearOutsideImageUrl}?t=${Date.now()}`);
    }, 1800000);
  }, []);
  const [url, setUrl] = useState(config.clearOutsideImageUrl);
  return (
    <>
      <Stack direction="row">
        <Button variant="contained" color="inherit" sx={{ margin: "0.2em" }}>
          <Link
            href={config.clearOutsideUrl}
            underline="none"
            target="_blank"
            color="white"
          >
            Clear Outside
          </Link>
        </Button>
        <Button variant="contained" color="inherit" sx={{ margin: "0.2em" }}>
          <Link
            href={config.astrosphericUrl}
            underline="none"
            target="_blank"
            color="white"
          >
            Astrospheric
          </Link>
        </Button>
      </Stack>
      <Box
        component="img"
        src={url}
        sx={{
          width: { xs: "99%", sm: 600, md: 750 },
          height: "auto",
          position: "relative",
          border: "1px solid black",
        }}
      />
    </>
  );
}

export default Forecast;

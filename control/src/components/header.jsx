import { AppBar, Toolbar, Typography } from "@mui/material";
import { NavLink } from "react-router";
import "../main.css";

function Header() {
  return (
    <>
      <AppBar position="static" color="primary" elevation={1}>
        <span style={{ position: "absolute", textIndent: "0.5rem" }}>
          Observatory Interface
        </span>
        <Toolbar style={{ marginTop: "0.5rem" }}>
          <Typography variant="h5" component="div" sx={{ flexGrow: 0.03 }}>
            <NavLink to="/" className="headerText">
              Info
            </NavLink>
          </Typography>
          <Typography variant="h5" component="div" sx={{ flexGrow: 0.03 }}>
            <NavLink to="/control" className="headerText">
              Control
            </NavLink>
          </Typography>
        </Toolbar>
      </AppBar>
    </>
  );
}

export default Header;

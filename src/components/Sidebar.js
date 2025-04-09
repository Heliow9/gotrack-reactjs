import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Box,
  Collapse,
} from "@mui/material";
import {
  FaHome,
  FaClipboardList,
  FaMotorcycle,
  FaCog,
  FaListUl,
  FaBars,
} from "react-icons/fa";

import PedidosEmAndamento from "./PedidosEmAndamento";

const Sidebar = () => {
  const [mostrarPedidos, setMostrarPedidos] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Oculta menu após 10s ao chegar no dashboard
    if (location.pathname === "/") {
      const timer = setTimeout(() => {
        setMostrarPedidos(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 370,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 370,
          boxSizing: "border-box",
          padding: 2,
          backgroundColor: "#ff7b00",
        },
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-around" >
        <Typography variant="h6" sx={{ fontWeight: "bold" }} color="white">
          GoTrack
        </Typography>
        <IconButton onClick={() => setMostrarPedidos(!mostrarPedidos)}>
          {mostrarPedidos ? (
            <FaBars style={{ color: "#fff" }} />
          ) : (
            <FaListUl style={{ color: "#fff" }} />
          )}
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Collapse in={!mostrarPedidos}>
  <List>
    <ListItem button component={Link} to="/">
      <ListItemIcon>
        <FaHome style={{ color: "#fff" }} />
      </ListItemIcon>
      <ListItemText
        primary="Dashboard"
        primaryTypographyProps={{ style: { color: "#fff" } }}
      />
    </ListItem>

    <ListItem button component={Link} to="/pedidos">
      <ListItemIcon>
        <FaClipboardList style={{ color: "#fff" }} />
      </ListItemIcon>
      <ListItemText
        primary="Pedidos"
        primaryTypographyProps={{ style: { color: "#fff" } }}
      />
    </ListItem>

    <ListItem button component={Link} to="/motoristas">
      <ListItemIcon>
        <FaMotorcycle style={{ color: "#fff" }} />
      </ListItemIcon>
      <ListItemText
        primary="Motoristas"
        primaryTypographyProps={{ style: { color: "#fff" } }}
      />
    </ListItem>

    <ListItem button component={Link} to="/configuracoes">
      <ListItemIcon>
        <FaCog style={{ color: "#fff" }} />
      </ListItemIcon>
      <ListItemText
        primary="Configurações"
        primaryTypographyProps={{ style: { color: "#fff" } }}
      />
    </ListItem>
  </List>
</Collapse>


      <Collapse in={mostrarPedidos}>
        <PedidosEmAndamento />
      </Collapse>
    </Drawer>
  );
};

export default Sidebar;

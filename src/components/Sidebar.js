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
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (location.pathname === "/") {
      const timer = setTimeout(() => {
        setMostrarPedidos(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const drawerContent = (
    <Box sx={{ padding: 2, backgroundColor: "#ff7b00", height: "100%" }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
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

      <Divider sx={{ mb: 2, borderColor: "#fff" }} />

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
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <>
          <IconButton
            color="inherit"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ position: "absolute", top: 16, left: 16, zIndex: 1300 }}
          >
            <FaBars />
          </IconButton>

          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              [`& .MuiDrawer-paper`]: {
                width: 260,
                backgroundColor: "#ff7b00",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        </>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: 300,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 300,
              boxSizing: "border-box",
              backgroundColor: "#ff7b00",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;

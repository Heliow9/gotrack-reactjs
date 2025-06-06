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
  Tooltip,
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
      const timer = setTimeout(() => setMostrarPedidos(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const primaryColor = "#d90429"; // vermelho da logo
  const secondaryColor = "#2e2e2e"; // cinza escuro neutro
  const hoverColor = "#fae3e3"; // hover suave
  const activeBg = primaryColor;
  const activeText = "#fff";
  const white = "#fff";


  const menuItems = [
    { text: "Dashboard", icon: <FaHome />, path: "/" },
    { text: "Pedidos", icon: <FaClipboardList />, path: "/pedidos" },
    { text: "Motoristas", icon: <FaMotorcycle />, path: "/motoristas" },
    { text: "Configurações", icon: <FaCog />, path: "/configuracoes" },
    { text: "Produtos", icon: <FaListUl />, path: "/produtos" },
  ];

  const drawerContent = (
    <Box sx={{ padding: 2, height: "100%", backgroundColor: white }}>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        px={1}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold", color: primaryColor }}>
          Rapigo
        </Typography>
        <Tooltip title="Alternar pedidos">
          <IconButton onClick={() => setMostrarPedidos(!mostrarPedidos)}>
            {mostrarPedidos ? (
              <FaBars style={{ color: primaryColor }} />
            ) : (
              <FaListUl style={{ color: primaryColor }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 2, borderColor: secondaryColor }} />

      {/* Menu Principal */}
      <Collapse in={!mostrarPedidos}>
        <List>
          {menuItems.map((item, i) => (
            <ListItem
              key={i}
              button
              component={Link}
              to={item.path}
              sx={{
                mb: 1,
                borderRadius: 1,
                backgroundColor:
                  location.pathname === item.path ? activeBg : "transparent",
                color: location.pathname === item.path ? activeText : secondaryColor,
                "&:hover": {
                  backgroundColor: hoverColor,
                  color: primaryColor,
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: "0.95rem",
                }}
              />
            </ListItem>

          ))}
        </List>
      </Collapse>

      {/* Pedidos em Andamento */}
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
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1300,
              color: primaryColor,
            }}
          >
            <FaBars />
          </IconButton>

          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              [`& .MuiDrawer-paper`]: {
                width: 260,
                backgroundColor: white,
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
            width: 280,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 280,
              boxSizing: "border-box",
              backgroundColor: white,
              borderRight: `2px solid ${secondaryColor}`,
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

// src/navigation/AppNavigator.js
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import MesasScreen from "../screens/MesasScreen";
import PedidosScreen from "../screens/PedidosScreen";
import BalcaoScreen from "../screens/BalcaoScreen";
import ComandaScreen from "../screens/ComandaScreen";
import MeuPerfilScreen from "../screens/MeuPerfilScreen";

import { clearSession, getSession } from "../api/storage/session";
import { authEvents } from "../api/api";

const Stack = createNativeStackNavigator();

function isSessionUsable(session) {
  const token = String(session?.token || "").trim();
  const restId = session?.restaurante?._id || session?.restaurante?.id;
  const garcomId = session?.garcom?._id || session?.garcom?.id;
  return !!token && !!restId && !!garcomId;
}

function Splash() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff7ed" }}>
      <ActivityIndicator size="large" color="#ff3b8a" />
    </View>
  );
}

export default function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const refreshAuth = useCallback(async () => {
    try {
      const session = await getSession();
      setIsAuth(isSessionUsable(session));
    } catch {
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    const off = authEvents.on(async (ev) => {
      if (ev?.type === "AUTH_LOGIN") {
        setIsAuth(true);
        return;
      }

      if (ev?.type === "AUTH_LOGOUT") {
        await clearSession();
        setIsAuth(false);
        return;
      }

      if (ev?.type === "AUTH_LOGOUT_REQUIRED") {
        // Só derruba sessão em casos definitivos: token realmente inválido/expirado
        // ou garçom desativado. 401/403 genérico não entra aqui.
        await clearSession();
        setIsAuth(false);
      }
    });
    return off;
  }, []);

  if (loading) return <Splash />;

  if (!isAuth) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login">
          {(props) => (
            <LoginScreen
              {...props}
              onLogged={() => {
                setIsAuth(true);
                authEvents.emit({ type: "AUTH_LOGIN" });
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home">
        {(props) => (
          <HomeScreen
            {...props}
            onLogout={async () => {
              await clearSession();
              setIsAuth(false);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Mesas" component={MesasScreen} />
      <Stack.Screen name="Pedidos" component={PedidosScreen} />
      <Stack.Screen name="Balcao" component={BalcaoScreen} />
      <Stack.Screen name="Comanda" component={ComandaScreen} />
      <Stack.Screen name="MeuPerfil">
        {(props) => (
          <MeuPerfilScreen
            {...props}
            onLogout={async () => {
              await clearSession();
              setIsAuth(false);
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

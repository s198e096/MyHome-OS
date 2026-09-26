import { Tabs } from "expo-router";
import { Home, Wrench, CalendarCheck, Banknote, FileText, User } from "lucide-react-native";
import { PRIMARY } from "../../lib/constants.js";
import { AppDataProvider, useAppData } from "../../lib/app-data-context.js";

function TabsNavigator() {
  const { dataLoaded } = useAppData();
  if (!dataLoaded) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: "#9C978C",
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="systems" options={{ title: "Systems", tabBarIcon: ({ color, size }) => <Wrench size={size} color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks", tabBarIcon: ({ color, size }) => <CalendarCheck size={size} color={color} /> }} />
      <Tabs.Screen name="costs" options={{ title: "Costs", tabBarIcon: ({ color, size }) => <Banknote size={size} color={color} /> }} />
      <Tabs.Screen name="docs" options={{ title: "Docs", tabBarIcon: ({ color, size }) => <FileText size={size} color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
      <Tabs.Screen name="furniture" options={{ href: null }} />
      <Tabs.Screen name="energy-audit" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  return (
    <AppDataProvider>
      <TabsNavigator />
    </AppDataProvider>
  );
}

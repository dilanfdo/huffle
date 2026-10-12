import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HistoryScreen } from '../../screens/history/HistoryScreen';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { SettingsScreen } from '../../screens/settings/SettingsScreen';
import { colors } from '../../theme/colors';
import type { MainTabParamList } from './types';

const Tabs = createBottomTabNavigator<MainTabParamList>();

// The default tab icon is a glyph Android's system font lacks (renders as a box).
function tabIcon(glyph: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{glyph}</Text>
  );
}

export function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: 'Home', tabBarIcon: tabIcon('🏠') }} />
      <Tabs.Screen name="History" component={HistoryScreen} options={{ title: 'History', tabBarIcon: tabIcon('📅') }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', tabBarIcon: tabIcon('⚙️') }} />
    </Tabs.Navigator>
  );
}

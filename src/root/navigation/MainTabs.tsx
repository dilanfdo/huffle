import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HistoryScreen } from '../../screens/history/HistoryScreen';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { SettingsScreen } from '../../screens/settings/SettingsScreen';
import { Icon } from '../../components/icons/Icon';
import type { IconName } from '../../components/icons/paths';
import { colors } from '../../theme/colors';
import type { MainTabParamList } from './types';

const Tabs = createBottomTabNavigator<MainTabParamList>();

function tabIcon(name: IconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Icon name={name} size={25} color={color} strokeWidth={focused ? 2.3 : 1.9} />
  );
}

export function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="History" component={HistoryScreen} options={{ title: 'History', tabBarIcon: tabIcon('calendar') }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', tabBarIcon: tabIcon('sliders') }} />
    </Tabs.Navigator>
  );
}

import { SectionList, StyleSheet, Text, View } from 'react-native';
import { Page } from '../../components/Page';
import { formatHistoryDayLabel, toLocalDateString } from '../../domain';
import { useSessionStore } from '../../store';
import { Icon } from '../../components/icons/Icon';
import { habitIconName } from '../../components/icons/habitIcons';
import { colors } from '../../theme/colors';

export function HistoryScreen() {
  const sessions = useSessionStore((s) => s.sessions);
  const habitTypes = useSessionStore((s) => s.habitTypes);

  const sections = groupByDay(sessions, habitTypes);

  return (
    <Page style={styles.safe} edges={['top']}>
      <Text style={styles.title}>History</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Your first session is already a start. More will land here.</Text>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.section}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.iconBadge}>
              {habitIconName(item.label) ? (
                <Icon
                  name={habitIconName(item.label) as NonNullable<ReturnType<typeof habitIconName>>}
                  size={22}
                  color={colors.accentDark}
                />
              ) : (
                <Text style={styles.icon}>{item.icon}</Text>
              )}
            </View>
            <View style={styles.body}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.meta}>
                {item.durationMinutes !== null ? `${item.durationMinutes} min · ` : ''}
                {item.xpAwarded > 0 ? `+${item.xpAwarded} XP` : 'Glow was full'}
                {item.note ? ` · ${item.note}` : ''}
              </Text>
            </View>
          </View>
        )}
      />
    </Page>
  );
}

function groupByDay(
  sessions: ReturnType<typeof useSessionStore.getState>['sessions'],
  habitTypes: ReturnType<typeof useSessionStore.getState>['habitTypes'],
) {
  const byDay = new Map<string, typeof sessions>();
  for (const session of sessions) {
    const day = toLocalDateString(new Date(session.completedAt));
    const list = byDay.get(day) ?? [];
    list.push(session);
    byDay.set(day, list);
  }

  return [...byDay.entries()].map(([day, items]) => ({
    title: formatHistoryDayLabel(day),
    data: items.map((session) => {
      const type = habitTypes.find((habit) => habit.id === session.habitTypeId);
      return {
        id: session.id,
        icon: type?.icon ?? '✨',
        label: type?.label ?? 'Session',
        durationMinutes: session.durationMinutes,
        xpAwarded: session.xpAwarded,
        note: session.note,
      };
    }),
  }));
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  empty: {
    marginTop: 24,
    fontSize: 16,
    lineHeight: 23,
    color: colors.inkMuted,
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.inkMuted,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: colors.bg,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 8,
  },
  icon: {
    fontSize: 22,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    color: colors.inkMuted,
  },
});

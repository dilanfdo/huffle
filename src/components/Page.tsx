import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

/** Widest the content grows on tablets, foldables and landscape; the background still fills the screen. */
export const MAX_CONTENT_WIDTH = 640;

type Props = {
  children: ReactNode;
  /** Vertical insets to respect; left and right are always respected (landscape cutouts, nav bar). */
  edges?: readonly Edge[];
  /** Wrap the content in a vertical scroll for screens that are not scrollable already. */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Screen frame that keeps phone layouts unchanged, centres them in a readable column on wide screens,
 * and (with `scroll`) lets fixed layouts scroll instead of clipping when the window is short.
 */
export function Page({ children, edges = ['top', 'bottom'], scroll = false, style }: Props) {
  const allEdges = Array.from(new Set<Edge>([...edges, 'left', 'right']));
  return (
    <SafeAreaView style={[styles.safe, style]} edges={allEdges}>
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.column}>{children}</View>
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <View style={styles.fixedColumn}>{children}</View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  fill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  // Inside the scroll view the column may grow taller than the window.
  column: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  // Otherwise it must stay exactly as tall as the window so pinned footers stay on screen.
  fixedColumn: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
});

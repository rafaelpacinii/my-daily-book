import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  type RefreshControlProps,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/src/presentation';
import { EmptyState, type EmptyStateProps } from '@/src/components/feedback/EmptyState';
import { ErrorState, type ErrorStateProps } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';

export interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  padded?: boolean;
  keyboardAvoiding?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  error?: ErrorStateProps | null;
  empty?: EmptyStateProps | null;
  header?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
  style?: ViewStyle;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  keyboardAvoiding = false,
  loading = false,
  loadingMessage,
  error,
  empty,
  header,
  refreshControl,
  style,
}: ScreenProps) {
  const { theme } = useAppTheme();
  const content = (
    <View
      style={[
        styles.content,
        {
          gap: theme.spacing.xl,
          paddingHorizontal: padded ? theme.spacing.lg : 0,
          paddingVertical: padded ? theme.spacing.lg : 0,
        },
        style,
      ]}>
      {header}
      {loading ? (
        <LoadingState message={loadingMessage} />
      ) : error ? (
        <ErrorState {...error} />
      ) : empty ? (
        <EmptyState {...empty} />
      ) : (
        children
      )}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}>
      {content}
    </ScrollView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safeArea}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
});

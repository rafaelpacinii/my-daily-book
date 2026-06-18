import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/src/presentation';
import { AppText } from '@/src/components/ui/AppText';

export interface AppLogoProps {
  size?: number;
  showWordmark?: boolean;
}

export function AppLogo({ size = 88, showWordmark = false }: AppLogoProps) {
  const { theme } = useAppTheme();
  const [failed, setFailed] = useState(false);

  return (
    <View style={styles.container} accessibilityRole="image" accessibilityLabel="My Daily Book">
      {failed ? (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: theme.radii.xl,
              backgroundColor: theme.colors.primary,
            },
          ]}>
          <AppText variant="heading2" color="textInverse">
            MDB
          </AppText>
        </View>
      ) : (
        <Image
          source={require('@/assets/images/logo.png')}
          resizeMode="contain"
          onError={() => setFailed(true)}
          style={{ width: size, height: size }}
        />
      )}
      {showWordmark ? (
        <AppText variant="heading3" color="textPrimary">
          My Daily Book
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});


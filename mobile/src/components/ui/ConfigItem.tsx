// =============================================================================
// ConfigItem.tsx — Item de lista de configuración con switch o navegación.
// =============================================================================

import { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { Text } from 'tamagui';
import * as Haptics from 'expo-haptics';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  switchValue?: boolean;
  onSwitch?: (v: boolean) => void;
  onPress?: () => void;
  right?: ReactNode;
}

export function ConfigItem({ icon: Icon, title, description, switchValue, onSwitch, onPress, right }: Props) {
  const hasSwitch = typeof switchValue === 'boolean';
  return (
    <Pressable
      onPress={onPress ?? (() => hasSwitch && onSwitch?.(!switchValue))}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}
    >
      {Icon && (
        <View style={s.iconWrap}>
          <Icon color="#00932C" size={20} strokeWidth={2.2} />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: Icon ? 14 : 0 }}>
        <Text fontFamily="$body" fontSize={14.5} fontWeight="700" color="$color">
          {title}
        </Text>
        {description && (
          <Text fontFamily="$body" fontSize={12} color="$colorMuted" fontWeight="600" marginTop={2}>
            {description}
          </Text>
        )}
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={(v) => {
            Haptics.selectionAsync();
            onSwitch?.(v);
          }}
          trackColor={{ false: '#E5E7E6', true: '#CCE9D5' }}
          thumbColor={switchValue ? '#00932C' : '#FFFFFF'}
        />
      ) : right ? (
        right
      ) : (
        <ChevronRight color="#A8B0AB" size={18} strokeWidth={2.2} />
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF0EF',
    marginBottom: 8,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

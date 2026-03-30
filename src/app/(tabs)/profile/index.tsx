import { View, Text } from 'react-native';

// Phase 2+: Profile with auth-guard, settings, language toggle
export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0d0c0b', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#b8966a', fontFamily: 'Cairo', fontSize: 20 }}>Profile</Text>
    </View>
  );
}

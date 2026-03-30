import { View, Text } from 'react-native';

// Phase 7: In-app notification feed [auth-guard]
export default function NotificationsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0d0c0b', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#b8966a', fontFamily: 'Cairo', fontSize: 20 }}>Notifications</Text>
    </View>
  );
}

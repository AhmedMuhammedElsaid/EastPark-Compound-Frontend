import { View, Text } from 'react-native';

// Phase 2: Login screen with email + password
export default function LoginScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0d0c0b', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#b8966a', fontFamily: 'Cairo', fontSize: 20 }}>Sign In</Text>
    </View>
  );
}

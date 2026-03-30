import { Redirect } from 'expo-router';

export default function OldLoginRedirect() {
  return <Redirect href="/(auth)/login" />;
}

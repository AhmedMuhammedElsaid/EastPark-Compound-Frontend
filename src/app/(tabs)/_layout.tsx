import { Tabs } from 'expo-router';
import * as React from 'react';

// Phosphor Icons — RTL-friendly
// TODO Phase 2: Add proper Phosphor icon imports
// import { House, CompassTool, ShoppingCart, Users, User } from 'phosphor-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#221f1c', // dark-card
          borderTopColor: '#3d3830',  // dark-border
        },
        tabBarActiveTintColor: '#b8966a',   // gold-500
        tabBarInactiveTintColor: '#a89880', // dark-muted
        tabBarLabelStyle: {
          fontFamily: 'Cairo',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // tabBarIcon: ({ color }) => <House color={color} size={24} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Directory',
          // tabBarIcon: ({ color }) => <CompassTool color={color} size={24} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          // tabBarIcon: ({ color }) => <ShoppingCart color={color} size={24} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          // tabBarIcon: ({ color }) => <Users color={color} size={24} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // tabBarIcon: ({ color }) => <User color={color} size={24} weight="fill" />,
        }}
      />
    </Tabs>
  );
}

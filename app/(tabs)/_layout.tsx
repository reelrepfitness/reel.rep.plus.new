import React from 'react';
import { Platform, DynamicColorIOS } from 'react-native';
import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { Home, PlusCircle, User } from 'lucide-react-native';

export default function TabLayout() {
  const tintColor = Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: 'white', light: 'black' })
    : '#0088FF';

  const labelColor = Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: 'white', light: 'black' })
    : undefined;

  return (
    <NativeTabs
      tintColor={tintColor}
      labelStyle={{ color: labelColor }}
    >
      <NativeTabs.Trigger name="profile">
        <Icon 
          src={
            <User 
              size={24} 
              color={tintColor as any}
              strokeWidth={2.5}
            />
          }
        />
        <Label>פרופיל</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="add">
        <Icon 
          src={
            <PlusCircle 
              size={24} 
              color={tintColor as any}
              strokeWidth={2.5}
            />
          }
        />
        <Label>הוסף</Label>
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="home">
        <Icon 
          src={
            <Home 
              size={24} 
              color={tintColor as any}
              strokeWidth={2.5}
            />
          }
        />
        <Label>ראשי</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

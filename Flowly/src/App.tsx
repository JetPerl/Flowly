import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import MainScreen from './MainScreen';
import AllAccountsScreen from './AllAccountsScreen';
import ProfileScreen from './ProfileScreen';
import CurrencyListScreen from './CurrencyListScreen';
import { MainCurrencyProvider } from './currency/CurrencyContext';
import { AvatarProvider } from './avatar/AvatarContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AvatarProvider>
        <MainCurrencyProvider>
          <BottomSheetModalProvider>
            <NavigationContainer>
              <Stack.Navigator
                id="root-stack"
                screenOptions={{
                  gestureEnabled: true,
                  gestureDirection: 'horizontal-inverted',
                  cardStyle: {
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    shadowOffset: { width: 4, height: 0 },
                  },
                  headerShown: false,
                  cardStyleInterpolator: ({ current, layouts }) => {
                    return {
                      cardStyle: {
                        transform: [
                          {
                            translateX: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-layouts.screen.width, 0], // ← движение с левой стороны
                            }),
                          },
                        ],
                      },
                    };
                  },
                }}
              >
                <Stack.Screen name="Main" component={MainScreen} />
                <Stack.Screen
                  name="AllAccounts"
                  component={AllAccountsScreen}
                  options={{
                    gestureDirection: 'horizontal',
                    cardStyleInterpolator: ({ current, layouts }) => ({
                      cardStyle: {
                        transform: [
                          {
                            translateX: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [layouts.screen.width, 0], // движение справа
                            }),
                          },
                        ],
                      },
                    }),
                  }}
                />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="CurrencyList" component={CurrencyListScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </BottomSheetModalProvider>
        </MainCurrencyProvider>
      </AvatarProvider>
    </SafeAreaProvider>
  );
}

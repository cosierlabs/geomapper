import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';


const SSTMap = () => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const pulsatingCircleAnimation = new Animated.Value(0);

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    };

    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulsatingCircleAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulsatingCircleAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          
        ])
      ).start();
    }
  }, [userLocation, pulsatingCircleAnimation]);

  return (
    <View className="flex-1 bg-white">
      <Text style={styles.header}>Sea Surface Temperature Map</Text>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          mapType="hybrid"  
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Your Location"
              description="This is your current location"
            >
              <Animated.View
                style={[
                  styles.pulsatingCircle,
                  {
                    opacity: pulsatingCircleAnimation,
                    transform: [
                      {
                        scale: pulsatingCircleAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 2],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </Marker>
          )}
        </MapView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  pulsatingCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 255, 0.5)',
  },
});

export default SSTMap;

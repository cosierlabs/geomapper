import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import base64 from 'react-native-base64';

const manager = new BleManager();

interface ChartDataPoint {
  x: number;
  y: number;
}

const BluetoothDataDisplay: React.FC = () => {
  const [angle, setAngle] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        scanAndConnect();
      }
    }, true);

    return () => subscription.remove();
  }, []);

  const scanAndConnect = () => {
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
        return;
      }

      if (device && device.name === 'HC-05') {
        manager.stopDeviceScan();
        connectToDevice(device);
      }
    });
  };

  const connectToDevice = (device: Device) => {
    device.connect()
      .then((connectedDevice) => connectedDevice.discoverAllServicesAndCharacteristics())
      .then((connectedDevice) => {
        connectedDevice.monitorCharacteristicForService(
          'SERVICE_UUID',
          'CHARACTERISTIC_UUID',
          (error, characteristic) => {
            if (error) {
              console.log(error);
              return;
            }
            if (characteristic && characteristic.value) {
              const decodedValue = base64.decode(characteristic.value);
              const [newAngle, newDistance] = decodedValue.split(',');
              const parsedAngle = parseInt(newAngle, 10);
              const parsedDistance = parseInt(newDistance, 10);
              if (!isNaN(parsedAngle) && !isNaN(parsedDistance)) {
                setAngle(parsedAngle);
                setDistance(parsedDistance);
                updateChartData(parsedAngle, parsedDistance);
              }
            }
          }
        );
      })
      .catch((error) => console.log(error));
  };

  const updateChartData = (newAngle: number, newDistance: number) => {
    setChartData(prevData => {
      const newData = [...prevData, { x: newAngle, y: newDistance }];
      if (newData.length > 50) newData.shift();
      return newData;
    });
  };

  const chartDataFormatted = {
    labels: chartData.map(point => point.x.toString()),
    datasets: [
      {
        data: chartData.map(point => point.y),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Angle: {angle}°</Text>
      <Text style={styles.text}>Distance: {distance} cm</Text>
      <LineChart
        data={chartDataFormatted}
        width={300}
        height={200}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16
          }
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  }
});

export default BluetoothDataDisplay;
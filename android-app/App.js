import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/FontAwesome';

// Enable playback in silence mode
Sound.setCategory('Playback');

const { width, height } = Dimensions.get('window');

// Utility functions
const formatTimeDifference = (start, end) => {
  const diff = Math.floor((end - start) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const formatDateTime = date => date.toLocaleString();

const getInitialValues = async () => {
  try {
    const savedShowerDuration = await AsyncStorage.getItem('showerDuration');
    const savedAudioSelect = await AsyncStorage.getItem('audioSelect');

    return {
      showerDuration: savedShowerDuration ? parseFloat(savedShowerDuration) : 10,
      audioSelect: savedAudioSelect || 'bell',
    };
  } catch (error) {
    return {
      showerDuration: 10,
      audioSelect: 'bell',
    };
  }
};

const getInitialHistory = async () => {
  try {
    const savedHistory = await AsyncStorage.getItem('showerHistory');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory).map(item => ({
        ...item,
        startTime: new Date(item.startTime),
        endTime: new Date(item.endTime),
      }));
      return parsed;
    }
  } catch (error) {
    console.log('Error loading history:', error);
  }
  return [];
};

const App = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [name, setName] = useState('');
  const [showerDuration, setShowerDuration] = useState(10);
  const [audioSelect, setAudioSelect] = useState('bell');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showerHistory, setShowerHistory] = useState([]);
  const [lastShowerEndTime, setLastShowerEndTime] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const timerRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const timerCompletedRef = useRef(false);
  const audioFiles = useRef({});

  // Initialize audio files
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioFiles.current = {
          bell: new Sound('bell.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) console.log('Failed to load bell sound:', error);
          }),
          buzzer: new Sound('buzzer.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) console.log('Failed to load buzzer sound:', error);
          }),
          chime: new Sound('chime.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) console.log('Failed to load chime sound:', error);
          }),
        };
      } catch (error) {
        console.log('Error initializing audio:', error);
      }
    };

    initAudio();
    return () => {
      Object.values(audioFiles.current).forEach(audio => {
        if (audio) audio.release();
      });
    };
  }, []);

  // Load initial values
  useEffect(() => {
    const loadInitialValues = async () => {
      const values = await getInitialValues();
      setShowerDuration(values.showerDuration);
      setAudioSelect(values.audioSelect);
      
      const history = await getInitialHistory();
      setShowerHistory(history);
    };

    loadInitialValues();
  }, []);

  // Save history to AsyncStorage
  useEffect(() => {
    const saveHistory = async () => {
      try {
        await AsyncStorage.setItem('showerHistory', JSON.stringify(showerHistory));
      } catch (error) {
        console.log('Error saving history:', error);
      }
    };

    if (showerHistory.length > 0) {
      saveHistory();
    }
  }, [showerHistory]);

  // Save settings to AsyncStorage
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('showerDuration', showerDuration.toString());
        await AsyncStorage.setItem('audioSelect', audioSelect);
      } catch (error) {
        console.log('Error saving settings:', error);
      }
    };

    saveSettings();
  }, [showerDuration, audioSelect]);

  const updateTimerDisplay = () => {
    if (!timeLeft) {
      if (isRunning) {
        return '00:00';
      }
      if (showerDuration < 1) {
        const seconds = Math.ceil(showerDuration * 60);
        return `00:${seconds.toString().padStart(2, '0')}`;
      } else {
        const minutes = showerDuration;
        const seconds = 0;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    if (timeLeft < 60) {
      return `00:${timeLeft.toString().padStart(2, '0')}`;
    } else {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const stopAllAudio = useCallback(() => {
    Object.values(audioFiles.current).forEach(audio => {
      if (audio) {
        audio.stop();
      }
    });
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  }, []);

  const playAlertSound = useCallback(() => {
    try {
      stopAllAudio();
      const audio = audioFiles.current[audioSelect];
      if (audio) {
        audio.play((success) => {
          if (!success) console.log('Failed to play sound');
        });
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }, [audioSelect, stopAllAudio]);

  const startAlarm = useCallback(() => {
    playAlertSound();
    alarmIntervalRef.current = setInterval(playAlertSound, 2000);
  }, [playAlertSound]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    stopAllAudio();
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
    setName('');
    setStartTime(null);
    timerCompletedRef.current = false;
  }, [stopAllAudio]);

  const startTimer = useCallback(() => {
    if (!isRunning && name.trim()) {
      const duration = parseFloat(showerDuration);
      const initialTime = duration < 1 ? Math.ceil(duration * 60) : duration * 60;
      setTimeLeft(initialTime);
      setIsRunning(true);
      setIsPaused(false);
      setStartTime(new Date());
      timerCompletedRef.current = false;
    }
  }, [isRunning, name, showerDuration]);

  const pauseTimer = useCallback(() => {
    if (isRunning && !isPaused) {
      clearInterval(timerRef.current);
      setIsPaused(true);
    } else if (isRunning && isPaused) {
      setIsPaused(false);
    }
  }, [isRunning, isPaused]);

  const stopEarly = useCallback(() => {
    clearInterval(timerRef.current);
    const endTime = new Date();
    const actualStartTime = new Date(endTime - (parseFloat(showerDuration) * 60 - timeLeft) * 1000);
    const timeSinceLastShower = lastShowerEndTime
      ? formatTimeDifference(lastShowerEndTime, actualStartTime)
      : 'First shower';

    const newRecord = {
      name: name,
      startTime: actualStartTime,
      endTime: endTime,
      duration: formatTimeDifference(actualStartTime, endTime),
      timeSinceLastShower: timeSinceLastShower,
      completed: false,
    };

    setShowerHistory(prev => [newRecord, ...prev]);
    setLastShowerEndTime(endTime);
    resetTimer();
  }, [timeLeft, showerDuration, name, lastShowerEndTime, resetTimer]);

  const clearHistory = useCallback(() => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all shower history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setShowerHistory([]);
            AsyncStorage.removeItem('showerHistory');
          },
        },
      ]
    );
  }, []);

  const testSound = useCallback(() => {
    playAlertSound();
  }, [playAlertSound]);

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (!timerCompletedRef.current) {
              timerCompletedRef.current = true;
              startAlarm();
              const endTime = new Date();
              const timeSinceLastShower = lastShowerEndTime
                ? formatTimeDifference(lastShowerEndTime, startTime)
                : 'First shower';

              const newRecord = {
                name: name,
                startTime: startTime,
                endTime: endTime,
                duration: formatTimeDifference(startTime, endTime),
                timeSinceLastShower: timeSinceLastShower,
                completed: true,
              };

              setShowerHistory(prev => [newRecord, ...prev]);
              setLastShowerEndTime(endTime);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft, startAlarm, name, startTime, lastShowerEndTime]);

  const handleNameChange = (text) => setName(text);
  const handleShowerDurationChange = (value) => setShowerDuration(parseFloat(value));
  const handleAudioSelectChange = (value) => setAudioSelect(value);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Top Right Icons */}
      <View style={styles.topRightIcons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowHistory(true)}
          accessibilityLabel="Show History"
        >
          <Icon name="history" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowSettings(true)}
          accessibilityLabel="Show Settings"
        >
          <Icon name="cog" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Name Input */}
        <TextInput
          style={[
            styles.nameInput,
            !name.trim() && isRunning && styles.nameInputError
          ]}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Enter Name"
          placeholderTextColor="#6c757d"
          editable={!isRunning}
          maxLength={50}
        />

        {/* Timer Display */}
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>{updateTimerDisplay()}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {!isRunning || timeLeft > 0 ? (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.startButton]}
                onPress={startTimer}
                disabled={isRunning}
              >
                <Icon name="play" size={32} color="white" />
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.pauseButton]}
                onPress={pauseTimer}
                disabled={!isRunning}
              >
                <Icon name={isPaused ? "play" : "pause"} size={32} color="white" />
                <Text style={styles.buttonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.resetButton]}
                onPress={resetTimer}
                disabled={!isRunning}
              >
                <Icon name="redo" size={32} color="white" />
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={stopEarly}
                disabled={!isRunning}
              >
                <Icon name="stop-circle" size={32} color="white" />
                <Text style={styles.buttonText}>End</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={resetTimer}
            >
              <Icon name="stop" size={32} color="white" />
              <Text style={styles.buttonText}>Stop Alarm</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Timer Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Icon name="times" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Shower Duration</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView>
                    {[0.083, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((duration) => (
                      <TouchableOpacity
                        key={duration}
                        style={[
                          styles.pickerOption,
                          showerDuration === duration && styles.pickerOptionSelected
                        ]}
                        onPress={() => handleShowerDurationChange(duration)}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          showerDuration === duration && styles.pickerOptionTextSelected
                        ]}>
                          {duration === 0.083 ? '5 seconds' : `${duration} minutes`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Alert Sound</Text>
                <View style={styles.pickerContainer}>
                  <ScrollView>
                    {['bell', 'buzzer', 'chime'].map((sound) => (
                      <TouchableOpacity
                        key={sound}
                        style={[
                          styles.pickerOption,
                          audioSelect === sound && styles.pickerOptionSelected
                        ]}
                        onPress={() => handleAudioSelectChange(sound)}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          audioSelect === sound && styles.pickerOptionTextSelected
                        ]}>
                          {sound.charAt(0).toUpperCase() + sound.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <TouchableOpacity style={styles.testButton} onPress={testSound}>
                  <Icon name="volume-up" size={16} color="white" />
                  <Text style={styles.testButtonText}>Test Sound</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.historyModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shower History</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Icon name="times" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {showerHistory.length === 0 ? (
                <Text style={styles.noHistoryText}>No shower history yet</Text>
              ) : (
                showerHistory.map((record, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyName}>{record.name}</Text>
                    <Text style={styles.historyTime}>
                      {formatDateTime(record.startTime)} - {formatDateTime(record.endTime)}
                    </Text>
                    <Text style={styles.historyDuration}>
                      Duration: {record.duration}
                      {record.completed ? '' : ' (Early)'}
                    </Text>
                    <Text style={styles.historySince}>
                      Time since last: {record.timeSinceLastShower}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={clearHistory}
              >
                <Icon name="trash" size={16} color="white" />
                <Text style={styles.modalButtonText}>Clear History</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowHistory(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 20,
  },
  topRightIcons: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 110, 253, 0.9)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  iconButton: {
    marginHorizontal: 8,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  nameInput: {
    fontSize: 32,
    padding: 16,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 12,
    backgroundColor: 'white',
    textAlign: 'center',
    marginBottom: 20,
    minHeight: 60,
  },
  nameInputError: {
    borderColor: '#dc3545',
  },
  timerDisplay: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: 'center',
  },
  timerText: {
    fontFamily: 'monospace',
    fontSize: 64,
    color: '#00ff00',
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 20,
  },
  controlButton: {
    width: 140,
    height: 140,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: '#0d6efd',
  },
  pauseButton: {
    backgroundColor: '#ffc107',
  },
  resetButton: {
    backgroundColor: '#dc3545',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  historyModal: {
    maxWidth: 800,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalBody: {
    padding: 20,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#212529',
  },
  pickerContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  pickerOptionSelected: {
    backgroundColor: '#0d6efd',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#212529',
  },
  pickerOptionTextSelected: {
    color: 'white',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  historyItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  historyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  historyDuration: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 4,
  },
  historySince: {
    fontSize: 14,
    color: '#6c757d',
  },
  noHistoryText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
    fontStyle: 'italic',
  },
});

export default App; 
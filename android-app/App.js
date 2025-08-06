import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

// const { width, height } = Dimensions.get('window'); // Not currently used

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

const formatDateTime = (date) => date.toLocaleString();

const getInitialValues = async () => {
  try {
    const savedShowerDuration = await AsyncStorage.getItem('showerDuration');
    const savedAudioSelect = await AsyncStorage.getItem('audioSelect');
    const savedClockBackground = await AsyncStorage.getItem('clockBackground');
    const savedClockDigitColor = await AsyncStorage.getItem('clockDigitColor');
    const savedClockColorScheme = await AsyncStorage.getItem(
      'clockColorScheme'
    );
    const savedClockFont = await AsyncStorage.getItem('clockFont');
    const savedWarningPercentage = await AsyncStorage.getItem(
      'warningPercentage'
    );
    const savedWarningSound = await AsyncStorage.getItem('warningSound');

    return {
      showerDuration: savedShowerDuration
        ? parseFloat(savedShowerDuration)
        : 20,
      audioSelect: savedAudioSelect || 'bell',
      clockBackground: savedClockBackground || 'black',
      clockDigitColor: savedClockDigitColor || 'green',
      clockColorScheme: savedClockColorScheme || 'default',
      clockFont: savedClockFont || 'Orbitron',
      warningPercentage: savedWarningPercentage || '25',
      warningSound: savedWarningSound || 'bell',
    };
  } catch (error) {
    return {
      showerDuration: 20,
      audioSelect: 'bell',
      clockBackground: 'black',
      clockDigitColor: 'green',
      clockColorScheme: 'default',
      clockFont: 'Orbitron',
      warningPercentage: '25',
      warningSound: 'bell',
    };
  }
};

const getInitialHistory = async () => {
  try {
    const savedHistory = await AsyncStorage.getItem('showerHistory');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory).map((item) => ({
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
  const [showerDuration, setShowerDuration] = useState(20);
  const [audioSelect, setAudioSelect] = useState('bell');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showerHistory, setShowerHistory] = useState([]);
  const [lastShowerEndTime, setLastShowerEndTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [startButtonPressed, setStartButtonPressed] = useState(false);

  // Clock face customization state
  const [clockBackground, setClockBackground] = useState('black');
  const [clockDigitColor, setClockDigitColor] = useState('green');
  const [clockColorScheme, setClockColorScheme] = useState('default');
  const [clockFont, setClockFont] = useState('Orbitron');
  const [warningPercentage, setWarningPercentage] = useState('25');
  const [warningSound, setWarningSound] = useState('bell');
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  // const [shouldMarquee, setShouldMarquee] = useState(false); // Not used in Android app

  const timerRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const timerCompletedRef = useRef(false);
  const warningPlayedRef = useRef(false);
  const nameInputRef = useRef(null);
  const audioFiles = useRef({});

  // Initialize audio files
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioFiles.current = {
          bell: new Sound('bell.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
              console.log("Failed to load bell sound:", error);
            }
          }),
          buzzer: new Sound('buzzer.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
              console.log("Failed to load buzzer sound:", error);
            }
          }),
          chime: new Sound('chime.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
              console.log("Failed to load chime sound:", error);
            }
          }),
        };
      } catch (error) {
        console.log('Error initializing audio:', error);
      }
    };

    initAudio();
    return () => {
      Object.values(audioFiles.current).forEach((audio) => {
        if (audio) {
          audio.release();
        }
      });
    };
  }, []);

  // Load initial values
  useEffect(() => {
    const loadInitialValues = async () => {
      const values = await getInitialValues();
      setShowerDuration(values.showerDuration);
      setAudioSelect(values.audioSelect);
      setClockBackground(values.clockBackground);
      setClockDigitColor(values.clockDigitColor);
      setClockColorScheme(values.clockColorScheme);
      setClockFont(values.clockFont);
      setWarningPercentage(values.warningPercentage);
      setWarningSound(values.warningSound);

      const history = await getInitialHistory();
      setShowerHistory(history);
    };

    loadInitialValues();
  }, []);

  // Save history to AsyncStorage
  useEffect(() => {
    const saveHistory = async () => {
      try {
        await AsyncStorage.setItem(
          'showerHistory',
          JSON.stringify(showerHistory)
        );
      } catch (error) {
        console.log('Error saving history:', error);
      }
    };

    if (showerHistory.length > 0) {
      saveHistory();
    }
  }, [showerHistory]);

  // Initialize lastShowerEndTime from history
  useEffect(() => {
    if (showerHistory.length > 0 && !lastShowerEndTime) {
      // Set lastShowerEndTime to the most recent shower's end time
      setLastShowerEndTime(showerHistory[0].endTime);
    }
  }, [showerHistory, lastShowerEndTime]);

  // Save settings to AsyncStorage
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('showerDuration', showerDuration.toString());
        await AsyncStorage.setItem('audioSelect', audioSelect);
        await AsyncStorage.setItem('clockBackground', clockBackground);
        await AsyncStorage.setItem('clockDigitColor', clockDigitColor);
        await AsyncStorage.setItem('clockColorScheme', clockColorScheme);
        await AsyncStorage.setItem('clockFont', clockFont);
        await AsyncStorage.setItem('warningPercentage', warningPercentage);
        await AsyncStorage.setItem('warningSound', warningSound);
      } catch (error) {
        console.log('Error saving settings:', error);
      }
    };

    saveSettings();
  }, [
    showerDuration,
    audioSelect,
    clockBackground,
    clockDigitColor,
    clockColorScheme,
    clockFont,
    warningPercentage,
    warningSound,
  ]);

  const getWarningTime = useCallback(() => {
    if (warningPercentage === 'none') {
      return 0;
    }
    const percentage = parseFloat(warningPercentage) / 100;
    const totalTime =
      showerDuration < 1 ? Math.ceil(showerDuration * 60) : showerDuration * 60;
    return Math.floor(totalTime * percentage);
  }, [warningPercentage, showerDuration]);

  const shouldShowWarning = useCallback(() => {
    if (warningPercentage === 'none') {
      return false;
    }
    return isRunning && timeLeft > 0 && timeLeft <= getWarningTime();
  }, [isRunning, timeLeft, getWarningTime, warningPercentage]);

  const playWarningSound = useCallback(() => {
    try {
      const audio = audioFiles.current[warningSound];
      if (audio) {
        audio.stop();
        audio.play();
      }
    } catch (error) {
      console.log('Error playing warning sound:', error);
    }
  }, [warningSound]);

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
        return `${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`;
      }
    }

    if (timeLeft < 60) {
      return `00:${timeLeft.toString().padStart(2, '0')}`;
    } else {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    }
  };

  const stopAllAudio = useCallback(() => {
    Object.values(audioFiles.current).forEach((audio) => {
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
          if (!success) {
            console.log("Failed to play sound");
          }
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
    warningPlayedRef.current = false;
  }, [stopAllAudio]);

  // const pauseAlarm = useCallback(() => {
  //   stopAllAudio();
  //   if (isRunning) {
  //     clearInterval(timerRef.current);
  //     setIsPaused(true);
  //   }
  // }, [stopAllAudio, isRunning]); // Not used

  const startTimer = useCallback(() => {
    setStartButtonPressed(true);
    if (!isRunning && name.trim()) {
      const duration = parseFloat(showerDuration);
      const initialTime =
        duration < 1 ? Math.ceil(duration * 60) : duration * 60;
      setTimeLeft(initialTime);
      setIsRunning(true);
      setIsPaused(false);
      setStartTime(new Date());
      timerCompletedRef.current = false;
      warningPlayedRef.current = false;
    } else if (isPaused) {
      // Resume paused timer
      setIsPaused(false);
      setIsRunning(true);
    }
  }, [isRunning, isPaused, name, showerDuration]);

  const pauseTimer = useCallback(() => {
    // Always stop all audio first (alarm sounds, warning sounds, manual sounds)
    stopAllAudio();

    if (isRunning && !isPaused) {
      clearInterval(timerRef.current);
      setIsPaused(true);
    }
  }, [isRunning, isPaused, stopAllAudio]);

  const stopEarly = useCallback(() => {
    clearInterval(timerRef.current);
    const endTime = new Date();
    const actualStartTime = new Date(
      endTime - (parseFloat(showerDuration) * 60 - timeLeft) * 1000
    );
    const timeSinceLastShower = lastShowerEndTime
      ? formatTimeDifference(lastShowerEndTime, actualStartTime)
      : '-';

    const newRecord = {
      name: name,
      startTime: actualStartTime,
      endTime: endTime,
      duration: formatTimeDifference(actualStartTime, endTime),
      timeSinceLastShower: timeSinceLastShower,
      completed: false,
    };

    setShowerHistory((prev) => [newRecord, ...prev]);
    setLastShowerEndTime(endTime);
    resetTimer();
  }, [timeLeft, showerDuration, name, lastShowerEndTime, resetTimer]);

  const clearHistory = useCallback(() => {
    setShowerHistory([]);
    AsyncStorage.removeItem('showerHistory');
  }, []);

  // const testSound = useCallback(() => {
  //   playAlertSound();
  // }, [playAlertSound]); // Not used

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (!timerCompletedRef.current) {
              timerCompletedRef.current = true;
              startAlarm();
              const endTime = new Date();
              const timeSinceLastShower = lastShowerEndTime
                ? formatTimeDifference(lastShowerEndTime, startTime)
                : '-';

              const newRecord = {
                name: name,
                startTime: startTime,
                endTime: endTime,
                duration: formatTimeDifference(startTime, endTime),
                timeSinceLastShower: timeSinceLastShower,
                completed: true,
              };

              setShowerHistory((prevHistory) => [newRecord, ...prevHistory]);
              setLastShowerEndTime(endTime);
            }
            return 0;
          }

          // Check for warning
          if (prev === getWarningTime() && !warningPlayedRef.current) {
            warningPlayedRef.current = true;
            playWarningSound();
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
  }, [
    isRunning,
    isPaused,
    timeLeft,
    startAlarm,
    name,
    startTime,
    lastShowerEndTime,
    getWarningTime,
    playWarningSound,
  ]);

  const resetSettings = useCallback(async () => {
    setClockBackground('black');
    setClockDigitColor('green');
    setClockColorScheme('default');
    setClockFont('Orbitron');
    setWarningPercentage('25');
    setWarningSound('bell');
    setAudioSelect('bell');
    setShowerDuration(20);

    // Clear from AsyncStorage
    try {
      await AsyncStorage.removeItem('clockBackground');
      await AsyncStorage.removeItem('clockDigitColor');
      await AsyncStorage.removeItem('clockColorScheme');
      await AsyncStorage.removeItem('clockFont');
      await AsyncStorage.removeItem('warningPercentage');
      await AsyncStorage.removeItem('warningSound');
      await AsyncStorage.removeItem('audioSelect');
      await AsyncStorage.removeItem('showerDuration');
    } catch (error) {
      console.log('Error clearing settings:', error);
    }
  }, []);

  const getClockFaceStyles = useCallback(() => {
    const baseStyle = {
      backgroundColor:
        clockBackground === 'white'
          ? '#ffffff'
          : clockBackground === 'black'
          ? '#000000'
          : clockBackground === 'gradient1'
          ? '#667eea'
          : clockBackground === 'gradient2'
          ? '#f093fb'
          : clockBackground === 'gradient3'
          ? '#4facfe'
          : clockBackground === 'ambient'
          ? '#1a1a1a'
          : '#000000',
    };

    const digitColor =
      clockDigitColor === 'green'
        ? '#00ff00'
        : clockDigitColor === 'white'
        ? '#ffffff'
        : clockDigitColor === 'black'
        ? '#000000'
        : clockDigitColor === 'red'
        ? '#ff0000'
        : clockDigitColor === 'blue'
        ? '#0000ff'
        : clockDigitColor === 'yellow'
        ? '#ffff00'
        : clockDigitColor === 'cyan'
        ? '#00ffff'
        : clockDigitColor === 'magenta'
        ? '#ff00ff'
        : clockDigitColor === 'orange'
        ? '#ffa500'
        : clockDigitColor === 'pink'
        ? '#ffc0cb'
        : '#00ff00';

    return {
      ...baseStyle,
      color: digitColor,
    };
  }, [clockBackground, clockDigitColor]);

  const handleNameChange = (text) => setName(text);
  const handleShowerDurationChange = (value) =>
    setShowerDuration(parseFloat(value));
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
          ref={nameInputRef}
          style={[
            styles.nameInput,
            !name.trim() && startButtonPressed && styles.nameInputError,
          ]}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Enter Name"
          placeholderTextColor="#6c757d"
          editable={!isRunning}
          maxLength={50}
        />

        {/* Timer Display */}
        <View
          style={[
            styles.timerDisplay,
            getClockFaceStyles(),
            shouldShowWarning() && styles.warningActive,
          ]}
        >
          <Text
            style={[styles.timerText, { color: getClockFaceStyles().color }]}
          >
            {updateTimerDisplay()}
          </Text>
          {shouldShowWarning() && (
            <View style={styles.warningIndicator}>
              <Icon name="exclamation-triangle" size={16} color="#ffc107" />
              <Text style={styles.warningText}>Time Almost Up!</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {/* First row: Start, Pause, Reset Timer */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={startTimer}
              disabled={
                (isRunning && !isPaused) ||
                (timeLeft === 0 && !isRunning && !name.trim()) ||
                (isPaused && timeLeft === 0)
              }
            >
              <Icon name="play" size={32} color="white" />
              <Text style={styles.buttonText}>
                {isPaused && timeLeft > 0 ? 'Resume' : 'Start'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton]}
              onPress={pauseTimer}
              disabled={!isRunning}
            >
              <Icon name="pause" size={32} color="white" />
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.resetButton]}
              onPress={resetTimer}
              disabled={!isRunning || timeLeft === 0}
            >
              <Icon name="undo" size={32} color="white" />
              <Text style={styles.buttonText}>Reset Timer</Text>
            </TouchableOpacity>
          </View>

          {/* Second row: Sound Alarm, Talk, End */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.controlButton, styles.soundButton]}
              onPress={playAlertSound}
            >
              <Icon name="volume-up" size={32} color="white" />
              <Text style={styles.buttonText}>Sound Alarm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.talkButton]}
              onPress={() => Alert.alert('Talk', 'Talk feature coming soon!')}
            >
              <Icon name="microphone" size={32} color="white" />
              <Text style={styles.buttonText}>Talk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.stopButton]}
              onPress={stopEarly}
              disabled={!isRunning}
            >
              <Icon name="stop-circle" size={32} color="white" />
              <Text style={styles.buttonText}>Finished</Text>
            </TouchableOpacity>
          </View>
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
          <View style={[styles.modalContent, styles.settingsModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Icon name="times" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeSettingsTab === 'general' && styles.activeTab,
                ]}
                onPress={() => setActiveSettingsTab('general')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeSettingsTab === 'general' && styles.activeTabText,
                  ]}
                >
                  General
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeSettingsTab === 'sound' && styles.activeTab,
                ]}
                onPress={() => setActiveSettingsTab('sound')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeSettingsTab === 'sound' && styles.activeTabText,
                  ]}
                >
                  Sound
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeSettingsTab === 'appearance' && styles.activeTab,
                ]}
                onPress={() => setActiveSettingsTab('appearance')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeSettingsTab === 'appearance' && styles.activeTabText,
                  ]}
                >
                  Appearance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeSettingsTab === 'bluetooth' && styles.activeTab,
                ]}
                onPress={() => setActiveSettingsTab('bluetooth')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeSettingsTab === 'bluetooth' && styles.activeTabText,
                  ]}
                >
                  Bluetooth
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* General Tab */}
              {activeSettingsTab === 'general' && (
                <View>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Shower Name</Text>
                    <TextInput
                      style={styles.nameInputField}
                      value={name}
                      onChangeText={handleNameChange}
                      placeholder="Enter a name for this shower timer"
                      maxLength={50}
                    />
                    <Text style={styles.helperText}>
                      This name will be used to identify this shower timer in
                      the history
                    </Text>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Shower Duration</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView>
                        {[0.083, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(
                          (duration) => (
                            <TouchableOpacity
                              key={duration}
                              style={[
                                styles.pickerOption,
                                showerDuration === duration &&
                                  styles.pickerOptionSelected,
                              ]}
                              onPress={() =>
                                handleShowerDurationChange(duration)
                              }
                            >
                              <Text
                                style={[
                                  styles.pickerOptionText,
                                  showerDuration === duration &&
                                    styles.pickerOptionTextSelected,
                                ]}
                              >
                                {duration === 0.083
                                  ? '5 seconds'
                                  : duration === 20
                                  ? `${duration} minutes (Default)`
                                  : `${duration} minutes`}
                              </Text>
                            </TouchableOpacity>
                          )
                        )}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Warning Duration</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView>
                        {['25', '50', '75', 'none'].map((percentage) => (
                          <TouchableOpacity
                            key={percentage}
                            style={[
                              styles.pickerOption,
                              warningPercentage === percentage &&
                                styles.pickerOptionSelected,
                            ]}
                            onPress={() => setWarningPercentage(percentage)}
                          >
                            <Text
                              style={[
                                styles.pickerOptionText,
                                warningPercentage === percentage &&
                                  styles.pickerOptionTextSelected,
                              ]}
                            >
                              {percentage === 'none'
                                ? 'None'
                                : percentage === '25'
                                ? `${percentage}% (Default)`
                                : `${percentage}%`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              )}

              {/* Sound Tab */}
              {activeSettingsTab === 'sound' && (
                <View>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Alarm Sound</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView>
                        {['bell', 'buzzer', 'chime'].map((sound) => (
                          <TouchableOpacity
                            key={sound}
                            style={[
                              styles.pickerOption,
                              audioSelect === sound &&
                                styles.pickerOptionSelected,
                            ]}
                            onPress={() => handleAudioSelectChange(sound)}
                          >
                            <Text
                              style={[
                                styles.pickerOptionText,
                                audioSelect === sound &&
                                  styles.pickerOptionTextSelected,
                              ]}
                            >
                              {sound === 'bell'
                                ? 'Bell (Default)'
                                : sound.charAt(0).toUpperCase() +
                                  sound.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <TouchableOpacity
                      style={styles.testButton}
                      onPress={playAlertSound}
                    >
                      <Icon name="volume-up" size={16} color="white" />
                      <Text style={styles.testButtonText}>Test Sound</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Warning Sound</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView>
                        {['bell', 'buzzer', 'chime'].map((sound) => (
                          <TouchableOpacity
                            key={sound}
                            style={[
                              styles.pickerOption,
                              warningSound === sound &&
                                styles.pickerOptionSelected,
                            ]}
                            onPress={() => setWarningSound(sound)}
                          >
                            <Text
                              style={[
                                styles.pickerOptionText,
                                warningSound === sound &&
                                  styles.pickerOptionTextSelected,
                              ]}
                            >
                              {sound === 'bell'
                                ? 'Bell (Default)'
                                : sound.charAt(0).toUpperCase() +
                                  sound.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.testButton,
                        warningPercentage === 'none' && styles.disabledButton,
                      ]}
                      onPress={playWarningSound}
                      disabled={warningPercentage === 'none'}
                    >
                      <Icon name="volume-up" size={16} color="white" />
                      <Text style={styles.testButtonText}>Test Sound</Text>
                    </TouchableOpacity>
                    {warningPercentage === 'none' && (
                      <Text style={styles.helperText}>
                        Disabled when Warning Duration is set to None
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Appearance Tab */}
              {activeSettingsTab === 'appearance' && (
                <View>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Background Style</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView>
                        {[
                          'black',
                          'white',
                          'gradient1',
                          'gradient2',
                          'gradient3',
                          'ambient',
                        ].map((bg) => (
                          <TouchableOpacity
                            key={bg}
                            style={[
                              styles.pickerOption,
                              clockBackground === bg &&
                                styles.pickerOptionSelected,
                            ]}
                            onPress={() => setClockBackground(bg)}
                          >
                            <Text
                              style={[
                                styles.pickerOptionText,
                                clockBackground === bg &&
                                  styles.pickerOptionTextSelected,
                              ]}
                            >
                              {bg === 'black'
                                ? 'Black (Default)'
                                : bg === 'white'
                                ? 'White'
                                : bg === 'gradient1'
                                ? 'Blue Gradient'
                                : bg === 'gradient2'
                                ? 'Purple Gradient'
                                : bg === 'gradient3'
                                ? 'Cyan Gradient'
                                : bg === 'ambient'
                                ? 'Ambient'
                                : bg}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Digit Color</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView>
                        {[
                          'green',
                          'white',
                          'black',
                          'red',
                          'blue',
                          'yellow',
                          'cyan',
                          'magenta',
                          'orange',
                          'pink',
                        ].map((color) => (
                          <TouchableOpacity
                            key={color}
                            style={[
                              styles.pickerOption,
                              clockDigitColor === color &&
                                styles.pickerOptionSelected,
                            ]}
                            onPress={() => setClockDigitColor(color)}
                          >
                            <Text
                              style={[
                                styles.pickerOptionText,
                                clockDigitColor === color &&
                                  styles.pickerOptionTextSelected,
                              ]}
                            >
                              {color === 'green'
                                ? 'Green (Default)'
                                : color.charAt(0).toUpperCase() +
                                  color.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Color Scheme</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView>
                        {[
                          'default',
                          'neon',
                          'fire',
                          'ocean',
                          'sunset',
                          'rainbow',
                        ].map((scheme) => (
                          <TouchableOpacity
                            key={scheme}
                            style={[
                              styles.pickerOption,
                              clockColorScheme === scheme &&
                                styles.pickerOptionSelected,
                            ]}
                            onPress={() => setClockColorScheme(scheme)}
                          >
                            <Text
                              style={[
                                styles.pickerOptionText,
                                clockColorScheme === scheme &&
                                  styles.pickerOptionTextSelected,
                              ]}
                            >
                              {scheme === 'default'
                                ? 'Individual Colors (Default)'
                                : scheme.charAt(0).toUpperCase() +
                                  scheme.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Digital Font</Text>
                    <View style={styles.pickerContainer}>
                      <ScrollView>
                        {['Orbitron', 'Share Tech Mono', 'VT323'].map(
                          (font) => (
                            <TouchableOpacity
                              key={font}
                              style={[
                                styles.pickerOption,
                                clockFont === font &&
                                  styles.pickerOptionSelected,
                              ]}
                              onPress={() => setClockFont(font)}
                            >
                              <Text
                                style={[
                                  styles.pickerOptionText,
                                  clockFont === font &&
                                    styles.pickerOptionTextSelected,
                                ]}
                              >
                                {font === 'Orbitron'
                                  ? 'Orbitron (Modern Digital) (Default)'
                                  : font === 'Share Tech Mono'
                                  ? 'Share Tech Mono (Classic)'
                                  : 'VT323 (Retro)'}
                              </Text>
                            </TouchableOpacity>
                          )
                        )}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              )}

              {/* Bluetooth Tab */}
              {activeSettingsTab === 'bluetooth' && (
                <View>
                  <View style={styles.infoAlert}>
                    <Icon name="info-circle" size={20} color="#0c5460" />
                    <Text style={styles.infoText}>
                      Bluetooth functionality requires additional setup and
                      hardware support.
                    </Text>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Bluetooth Status</Text>
                    <View style={styles.statusContainer}>
                      <Text style={styles.statusText}>Not Available</Text>
                    </View>
                  </View>

                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Connected Devices</Text>
                    <View style={styles.statusContainer}>
                      <Text style={styles.statusText}>
                        No devices connected
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.scanButton, styles.disabledButton]}
                    disabled
                  >
                    <Icon name="bluetooth" size={16} color="#6c757d" />
                    <Text style={styles.scanButtonText}>Scan for Devices</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.footerContent}>
                <TouchableOpacity
                                  style={styles.settingsResetButton}
                onPress={resetSettings}
              >
                <Text style={styles.resetButtonText}>Reset Settings</Text>
                </TouchableOpacity>

                <View style={styles.footerButtons}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowSettings(false)}
                  >
                    <Text style={styles.modalButtonText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={() => setShowSettings(false)}
                  >
                    <Text style={styles.saveButtonText}>Save changes</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.versionText}>Version 1.0.0</Text>
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
                      {formatDateTime(record.startTime)} -{' '}
                      {formatDateTime(record.endTime)}
                    </Text>
                    <Text style={styles.historyDuration}>
                      Duration: {record.duration}
                      {record.completed ? '' : ' (Early)'}
                    </Text>
                    <Text style={styles.historySince}>
                      Time Between: {record.timeSinceLastShower}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.footerContent}>
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
  warningActive: {
    /* Removed yellow shadow and border - keeping only the warning indicator */
  },
  warningIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  warningText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  controlsContainer: {
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
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
  warningButton: {
    backgroundColor: '#ffc107',
  },
  soundButton: {
    backgroundColor: '#17a2b8',
  },
  talkButton: {
    backgroundColor: '#28a745',
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
  settingsModal: {
    maxWidth: 600,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0d6efd',
  },
  tabText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0d6efd',
    fontWeight: '600',
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
  disabledButton: {
    backgroundColor: '#e9ecef',
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 6,
  },
  infoAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1ecf1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#0c5460',
    marginLeft: 8,
    flex: 1,
  },
  statusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  statusText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d6efd',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 10,
  },
  scanButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  nameInputField: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 6,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  settingsResetButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0d6efd',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6c757d',
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

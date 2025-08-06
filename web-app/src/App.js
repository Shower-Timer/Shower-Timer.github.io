import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// Version information
const APP_VERSION = '1.0.0';

// Arrow functions for utilities
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

// Arrow functions for getInitialValues and getInitialHistory
const getInitialValues = () => {
  const savedShowerDuration = localStorage.getItem('showerDuration');
  const savedAudioSelect = localStorage.getItem('audioSelect');

  return {
    showerDuration: savedShowerDuration ? parseFloat(savedShowerDuration) : 10,
    audioSelect: savedAudioSelect || 'bell',
  };
};

const getInitialHistory = () => {
  const savedHistory = localStorage.getItem('showerHistory');
  if (savedHistory) {
    try {
      const parsed = JSON.parse(savedHistory).map(item => ({
        ...item,
        startTime: new Date(item.startTime),
        endTime: new Date(item.endTime),
      }));
      return parsed;
    } catch (error) {
      // Silently handle parsing errors
      return [];
    }
  }
  return [];
};

// Memoized handlers for icons and modals
const useModalHandlers = (setShowHistory, setShowSettings) => {
  const handleShowHistory = useCallback(() => setShowHistory(true), [setShowHistory]);
  const handleShowSettings = useCallback(() => setShowSettings(true), [setShowSettings]);
  const handleCloseHistory = useCallback(() => setShowHistory(false), [setShowHistory]);
  const handleCloseSettings = useCallback(() => setShowSettings(false), [setShowSettings]);
  return { handleShowHistory, handleShowSettings, handleCloseHistory, handleCloseSettings };
};

const App = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [name, setName] = useState('');
  const [showerDuration, setShowerDuration] = useState(() => getInitialValues().showerDuration);
  const [audioSelect, setAudioSelect] = useState(() => getInitialValues().audioSelect);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showerHistory, setShowerHistory] = useState(() => getInitialHistory());
  const [lastShowerEndTime, setLastShowerEndTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [startButtonPressed, setStartButtonPressed] = useState(false);

  // Clock face customization state
  const [clockBackground, setClockBackground] = useState(
    () => localStorage.getItem('clockBackground') || 'black',
  );
  const [clockDigitColor, setClockDigitColor] = useState(
    () => localStorage.getItem('clockDigitColor') || 'green',
  );
  const [clockColorScheme, setClockColorScheme] = useState(
    () => localStorage.getItem('clockColorScheme') || 'default',
  );
  const [clockFont, setClockFont] = useState(() => localStorage.getItem('clockFont') || 'Orbitron');
  const [warningPercentage, setWarningPercentage] = useState(
    () => localStorage.getItem('warningPercentage') || '25',
  );
  const [warningSound, setWarningSound] = useState(
    () => localStorage.getItem('warningSound') || 'bell',
  );

  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [shouldMarquee, setShouldMarquee] = useState(false);

  const timerRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const timerCompletedRef = useRef(false);
  const warningPlayedRef = useRef(false);
  const nameInputRef = useRef(null);
  const textMeasureRef = useRef(null);
  const marqueeTextRef = useRef(null);
  const audioFiles = useRef({
    bell: new Audio(`${process.env.PUBLIC_URL}/sounds/bell.mp3`),
    buzzer: new Audio(`${process.env.PUBLIC_URL}/sounds/buzzer.mp3`),
    chime: new Audio(`${process.env.PUBLIC_URL}/sounds/chime.mp3`),
  });

  const { handleShowHistory, handleShowSettings, handleCloseHistory, handleCloseSettings } =
    useModalHandlers(setShowHistory, setShowSettings);

  // Initialize audio files with error handling
  useEffect(() => {
    Object.entries(audioFiles.current).forEach(([_key, audio]) => {
      audio.addEventListener('error', _event => {
        // Silently handle audio loading errors
      });
    });
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('showerHistory', JSON.stringify(showerHistory));
  }, [showerHistory]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('showerDuration', showerDuration.toString());
    localStorage.setItem('audioSelect', audioSelect);
    localStorage.setItem('clockBackground', clockBackground);
    localStorage.setItem('clockDigitColor', clockDigitColor);
    localStorage.setItem('clockColorScheme', clockColorScheme);
    localStorage.setItem('clockFont', clockFont);
    localStorage.setItem('warningPercentage', warningPercentage);
    localStorage.setItem('warningSound', warningSound);
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

  const checkTextOverflow = useCallback(() => {
    if (textMeasureRef.current && nameInputRef.current) {
      const textWidth = textMeasureRef.current.scrollWidth;
      const containerWidth = nameInputRef.current.offsetWidth;
      const shouldActivate = textWidth > containerWidth && isRunning && name.trim();
      setShouldMarquee(shouldActivate);
    }
  }, [isRunning, name]);

  // Check for text overflow when timer starts or name changes
  useEffect(() => {
    checkTextOverflow();
  }, [checkTextOverflow]);

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
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {
        // Silently handle audio stopping errors
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
        audio.play().catch(_error => {
          // Silently handle audio playing errors
        });
      }
    } catch (_error) {
      // Silently handle audio errors
    }
  }, [audioSelect, stopAllAudio]);

  const startAlarm = useCallback(() => {
    playAlertSound();
    alarmIntervalRef.current = setInterval(playAlertSound, 2000);
  }, [playAlertSound]);

  const startTimer = useCallback(() => {
    setStartButtonPressed(true);
    if (!isRunning && name.trim()) {
      const duration = parseFloat(showerDuration);
      const initialTime = duration < 1 ? Math.ceil(duration * 60) : duration * 60;
      setTimeLeft(initialTime);
      setIsRunning(true);
      setIsPaused(false);
      setStartTime(new Date());
      timerCompletedRef.current = false;
      warningPlayedRef.current = false;
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
      : 'N/A';

    const newEntry = {
      name,
      startTime: actualStartTime,
      endTime,
      duration: formatTimeDifference(actualStartTime, endTime),
      timeSinceLastShower,
      completed: false,
    };

    setShowerHistory(prev => [newEntry, ...prev]);
    setLastShowerEndTime(endTime);

    // Reset timer state
    stopAllAudio();
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
    setName('');
    setStartTime(null);
    timerCompletedRef.current = false;
    warningPlayedRef.current = false;
    setStartButtonPressed(false);
  }, [name, showerDuration, timeLeft, lastShowerEndTime, stopAllAudio]);

  const clearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all shower history?')) {
      setShowerHistory([]);
      localStorage.removeItem('showerHistory');
    }
  }, []);

  const testSound = useCallback(() => {
    try {
      stopAllAudio();
      const audio = audioFiles.current[audioSelect];
      if (audio) {
        audio.play().catch(_error => {
          alert(
            'Audio file not found. Please ensure the audio files are in the public/sounds directory.',
          );
        });
      }
    } catch (_error) {
      alert(
        'Audio file not found. Please ensure the audio files are in the public/sounds directory.',
      );
    }
  }, [audioSelect, stopAllAudio]);

  const handleStopAlarm = useCallback(() => {
    stopAllAudio();
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
    setName('');
    setStartTime(null);
    timerCompletedRef.current = false;
    warningPlayedRef.current = false;
    setStartButtonPressed(false);
  }, [stopAllAudio]);

  // New function to reset timer only
  const resetTimer = useCallback(() => {
    if (isRunning) {
      const duration = parseFloat(showerDuration);
      const initialTime = duration < 1 ? Math.ceil(duration * 60) : duration * 60;
      setTimeLeft(initialTime);
    } else {
      setTimeLeft(0);
    }
  }, [isRunning, showerDuration]);

  // New function to play alarm sound manually
  const playAlarmSound = useCallback(() => {
    playAlertSound();
  }, [playAlertSound]);

  // New function for Talk button (stubbed for now)
  const handleTalk = useCallback(() => {
    // TODO: Implement microphone functionality
    // eslint-disable-next-line no-console
    console.log('Talk button pressed - microphone functionality to be implemented');
  }, []);

  // Function to get clock face styles based on selected options
  const getClockFaceStyles = useCallback(() => {
    const styles = {
      background: '',
      color: '',
      animation: '',
      fontFamily: '',
    };

    // Background styles
    switch (clockBackground) {
      case 'white':
        styles.background = '#ffffff';
        break;
      case 'black':
        styles.background = '#000000';
        break;
      case 'gradient':
        styles.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        break;
      case 'gradient2':
        styles.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        break;
      case 'gradient3':
        styles.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        break;
      case 'ambient':
        styles.background =
          'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3)';
        styles.animation = 'ambient 8s ease infinite';
        break;
      default:
        styles.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    // Digit color styles
    switch (clockDigitColor) {
      case 'green':
        styles.color = '#00ff00';
        break;
      case 'white':
        styles.color = '#ffffff';
        break;
      case 'black':
        styles.color = '#000000';
        break;
      case 'red':
        styles.color = '#ff0000';
        break;
      case 'blue':
        styles.color = '#0066ff';
        break;
      case 'yellow':
        styles.color = '#ffff00';
        break;
      case 'cyan':
        styles.color = '#00ffff';
        break;
      case 'magenta':
        styles.color = '#ff00ff';
        break;
      case 'orange':
        styles.color = '#ff6600';
        break;
      case 'pink':
        styles.color = '#ff69b4';
        break;
      default:
        styles.color = '#00ff00';
    }

    // Color scheme overrides
    switch (clockColorScheme) {
      case 'neon':
        styles.color = '#00ff00';
        styles.animation = 'neon 2s ease-in-out infinite alternate';
        break;
      case 'fire':
        styles.color = '#ff4500';
        styles.animation = 'fire 3s ease-in-out infinite';
        break;
      case 'ocean':
        styles.color = '#00bfff';
        styles.animation = 'ocean 4s ease-in-out infinite';
        break;
      case 'sunset':
        styles.color = '#ff6347';
        styles.animation = 'sunset 5s ease-in-out infinite';
        break;
      case 'rainbow':
        styles.animation = 'rainbow 6s linear infinite';
        break;
      case 'gradient-horizontal':
        styles.background =
          'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0000)';
        styles.backgroundSize = '200% 100%';
        styles.animation = 'gradient-horizontal 3s linear infinite';
        styles.webkitBackgroundClip = 'text';
        styles.webkitTextFillColor = 'transparent';
        styles.backgroundClip = 'text';
        break;
      case 'gradient-vertical':
        styles.background =
          'linear-gradient(180deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0000)';
        styles.backgroundSize = '100% 200%';
        styles.animation = 'gradient-vertical 3s linear infinite';
        styles.webkitBackgroundClip = 'text';
        styles.webkitTextFillColor = 'transparent';
        styles.backgroundClip = 'text';
        break;
      case 'gradient-diagonal':
        styles.background =
          'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0000)';
        styles.backgroundSize = '200% 200%';
        styles.animation = 'gradient-diagonal 4s linear infinite';
        styles.webkitBackgroundClip = 'text';
        styles.webkitTextFillColor = 'transparent';
        styles.backgroundClip = 'text';
        break;
      case 'gradient-radial':
        styles.background =
          'radial-gradient(circle, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0000)';
        styles.backgroundSize = '200% 200%';
        styles.animation = 'gradient-radial 5s linear infinite';
        styles.webkitBackgroundClip = 'text';
        styles.webkitTextFillColor = 'transparent';
        styles.backgroundClip = 'text';
        break;
      default:
        // Use the individual color settings
        break;
    }

    // Font family
    switch (clockFont) {
      case 'Orbitron':
        styles.fontFamily = "'Orbitron', monospace";
        break;
      case 'Share Tech Mono':
        styles.fontFamily = "'Share Tech Mono', monospace";
        break;
      case 'VT323':
        styles.fontFamily = "'VT323', monospace";
        break;
      default:
        styles.fontFamily = "'Orbitron', monospace";
    }

    return styles;
  }, [clockBackground, clockDigitColor, clockColorScheme, clockFont]);

  // Handler functions for clock customization
  const handleClockBackgroundChange = useCallback(event => {
    setClockBackground(event.target.value);
  }, []);

  const handleClockDigitColorChange = useCallback(event => {
    setClockDigitColor(event.target.value);
  }, []);

  const handleClockColorSchemeChange = useCallback(event => {
    setClockColorScheme(event.target.value);
  }, []);

  const handleClockFontChange = useCallback(event => {
    setClockFont(event.target.value);
  }, []);

  const handleWarningPercentageChange = useCallback(event => {
    setWarningPercentage(event.target.value);
  }, []);

  const handleWarningSoundChange = useCallback(event => {
    setWarningSound(event.target.value);
  }, []);

  // Function to calculate warning time based on percentage
  const getWarningTime = useCallback(() => {
    if (warningPercentage === 'none') return null;

    const percentage = parseFloat(warningPercentage);
    const totalTime = parseFloat(showerDuration) * 60; // Convert to seconds
    return Math.ceil(totalTime * (percentage / 100));
  }, [warningPercentage, showerDuration]);

  // Function to check if warning should be shown
  const shouldShowWarning = useCallback(() => {
    const warningTime = getWarningTime();
    return warningTime && timeLeft <= warningTime && timeLeft > 0;
  }, [getWarningTime, timeLeft]);

  // Function to play warning sound
  const playWarningSound = useCallback(() => {
    try {
      stopAllAudio();
      const audio = audioFiles.current[warningSound];
      if (audio) {
        audio.play().catch(_error => {
          // Silently handle audio playing errors
        });
      }
    } catch (_error) {
      // Silently handle audio errors
    }
  }, [warningSound, stopAllAudio]);

  // Function to reset all settings to defaults
  const resetSettings = useCallback(() => {
    setClockBackground('black');
    setClockDigitColor('green');
    setClockColorScheme('default');
    setClockFont('Orbitron');
    setWarningPercentage('25');
    setWarningSound('bell'); // Reset warning sound
    setAudioSelect('bell'); // Reset alarm sound
    setShowerDuration(20); // Reset shower duration

    // Clear from localStorage
    localStorage.removeItem('clockBackground');
    localStorage.removeItem('clockDigitColor');
    localStorage.removeItem('clockColorScheme');
    localStorage.removeItem('clockFont');
    localStorage.removeItem('warningPercentage');
    localStorage.removeItem('warningSound');
    localStorage.removeItem('audioSelect');
    localStorage.removeItem('showerDuration');
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          // Check for warning time
          const warningTime = getWarningTime();
          if (warningTime && prev <= warningTime && !warningPlayedRef.current) {
            warningPlayedRef.current = true;
            playWarningSound();
          }

          if (prev <= 1 && !timerCompletedRef.current) {
            clearInterval(timerRef.current);
            timerCompletedRef.current = true;
            const endTime = new Date();
            const timeSinceLastShower = lastShowerEndTime
              ? formatTimeDifference(lastShowerEndTime, startTime)
              : 'N/A';

            const newEntry = {
              name,
              startTime,
              endTime,
              duration: formatTimeDifference(startTime, endTime),
              timeSinceLastShower,
              completed: true,
            };

            setShowerHistory(prev => [newEntry, ...prev]);
            setLastShowerEndTime(endTime);
            startAlarm();
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
  }, [
    isRunning,
    isPaused,
    timeLeft,
    name,
    startTime,
    lastShowerEndTime,
    startAlarm,
    getWarningTime,
    playWarningSound,
  ]);

  // Memoized input handlers
  const handleNameChange = useCallback(
    event => {
      const newName = event.target.value.toUpperCase();
      setName(newName);
      // Clear validation state if user starts typing a valid name
      if (newName.trim() && startButtonPressed) {
        setStartButtonPressed(false);
      }
    },
    [startButtonPressed],
  );
  const handleShowerDurationChange = useCallback(event => {
    setShowerDuration(parseFloat(event.target.value));
  }, []);
  const handleAudioSelectChange = useCallback(event => {
    setAudioSelect(event.target.value);
  }, []);

  // Memoized handlers for JSX props
  const handleKeyDownHistory = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleShowHistory();
      }
    },
    [handleShowHistory],
  );

  const handleKeyDownSettings = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleShowSettings();
      }
    },
    [handleShowSettings],
  );

  const handleBackdropClick = useCallback(() => {
    handleCloseSettings();
    handleCloseHistory();
  }, [handleCloseSettings, handleCloseHistory]);

  const handleBackdropKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleCloseSettings();
        handleCloseHistory();
      }
    },
    [handleCloseSettings, handleCloseHistory],
  );

  return (
    <div className='App'>
      {/* Top Right Icons */}
      <div className='top-right-icons'>
        <i
          className='fas fa-history settings-icon me-3'
          role='button'
          tabIndex={0}
          onClick={handleShowHistory}
          onKeyDown={handleKeyDownHistory}
          aria-label='Show History'
        ></i>
        <i
          className='fas fa-cog settings-icon'
          role='button'
          tabIndex={0}
          onClick={handleShowSettings}
          onKeyDown={handleKeyDownSettings}
          aria-label='Show Settings'
        ></i>
      </div>

      {/* Main Content */}
      <div className='container-fluid'>
        {/* Name Input */}
        <div className='mb-3'>
          <div
            ref={nameInputRef}
            className={`form-control form-control-lg text-center name-input ${!name.trim() && startButtonPressed ? 'is-invalid' : ''} ${shouldMarquee ? 'marquee' : ''}`}
          >
            {shouldMarquee ? (
              <span className='marquee-text' ref={marqueeTextRef}>
                {name}
              </span>
            ) : (
              <input
                type='text'
                className='border-0 bg-transparent text-center w-100 h-100'
                value={name}
                onChange={handleNameChange}
                placeholder='Enter Name'
                disabled={isRunning}
                style={{ fontSize: 'inherit', fontWeight: 'inherit' }}
              />
            )}
          </div>
          {/* Hidden element to measure text width */}
          <span
            ref={textMeasureRef}
            style={{
              position: 'absolute',
              visibility: 'hidden',
              whiteSpace: 'nowrap',
              fontSize: 'inherit',
              fontWeight: 'inherit',
            }}
          >
            {name}
          </span>
        </div>

        {/* Timer Display - Full Width */}
        <div
          className={`timer-display ${shouldShowWarning() ? 'warning-active' : ''}`}
          style={getClockFaceStyles()}
        >
          {updateTimerDisplay()}
          {shouldShowWarning() && (
            <div className='warning-indicator'>
              <i className='fas fa-exclamation-triangle'></i> Time Almost Up!
            </div>
          )}
        </div>

        {/* Controls */}
        <div className='row justify-content-center'>
          <div className='col-md-8 col-lg-6'>
            <div className='controls-container'>
              {/* First row: Start, Pause, End */}
              <div className='d-flex justify-content-center gap-2 mb-3'>
                {!isRunning || timeLeft > 0 ? (
                  <>
                    <button
                      className='btn btn-primary btn-lg square-btn'
                      onClick={startTimer}
                      disabled={isRunning}
                    >
                      <i className='fas fa-play'></i>
                      <span>Start</span>
                    </button>
                    <button
                      className='btn btn-warning btn-lg square-btn'
                      onClick={pauseTimer}
                      disabled={!isRunning}
                    >
                      <i className={`fas fa-${isPaused ? 'play' : 'pause'}`}></i>
                      <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                    <button
                      className='btn btn-danger btn-lg square-btn'
                      onClick={stopEarly}
                      disabled={!isRunning}
                    >
                      <i className='fas fa-stop-circle'></i>
                      <span>End</span>
                    </button>
                  </>
                ) : (
                  <button className='btn btn-danger btn-lg square-btn' onClick={handleStopAlarm}>
                    <i className='fas fa-stop'></i>
                    <span>Stop Alarm</span>
                  </button>
                )}
              </div>

              {/* Second row: Reset Timer, Sound Alarm, Talk */}
              <div className='d-flex justify-content-center gap-2'>
                <button
                  className='btn btn-secondary btn-lg square-btn'
                  onClick={resetTimer}
                  disabled={!isRunning && timeLeft === 0}
                >
                  <i className='fas fa-undo'></i>
                  <span>Reset Timer</span>
                </button>
                <button
                  className='btn btn-info btn-lg square-btn'
                  onMouseDown={playAlarmSound}
                  onTouchStart={playAlarmSound}
                >
                  <i className='fas fa-volume-up'></i>
                  <span>Sound Alarm</span>
                </button>
                <button className='btn btn-success btn-lg square-btn' onClick={handleTalk}>
                  <i className='fas fa-microphone'></i>
                  <span>Talk</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className='modal show d-block' tabIndex='-1'>
          <div className='modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Settings</h5>
                <button type='button' className='btn-close' onClick={handleCloseSettings}></button>
              </div>
              <div className='modal-body'>
                {/* Settings Tabs */}
                <ul className='nav nav-tabs mb-3' id='settingsTabs' role='tablist'>
                  <li className='nav-item' role='presentation'>
                    <button
                      className={`nav-link ${activeSettingsTab === 'general' ? 'active' : ''}`}
                      id='general-tab'
                      type='button'
                      role='tab'
                      onClick={() => setActiveSettingsTab('general')}
                    >
                      General
                    </button>
                  </li>
                  <li className='nav-item' role='presentation'>
                    <button
                      className={`nav-link ${activeSettingsTab === 'alerts' ? 'active' : ''}`}
                      id='alerts-tab'
                      type='button'
                      role='tab'
                      onClick={() => setActiveSettingsTab('alerts')}
                    >
                      Sound
                    </button>
                  </li>
                  <li className='nav-item' role='presentation'>
                    <button
                      className={`nav-link ${activeSettingsTab === 'appearance' ? 'active' : ''}`}
                      id='appearance-tab'
                      type='button'
                      role='tab'
                      onClick={() => setActiveSettingsTab('appearance')}
                    >
                      Appearance
                    </button>
                  </li>
                  <li className='nav-item' role='presentation'>
                    <button
                      className={`nav-link ${activeSettingsTab === 'bluetooth' ? 'active' : ''}`}
                      id='bluetooth-tab'
                      type='button'
                      role='tab'
                      onClick={() => setActiveSettingsTab('bluetooth')}
                    >
                      Bluetooth
                    </button>
                  </li>
                </ul>

                {/* Tab Content */}
                <div className='tab-content' id='settingsTabContent'>
                  {/* General Tab */}
                  <div
                    className={`tab-pane fade ${activeSettingsTab === 'general' ? 'show active' : ''}`}
                    id='general'
                    role='tabpanel'
                  >
                    <div className='mb-3'>
                      <label htmlFor='showerName' className='form-label'>
                        Shower Name
                      </label>
                      <input
                        type='text'
                        className='form-control'
                        id='showerName'
                        value={name}
                        onChange={handleNameChange}
                        placeholder='Enter a name for this shower timer'
                        maxLength={50}
                      />
                      <small className='form-text text-muted'>
                        This name will be used to identify this shower timer in the history
                      </small>
                    </div>

                    <div className='mb-3'>
                      <label htmlFor='showerDuration' className='form-label'>
                        Shower Duration
                      </label>
                      <select
                        className='form-select'
                        value={showerDuration}
                        onChange={handleShowerDurationChange}
                      >
                        <option value={0.083}>5 seconds</option>
                        <option value={10}>10 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={20}>20 minutes (Default)</option>
                        <option value={25}>25 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={35}>35 minutes</option>
                        <option value={40}>40 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={50}>50 minutes</option>
                        <option value={55}>55 minutes</option>
                      </select>
                    </div>

                    <div className='mb-3'>
                      <label htmlFor='warningPercentage' className='form-label'>
                        Warning Duration
                      </label>
                      <select
                        className='form-select'
                        value={warningPercentage}
                        onChange={handleWarningPercentageChange}
                      >
                        <option value='none'>No Warning</option>
                        <option value='5'>
                          {Math.ceil(((parseFloat(showerDuration) * 60 * 0.05) / 60) * 10) / 10}{' '}
                          minutes
                        </option>
                        <option value='10'>
                          {Math.ceil(((parseFloat(showerDuration) * 60 * 0.1) / 60) * 10) / 10}{' '}
                          minutes
                        </option>
                        <option value='15'>
                          {Math.ceil(((parseFloat(showerDuration) * 60 * 0.15) / 60) * 10) / 10}{' '}
                          minutes
                        </option>
                        <option value='20'>
                          {Math.ceil(((parseFloat(showerDuration) * 60 * 0.2) / 60) * 10) / 10}{' '}
                          minutes
                        </option>
                        <option value='25'>
                          {Math.ceil(((parseFloat(showerDuration) * 60 * 0.25) / 60) * 10) / 10}{' '}
                          minutes (Default)
                        </option>
                        <option value='30'>
                          {Math.ceil(((parseFloat(showerDuration) * 60 * 0.3) / 60) * 10) / 10}{' '}
                          minutes
                        </option>
                      </select>
                      {warningPercentage !== 'none' && (
                        <small className='form-text text-muted'>
                          Warning will sound when{' '}
                          {Math.ceil(
                            (parseFloat(showerDuration) *
                              60 *
                              (parseFloat(warningPercentage) / 100)) /
                              60,
                          )}{' '}
                          minutes remain
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Alerts Tab */}
                  <div
                    className={`tab-pane fade ${activeSettingsTab === 'alerts' ? 'show active' : ''}`}
                    id='alerts'
                    role='tabpanel'
                  >
                    <div className='mb-3'>
                      <label htmlFor='audioSelect' className='form-label'>
                        Alarm Sound
                      </label>
                      <div className='input-group'>
                        <select
                          className='form-select'
                          value={audioSelect}
                          onChange={handleAudioSelectChange}
                        >
                          <option value='bell'>Bell (Default)</option>
                          <option value='buzzer'>Buzzer</option>
                          <option value='chime'>Chime</option>
                        </select>
                        <button
                          className='btn btn-outline-secondary'
                          type='button'
                          onClick={testSound}
                        >
                          <i className='fas fa-volume-up'></i> Test Sound
                        </button>
                      </div>
                    </div>

                    <div className='mb-3'>
                      <label htmlFor='warningSound' className='form-label'>
                        Warning Sound
                      </label>
                      <div className='input-group'>
                        <select
                          className='form-select'
                          value={warningSound}
                          onChange={handleWarningSoundChange}
                          disabled={warningPercentage === 'none'}
                        >
                          <option value='bell'>Bell (Default)</option>
                          <option value='buzzer'>Buzzer</option>
                          <option value='chime'>Chime</option>
                        </select>
                        <button
                          className='btn btn-outline-secondary'
                          type='button'
                          onClick={() => {
                            try {
                              stopAllAudio();
                              const audio = audioFiles.current[warningSound];
                              if (audio) {
                                audio.play().catch(_error => {
                                  // Silently handle audio playing errors
                                });
                              }
                            } catch (_error) {
                              // Silently handle audio errors
                            }
                          }}
                          disabled={warningPercentage === 'none'}
                        >
                          <i className='fas fa-volume-up'></i> Test Sound
                        </button>
                      </div>
                      {warningPercentage === 'none' && (
                        <small className='form-text text-muted'>
                          Enable a warning duration in General settings to select a warning sound
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Appearance Tab */}
                  <div
                    className={`tab-pane fade ${activeSettingsTab === 'appearance' ? 'show active' : ''}`}
                    id='appearance'
                    role='tabpanel'
                  >
                    <h6 className='mb-3'>Clock Face Customization</h6>

                    <div className='mb-3'>
                      <label htmlFor='clockBackground' className='form-label'>
                        Background Style
                      </label>
                      <select
                        className='form-select'
                        value={clockBackground}
                        onChange={handleClockBackgroundChange}
                      >
                        <option value='black'>Black (Default)</option>
                        <option value='gradient'>Default Gradient</option>
                        <option value='gradient2'>Pink Gradient</option>
                        <option value='gradient3'>Blue Gradient</option>
                        <option value='white'>White</option>
                        <option value='ambient'>Ambient Rainbow</option>
                      </select>
                    </div>

                    <div className='mb-3'>
                      <label htmlFor='clockDigitColor' className='form-label'>
                        Digit Color
                      </label>
                      <select
                        className='form-select'
                        value={clockDigitColor}
                        onChange={handleClockDigitColorChange}
                      >
                        <option value='green'>Green (Default)</option>
                        <option value='white'>White</option>
                        <option value='black'>Black</option>
                        <option value='red'>Red</option>
                        <option value='blue'>Blue</option>
                        <option value='yellow'>Yellow</option>
                        <option value='cyan'>Cyan</option>
                        <option value='magenta'>Magenta</option>
                        <option value='orange'>Orange</option>
                        <option value='pink'>Pink</option>
                      </select>
                    </div>

                    <div className='mb-3'>
                      <label htmlFor='clockColorScheme' className='form-label'>
                        Color Scheme
                      </label>
                      <select
                        className='form-select'
                        value={clockColorScheme}
                        onChange={handleClockColorSchemeChange}
                      >
                        <option value='default'>Individual Colors (Default)</option>
                        <option value='neon'>Neon Green</option>
                        <option value='fire'>Fire Orange</option>
                        <option value='ocean'>Ocean Blue</option>
                        <option value='sunset'>Sunset Red</option>
                        <option value='rainbow'>Rainbow</option>
                        <option value='gradient-horizontal'>Gradient Horizontal</option>
                        <option value='gradient-vertical'>Gradient Vertical</option>
                        <option value='gradient-diagonal'>Gradient Diagonal</option>
                        <option value='gradient-radial'>Gradient Radial</option>
                      </select>
                    </div>

                    <div className='mb-3'>
                      <label htmlFor='clockFont' className='form-label'>
                        Digital Font
                      </label>
                      <select
                        className='form-select'
                        value={clockFont}
                        onChange={handleClockFontChange}
                      >
                        <option value='Orbitron'>Orbitron (Modern Digital) (Default)</option>
                        <option value='Share Tech Mono'>Share Tech Mono (Clean Digital)</option>
                        <option value='VT323'>VT323 (Retro Terminal)</option>
                      </select>
                    </div>
                  </div>

                  {/* Bluetooth Tab */}
                  <div
                    className={`tab-pane fade ${activeSettingsTab === 'bluetooth' ? 'show active' : ''}`}
                    id='bluetooth'
                    role='tabpanel'
                  >
                    <div className='mb-3'>
                      <h6 className='mb-3'>Bluetooth Settings</h6>
                      <div className='alert alert-info'>
                        <i className='fas fa-info-circle me-2'></i>
                        Bluetooth functionality is coming soon! This section will allow you to
                        connect to Bluetooth devices and configure wireless settings.
                      </div>

                      <div className='mb-3'>
                        <label htmlFor='bluetooth-status' className='form-label'>
                          Bluetooth Status
                        </label>
                        <div id='bluetooth-status' className='form-control-plaintext'>
                          <span className='badge bg-secondary'>Not Available</span>
                        </div>
                      </div>

                      <div className='mb-3'>
                        <label htmlFor='connected-devices' className='form-label'>
                          Connected Devices
                        </label>
                        <div id='connected-devices' className='form-control-plaintext'>
                          <em>No devices connected</em>
                        </div>
                      </div>

                      <div className='mb-3'>
                        <button className='btn btn-primary' disabled>
                          <i className='fas fa-bluetooth me-2'></i>
                          Scan for Devices
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='modal-footer'>
                <div className='text-muted small text-center mb-3'>Version {APP_VERSION}</div>
                <div className='d-flex justify-content-between align-items-center w-100'>
                  <div>
                    <button type='button' className='btn btn-danger' onClick={resetSettings}>
                      Reset Settings
                    </button>
                  </div>
                  <div className='d-flex gap-2'>
                    <button
                      type='button'
                      className='btn btn-secondary'
                      onClick={handleCloseSettings}
                    >
                      Close
                    </button>
                    <button type='button' className='btn btn-primary' onClick={handleCloseSettings}>
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className='modal show d-block' tabIndex='-1'>
          <div className='modal-dialog modal-lg'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Shower History</h5>
                <button type='button' className='btn-close' onClick={handleCloseHistory}></button>
              </div>
              <div className='modal-body'>
                <div className='table-responsive'>
                  <table className='table table-striped'>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration</th>
                        <th>Time Since Last Shower</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showerHistory.map((record, recordIndex) => (
                        <tr key={recordIndex}>
                          <td>{record.name}</td>
                          <td>{formatDateTime(record.startTime)}</td>
                          <td>{formatDateTime(record.endTime)}</td>
                          <td>
                            {record.duration}
                            {record.completed ? '' : ' (Early)'}
                          </td>
                          <td>{record.timeSinceLastShower}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className='modal-footer'>
                <button type='button' className='btn btn-danger' onClick={clearHistory}>
                  <i className='fas fa-trash'></i> Clear History
                </button>
                <button type='button' className='btn btn-secondary' onClick={handleCloseHistory}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showSettings || showHistory) && (
        <div
          className='modal-backdrop show'
          role='button'
          tabIndex={0}
          onClick={handleBackdropClick}
          onKeyDown={handleBackdropKeyDown}
        ></div>
      )}
    </div>
  );
};

export default App;

import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

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

  const timerRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const timerCompletedRef = useRef(false);
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
    resetTimer();
  }, [name, showerDuration, timeLeft, lastShowerEndTime, resetTimer]);

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

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
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
  }, [isRunning, isPaused, timeLeft, name, startTime, lastShowerEndTime, startAlarm]);

  // Memoized input handlers
  const handleNameChange = useCallback(event => {
    setName(event.target.value.toUpperCase());
  }, []);
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
      {/* Header */}
      <div className='header d-flex justify-content-between align-items-center'>
        <div className='flex-grow-1 text-center'>
          <h1 className='mb-0'>TRM Shower Timer</h1>
        </div>
        <div>
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
      </div>

      {/* Main Content */}
      <div className='container'>
        <div className='row justify-content-center'>
          <div className='col-md-6'>
            {/* Name Input */}
            <div className='mb-3'>
              <input
                type='text'
                className={`form-control form-control-lg text-center name-input ${!name.trim() && isRunning ? 'is-invalid' : ''}`}
                value={name}
                onChange={handleNameChange}
                placeholder='Enter Name'
                disabled={isRunning}
              />
            </div>

            {/* Timer Display */}
            <div className='timer-display'>{updateTimerDisplay()}</div>

            {/* Controls */}
            <div className='d-flex justify-content-center gap-2'>
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
                    onClick={resetTimer}
                    disabled={!isRunning}
                  >
                    <i className='fas fa-redo'></i>
                    <span>Reset</span>
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
                <button className='btn btn-danger btn-lg square-btn' onClick={resetTimer}>
                  <i className='fas fa-stop'></i>
                  <span>Stop Alarm</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className='modal show d-block' tabIndex='-1'>
          <div className='modal-dialog'>
            <div className='modal-content'>
              <div className='modal-header'>
                <h5 className='modal-title'>Timer Settings</h5>
                <button type='button' className='btn-close' onClick={handleCloseSettings}></button>
              </div>
              <div className='modal-body'>
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
                    <option value={20}>20 minutes</option>
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
                  <label htmlFor='audioSelect' className='form-label'>
                    Alert Sound
                  </label>
                  <div className='input-group'>
                    <select
                      className='form-select'
                      value={audioSelect}
                      onChange={handleAudioSelectChange}
                    >
                      <option value='bell'>Bell</option>
                      <option value='buzzer'>Buzzer</option>
                      <option value='chime'>Chime</option>
                    </select>
                    <button className='btn btn-outline-secondary' type='button' onClick={testSound}>
                      <i className='fas fa-volume-up'></i> Test Sound
                    </button>
                  </div>
                </div>
              </div>
              <div className='modal-footer'>
                <button type='button' className='btn btn-secondary' onClick={handleCloseSettings}>
                  Close
                </button>
                <button type='button' className='btn btn-primary' onClick={handleCloseSettings}>
                  Save changes
                </button>
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

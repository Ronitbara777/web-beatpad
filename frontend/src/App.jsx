import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { Howl } from 'howler';
import './App.css';

function Beatpad() {
  const { id } = useParams();
  const navigate = useNavigate();

  // A default Trap Starter Kit!
  const defaultKit = [
    { keyBinding: 'Z', soundUrl: '/sounds/01_808_Kick.wav' },
    { keyBinding: 'X', soundUrl: '/sounds/02_Punchy_Kick.wav' },
    { keyBinding: 'C', soundUrl: '/sounds/03_Snare.wav' },
    { keyBinding: 'V', soundUrl: '/sounds/04_Clap.wav' },
    { keyBinding: 'A', soundUrl: '/sounds/05_HiHat_Closed.wav' },
    { keyBinding: 'S', soundUrl: '/sounds/06_HiHat_Open.wav' },
    { keyBinding: 'D', soundUrl: '/sounds/07_Crash.wav' },
    { keyBinding: 'F', soundUrl: '/sounds/08_Perc.wav' },
    { keyBinding: 'Q', soundUrl: '/sounds/09_Bass_C2.wav' },
    { keyBinding: 'W', soundUrl: '/sounds/10_Bass_Eb2.wav' },
    { keyBinding: 'E', soundUrl: '/sounds/11_Bass_G2.wav' },
    { keyBinding: 'R', soundUrl: '/sounds/12_Bass_Bb2.wav' },
    { keyBinding: '1', soundUrl: '/sounds/13_Pluck_C4.wav' },
    { keyBinding: '2', soundUrl: '/sounds/14_Pluck_Eb4.wav' },
    { keyBinding: '3', soundUrl: '/sounds/15_Pluck_G4.wav' },
    { keyBinding: '4', soundUrl: '/sounds/16_Pluck_Bb4.wav' },
  ];

  // The main state for our 16 pads
  const [pads, setPads] = useState(
    Array.from({ length: 16 }).map((_, index) => ({
      padIndex: index + 1,
      keyBinding: defaultKit[index]?.keyBinding || '',
      soundUrl: defaultKit[index]?.soundUrl || null, // This can be a local blob URL or a server URL
      file: null, // The actual File object to upload
      config: { cut: 'playTillEnd', trigger: 'press' }
    }))
  );

  const [selectedPadIndex, setSelectedPadIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [kitId, setKitId] = useState(id || null);
  const [loadKitInput, setLoadKitInput] = useState('');

  // We use a ref to store the Howl audio instances so they don't cause re-renders
  const audioPlayers = useRef({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 1. Fetch kit if an ID is present in the URL
  useEffect(() => {
    if (id) {
      fetch(`${API_URL}/api/kits/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.msg === "Kit not found") {
            alert("Kit not found!");
            return;
          }
          // Clear any currently playing sounds
          Object.values(audioPlayers.current).forEach(player => player.unload());
          audioPlayers.current = {};

          // Start with a clean slate of 16 pads
          const freshPads = Array.from({ length: 16 }).map((_, i) => ({
            padIndex: i + 1,
            keyBinding: '',
            soundUrl: null,
            file: null,
            config: { cut: 'playTillEnd', trigger: 'press' }
          }));

          data.pads.forEach(loadedPad => {
            const index = loadedPad.padIndex - 1;
            
            // If the URL starts with http (Cloudinary), don't prepend localhost!
            const finalUrl = loadedPad.soundUrl 
              ? (loadedPad.soundUrl.startsWith('http') ? loadedPad.soundUrl : `${API_URL}${loadedPad.soundUrl}`)
              : null;

            freshPads[index] = {
              ...freshPads[index],
              keyBinding: loadedPad.keyBinding,
              soundUrl: finalUrl,
              config: loadedPad.config
            };
          });

          // Initialize Howler for the new loaded sounds
          freshPads.forEach(pad => {
            if (pad.soundUrl) {
              audioPlayers.current[pad.padIndex] = new Howl({
                src: [pad.soundUrl],
                format: ['wav', 'mp3']
              });
            }
          });

          setPads(freshPads);
          setKitId(data.id);
        })
        .catch(err => console.error("Error fetching kit:", err));
    } else {
      // If there is no ID, we are on the homepage. Load the default sounds into Howler!
      pads.forEach(pad => {
        if (pad.soundUrl && !audioPlayers.current[pad.padIndex]) {
          audioPlayers.current[pad.padIndex] = new Howl({
            src: [pad.soundUrl],
            format: ['wav', 'mp3']
          });
        }
      });
    }
  }, [id]);

  // 2. Play a pad
  const playPad = (padIndex) => {
    const pad = pads.find(p => p.padIndex === padIndex);
    if (!pad || !pad.soundUrl) return;

    const player = audioPlayers.current[padIndex];
    if (player) {
      if (pad.config.cut === 'cutOnNext') {
        player.stop(); // Cut the previous sound if it's playing
      }
      player.play();
    }
    
    // Visual feedback for pressing
    const el = document.getElementById(`pad-${padIndex}`);
    if (el) {
      el.classList.add('playing');
      setTimeout(() => el.classList.remove('playing'), 100);
    }
  };

  // 3. Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input box
      if (e.target.tagName === 'INPUT') return;

      const key = e.key.toUpperCase();
      const padToTrigger = pads.find(p => p.keyBinding === key);
      if (padToTrigger) {
        playPad(padToTrigger.padIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pads]); // Re-bind when pads change

  // 4. Update Pad State
  const updatePad = (indexToUpdate, field, newValue) => {
    const newPads = pads.map(pad => {
      if (pad.padIndex === indexToUpdate) {
        if (field === 'cut' || field === 'trigger') {
          return { ...pad, config: { ...pad.config, [field]: newValue } };
        }
        return { ...pad, [field]: newValue };
      }
      return pad;
    });
    setPads(newPads);
  };

  // 5. Handle Audio File Upload Locally
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedPadIndex) return;

    // Create a local temporary URL so the user can play it immediately
    const tempUrl = URL.createObjectURL(file);
    
    // Update State with the URL and the File object (we need the File object for sending to backend)
    const newPads = pads.map(pad => {
      if (pad.padIndex === selectedPadIndex) {
        return { ...pad, soundUrl: tempUrl, file: file };
      }
      return pad;
    });
    setPads(newPads);

    // Load into Howler
    audioPlayers.current[selectedPadIndex] = new Howl({
      src: [tempUrl],
      format: ['wav', 'mp3']
    });
  };

  // 6. Share Kit (Upload to Backend)
  const shareKit = async () => {
    setIsUploading(true);
    const formData = new FormData();

    // Prepare the JSON config for the backend
    const padsConfig = pads.filter(p => p.file || p.soundUrl).map(p => ({
      padIndex: p.padIndex,
      keyBinding: p.keyBinding,
      config: p.config,
      soundUrl: p.soundUrl, // keep existing URL (e.g. for default sounds)
      hasNewFile: !!p.file // Flag for the backend to know if it should look in req.files
    }));

    formData.append('pads', JSON.stringify(padsConfig));

    // Append the actual binary files
    pads.forEach(pad => {
      if (pad.file) {
        formData.append('sounds', pad.file);
      }
    });

    try {
      const response = await fetch(`${API_URL}/api/kits/create`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`Kit Shared! Your ID is: ${data.kit.id}`);
        navigate(`/${data.kit.id}`);
        setKitId(data.kit.id);
      } else {
        alert("Error sharing kit.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    } finally {
      setIsUploading(false);
    }
  };

  // 7. Utility functions to clear or load defaults
  const loadDefaultKit = () => {
    const newPads = Array.from({ length: 16 }).map((_, index) => ({
      padIndex: index + 1,
      keyBinding: defaultKit[index]?.keyBinding || '',
      soundUrl: defaultKit[index]?.soundUrl || null,
      file: null,
      config: { cut: 'playTillEnd', trigger: 'press' }
    }));
    setPads(newPads);
    
    // Stop all current sounds
    Object.values(audioPlayers.current).forEach(player => player.unload());
    audioPlayers.current = {};
    
    // Initialize defaults
    newPads.forEach(pad => {
      if (pad.soundUrl) {
        audioPlayers.current[pad.padIndex] = new Howl({
          src: [pad.soundUrl],
          format: ['wav', 'mp3']
        });
      }
    });
  };

  const clearKit = () => {
    setPads(Array.from({ length: 16 }).map((_, index) => ({
      padIndex: index + 1,
      keyBinding: '',
      soundUrl: null,
      file: null,
      config: { cut: 'playTillEnd', trigger: 'press' }
    })));
    Object.values(audioPlayers.current).forEach(player => player.unload());
    audioPlayers.current = {};
    setKitId(null);
    navigate('/');
  };

  const handleLoadKitSubmit = (e) => {
    e.preventDefault();
    if (loadKitInput.trim()) {
      let finalId = loadKitInput.trim();
      // If they pasted a full URL, extract just the ID
      if (finalId.includes('/')) {
        finalId = finalId.split('/').filter(Boolean).pop();
      }
      navigate(`/${finalId}`);
      setLoadKitInput('');
    }
  };

  const activePad = pads.find(p => p.padIndex === selectedPadIndex);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-brand">
          <h1>ONLINE BEATPAD {kitId && <span className="kit-badge">Kit: {kitId}</span>}</h1>
          <form className="load-kit-form" onSubmit={handleLoadKitSubmit}>
            <input 
              type="text" 
              placeholder="Paste Kit ID or URL" 
              value={loadKitInput}
              onChange={(e) => setLoadKitInput(e.target.value)}
              className="load-input"
            />
            <button type="submit" className="load-btn">Load</button>
          </form>
        </div>
        <div className="header-actions">
          <button className="settings-btn" onClick={clearKit} style={{marginRight: '10px', backgroundColor: '#555', color: 'white'}}>Clear All</button>
          <button className="settings-btn" onClick={loadDefaultKit} style={{marginRight: '20px'}}>Load Default</button>
          
          <button className="settings-btn" onClick={shareKit} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Share Kit'}
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="pad-grid">
          {pads.map((pad) => (
            <div 
              id={`pad-${pad.padIndex}`}
              key={pad.padIndex} 
              className={`pad ${selectedPadIndex === pad.padIndex ? 'active' : ''} ${pad.soundUrl ? 'has-sound' : ''}`}
              onClick={() => {
                setSelectedPadIndex(pad.padIndex);
                playPad(pad.padIndex);
              }}
            >
              <span className="pad-number">{pad.padIndex}</span>
              {pad.keyBinding && <span className="pad-key">{pad.keyBinding}</span>}
            </div>
          ))}
        </div>

        <aside className="sidebar">
          <h2>Pad Config</h2>
          
          {activePad ? (
            <div className="config-panel">
              <p className="editing-title">Editing Pad {activePad.padIndex}</p>
              
              <div className="setting-row">
                <label>Key Binding: </label>
                <input 
                  type="text" 
                  maxLength="1"
                  value={activePad.keyBinding} 
                  onChange={(e) => updatePad(activePad.padIndex, 'keyBinding', e.target.value.toUpperCase())}
                  className="key-input"
                />
              </div>

              <div className="setting-row">
                <label>Cut Mode: </label>
                <select 
                  value={activePad.config.cut}
                  onChange={(e) => updatePad(activePad.padIndex, 'cut', e.target.value)}
                  className="config-select"
                >
                  <option value="playTillEnd">Play Till End</option>
                  <option value="cutOnNext">Cut On Next Trigger</option>
                </select>
              </div>

              <div className="upload-section">
                <label className="upload-label">
                  Load Sound
                  <input type="file" accept=".wav,.mp3" onChange={handleFileUpload} />
                </label>
                {activePad.soundUrl && <span className="status-badge success">Sound Loaded</span>}
              </div>
            </div>
          ) : (
            <p className="placeholder-text">Select a pad in the grid to edit its settings.</p>
          )}
        </aside>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Beatpad />} />
      <Route path="/:id" element={<Beatpad />} />
    </Routes>
  );
}

export default App;

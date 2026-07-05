// ============================================================================
// Speech AI · Azure AI Speech Studio (Project 3)
// Phase 1: Cloud Credentials & Phase 2: Speech SDK Initialization
// Phase 3: Real-Time Speech-to-Text & Phase 4: Neural Text-to-Speech
// ============================================================================

// Global Application State
let state = {
    apiMode: 'proxy', // 'proxy' (localhost:3000), 'direct' (browser REST), or 'demo'
    sttMode: 'continuous', // 'continuous' or 'once'
    recognizer: null,
    synthesizer: null,
    isRecording: false,
    isPlaying: false,
    finalizedText: "",
    interimText: "",
    startTime: null,
    timerInterval: null,
    topics: new Set(),
    credentials: {
        region: "centralindia",
        key: ""
    }
};

// Curated Sample Presets for Voice Synthesizer
const PRESETS = {
    tech: "Welcome to Speech AI Studio and Vision AI Studio! Microsoft Azure Cognitive Services power real-time AI multimodal intelligence with ultra-realistic neural speech synthesis.",
    medical: "Patient presents with mild arrhythmia and occasional sinus tachycardia. Recommended daily monitoring and follow-up cardiology screening in two weeks.",
    support: "Hello! Thank you for contacting Azure Cloud Support. I have analyzed your system diagnostics and resolved the network latency issue on your virtual machine.",
    poetic: "Across the digital horizon, neural networks weave sound and vision into a seamless symphony of human cognition and artificial awareness."
};

// ============================================================================
// Initialization & Lifecycle
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    setupProsodySliders();
    updateSsmlPreview();
    
    // Check backend proxy status and load credentials securely
    await detectBackendProxy();
    
    // Initialize analytics display
    updateAnalytics();
    
    console.log("✨ Speech AI Studio Initialized Successfully!");
});

// ── Backend Proxy Detection & Credentials Loading ───────────────────────────
async function detectBackendProxy() {
    const statusPill = document.getElementById('statusPill');
    const pillText = document.getElementById('pillText');
    
    try {
        const res = await fetch('/api/status');
        if (res.ok) {
            const data = await res.json();
            console.log("[Backend Proxy] Connected to local server:", data);
            
            // Try fetching credentials from backend proxy (.env)
            const credRes = await fetch('/api/credentials');
            if (credRes.ok) {
                const credData = await credRes.json();
                if (credData.success && credData.key) {
                    state.credentials.key = credData.key;
                    state.credentials.region = credData.region || "centralindia";
                    
                    document.getElementById('azureRegionInput').value = state.credentials.region;
                    document.getElementById('azureKeyInput').value = state.credentials.key;
                    console.log("[Security] Credentials loaded seamlessly from server .env");
                }
            }
            
            state.apiMode = 'proxy';
            document.getElementById('modeProxy').checked = true;
            pillText.textContent = `SECURE BACKEND PROXY · REGION: ${state.credentials.region.toUpperCase()}`;
            statusPill.style.borderColor = "var(--emerald)";
            statusPill.style.color = "var(--emerald)";
            return;
        }
    } catch (err) {
        console.warn("[Backend Proxy] Local server not running on port 3000. Switching to Direct REST/SDK mode.");
    }
    
    // Fallback if local server is offline
    state.apiMode = 'direct';
    document.getElementById('modeDirect').checked = true;
    pillText.textContent = "DIRECT CLIENT SDK MODE · OFFLINE PROXY";
    statusPill.style.borderColor = "var(--cyan)";
    statusPill.style.color = "var(--cyan)";
}

// ── Event Listeners Setup ───────────────────────────────────────────────────
function setupEventListeners() {
    // Mode selector changes
    document.querySelectorAll('input[name="apiMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.apiMode = e.target.value;
            const pillText = document.getElementById('pillText');
            if (state.apiMode === 'proxy') pillText.textContent = "SECURE BACKEND PROXY MODE";
            else if (state.apiMode === 'direct') pillText.textContent = "DIRECT CLIENT SDK MODE";
            else pillText.textContent = "OFFLINE DEMO SIMULATION MODE";
        });
    });

    // Configuration drawer toggle & save
    document.getElementById('configToggleBtn').addEventListener('click', () => {
        const panel = document.getElementById('configPanel');
        const icon = document.getElementById('configIcon');
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
            icon.textContent = '▲';
        } else {
            panel.style.display = 'none';
            icon.textContent = '▼';
        }
    });

    document.getElementById('saveConfigBtn').addEventListener('click', () => {
        state.credentials.region = document.getElementById('azureRegionInput').value.trim() || "centralindia";
        state.credentials.key = document.getElementById('azureKeyInput').value.trim();
        alert(`✅ Credentials saved for region: ${state.credentials.region}`);
        document.getElementById('configPanel').style.display = 'none';
        document.getElementById('configIcon').textContent = '▼';
    });

    document.getElementById('testConnectionBtn').addEventListener('click', async () => {
        const region = document.getElementById('azureRegionInput').value.trim() || "centralindia";
        const key = document.getElementById('azureKeyInput').value.trim();
        if (!key) return alert("❌ Please enter an Azure Subscription Key to test.");
        
        try {
            // Quick REST check to Azure Token Endpoint
            const res = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
                method: 'POST',
                headers: { 'Ocp-Apim-Subscription-Key': key }
            });
            if (res.ok) {
                alert(`🚀 Connection Successful! Azure Cognitive Services authenticated in [${region}].`);
            } else {
                alert(`❌ Authentication Failed (HTTP ${res.status}). Please verify your key and region.`);
            }
        } catch (err) {
            alert(`⚠️ Network check completed. If testing locally, CORS might block token check, but browser SDK will handle it!`);
        }
    });

    // Recognition Mode Switcher (Continuous vs Quick Dictation)
    document.getElementById('modeContinuousBtn').addEventListener('click', (e) => {
        state.sttMode = 'continuous';
        e.target.classList.add('active');
        document.getElementById('modeOnceBtn').classList.remove('active');
    });
    document.getElementById('modeOnceBtn').addEventListener('click', (e) => {
        state.sttMode = 'once';
        e.target.classList.add('active');
        document.getElementById('modeContinuousBtn').classList.remove('active');
    });

    // Speech-to-Text Buttons
    document.getElementById('startRecordBtn').addEventListener('click', startSpeechRecognition);
    document.getElementById('stopRecordBtn').addEventListener('click', stopSpeechRecognition);
    document.getElementById('copySttBtn').addEventListener('click', copyTranscribedText);
    document.getElementById('downloadSttBtn').addEventListener('click', downloadTranscribedText);
    document.getElementById('clearSttBtn').addEventListener('click', clearTranscriptionConsole);
    document.getElementById('sendToTtsBtn').addEventListener('click', sendNotesToVoiceGenerator);

    // Text-to-Speech Buttons & Controls
    document.getElementById('speakBtn').addEventListener('click', startSpeechSynthesis);
    document.getElementById('stopSpeakBtn').addEventListener('click', stopSpeechSynthesis);
    document.getElementById('downloadAudioBtn').addEventListener('click', downloadSynthesizedMp3);
    document.getElementById('ttsInputText').addEventListener('input', updateSsmlPreview);
    document.getElementById('ttsVoiceSelect').addEventListener('change', updateSsmlPreview);
    document.getElementById('toggleSsmlBtn').addEventListener('click', toggleSsmlPreviewBox);
    document.getElementById('copySsmlBtn').addEventListener('click', copySsmlToClipboard);

    // Voice filter tags
    document.querySelectorAll('.voice-filters .filter-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            document.querySelectorAll('.voice-filters .filter-tag').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            filterVoiceGallery(e.target.getAttribute('data-filter'));
        });
    });

    // Quick preset pills
    document.querySelectorAll('.preset-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const presetKey = e.target.getAttribute('data-preset');
            if (PRESETS[presetKey]) {
                document.getElementById('ttsInputText').value = PRESETS[presetKey];
                updateSsmlPreview();
                // Flash animation
                e.target.style.transform = "scale(1.1)";
                setTimeout(() => e.target.style.transform = "", 200);
            }
        });
    });
}

// ── Prosody Sliders Setup (Rate & Pitch) ────────────────────────────────────
function setupProsodySliders() {
    const rateSlider = document.getElementById('rateSlider');
    const rateVal = document.getElementById('rateVal');
    rateSlider.addEventListener('input', () => {
        const val = parseFloat(rateSlider.value);
        let label = "Normal";
        if (val < 0.8) label = "Slow";
        else if (val > 1.3) label = "Fast";
        rateVal.textContent = `${val.toFixed(1)}x (${label})`;
        updateSsmlPreview();
    });

    const pitchSlider = document.getElementById('pitchSlider');
    const pitchVal = document.getElementById('pitchVal');
    pitchSlider.addEventListener('input', () => {
        const val = parseInt(pitchSlider.value, 10);
        let sign = val > 0 ? "+" : "";
        let label = "Default";
        if (val < -15) label = "Deep";
        else if (val > 15) label = "High";
        pitchVal.textContent = `${sign}${val}% (${label})`;
        updateSsmlPreview();
    });
}

// ── Helper: Reliable Speech SDK Loader with Multi-CDN Fallback ───────────────
async function ensureSpeechSDKLoaded() {
    if (window.SpeechSDK || (typeof SpeechSDK !== 'undefined' && SpeechSDK)) {
        return window.SpeechSDK || (typeof SpeechSDK !== 'undefined' ? SpeechSDK : null);
    }
    console.log("[SDK] Speech SDK not loaded in window. Dynamically loading from CDN...");
    const cdns = [
        "https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@latest/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.js",
        "https://unpkg.com/microsoft-cognitiveservices-speech-sdk@latest/distrib/browser/microsoft.cognitiveservices.speech.sdk.bundle.js",
        "/sdk/speech-sdk.js"
    ];
    for (const url of cdns) {
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.onload = () => {
                    if (window.SpeechSDK || (typeof SpeechSDK !== 'undefined' && SpeechSDK)) resolve();
                    else reject(new Error("Script loaded but SpeechSDK not defined"));
                };
                script.onerror = () => reject(new Error(`Failed to load script from ${url}`));
                document.head.appendChild(script);
            });
            if (window.SpeechSDK || (typeof SpeechSDK !== 'undefined' && SpeechSDK)) {
                console.log(`[SDK] Successfully loaded Speech SDK from ${url}`);
                return window.SpeechSDK || (typeof SpeechSDK !== 'undefined' ? SpeechSDK : null);
            }
        } catch (e) {
            console.warn(`[SDK] Could not load SDK from ${url}:`, e);
        }
    }
    return null;
}

// ============================================================================
// Phase 3: Speech-to-Text (Real-Time Transcription Implementation)
// ============================================================================

async function startSpeechRecognition() {
    if (state.isRecording) return;

    // Check offline demo mode
    if (state.apiMode === 'demo') {
        return startDemoSpeechRecognition();
    }

    // Ensure Speech SDK is available
    const SDK = await ensureSpeechSDKLoaded();
    if (!SDK) {
        alert("⚠️ Microsoft Cognitive Services Speech SDK script could not be loaded. Please check your internet connection or disable ad/content blockers.");
        return;
    }

    // Verify credentials
    const key = state.credentials.key || document.getElementById('azureKeyInput').value.trim();
    const region = state.credentials.region || document.getElementById('azureRegionInput').value.trim() || "centralindia";
    if (!key) {
        alert("❌ Missing Azure Subscription Key. Please open 'API & Proxy Configuration' and enter your Speech Service key.");
        return;
    }

    try {
        console.log(`[STT] Initializing SpeechRecognizer for region [${region}]...`);
        
        // 1. Initialize SpeechConfig
        const speechConfig = SDK.SpeechConfig.fromSubscription(key, region);
        speechConfig.speechRecognitionLanguage = document.getElementById('sttLanguageSelect').value;

        // 2. Request microphone input automatically via AudioConfig
        const audioConfig = SDK.AudioConfig.fromDefaultMicrophoneInput();

        // 3. Instantiate SpeechRecognizer
        state.recognizer = new SDK.SpeechRecognizer(speechConfig, audioConfig);

        // UI updates for recording start
        setRecordingUIState(true);
        startDurationTimer();

        // Remove placeholder if present
        const placeholder = document.querySelector('#sttOutputArea .placeholder-msg');
        if (placeholder) placeholder.style.display = 'none';

        // 4. Bind event listeners for real-time DOM updates
        state.recognizer.recognizing = (s, e) => {
            // Interim hypothesis streaming
            if (e.result.text && e.result.text.trim()) {
                state.interimText = e.result.text;
                document.getElementById('interimText').textContent = ` ${state.interimText}`;
                // Keep scroll at bottom
                const consoleArea = document.getElementById('sttOutputArea');
                consoleArea.scrollTop = consoleArea.scrollHeight;
            }
        };

        state.recognizer.recognized = (s, e) => {
            // Finalized speech phrase recognized
            if (e.result.reason === SDK.ResultReason.RecognizedSpeech) {
                const text = e.result.text.trim();
                if (text) {
                    state.finalizedText += (state.finalizedText ? " " : "") + text;
                    state.interimText = "";
                    
                    document.getElementById('finalizedText').textContent = state.finalizedText;
                    document.getElementById('interimText').textContent = "";
                    
                    // Update live analytics & extract topics
                    updateAnalytics();
                    
                    // Keep scroll at bottom
                    const consoleArea = document.getElementById('sttOutputArea');
                    consoleArea.scrollTop = consoleArea.scrollHeight;
                }
            } else if (e.result.reason === SDK.ResultReason.NoMatch) {
                console.log("[STT] No speech could be recognized.");
            }
        };

        state.recognizer.canceled = (s, e) => {
            console.error(`[STT Canceled] Reason: ${e.reason}`);
            if (e.reason === SDK.CancellationReason.Error) {
                console.error(`[STT Error Details]: ${e.errorDetails}`);
                alert(`❌ Speech Recognition Error: ${e.errorDetails}\n\nPlease check your Azure Key and Region (${region}).`);
            }
            stopSpeechRecognition();
        };

        state.recognizer.sessionStopped = (s, e) => {
            console.log("[STT Session Stopped]");
            stopSpeechRecognition();
        };

        // 5. Start recognition based on mode
        if (state.sttMode === 'continuous') {
            await state.recognizer.startContinuousRecognitionAsync();
            console.log("[STT] Continuous recognition started successfully.");
        } else {
            // Single burst dictation
            state.recognizer.recognizeOnceAsync(
                result => {
                    console.log("[STT] Single burst dictation complete:", result.text);
                    stopSpeechRecognition();
                },
                error => {
                    console.error("[STT] Error during single dictation:", error);
                    stopSpeechRecognition();
                }
            );
        }

    } catch (err) {
        console.error("[STT Initialization Error]:", err);
        alert(`❌ Failed to start Speech-to-Text microphone: ${err.message || err}\n\nPlease verify your browser has microphone permissions enabled.`);
        setRecordingUIState(false);
    }
}

function stopSpeechRecognition() {
    if (!state.isRecording) return;

    console.log("[STT] Stopping speech recognition session...");
    setRecordingUIState(false);
    stopDurationTimer();

    if (state.recognizer) {
        try {
            if (state.sttMode === 'continuous') {
                state.recognizer.stopContinuousRecognitionAsync(
                    () => {
                        state.recognizer.close();
                        state.recognizer = null;
                        console.log("[STT] Continuous recognizer closed cleanly.");
                    },
                    err => {
                        console.error("[STT Stop Error]:", err);
                        state.recognizer.close();
                        state.recognizer = null;
                    }
                );
            } else {
                state.recognizer.close();
                state.recognizer = null;
            }
        } catch (e) {
            console.error("[STT Cleanup Error]:", e);
            state.recognizer = null;
        }
    }

    // Clean interim text
    state.interimText = "";
    document.getElementById('interimText').textContent = "";
    updateAnalytics();
}

function setRecordingUIState(recording) {
    state.isRecording = recording;
    const startBtn = document.getElementById('startRecordBtn');
    const stopBtn = document.getElementById('stopRecordBtn');
    const banner = document.getElementById('recordingBanner');
    const waveBars = document.getElementById('sttWaveBars');

    if (recording) {
        startBtn.classList.add('recording');
        startBtn.innerHTML = `<span class="record-icon">🔴</span> Listening in Progress...`;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        banner.style.display = 'flex';
        waveBars.classList.add('active');
    } else {
        startBtn.classList.remove('recording');
        startBtn.innerHTML = `<span class="record-icon">🔴</span> Start Live Recording`;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        banner.style.display = 'none';
        waveBars.classList.remove('active');
    }
}

// ── Offline Demo Simulation for STT ─────────────────────────────────────────
function startDemoSpeechRecognition() {
    setRecordingUIState(true);
    startDurationTimer();

    const placeholder = document.querySelector('#sttOutputArea .placeholder-msg');
    if (placeholder) placeholder.style.display = 'none';

    const demoSentences = [
        "Welcome to Speech AI Studio, our Azure Cognitive Services intelligence studio.",
        "Real-time speech-to-text captures live microphone audio with zero perceptible latency.",
        "Notice how neural language models transcribe medical, technical, and business terminology accurately.",
        "You can instantly send these transcribed notes directly to our neural voice generator!"
    ];

    let sentenceIdx = 0;
    let wordIdx = 0;
    
    state.demoInterval = setInterval(() => {
        if (!state.isRecording) {
            clearInterval(state.demoInterval);
            return;
        }

        const currentSentence = demoSentences[sentenceIdx % demoSentences.length];
        const words = currentSentence.split(" ");

        if (wordIdx < words.length) {
            const word = words[wordIdx];
            state.interimText += (state.interimText ? " " : "") + word;
            document.getElementById('interimText').textContent = ` ${state.interimText}`;
            wordIdx++;
        } else {
            // Finalize sentence
            state.finalizedText += (state.finalizedText ? " " : "") + state.interimText;
            state.interimText = "";
            document.getElementById('finalizedText').textContent = state.finalizedText;
            document.getElementById('interimText').textContent = "";
            
            updateAnalytics();
            wordIdx = 0;
            sentenceIdx++;
        }
        
        const consoleArea = document.getElementById('sttOutputArea');
        consoleArea.scrollTop = consoleArea.scrollHeight;
    }, 280);
}

// ============================================================================
// Phase 4: Text-to-Speech (Neural Voice Generation Implementation)
// ============================================================================

async function startSpeechSynthesis() {
    if (state.isPlaying) return;

    const text = document.getElementById('ttsInputText').value.trim();
    if (!text) {
        alert("⚠️ Please enter some text or script in the text editor to synthesize.");
        document.getElementById('ttsInputText').focus();
        return;
    }

    // Check offline demo mode
    if (state.apiMode === 'demo') {
        return startDemoSpeechSynthesis(text);
    }

    const SDK = await ensureSpeechSDKLoaded();
    if (!SDK) {
        alert("⚠️ Speech SDK is not loaded. Please check your internet connection.");
        return;
    }

    const key = state.credentials.key || document.getElementById('azureKeyInput').value.trim();
    const region = state.credentials.region || document.getElementById('azureRegionInput').value.trim() || "centralindia";
    if (!key) {
        alert("❌ Missing Azure Subscription Key for Speech Synthesis.");
        return;
    }

    try {
        console.log(`[TTS] Initializing SpeechSynthesizer for region [${region}]...`);
        
        // 1. Initialize SpeechConfig
        const speechConfig = SDK.SpeechConfig.fromSubscription(key, region);
        const selectedVoice = document.getElementById('ttsVoiceSelect').value;
        speechConfig.speechSynthesisVoiceName = selectedVoice;

        // 2. Instantiate SpeechSynthesizer (automatically outputs to default browser speakers!)
        state.synthesizer = new SDK.SpeechSynthesizer(speechConfig);

        setPlaybackUIState(true);

        // 3. Build custom SSML incorporating rate and pitch adjustments
        const rateVal = document.getElementById('rateSlider').value;
        const pitchVal = document.getElementById('pitchSlider').value;
        const pitchSign = pitchVal > 0 ? "+" : "";

        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="${selectedVoice}">
        <prosody rate="${rateVal}" pitch="${pitchSign}${pitchVal}%">
            ${text}
        </prosody>
    </voice>
</speak>`;

        console.log(`[TTS] Synthesizing SSML payload:\n`, ssml);

        // 4. Execute speakSsmlAsync
        state.synthesizer.speakSsmlAsync(
            ssml,
            result => {
                if (result.reason === SDK.ResultReason.SynthesizingAudioCompleted) {
                    console.log(`[TTS Success] Audio synthesized and played cleanly (${result.audioData.byteLength} bytes).`);
                } else if (result.reason === SDK.ResultReason.Canceled) {
                    const cancellation = SDK.SpeechSynthesisCancellationDetails.fromResult(result);
                    console.error(`[TTS Canceled]: ${cancellation.reason}`);
                    if (cancellation.reason === SDK.CancellationReason.Error) {
                        console.error(`[TTS Error Details]: ${cancellation.errorDetails}`);
                        alert(`❌ Speech Synthesis Error: ${cancellation.errorDetails}`);
                    }
                }
                stopSpeechSynthesis();
            },
            error => {
                console.error(`[TTS Exception]:`, error);
                alert(`❌ Speech Synthesis failed: ${error}`);
                stopSpeechSynthesis();
            }
        );

    } catch (err) {
        console.error("[TTS Initialization Error]:", err);
        alert(`❌ Could not initiate Text-to-Speech: ${err.message || err}`);
        setPlaybackUIState(false);
    }
}

function stopSpeechSynthesis() {
    if (!state.isPlaying) return;

    console.log("[TTS] Stopping speech synthesis playback...");
    setPlaybackUIState(false);

    if (state.synthesizer) {
        try {
            state.synthesizer.close();
            state.synthesizer = null;
        } catch (e) {
            console.error("[TTS Cleanup Error]:", e);
            state.synthesizer = null;
        }
    }
}

function setPlaybackUIState(playing) {
    state.isPlaying = playing;
    const speakBtn = document.getElementById('speakBtn');
    const stopSpeakBtn = document.getElementById('stopSpeakBtn');
    const banner = document.getElementById('playingBanner');
    const waveBars = document.getElementById('ttsWaveBars');

    if (playing) {
        speakBtn.innerHTML = `<span class="speak-icon">🔊</span> Synthesizing & Speaking...`;
        speakBtn.disabled = true;
        stopSpeakBtn.disabled = false;
        banner.style.display = 'flex';
        waveBars.classList.add('active');
    } else {
        speakBtn.innerHTML = `<span class="speak-icon">🔊</span> Synthesizing & Speak Now`;
        speakBtn.disabled = false;
        stopSpeakBtn.disabled = true;
        banner.style.display = 'none';
        waveBars.classList.remove('active');
    }
}

function startDemoSpeechSynthesis(text) {
    setPlaybackUIState(true);
    // Calculate approximate speaking time (150 WPM -> ~2.5 words/sec)
    const words = text.split(" ").length;
    const durationMs = Math.max(2500, Math.min(10000, (words / 2.5) * 1000));
    
    console.log(`[Demo TTS] Simulating audio playback for ${durationMs}ms...`);
    setTimeout(() => {
        if (state.isPlaying) {
            stopSpeechSynthesis();
            console.log("[Demo TTS] Playback complete.");
        }
    }, durationMs);
}

// ── SSML Preview Box & Helper Functions ─────────────────────────────────────
function updateSsmlPreview() {
    const text = document.getElementById('ttsInputText').value.trim() || "Enter text to see generated SSML...";
    const selectedVoice = document.getElementById('ttsVoiceSelect').value;
    const rateVal = document.getElementById('rateSlider').value;
    const pitchVal = document.getElementById('pitchSlider').value;
    const pitchSign = pitchVal > 0 ? "+" : "";

    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="${selectedVoice}">
        <prosody rate="${rateVal}" pitch="${pitchSign}${pitchVal}%">
            ${text}
        </prosody>
    </voice>
</speak>`;

    document.getElementById('ssmlCodeDisplay').textContent = ssml;
}

function toggleSsmlPreviewBox() {
    const box = document.getElementById('ssmlPreviewBox');
    const btn = document.getElementById('toggleSsmlBtn');
    if (box.style.display === 'none' || !box.style.display) {
        box.style.display = 'block';
        btn.textContent = '🙈 Hide SSML XML';
    } else {
        box.style.display = 'none';
        btn.textContent = '🔍 Inspect SSML XML';
    }
}

function copySsmlToClipboard() {
    const ssml = document.getElementById('ssmlCodeDisplay').textContent;
    navigator.clipboard.writeText(ssml);
    const btn = document.getElementById('copySsmlBtn');
    btn.textContent = "✅ Copied!";
    setTimeout(() => btn.textContent = "📋 Copy XML", 1500);
}

function filterVoiceGallery(filter) {
    const select = document.getElementById('ttsVoiceSelect');
    const options = select.querySelectorAll('option');
    options.forEach(opt => {
        const val = opt.value;
        if (filter === 'all') opt.style.display = '';
        else if (filter === 'us' && (val.startsWith('en-US') || val.startsWith('en-GB'))) opt.style.display = '';
        else if (filter === 'in' && (val.startsWith('en-IN') || val.startsWith('hi-IN'))) opt.style.display = '';
        else if (filter === 'multi' && (!val.startsWith('en-US') && !val.startsWith('en-IN') && !val.startsWith('en-GB'))) opt.style.display = '';
        else opt.style.display = 'none';
    });
}

// ============================================================================
// Interactive Utilities & Real-Time Analytics Telemetry
// ============================================================================

function sendNotesToVoiceGenerator() {
    const text = state.finalizedText.trim();
    if (!text) {
        alert("⚠️ No transcribed text available yet. Please record some speech first!");
        return;
    }
    const ttsInput = document.getElementById('ttsInputText');
    ttsInput.value = text;
    updateSsmlPreview();
    
    // Smooth scroll and flash highlight
    ttsInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ttsInput.style.transition = "box-shadow 0.3s ease, border-color 0.3s ease";
    ttsInput.style.borderColor = "var(--purple)";
    ttsInput.style.boxShadow = "0 0 25px rgba(168, 85, 247, 0.8)";
    
    setTimeout(() => {
        ttsInput.style.borderColor = "";
        ttsInput.style.boxShadow = "";
    }, 1500);
}

function copyTranscribedText() {
    if (!state.finalizedText) return alert("⚠️ Nothing to copy yet!");
    navigator.clipboard.writeText(state.finalizedText);
    const btn = document.getElementById('copySttBtn');
    btn.textContent = "✅ Copied!";
    setTimeout(() => btn.textContent = "📋 Copy", 1500);
}

function downloadTranscribedText() {
    if (!state.finalizedText) return alert("⚠️ Nothing to export yet!");
    const blob = new Blob([`======================================================\nSPEECH AI STUDIO · AZURE AI SPEECH TRANSCRIPTION NOTES\nDate: ${new Date().toLocaleString()}\n======================================================\n\n${state.finalizedText}\n`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Speech AI Studio-Transcription-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function clearTranscriptionConsole() {
    if (confirm("Are you sure you want to clear the transcription notes?")) {
        state.finalizedText = "";
        state.interimText = "";
        document.getElementById('finalizedText').textContent = "";
        document.getElementById('interimText').textContent = "";
        document.querySelector('#sttOutputArea .placeholder-msg').style.display = 'block';
        state.topics.clear();
        updateAnalytics();
    }
}

async function downloadSynthesizedMp3() {
    const text = document.getElementById('ttsInputText').value.trim();
    if (!text) return alert("⚠️ Enter some text to generate audio.");
    
    const voice = document.getElementById('ttsVoiceSelect').value;
    const rate = document.getElementById('rateSlider').value;
    const pitch = document.getElementById('pitchSlider').value + "%";
    
    const btn = document.getElementById('downloadAudioBtn');
    const origText = btn.innerHTML;
    btn.innerHTML = "⏳ Synthesizing Audio on Server...";
    btn.disabled = true;
    
    try {
        const res = await fetch('/api/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice, rate, pitch })
        });
        
        if (!res.ok) {
            throw new Error(`Server returned HTTP ${res.status}`);
        }
        
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Speech AI Studio-${voice}-${Date.now()}.mp3`;
        a.click();
        URL.revokeObjectURL(url);
        console.log("[Download] MP3 file generated and downloaded successfully!");
    } catch (err) {
        console.error("[Download Error]:", err);
        alert(`⚠️ Could not generate audio file via local proxy: ${err.message}.\nMake sure 'node server.js' is running on port 3000!`);
    } finally {
        btn.innerHTML = origText;
        btn.disabled = false;
    }
}

// ── Analytics & Natural Language Processing Telemetry ───────────────────────
function updateAnalytics() {
    const text = state.finalizedText.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;

    document.getElementById('statWordCount').textContent = words;
    document.getElementById('statCharCount').textContent = chars;

    // Calculate WPM if duration > 0
    const durationSec = parseFloat(document.getElementById('statDuration').textContent) || 1;
    const wpm = words > 0 ? Math.round((words / Math.max(1, durationSec)) * 60) : 0;
    document.getElementById('statWpm').innerHTML = `${wpm} <span style="font-size: 1rem; font-weight: 500;">WPM</span>`;
    
    let wpmLabel = "Normal Conversational Speed";
    if (wpm > 160) wpmLabel = "⚡ Fast Pace / Rapid Speech";
    else if (wpm > 0 && wpm < 100) wpmLabel = "🐢 Deliberate / Measured Pace";
    document.getElementById('statWpmLabel').textContent = wpmLabel;

    // Sentiment / Tone calculation
    let tone = "Neutral";
    const lowerText = text.toLowerCase();
    if (lowerText.match(/(urgent|emergency|error|failed|issue|critical|alert|problem)/)) tone = "⚠️ Urgent / Action Required";
    else if (lowerText.match(/(great|thank|successful|happy|awesome|welcome|resolved|excellent)/)) tone = "🌟 Positive & Friendly";
    else if (lowerText.match(/(system|azure|cloud|network|diagnostic|analysis|data|server)/)) tone = "💼 Technical / Professional";
    document.getElementById('statTone').textContent = text ? tone : "Ready";

    // Keyword topic extraction
    const topicKeywords = [
        "Azure", "AI", "Cognitive Services", "Speech", "Cloud", "Neural", "Server", "Proxy",
        "Network", "Latency", "Diagnostic", "Cardiology", "Patient", "Customer Support",
        "Bootcamp", "Project", "Security", "Python", "JavaScript", "Database", "Algorithm",
        "Meeting", "Action Item", "Deadline", "Release", "Deployment"
    ];

    topicKeywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(text)) {
            state.topics.add(kw);
        }
    });

    const topicsBox = document.getElementById('statTopics');
    if (state.topics.size > 0) {
        topicsBox.innerHTML = "";
        state.topics.forEach(t => {
            const tag = document.createElement('span');
            tag.className = 'topic-tag';
            tag.textContent = `# ${t}`;
            topicsBox.appendChild(tag);
        });
    } else {
        topicsBox.innerHTML = `<span class="topic-tag empty-tag">Speak or transcribe notes to extract key topics automatically...</span>`;
    }
}

function startDurationTimer() {
    state.startTime = Date.now();
    const durationEl = document.getElementById('statDuration');
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        if (!state.isRecording) {
            clearInterval(state.timerInterval);
            return;
        }
        const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);
        durationEl.textContent = `${elapsed}s`;
        updateAnalytics();
    }, 200);
}

function stopDurationTimer() {
    clearInterval(state.timerInterval);
}

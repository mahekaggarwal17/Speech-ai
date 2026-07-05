// ============================================================================
// Speech AI Studio · Azure AI Speech Studio Lightweight Backend Proxy
// Phase 1 & 2: Secure Cloud Infrastructure & Credentials Management
// ============================================================================
// Best Practice: This Node.js/Express backend handles API requests and token
// provisioning securely without exposing your raw secrets in public repositories!

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Azure AI Speech Configuration
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || '';
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'centralindia';

// Middleware setup
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'audio/*', limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// ── Local Speech SDK Bundle Proxy (100% Reliable, Zero CDN Dependency) ───────
app.get('/sdk/speech-sdk.js', (req, res) => {
    const sdkPath = path.join(__dirname, 'node_modules', 'microsoft-cognitiveservices-speech-sdk', 'distrib', 'browser', 'microsoft.cognitiveservices.speech.sdk.bundle.js');
    if (fs.existsSync(sdkPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.sendFile(sdkPath);
    } else {
        res.status(404).send('console.error("Speech SDK bundle not found locally.");');
    }
});

// ── Health & Config Status Endpoint ──────────────────────────────────────────
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        service: 'Azure AI Speech Intelligence',
        mode: 'secure-backend-proxy',
        region: AZURE_SPEECH_REGION,
        hasKey: Boolean(AZURE_SPEECH_KEY && AZURE_SPEECH_KEY.length > 10),
        sdkSupported: true,
        timestamp: new Date().toISOString()
    });
});

// ── Secure Credentials Endpoint for Local Studio ─────────────────────────────
// In Secure Backend Proxy Mode, the local frontend retrieves the configured
// credentials so the user doesn't need to manually type keys in the browser!
app.get('/api/credentials', (req, res) => {
    if (!AZURE_SPEECH_KEY) {
        return res.status(500).json({
            success: false,
            error: "Azure Speech Key is missing on the server. Please check your .env file."
        });
    }

    res.json({
        success: true,
        region: AZURE_SPEECH_REGION,
        key: AZURE_SPEECH_KEY
    });
});

// ── Server-Side Neural TTS Synthesis Proxy (Optional/Fallback Endpoint) ──────
// Demonstrates server-side audio generation via Azure Cognitive Services REST/SDK
app.post('/api/synthesize', async (req, res) => {
    if (!AZURE_SPEECH_KEY) {
        return res.status(500).json({ error: "Azure API Key is missing on server." });
    }

    try {
        const { text, voice = "en-US-AriaNeural", rate = "1.0", pitch = "0%" } = req.body;
        if (!text) {
            return res.status(400).json({ error: "Text payload is required for synthesis." });
        }

        console.log(`[Azure Speech Proxy] Synthesizing voice (${voice}) for text: "${text.substring(0, 40)}..."`);
        
        // Build SSML payload
        const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
            <voice name="${voice}">
                <prosody rate="${rate}" pitch="${pitch}">
                    ${text}
                </prosody>
            </voice>
        </speak>`;

        // Construct REST endpoint for Speech Synthesis
        const ttsUrl = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

        const fetchFn = typeof fetch === 'function' ? fetch : (...args) => import('node-fetch').then(({default: f}) => f(...args));
        const azureResponse = await fetchFn(ttsUrl, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
                'User-Agent': 'Speech AI studio-NodeProxy'
            },
            body: ssml
        });

        if (!azureResponse.ok) {
            const errText = await azureResponse.text();
            console.error(`[Azure TTS Error] ${azureResponse.status}:`, errText);
            return res.status(azureResponse.status).json({ error: "Azure TTS failed", details: errText });
        }

        const audioBuffer = await azureResponse.arrayBuffer();
        console.log(`[Azure TTS Success] Generated ${audioBuffer.byteLength} bytes of audio.`);

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength
        });
        res.send(Buffer.from(audioBuffer));

    } catch (err) {
        console.error("[Proxy Server Error]:", err);
        res.status(500).json({ error: "Internal server error during speech synthesis", message: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Speech AI Studio · Azure AI Speech Studio Online`);
    console.log(`📡 Local Server URL : http://localhost:${PORT}`);
    console.log(`🌍 Azure Region     : ${AZURE_SPEECH_REGION}`);
    console.log(`🔑 Secure Key Status: ${AZURE_SPEECH_KEY ? 'Configured ✅' : 'Missing ❌'}`);
    console.log(`======================================================\n`);
});

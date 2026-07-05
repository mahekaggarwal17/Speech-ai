# 🎙️ Speech AI Studio

Speech AI Studio is a modern web application built with **Microsoft Azure AI Speech Services** that demonstrates both **Speech-to-Text (STT)** and **Text-to-Speech (TTS)** capabilities. The application provides an interactive browser-based interface for converting spoken words into text and generating natural-sounding speech using Azure Neural Voices.

The project also showcases secure Azure API integration through a lightweight **Node.js** and **Express.js** backend, making it an excellent learning project for developers exploring cloud-based AI services.

---

## 🚀 Features

* 🎤 Real-time Speech-to-Text transcription
* 🔊 High-quality Neural Text-to-Speech synthesis
* 🌍 Support for multiple languages
* 🎙️ Azure Neural Voice selection
* ⚙️ Adjustable speech rate and pitch
* 🔒 Secure credential management using `.env`
* 📊 Live telemetry and session dashboard
* 💻 Responsive and user-friendly interface
* 🌐 Express.js backend acting as a secure Azure API proxy

---

## 🛠️ Technologies Used

* HTML5
* CSS3
* JavaScript (ES6)
* Node.js
* Express.js
* Microsoft Azure AI Speech Service
* Azure Speech SDK
* Dotenv

---

## 📂 Project Structure

```text
speech-ai-project/
│
├── index.html
├── style.css
├── script.js
├── server.js
├── package.json
├── .gitignore
├── .env.example
├── README.md
└── assets/
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/mahekaggarwal17/speech-ai-project.git
```

### 2. Navigate to the project folder

```bash
cd speech-ai-project
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create a `.env` file

```env
AZURE_SPEECH_KEY=YOUR_AZURE_SPEECH_KEY
AZURE_SPEECH_REGION=YOUR_REGION
PORT=3000
```

### 5. Start the application

```bash
npm start
```

### 6. Open the application

```text
http://localhost:3000
```

---

## 📸 Application Modules

### 🎤 Speech Recognition

* Live microphone transcription
* Continuous speech recognition
* Multiple language support

### 🔊 Speech Synthesis

* Azure Neural Voices
* Adjustable speaking rate
* Adjustable voice pitch
* SSML-based speech generation

### 📊 Dashboard

* Service status monitoring
* Recognition metrics
* Voice information
* Session statistics

---

## 🔐 Security

To protect sensitive information, Azure credentials are **never exposed on the frontend**.

Security is implemented using:

* `.env` configuration
* `.gitignore`
* Express.js backend proxy

---

## ☁️ Azure Services Used

* Azure AI Speech

  * Speech-to-Text
  * Text-to-Speech
* Azure Speech SDK

---

## 🎯 Learning Outcomes

This project demonstrates:

* Integration with Microsoft Azure AI Speech Services
* Secure API key management
* Backend development using Node.js and Express.js
* REST API communication
* Browser-based Speech SDK implementation
* Responsive web application development

---

## 👩‍💻 Author

**Mehek Aggarwal**

GitHub: https://github.com/mahekaggarwal17

---

## 📄 License

This project is intended for **educational and learning purposes** and is provided as a demonstration of Microsoft Azure AI Speech Services integration.

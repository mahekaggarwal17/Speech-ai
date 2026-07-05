🎙️ Speech AI Studio
An interactive web application built using Microsoft Azure AI Speech Services that demonstrates Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities through a modern browser interface.
This project showcases real-time speech recognition, neural voice synthesis, configurable voice settings, and secure Azure API integration using a lightweight Node.js backend.

🚀 Features
🎤 Real-time Speech-to-Text transcription
🔊 Neural Text-to-Speech synthesis
🌍 Multiple language support
🎙️ Azure Neural Voice selection
⚙️ Adjustable speech rate and pitch
🔒 Secure Azure credentials using .env
📊 Live telemetry dashboard
💻 Responsive modern UI
🌐 Local backend proxy using Express.js

🛠️ Technologies Used
HTML5
CSS3
JavaScript (ES6)
Node.js
Express.js
Microsoft Azure AI Speech Service
Azure Speech SDK
Dotenv

📂 Project Structure
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



⚙️ Installation
Clone the repository
git clone https://github.com/mahekaggarwal17/speech-ai-project.git
Go to the project directory
cd speech-ai-project
Install dependencies
npm install
Create a .env file
AZURE_SPEECH_KEY=YOUR_AZURE_SPEECH_KEY
AZURE_SPEECH_REGION=YOUR_REGION
PORT=3000
Start the application
npm start
Open your browser
http://localhost:3000



📸 Application Modules
Speech Recognition
Live microphone transcription
Continuous recognition
Multiple language support
Speech Synthesis
Azure Neural Voices
Adjustable speaking rate
Adjustable pitch
SSML generation
Dashboard
Service status
Recognition metrics
Voice information
Session statistics

🔐 Security
Azure API credentials are never stored inside the frontend.
Sensitive information is securely managed using:
.env
.gitignore
Express backend proxy

📚 Azure Services Used
Azure AI Speech
Speech-to-Text
Text-to-Speech
Azure Speech SDK

🎯 Learning Outcomes
This project demonstrates:
Azure AI Speech integration
Secure API management
Node.js backend development
REST API communication
Browser Speech SDK usage
Responsive UI development

👩‍💻 Author
Mehek Aggarwal
GitHub: https://github.com/mahekaggarwal17

📄 License
This project is developed for educational and learning purposes.


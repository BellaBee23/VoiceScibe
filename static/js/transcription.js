class SpeechTranscriber {
    constructor() {
        if (!('webkitSpeechRecognition' in window)) {
            console.error('Speech recognition not supported');
            document.getElementById('transcription').textContent = 
                'Speech recognition is not supported in this browser. Please use Chrome.';
            return;
        }

        this.recognition = new webkitSpeechRecognition();
        this.transcriptionDiv = document.getElementById('transcription');
        this.recordButton = document.getElementById('recordButton');
        this.setupRecognition();
    }

    setupRecognition() {
        // Configure recognition settings
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        // Handle results
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update the display
            if (finalTranscript) {
                const existingText = this.transcriptionDiv.textContent;
                if (existingText === 'Transcription will appear here...' || 
                    existingText === 'Listening...') {
                    this.transcriptionDiv.textContent = finalTranscript;
                } else {
                    this.transcriptionDiv.textContent += finalTranscript;
                }
            }
            if (interimTranscript) {
                const finalText = this.transcriptionDiv.textContent || '';
                this.transcriptionDiv.innerHTML = finalText + 
                    '<span style="color: gray">' + interimTranscript + '</span>';
            }
        };

        // Handle errors
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                this.transcriptionDiv.textContent = 
                    'Please allow microphone access to use transcription.';
            }
        };

        // Sync with recording button
        this.recordButton.addEventListener('click', () => {
            if (window.voiceRecorder.isRecording) {
                this.startTranscription();
            } else {
                this.stopTranscription();
            }
        });
    }

    startTranscription() {
        this.transcriptionDiv.textContent = 'Listening...';
        try {
            this.recognition.start();
        } catch (e) {
            console.error('Failed to start recognition:', e);
            this.transcriptionDiv.textContent = 
                'Error starting transcription. Please refresh and try again.';
        }
    }

    stopTranscription() {
        try {
            this.recognition.stop();
        } catch (e) {
            console.error('Failed to stop recognition:', e);
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.speechTranscriber = new SpeechTranscriber();
});

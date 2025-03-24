class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
        this.startTime = 0;
        this.timerInterval = null;

        this.recordButton = document.getElementById('recordButton');
        this.saveButton = document.getElementById('saveButton');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.timer = document.getElementById('timer');
        this.recordingsList = document.getElementById('recordingsList');

        this.initializeEventListeners();
        this.loadSavedRecordings();
    }

    initializeEventListeners() {
        this.recordButton.addEventListener('click', () => this.toggleRecording());
        this.saveButton.addEventListener('click', () => this.saveRecording());
    }

    async toggleRecording() {
        if (!this.isRecording) {
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.startRecording();
            } catch (error) {
                this.showError('Microphone access denied. Please enable microphone access.');
            }
        } else {
            this.stopRecording();
        }
    }

    startRecording() {
        this.mediaRecorder = new MediaRecorder(this.stream);
        this.audioChunks = [];
        
        this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstart = () => {
            this.isRecording = true;
            this.recordButton.innerHTML = '<i class="bi bi-stop-circle"></i> Stop';
            this.recordButton.classList.add('recording');
            this.recordingStatus.textContent = 'Recording';
            this.recordingStatus.className = 'badge bg-danger';
            this.startTimer();
        };

        this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            this.audioPlayer.src = URL.createObjectURL(audioBlob);
            this.saveButton.disabled = false;
        };

        this.mediaRecorder.start();
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            this.recordButton.innerHTML = '<i class="bi bi-record-circle"></i> Record';
            this.recordButton.classList.remove('recording');
            this.recordingStatus.textContent = 'Ready';
            this.recordingStatus.className = 'badge bg-secondary';
            this.stopTimer();
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    saveRecording() {
        const timestamp = new Date().toISOString();
        const recording = {
            id: Date.now(),
            timestamp: timestamp,
            audio: this.audioPlayer.src,
            transcription: document.getElementById('transcription').textContent
        };

        let recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
        recordings.push(recording);
        localStorage.setItem('recordings', JSON.stringify(recordings));

        this.addRecordingToList(recording);
        this.saveButton.disabled = true;
    }

    loadSavedRecordings() {
        const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
        recordings.forEach(recording => this.addRecordingToList(recording));
    }

    addRecordingToList(recording) {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center recording-item';
        item.innerHTML = `
            <div>
                <h6 class="mb-0">Recording ${new Date(recording.timestamp).toLocaleString()}</h6>
                <small class="text-muted">Click to play</small>
            </div>
            <button class="btn btn-sm btn-danger delete-recording" data-id="${recording.id}">
                <i class="bi bi-trash"></i>
            </button>
        `;

        item.querySelector('div').addEventListener('click', () => {
            this.audioPlayer.src = recording.audio;
            document.getElementById('transcription').textContent = recording.transcription;
        });

        item.querySelector('.delete-recording').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteRecording(recording.id);
            item.remove();
        });

        this.recordingsList.prepend(item);
    }

    deleteRecording(id) {
        let recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
        recordings = recordings.filter(recording => recording.id !== id);
        localStorage.setItem('recordings', JSON.stringify(recordings));
    }

    showError(message) {
        const errorToast = new bootstrap.Toast(document.getElementById('errorToast'));
        document.getElementById('errorMessage').textContent = message;
        errorToast.show();
    }
}

// Initialize the voice recorder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.voiceRecorder = new VoiceRecorder();
});

const slider = document.getElementById('useless-slider');
slider.addEventListener('input', adjustBrightness);

const tgLogo = document.getElementById('tg-logo');

const toggleButton = document.getElementById('listenButton'); // Button to start/stop listening

const errorDiv = document.getElementById('errorDiv');

let isListening = false; // Flag to control microphone listening
let audioStream = null; // To store the microphone stream
let analyzeTone = false; // Flag to toggle between volume and tone analysis

toggleButton.addEventListener('click', toggleMicrophone);

function adjustBrightness() {
    const brightness = slider.value;
    tgLogo.style.filter = `brightness(${brightness}%)`;
}

// Function to toggle microphone listening
async function toggleMicrophone() {
    if (isListening) {
        stopListening();
    } else {
        await listenToMicrophone();
    }
}

// Function to listen to the microphone
async function listenToMicrophone() {
    isListening = true;
    toggleButton.textContent = 'Stop sensor';

    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // Set FFT size for frequency resolution
        const source = audioContext.createMediaStreamSource(audioStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Function to analyze audio
        function analyzeAudio() {
            if (!isListening) return; // Stop analyzing if listening is stopped
            analyser.getByteFrequencyData(dataArray);
           
            // Volume analysis
            const volume = dataArray.reduce((a, b) => a + b) / dataArray.length; // Calculate average volume
            slider.value = Math.min(volume, 100);
            tgLogo.style.filter = `brightness(${Math.min(volume, 100)}%)`;
        }

        // Set interval to update every 500ms
        const intervalId = setInterval(() => {
            if (!isListening) {
                clearInterval(intervalId); // Stop the interval when listening stops
                return;
            }
            analyzeAudio();
        }, 500);

    } catch (err) {
        console.error('Error accessing microphone:', err);
        errorDiv.innerHTML = '';
        const errorMessage = document.createElement('h1');
        errorMessage.innerHTML = 'Error accessing microphone. Please check your permissions.';
        errorDiv.appendChild(errorMessage);
        isListening = false; // Reset the flag if an error occurs
        toggleButton.textContent = 'Volum-sensor';
    }
}

// Function to stop listening to the microphone
function stopListening() {
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop()); // Stop all tracks in the stream
        audioStream = null; // Clear the stream
    }
    isListening = false; // Reset the listening flag
    toggleButton.textContent = 'Volum-sensor';
}

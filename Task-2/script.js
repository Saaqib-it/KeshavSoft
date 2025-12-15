document.addEventListener('DOMContentLoaded', () => {
    // === Navigation Logic ===
    const landingPage = document.getElementById('landing-page');
    const mainApp = document.getElementById('main-app');
    const currentModeTitle = document.getElementById('current-mode-title');

    // Sections
    const sectionVoiceScribe = document.getElementById('section-voice-scribe');
    const sectionVoiceBox = document.getElementById('section-voice-box');

    // Global expose
    window.startApp = (mode) => {
        landingPage.classList.remove('active');
        landingPage.classList.add('hidden'); // Ensure it hides

        mainApp.classList.remove('hidden');
        mainApp.classList.add('active');

        if (mode === 'voice-scribe') {
            currentModeTitle.textContent = "SpeakIT";
            sectionVoiceScribe.classList.add('active'); // CSS Handles display
            sectionVoiceScribe.style.display = 'block';
            sectionVoiceBox.classList.remove('active');
            sectionVoiceBox.style.display = 'none';
        } else {
            currentModeTitle.textContent = "HearIT";
            sectionVoiceBox.classList.add('active');
            sectionVoiceBox.style.display = 'block';
            sectionVoiceScribe.classList.remove('active');
            sectionVoiceScribe.style.display = 'none';
        }
    };

    window.goBackToMenu = () => {
        // Stop any active processes
        if (stopRecording) stopRecording();
        if (speechSynthesis.speaking) speechSynthesis.cancel();

        mainApp.classList.remove('active');
        mainApp.classList.add('hidden');

        landingPage.classList.remove('hidden');
        landingPage.classList.add('active');

        // Reset sections
        sectionVoiceScribe.style.display = 'none';
        sectionVoiceBox.style.display = 'none';
    };

    // === Voice Scribe (Speech to Text) Logic ===
    const micBtn = document.getElementById('mic-btn');
    const statusText = document.getElementById('recording-status');
    const outputText = document.getElementById('voice-text-output');

    let recognition;
    let isRecording = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isRecording = true;
            micBtn.classList.add('listening');
            statusText.textContent = "Listening...";
            statusText.style.color = "#818cf8";
        };

        recognition.onend = () => {
            isRecording = false;
            micBtn.classList.remove('listening');
            statusText.textContent = "Tap directly on the microphone to start listening";
            statusText.style.color = "#94a3b8";
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Live Transcript in Status Area
            if (interimTranscript) {
                statusText.textContent = interimTranscript + '...';
                statusText.style.color = "#fff";
                statusText.style.fontWeight = "600";
            } else {
                statusText.textContent = "Listening...";
                statusText.style.color = "#818cf8";
                statusText.style.fontWeight = "normal";
            }

            if (finalTranscript) {
                const current = outputText.value;
                const prefix = current && !current.endsWith(' ') ? ' ' : '';
                outputText.value = current + prefix + finalTranscript;
                outputText.scrollTop = outputText.scrollHeight;
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            statusText.textContent = "Error: " + event.error;
            isRecording = false;
            micBtn.classList.remove('listening');
        };
    } else {
        statusText.textContent = "Browser not supported. Please use Chrome/Edge.";
        micBtn.style.pointerEvents = "none";
        micBtn.style.opacity = "0.5";
    }

    micBtn.addEventListener('click', () => {
        if (!recognition) return;
        if (isRecording) {
            stopRecording();
        } else {
            recognition.start();
        }
    });

    function stopRecording() {
        if (recognition) recognition.stop();
    }

    // === Voice Box (Text to Speech) Logic ===
    const synth = window.speechSynthesis;
    const voiceSelect = document.getElementById('voice-select');
    const inputText = document.getElementById('text-voice-input');
    const rateRange = document.getElementById('rate-range');
    const pitchRange = document.getElementById('pitch-range');
    const speakBtn = document.getElementById('speak-btn');
    const stopBtn = document.getElementById('stop-btn');

    let voices = [];

    function populateVoices() {
        const allVoices = synth.getVoices();
        // Filter for USA, India, Japan
        voices = allVoices.filter(voice => {
            // Check for region codes in specific languages
            const lang = voice.lang.replace('_', '-');
            return (
                lang.includes('en-US') ||
                lang.includes('en-IN') ||
                lang.includes('hi-IN') ||
                lang.includes('ja-JP')
            );
        });

        voiceSelect.innerHTML = '<option value="" disabled selected>Select a Voice...</option>';

        // Handle case where no voices match (e.g. some minimalist environments)
        if (voices.length === 0 && allVoices.length > 0) {
            // Optional: fallback to all or show specific message. 
            // Attempting to show English voices at least?
            // For now, let's keep filtered. If empty, user sees empty.
            // Or add a fallback helper option?
            const opt = document.createElement('option');
            opt.textContent = "No Region-Specific Voices Found (Using All)";
            opt.disabled = true;
            voiceSelect.appendChild(opt);
            voices = allVoices; // Fallback
        }

        voices.forEach((voice) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });
    }

    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }

    speakBtn.addEventListener('click', () => {
        if (synth.speaking) {
            console.error('speechSynthesis.speaking');
            return;
        }

        if (inputText.value !== '') {
            const utterThis = new SpeechSynthesisUtterance(inputText.value);

            const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
            for (let i = 0; i < voices.length; i++) {
                if (voices[i].name === selectedOption) {
                    utterThis.voice = voices[i];
                    break;
                }
            }

            utterThis.pitch = pitchRange.value;
            utterThis.rate = rateRange.value;

            utterThis.onend = function (event) {
                console.log('SpeechSynthesisUtterance.onend');
            };

            utterThis.onerror = function (event) {
                console.error('SpeechSynthesisUtterance.onerror');
            };

            synth.speak(utterThis);
        }
    });

    stopBtn.addEventListener('click', () => {
        if (synth.speaking) {
            synth.cancel();
        }
    });

    // === Helpers ===
    window.copyText = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.select();
            document.execCommand('copy');
        }
    };

    window.clearText = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = "";
        }
    };
});

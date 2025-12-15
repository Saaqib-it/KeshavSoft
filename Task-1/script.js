document.addEventListener('DOMContentLoaded', () => {
    const micBtn = document.getElementById('micBtn');
    const statusText = document.getElementById('status');
    const transcriptArea = document.getElementById('transcript');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Browser not supported. Please use Chrome/Edge.");
        micBtn.disabled = true;
        micBtn.style.opacity = "0.5";
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isRecording = false;

    micBtn.addEventListener('click', toggleRecording);

    function toggleRecording() {
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }

    recognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('listening');
        if (statusText) statusText.textContent = "Listening...";
    };

    recognition.onend = () => {
        isRecording = false;
        micBtn.classList.remove('listening');
        if (statusText) statusText.textContent = "Tap to Speak";
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (statusText) statusText.textContent = "Error: " + event.error;
        isRecording = false;
        micBtn.classList.remove('listening');
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                // Final result: Append to main text area
                if (transcriptArea.value.length > 0 && !transcriptArea.value.endsWith(' ')) {
                    transcriptArea.value += ' ';
                }
                transcriptArea.value += transcript;
                transcriptArea.scrollTop = transcriptArea.scrollHeight;
            } else {
                // Interim result: Keep track of it
                interimTranscript += transcript;
            }
        }

        // Show interim text in the status bar for immediate feedback
        if (interimTranscript) {
            statusText.textContent = interimTranscript + "...";
            statusText.style.color = "#3b82f6"; // Highlight interim text
        } else {
            // Restore default text if no interim
            if (isRecording) {
                // Only reset if we are still recording and silence came
                // But better to keep 'Listening...'
                statusText.textContent = "Listening...";
                statusText.style.color = "var(--text-color)";
            }
        }
    };

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (!transcriptArea.value) return;

            navigator.clipboard.writeText(transcriptArea.value).then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Copied!
                `;
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            transcriptArea.value = '';
        });
    }
});

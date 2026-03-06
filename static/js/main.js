document.addEventListener('DOMContentLoaded', () => {
    const messagesArea = document.getElementById('messages-area');
    const messagesWrapper = messagesArea.querySelector('.messages-wrapper');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const micButton = document.getElementById('mic-button');

    let isRecording = false;
    let recognition = null;
    let sessionId = localStorage.getItem('soma_obi_session_id');
    let userId = localStorage.getItem('soma_obi_user_id');
    let chatHistory = [];

    // Settings State
    let ttsSpeed = parseFloat(localStorage.getItem('soma_obi_tts_speed')) || 0.82;

    // Modal Elements
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.getElementById('close-modal');
    const aboutBtn = document.getElementById('about-btn');
    const settingsBtn = document.getElementById('settings-btn');

    // Welcome Screen Logic
    const welcomeScreen = document.getElementById('welcome-screen');
    const enterBtn = document.getElementById('enter-btn');
    const appContainer = document.querySelector('.app-container');

    if (enterBtn) {
        enterBtn.onclick = () => {
            welcomeScreen.classList.add('fade-out');
            appContainer.classList.remove('hidden');

            // Re-reveal with fade
            setTimeout(() => {
                appContainer.style.opacity = '1';
                scrollToBottom();
            }, 100);

            // Clean up DOM after transition
            setTimeout(() => {
                welcomeScreen.remove();
            }, 1000);
        };
    }

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isRecording = true;
            micButton.classList.add('recording');
        };

        recognition.onend = () => {
            isRecording = false;
            micButton.classList.remove('recording');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            isRecording = false;
            micButton.classList.remove('recording');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            updateSendButtonState();
            handleSend();
        };
    } else {
        micButton.style.display = 'none';
    }

    // Event Listeners
    userInput.addEventListener('input', updateSendButtonState);

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSend();
    });

    micButton.addEventListener('click', () => {
        if (!recognition) return;
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    function updateSendButtonState() {
        const hasText = userInput.value.trim().length > 0;
        sendButton.disabled = !hasText;
        if (hasText) {
            sendButton.classList.add('active');
        } else {
            sendButton.classList.remove('active');
        }
    }

    // Modal Logic
    function openModal(title, content) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modalOverlay.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    function hideModal() {
        modalOverlay.classList.add('hidden');
    }

    closeModal.onclick = hideModal;
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) hideModal();
    };

    aboutBtn.onclick = () => {
        const content = `
            <div class="about-text">
                <p><strong>Soma Obi</strong> is a soulful African companion designed to listen, reflect, and guide you through life's whispers.</p>
                <p>Powered by <strong>WAIT Technologies</strong> and inspired by the gritty, poetic essence of Ghanaian culture and the rhythmic flow of Blacko's artistry, Soma provides a safe space for your deepest thoughts.</p>
                <p><em>"Every soul has a story. Speak your truth, and let the wind carry the weight away."</em></p>
            </div>
        `;
        openModal("ABOUT SOMA OBI", content);
    };

    settingsBtn.onclick = () => {
        const content = `
            <div class="settings-group">
                <label class="settings-label">SOMA'S VOICE SPEED</label>
                <div class="slider-container">
                    <input type="range" id="speed-slider" min="0.5" max="1.5" step="0.05" value="${ttsSpeed}">
                    <span class="slider-val" id="speed-val">${ttsSpeed}x</span>
                </div>
            </div>
            <div class="danger-zone">
                <button id="clear-chat" class="btn-secondary">
                    <i data-lucide="trash-2" style="width: 16px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i>
                    CLEAR CONVERSATION
                </button>
            </div>
        `;
        openModal("SOMA SETTINGS", content);

        const slider = document.getElementById('speed-slider');
        const valDisp = document.getElementById('speed-val');
        slider.oninput = (e) => {
            ttsSpeed = e.target.value;
            valDisp.textContent = ttsSpeed + 'x';
            localStorage.setItem('soma_obi_tts_speed', ttsSpeed);
        };

        document.getElementById('clear-chat').onclick = () => {
            if (confirm("Are you sure you want to clear your soul's journey? This cannot be undone.")) {
                messagesWrapper.innerHTML = '';
                // Optional: append welcome message back
                appendMessage('system', "A fresh start. What is on your soul today?");
                chatHistory = []; // Clear chat history
                hideModal();
            }
        };
    };

    async function handleSend(providedMessage = null) {
        const message = providedMessage || userInput.value.trim();
        if (!message) return;

        userInput.value = '';
        updateSendButtonState();
        appendMessage('user', message);

        chatHistory.push(["User", message]);
        // Keep history manageable (last 5 exchanges, 10 messages total)
        if (chatHistory.length > 10) chatHistory.shift();

        const typingId = appendTypingIndicator();
        scrollToBottom();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    history: chatHistory,
                    session_id: sessionId,
                    user_id: userId
                }),
            });

            if (!response.ok) throw new Error('Failed to fetch chat');

            const data = await response.json();
            removeTypingIndicator(typingId);

            if (data.session_id) {
                sessionId = data.session_id;
                userId = data.user_id;
                localStorage.setItem('soma_obi_session_id', sessionId);
                localStorage.setItem('soma_obi_user_id', userId);
            }

            const aiText = data.response || "I hear you, but the wind carries my words away. Speak again.";
            chatHistory.push(["AI", aiText]);
            const baseUrl = data.audio_url;
            const audioUrl = `${baseUrl}&speed=${ttsSpeed}`;

            appendMessage('ai', aiText, audioUrl);

        } catch (error) {
            console.error(error);
            removeTypingIndicator(typingId);
            appendMessage('ai', "Chale, the connection is heavy right now. Try sending that again, or refresh the aura.");
            // Remove the failed user message from history so retry works cleanly
            chatHistory.pop();
        }
    }

    function appendMessage(role, text, audioUrl = null) {
        const row = document.createElement('div');
        row.className = `message-row ${role}`;

        const avatarWrapper = document.createElement('div');
        avatarWrapper.className = 'avatar-wrapper';
        const avatar = document.createElement('div');
        avatar.className = `avatar ${role === 'ai' ? 'soma-aura' : 'user-aura'}`;
        avatar.innerHTML = `<i data-lucide="${role === 'ai' ? 'sparkles' : 'user'}"></i>`;
        avatarWrapper.appendChild(avatar);

        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${role === 'ai' ? 'soma-bubble' : 'user-bubble'}`;

        const bubbleContentRow = document.createElement('div');
        bubbleContentRow.className = 'bubble-content-row';

        const content = document.createElement('p');
        content.className = 'message-content';

        if (role === 'ai') {
            content.textContent = ''; // Start empty for typing
        } else {
            content.textContent = text;
        }

        bubbleContentRow.appendChild(content);

        let audioBtn = null;
        if (audioUrl && role === 'ai') {
            audioBtn = document.createElement('button');
            audioBtn.className = 'audio-play-btn';
            audioBtn.innerHTML = `
                <svg class="countdown-svg" viewBox="0 0 40 40">
                    <circle class="countdown-bg" cx="20" cy="20" r="18"></circle>
                    <circle class="countdown-ring" cx="20" cy="20" r="18"></circle>
                </svg>
                <i data-lucide="volume-2"></i>
                <span class="countdown-text"></span>
            `;
            audioBtn.title = "Listen to response";
            audioBtn.onclick = () => {
                if (audioBtn.countdown) {
                    clearTimeout(audioBtn.countdown.timer);
                    clearInterval(audioBtn.countdown.interval);
                    audioBtn.classList.remove('counting');
                    audioBtn.countdown = null;
                    playAudio(audioUrl, audioBtn);
                } else {
                    playAudio(audioUrl, audioBtn);
                }
            };
            bubbleContentRow.appendChild(audioBtn);
        }

        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        bubble.appendChild(bubbleContentRow);
        bubble.appendChild(time);

        row.appendChild(avatarWrapper);
        row.appendChild(bubble);
        messagesWrapper.appendChild(row);

        if (window.lucide) lucide.createIcons();
        scrollToBottom();

        // Start typing if AI
        if (role === 'ai') {
            typeText(content, text, () => {
                if (audioUrl && audioBtn) {
                    startTtsCountdown(audioBtn, 12, () => {
                        playAudio(audioUrl, audioBtn);
                    });
                }
            });
        }
    }

    function startTtsCountdown(btn, duration, onComplete) {
        if (btn.classList.contains('playing')) return;

        btn.classList.add('counting');
        const ring = btn.querySelector('.countdown-ring');
        const text = btn.querySelector('.countdown-text');

        let timeLeft = duration;
        text.textContent = timeLeft;

        // Reset ring
        ring.style.strokeDashoffset = '0';

        const interval = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0) {
                text.textContent = timeLeft > 0 ? timeLeft : '';
            }
        }, 1000);

        const timer = setTimeout(() => {
            clearInterval(interval);
            btn.classList.remove('counting');
            btn.countdown = null;
            onComplete();
        }, duration * 1000);

        btn.countdown = { timer, interval };
    }

    function typeText(element, text, onComplete) {
        let i = 0;
        const speed = 25; // ms per char - snappier
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                scrollToBottom();
                setTimeout(type, speed);
            } else if (onComplete) {
                onComplete();
            }
        }
        type();
    }

    function playAudio(url, btn) {
        if (!url) return;

        // If already playing, stop or do nothing? Let's stop existing audio if any
        if (btn.classList.contains('playing')) return;

        btn.classList.add('playing');
        const audio = new Audio(url);

        audio.onended = () => {
            btn.classList.remove('playing');
        };

        audio.onerror = () => {
            btn.classList.remove('playing');
            console.error("Audio playback failed");
        };

        audio.play().catch(e => {
            console.log("Play failed:", e);
            btn.classList.remove('playing');
        });
    }

    function appendTypingIndicator() {
        const id = 'typing-' + Date.now();
        const row = document.createElement('div');
        row.id = id;
        row.className = 'message-row ai typing';
        row.innerHTML = `
            <div class="avatar-wrapper">
                <div class="avatar soma-aura">
                    <i data-lucide="sparkles"></i>
                </div>
            </div>
            <div class="message-bubble soma-bubble">
                <div class="typing-indicator">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
        `;
        messagesWrapper.appendChild(row);
        if (window.lucide) lucide.createIcons();
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        messagesArea.scrollTo({
            top: messagesArea.scrollHeight,
            behavior: 'smooth'
        });
    }
});

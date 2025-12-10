const messages = [
    "Laisse-moi tranquille.",
    "Ne me dérange pas.",
    "Va-t'en.",
    "Qu'est-ce que tu veux encore ?",
    "Lâche-moi.",
    "Je suis occupé.",
    "Pas maintenant.",
    "Tu me fatigues.",
    "Retourne d'où tu viens.",
    "Je n'ai pas de temps pour ça.",
    "Dégage.",
    "Fous-moi la paix.",
    "Je n'ai rien à te dire.",
    "Occupe-toi de tes affaires.",
    "Je suis de mauvaise humeur.",
    "Tu m'ennuies.",
    "Tu pues.",
    "Je n'ai pas envie de parler.",
    "C'est pas le moment.",
    "Je suis fatigué de toi.",
    "Allez, casse-toi.",
    "C'est bon, j'en ai marre.",
    "Tu me casses les pieds.",
    "Je ne veux pas te voir.",
    "Laisse-moi respirer.",
    "Je suis pas d'humeur.",
    "Ta bouche.",
    "Je t'ai dit de partir.",
    "Tu me déranges sérieusement.",
    "Je n'ai rien à te dire aujourd'hui.",
    "Retourne jouer avec tes amis imaginaires.",
    "Je suis pas ton pote.",
    "Va faire quelque chose d'utile.",
    "Je suis pas d'humeur à blaguer.",
    "Tu me fatigues avec tes questions.",
    "Je n'ai pas envie de discuter.",
    "C'est pas le moment pour tes conneries.",
    "Je suis pas ton esclave.",
    "Fous-moi la paix, bordel.",
    "Je suis pas là pour te divertir.",
    "Tu me casses les couilles.",
    "Je n'ai pas de temps à perdre avec toi.",
    "Va te faire voir.",
    "Je suis pas ton jouet.",
    "Laisse-moi tranquille, ok ?",
    "Je suis pas ton ami.",
    "Tu me soules.",
    "Je n'ai rien à te dire, alors dégage.",
];

// --- SÉLECTEURS ---
const landingView = document.getElementById('landing-view');
const chatView = document.getElementById('chat-view');

const startButton = document.getElementById('start-btn');

const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');
const audioButton = document.getElementById('audio-btn');
const audioIcon = document.getElementById('audio-icon');

// Mute par défaut
let isMuted = true;

// --- FONCTIONS ---

function goToChat() {
    // Cacher Landing et afficher Chat
    landingView.classList.add('hidden');
    header.classList.add('hidden');
    chatView.classList.remove('hidden');
    
    // Vidéo pause
    const bgVideo = document.querySelector('video');
    if(bgVideo) bgVideo.pause();

    userInput.focus();
}

function hideTopBar() {
    const topBar = document.getElementById('top-bar');
    topBar.style.display = 'hidden';
    }

// Gestion de l'audio
function toggleAudio() {
    isMuted = !isMuted;
    if (isMuted) {
        audioIcon.classList.replace('ph-speaker-high', 'ph-speaker-slash');
        audioButton.classList.remove('text-white');
        window.speechSynthesis.cancel(); 
    } else {
        audioIcon.classList.replace('ph-speaker-slash', 'ph-speaker-high');
        audioButton.classList.add('text-white');
    }
}

// Fonction TTS (Synthèse Vocale)
function speak(text) {
    if (isMuted) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.5; 
    utterance.rate = 1.0; 
    utterance.lang = 'fr-FR';
    window.speechSynthesis.speak(utterance);
}

// Effet machine à écrire avec Markdown visible pendant la construction
function typeWriterMarkdown(element, markdown, index = 0) {
    const htmlContent = marked.parse(markdown);
    
    if (index === 0) {
        element.innerHTML = '';
        element.classList.add('markdown-content');
        element.setAttribute('data-full-html', htmlContent);
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const fullText = tempDiv.textContent || tempDiv.innerText;
    
    if (index < fullText.length) {
        element.innerHTML = buildPartialHTML(htmlContent, index + 1);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        setTimeout(() => typeWriterMarkdown(element, markdown, index + 1), 20);
    } else {
        element.innerHTML = htmlContent;
        element.classList.remove('typing-cursor');
    }
}

// Fonction pour construire le HTML partiellement (caractère par caractère)
function buildPartialHTML(html, charLimit) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let charCount = 0;
    
    function processNode(node) {
        if (charCount >= charLimit) return null;
        
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const remainingChars = charLimit - charCount;
            
            if (text.length <= remainingChars) {
                charCount += text.length;
                return document.createTextNode(text);
            } else {
                charCount += remainingChars;
                return document.createTextNode(text.substring(0, remainingChars));
            }
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = document.createElement(node.tagName);
            for (const attr of node.attributes) {
                clone.setAttribute(attr.name, attr.value);
            }
            for (const child of node.childNodes) {
                const processedChild = processNode(child);
                if (processedChild) clone.appendChild(processedChild);
                if (charCount >= charLimit) break;
            }
            return clone;
        }
        return null;
    }
    
    const resultDiv = document.createElement('div');
    for (const child of tempDiv.childNodes) {
        const processedChild = processNode(child);
        if (processedChild) resultDiv.appendChild(processedChild);
        if (charCount >= charLimit) break;
    }
    
    return resultDiv.innerHTML;
}

async function botReply(userMessage) {
    const thinkingBubble = `
    <div class="flex justify-start mb-6" id="loading">
        <div class="max-w-[80%]">
            <div class="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <span>Kevin</span>
            </div>
            <div class="text-gray-500 italic text-sm animate-pulse">
                ...
            </div>
        </div>
    </div>`;
    
    chatHistory.innerHTML += thinkingBubble;
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();
        
        // Remove loading
        const loadingElement = document.getElementById('loading');
        if (loadingElement) loadingElement.remove();

        // Bulle réponse Kevin
        const msgId = 'msg-' + Date.now();
        const botHtml = `
        <div class="flex justify-start mb-6">
            <div class="max-w-[90%] md:max-w-[80%]">
                <div class="flex items-center gap-2 text-gray-400 text-[10px] mb-1 font-bold uppercase tracking-wide">
                    Kevin
                </div>
                <div id="${msgId}" class="typing-cursor text-gray-200 leading-relaxed text-sm md:text-base font-light"></div>
            </div>
        </div>`;

        chatHistory.innerHTML += botHtml;
        chatHistory.scrollTop = chatHistory.scrollHeight;

        const bubbleElement = document.getElementById(msgId);
        typeWriterMarkdown(bubbleElement, data.reply);

        speak(data.reply);
        saveChat();

    } catch (error) {
        console.error(error);
        const errorHtml = `<div class="text-gray-500 mb-4 text-xs">Erreur réseau.</div>`;
        chatHistory.innerHTML += errorHtml;
    }
}

function sendMessage() {
    const text = userInput.value.trim();
    if (text === "") return;

    // Bulle Utilisateur 
    const userHtml = `
    <div class="flex justify-end mb-6">
        <div class="bg-[#2C2C2E] text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] text-sm border border-white/5">
            ${text.replace(/\n/g, '<br>')}
        </div>
    </div>`;
    
    chatHistory.innerHTML += userHtml;
    
    // Reset Input
    userInput.value = "";
    userInput.style.height = 'auto'; 
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    saveChat();
    botReply(text);
}

function saveChat() {
    const historyHTML = chatHistory.innerHTML;
    localStorage.setItem('kevin_history', historyHTML);
}

function loadChat() {
    const savedHistory = localStorage.getItem('kevin_history');
    if (savedHistory) {
        chatHistory.innerHTML = savedHistory;
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
}

function resetChat() {
    localStorage.removeItem('kevin_history');
    location.reload();
}

// EVENTS
loadChat();

startButton.addEventListener('click', goToChat);
sendButton.addEventListener('click', sendMessage);
audioButton.addEventListener('click', toggleAudio);

// Gestion Entrée
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

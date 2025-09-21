// ===== STELLAR TALES - ENHANCED MOBILE PWA JavaScript =====
// Navigation system, user authentication, multilingual support, and interactive features

// ===== GLOBAL VARIABLES =====
let currentScreen = 'home-screen';
let isModalOpen = false;
let currentUser = null;
let currentLanguage = 'en';
let userCoins = 100;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;

// ===== USER DATA MANAGEMENT =====
class UserManager {
    constructor() {
        this.userData = this.loadUserData();
        this.init();
    }

    init() {
        // Check if user is logged in
        if (this.userData && this.userData.username) {
            currentUser = this.userData;
            currentLanguage = this.userData.language || 'en';
            userCoins = this.userData.coins || 100;
            this.showUserProfile();
            this.updateLanguageUI();
        } else {
            // Show login modal for new users
            setTimeout(() => this.showLoginModal(), 1000);
        }
    }

    loadUserData() {
        try {
            const data = localStorage.getItem('stellarTalesUser');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }

    saveUserData(userData) {
        try {
            localStorage.setItem('stellarTalesUser', JSON.stringify(userData));
            this.userData = userData;
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    }

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        modal.classList.add('active');
        isModalOpen = true;
        document.body.style.overflow = 'hidden';
        this.setupLoginValidation();
    }

    setupLoginValidation() {
        const usernameInput = document.getElementById('username');
        const ageSelect = document.getElementById('age');
        const languageSelect = document.getElementById('language');
        const createBtn = document.getElementById('create-profile-btn');

        const validateForm = () => {
            const isValid = usernameInput.value.trim().length >= 3 && 
                           ageSelect.value && 
                           languageSelect.value;
            
            createBtn.disabled = !isValid;
            
            // Visual validation feedback
            usernameInput.className = usernameInput.value.trim().length >= 3 ? 'valid' : 
                                    usernameInput.value.trim().length > 0 ? 'invalid' : '';
            ageSelect.className = ageSelect.value ? 'valid' : '';
        };

        usernameInput.addEventListener('input', validateForm);
        ageSelect.addEventListener('change', validateForm);
        languageSelect.addEventListener('change', validateForm);
    }

    showUserProfile() {
        const avatarProfile = document.getElementById('avatar-profile');
        const coinDisplay = document.getElementById('coin-display');
        
        if (currentUser && avatarProfile) {
            // Update avatar button
            document.getElementById('user-avatar').textContent = currentUser.character || '🧑‍🚀';
            
            // Update coin display if exists
            if (document.getElementById('coin-amount')) {
                document.getElementById('coin-amount').textContent = currentUser.coins || 100;
            }
            
            // Show avatar profile
            avatarProfile.style.display = 'block';
            if (coinDisplay) {
                coinDisplay.classList.remove('hidden');
                coinDisplay.style.display = 'block';
            }
            
            // Update avatar menu data
            updateAvatarMenuData();
        }
    }

    createProfile(username, age, language, character) {
        const newUser = {
            username: username.trim(),
            age: age,
            language: language,
            character: character,
            level: 1,
            coins: 100,
            storiesCompleted: 0,
            unlockedStories: ['space-weather'], // First story is free
            knowledgeLevel: 'beginner',
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            progress: {}
        };

        if (this.saveUserData(newUser)) {
            currentUser = newUser;
            currentLanguage = language;
            userCoins = 100;
            
            this.closeLoginModal();
            this.showUserProfile();
            this.updateLanguageUI();
            
            // Show onboarding for new users
            setTimeout(() => this.showOnboarding(), 500);
            
            return true;
        }
        return false;
    }

    showOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        modal.classList.add('active');
        isModalOpen = true;
        this.setupOnboardingValidation();
    }

    setupOnboardingValidation() {
        const questions = document.querySelectorAll('input[type="radio"]');
        const completeBtn = document.getElementById('complete-onboarding-btn');

        const validateOnboarding = () => {
            const q1Answered = document.querySelector('input[name="q1"]:checked');
            const q2Answered = document.querySelector('input[name="q2"]:checked');
            
            const isComplete = q1Answered && q2Answered;
            completeBtn.disabled = !isComplete;

            if (isComplete) {
                this.assessKnowledgeLevel(q1Answered.value, q2Answered.value);
            }
        };

        questions.forEach(radio => {
            radio.addEventListener('change', validateOnboarding);
        });
    }

    assessKnowledgeLevel(q1Answer, q2Answer) {
        let level = 'beginner';
        let description = "Perfect! We'll start with the basics and build up your space knowledge.";

        if (q1Answer === 'advanced' || q2Answer === 'advanced') {
            level = 'advanced';
            description = "Awesome! You already know quite a bit about space weather. We'll challenge you with advanced content!";
        } else if (q1Answer === 'intermediate' || q2Answer === 'intermediate') {
            level = 'intermediate';
            description = "Great! You have some foundation knowledge. We'll build upon what you already know!";
        }

        // Update user data
        currentUser.knowledgeLevel = level;
        this.saveUserData(currentUser);

        // Show result
        document.getElementById('knowledge-check').style.display = 'none';
        document.getElementById('onboarding-result').style.display = 'block';
        document.getElementById('user-level').textContent = `${level.charAt(0).toUpperCase() + level.slice(1)} Explorer`;
        document.getElementById('level-description').textContent = description;
    }

    completeOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        modal.classList.remove('active');
        isModalOpen = false;
        document.body.style.overflow = '';

        // Award welcome coins
        this.addCoins(50, '🎉 Welcome bonus!');
        
        console.log('🌟 Onboarding completed!');
    }

    closeLoginModal() {
        const modal = document.getElementById('login-modal');
        modal.classList.remove('active');
        isModalOpen = false;
        document.body.style.overflow = '';
    }

    addCoins(amount, reason = '') {
        if (currentUser) {
            currentUser.coins = (currentUser.coins || 0) + amount;
            this.saveUserData(currentUser);
            this.updateCoinDisplay();
            
            if (reason) {
                this.showCoinNotification(amount, reason);
            }
        }
    }

    spendCoins(amount) {
        if (currentUser && currentUser.coins >= amount) {
            currentUser.coins -= amount;
            this.saveUserData(currentUser);
            this.updateCoinDisplay();
            return true;
        }
        return false;
    }

    updateCoinDisplay() {
        document.getElementById('coin-amount').textContent = currentUser.coins || 0;
        document.getElementById('user-coins').textContent = currentUser.coins || 0;
    }

    showCoinNotification(amount, reason) {
        // Create floating coin notification
        const notification = document.createElement('div');
        notification.className = 'coin-notification';
        notification.innerHTML = `+${amount} 🪙<br><small>${reason}</small>`;
        document.body.appendChild(notification);

        // Animate and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-50px)';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    logout() {
        if (confirm(translations[currentLanguage].confirmLogout || 'Are you sure you want to logout?')) {
            // Clear all user data
            localStorage.removeItem('stellarTalesUser');
            currentUser = null;
            userCoins = 100;
            
            // Hide avatar profile
            const avatarProfile = document.getElementById('avatar-profile');
            if (avatarProfile) {
                avatarProfile.style.display = 'none';
            }
            
            // Close avatar menu if open
            closeAvatarMenu();
            
            // Reset to home screen
            showScreen('home-screen');
            
            // Show login modal after a short delay
            setTimeout(() => {
                this.showLoginModal();
            }, 500);
            
            // Update language UI
            updateLanguageUI();
        }
    }
}

// ===== MULTILINGUAL SUPPORT =====
const translations = {
    en: {
        appTitle: "Stellar Tales",
        tagline: "Blast Off on an Adventure!",
        greeting: "Hello! | ¡Hola! | স্বাগতম্!",
        getStarted: "Get Started",
        home: "Home",
        stories: "Stories",
        games: "Games",
        dashboard: "Dashboard",
        welcome: "Welcome, Space Explorer! 🚀",
        welcomeDesc: "Ready to learn about space weather?",
        storiesTitle: "Space Weather Stories 📖",
        gamesTitle: "Space Weather Games 🎮",
        confirmLogout: "Are you sure you want to logout?",
        play: "Play Now",
        comingSoon: "Coming soon!",
        gotIt: "Got it! 🌟",
        awesome: "Awesome! ⭐"
    },
    es: {
        appTitle: "Cuentos Estelares",
        tagline: "¡Despega en una Aventura!",
        greeting: "¡Hola! | Hello! | স্বাগতম্!",
        getStarted: "Comenzar",
        home: "Inicio",
        stories: "Cuentos",
        games: "Juegos",
        dashboard: "Panel",
        welcome: "¡Bienvenido, Explorador Espacial! 🚀",
        welcomeDesc: "¿Listo para aprender sobre el clima espacial?",
        storiesTitle: "Cuentos del Clima Espacial 📖",
        gamesTitle: "Juegos del Clima Espacial 🎮",
        confirmLogout: "¿Estás seguro de que quieres cerrar sesión?",
        play: "Jugar Ahora",
        comingSoon: "¡Próximamente!",
        gotIt: "¡Entendido! 🌟",
        awesome: "¡Increíble! ⭐"
    },
    bn: {
        appTitle: "নাক্ষত্রিক কাহিনী",
        tagline: "একটি অভিযানে উড়াল দাও!",
        greeting: "স্বাগতম্! | Hello! | ¡Hola!",
        getStarted: "শুরু করি",
        home: "হোম",
        stories: "গল্প",
        games: "খেলা",
        dashboard: "ড্যাশবোর্ড",
        welcome: "স্বাগতম, মহাকাশ অভিযাত্রী! 🚀",
        welcomeDesc: "মহাকাশের আবহাওয়া সম্পর্কে জানতে প্রস্তুত?",
        storiesTitle: "মহাকাশের আবহাওয়ার গল্প 📖",
        gamesTitle: "মহাকাশের আবহাওয়ার খেলা 🎮",
        confirmLogout: "আপনি কি লগআউট করতে চান?",
        play: "এখনই খেলুন",
        comingSoon: "শীঘ্রই আসছে!",
        gotIt: "বুঝেছি! 🌟",
        awesome: "দুর্দান্ত! ⭐"
    },
    hi: {
        appTitle: "तारकीय कहानियां",
        tagline: "एक रोमांच पर उड़ान भरें!",
        greeting: "नमस्ते! | Hello! | ¡Hola!",
        getStarted: "शुरू करें",
        home: "होम",
        stories: "कहानियां",
        games: "खेल",
        dashboard: "डैशबोर्ड",
        welcome: "स्वागत है, अंतरिक्ष खोजकर्ता! 🚀",
        welcomeDesc: "अंतरिक्षीय मौसम के बारे में जानने के लिए तैयार?",
        storiesTitle: "अंतरिक्षीय मौसम की कहानियां 📖",
        gamesTitle: "अंतरिक्षीय मौसम के खेल 🎮",
        confirmLogout: "क्या आप लॉगआउट करना चाहते हैं?",
        play: "अभी खेलें",
        comingSoon: "जल्द आ रहा है!",
        gotIt: "समझ गया! 🌟",
        awesome: "शानदार! ⭐"
    },
    fr: {
        appTitle: "Contes Stellaires",
        tagline: "Décollez vers l'Aventure!",
        greeting: "Bonjour! | Hello! | ¡Hola!",
        getStarted: "Commencer",
        home: "Accueil",
        stories: "Histoires",
        games: "Jeux",
        dashboard: "Tableau de bord",
        welcome: "Bienvenue, Explorateur Spatial! 🚀",
        welcomeDesc: "Prêt à découvrir la météo spatiale?",
        storiesTitle: "Histoires de Météo Spatiale 📖",
        gamesTitle: "Jeux de Météo Spatiale 🎮",
        confirmLogout: "Êtes-vous sûr de vouloir vous déconnecter?",
        play: "Jouer Maintenant",
        comingSoon: "Bientôt disponible!",
        gotIt: "Compris! 🌟",
        awesome: "Fantastique! ⭐"
    }
};

function updateLanguageUI() {
    const t = translations[currentLanguage];
    
    // Update main UI elements
    if (document.querySelector('.logo h1')) {
        document.querySelector('.logo h1').innerHTML = `🌟 ${t.appTitle}`;
    }
    
    if (document.querySelector('.title-section h2')) {
        document.querySelector('.title-section h2').textContent = t.tagline;
    }
    
    if (document.querySelector('.greeting-texts span')) {
        document.querySelector('.greeting-texts span').textContent = t.greeting;
    }
    
    if (document.querySelector('.get-started-btn')) {
        document.querySelector('.get-started-btn').textContent = t.getStarted;
    }
    
    // Update navigation
    const navItems = document.querySelectorAll('.nav-item span');
    if (navItems.length >= 4) {
        navItems[0].textContent = t.home;
        navItems[1].textContent = t.stories;
        navItems[2].textContent = t.games;
        navItems[3].textContent = t.dashboard;
    }
    
    // Update welcome section
    if (document.querySelector('.welcome-section h2')) {
        document.querySelector('.welcome-section h2').textContent = t.welcome;
    }
    
    if (document.querySelector('.welcome-section p')) {
        document.querySelector('.welcome-section p').textContent = t.welcomeDesc;
    }
    
    // Update screen headers
    if (document.querySelector('.stories-content .screen-header h2')) {
        document.querySelector('.stories-content .screen-header h2').textContent = t.storiesTitle;
    }
    
    if (document.querySelector('.games-content .screen-header h2')) {
        document.querySelector('.games-content .screen-header h2').textContent = t.gamesTitle;
    }
    
    // Update language flag
    const langFlags = {
        en: '🇺🇸',
        es: '🇪🇸',
        bn: '🇧🇩',
        hi: '🇮🇳',
        fr: '🇫🇷'
    };
    
    if (document.getElementById('current-lang-flag')) {
        document.getElementById('current-lang-flag').textContent = langFlags[currentLanguage];
        document.getElementById('current-lang-code').textContent = currentLanguage.toUpperCase();
    }
}

// ===== STORY CONTENT DATABASE =====
const storyContent = {
    'space-weather': {
        title: {
            en: 'What is Space Weather?',
            es: '¿Qué es el Clima Espacial?',
            bn: 'মহাকাশের আবহাওয়া কি?',
            hi: 'अंतरिक्षीय मौसम क्या है?',
            fr: 'Qu\'est-ce que la Météo Spatiale?'
        },
        content: {
            en: `
                <div class="story-content">
                    <h4>🌟 Meet Our Sun!</h4>
                    <p>Our Sun is like a giant, friendly ball of fire in space! But did you know the Sun can sometimes get very excited and send invisible energy toward Earth?</p>
                    
                    <h4>⚡ Solar Storms</h4>
                    <p>Sometimes the Sun creates <strong>solar storms</strong> - these are like space hurricanes made of tiny invisible particles! These particles zoom through space super fast.</p>
                    
                    <h4>🛡️ Earth's Invisible Shield</h4>
                    <p>Lucky for us, Earth has an invisible magnetic shield called a <strong>magnetosphere</strong>! It's like a protective bubble that keeps most of the Sun's particles from reaching us.</p>
                    
                    <h4>🌈 Beautiful Side Effects</h4>
                    <p>When some solar particles do get through, they create the beautiful <strong>Northern Lights</strong> (Aurora) - like colorful dancing lights in the sky!</p>
                    
                    <h4>📡 Space Weather Effects</h4>
                    <p>Space weather can sometimes affect:</p>
                    <ul>
                        <li>🛰️ Satellites that help with GPS</li>
                        <li>📱 Cell phone signals</li>
                        <li>✈️ Airplane routes over the North Pole</li>
                        <li>💡 Power grids on Earth</li>
                    </ul>
                    
                    <h4>👨‍🚀 Space Weather Scientists</h4>
                    <p>Special scientists called <strong>space weather forecasters</strong> watch the Sun every day to predict when space storms might happen, just like weather forecasters predict rain!</p>
                    
                    <div class="fun-fact">
                        <strong>🤓 Fun Fact:</strong> The Sun's magnetic field is 10,000 times stronger than Earth's magnetic field!
                    </div>
                </div>
            `,
            es: `
                <div class="story-content">
                    <h4>🌟 ¡Conoce Nuestro Sol!</h4>
                    <p>¡Nuestro Sol es como una pelota gigante y amigable de fuego en el espacio! ¿Pero sabías que el Sol a veces puede emocionarse mucho y enviar energía invisible hacia la Tierra?</p>
                    
                    <h4>⚡ Tormentas Solares</h4>
                    <p>A veces el Sol crea <strong>tormentas solares</strong> - ¡son como huracanes espaciales hechos de pequeñas partículas invisibles! Estas partículas viajan por el espacio súper rápido.</p>
                    
                    <h4>🛡️ El Escudo Invisible de la Tierra</h4>
                    <p>Por suerte para nosotros, ¡la Tierra tiene un escudo magnético invisible llamado <strong>magnetosfera</strong>! Es como una burbuja protectora que evita que la mayoría de las partículas del Sol nos alcancen.</p>
                    
                    <h4>🌈 Efectos Hermosos</h4>
                    <p>Cuando algunas partículas solares logran pasar, crean las hermosas <strong>Auroras Boreales</strong> - ¡como luces coloridas que bailan en el cielo!</p>
                    
                    <div class="fun-fact">
                        <strong>🤓 Dato Curioso:</strong> ¡El campo magnético del Sol es 10,000 veces más fuerte que el campo magnético de la Tierra!
                    </div>
                </div>
            `,
            bn: `
                <div class="story-content">
                    <h4>🌟 আমাদের সূর্যের সাথে পরিচয়!</h4>
                    <p>আমাদের সূর্য হল মহাকাশে একটি বিশাল, বন্ধুত্বপূর্ণ আগুনের গোলার মতো! কিন্তু তুমি কি জানো যে সূর্য কখনও কখনও খুব উত্তেজিত হয়ে পৃথিবীর দিকে অদৃশ্য শক্তি পাঠায়?</p>
                    
                    <h4>⚡ সৌর ঝড়</h4>
                    <p>কখনও কখনও সূর্য <strong>সৌর ঝড়</strong> তৈরি করে - এগুলো হল ছোট অদৃশ্য কণা দিয়ে তৈরি মহাকাশের হারিকেনের মতো! এই কণাগুলো মহাকাশে অত্যন্ত দ্রুত গতিতে ছুটে যায়।</p>
                    
                    <h4>🛡️ পৃথিবীর অদৃশ্য ঢাল</h4>
                    <p>আমাদের ভাগ্যের বিষয় যে, পৃথিবীর একটি অদৃশ্য চৌম্বকীয় ঢাল আছে যাকে বলা হয় <strong>চৌম্বকমণ্ডল</strong>! এটি একটি সুরক্ষামূলক বুদবুদের মতো যা সূর্যের বেশিরভাগ কণাকে আমাদের কাছে পৌঁছাতে বাধা দেয়।</p>
                    
                    <div class="fun-fact">
                        <strong>🤓 মজার তথ্য:</strong> সূর্যের চৌম্বক ক্ষেত্র পৃথিবীর চৌম্বক ক্ষেত্রের চেয়ে ১০,০০০ গুণ শক্তিশালী!
                    </div>
                </div>
            `
        },
        cost: 0,
        requiredLevel: 1
    },
    'magnetic-field': {
        title: {
            en: "Earth's Magnetic Shield",
            es: "El Escudo Magnético de la Tierra",
            bn: "পৃথিবীর চৌম্বকীয় ঢাল",
            hi: "पृथ्वी की चुंबकीय ढाल",
            fr: "Le Bouclier Magnétique de la Terre"
        },
        content: {
            en: `
                <div class="story-content">
                    <h4>🌍 Earth's Secret Superpower</h4>
                    <p>Did you know Earth has a secret superpower? It has an invisible force field called a <strong>magnetic field</strong> that protects us every single day!</p>
                    
                    <h4>🧲 How Does It Work?</h4>
                    <p>Deep inside Earth's core, there's hot liquid metal that moves around and around. This moving metal creates electricity, and electricity creates magnetism - just like a giant magnet!</p>
                    
                    <h4>🛡️ Our Protective Bubble</h4>
                    <p>This magnetic field creates an invisible bubble around Earth called the <strong>magnetosphere</strong>. It's like having a giant invisible shield protecting us from space!</p>
                    
                    <h4>🧭 Helping Animals Navigate</h4>
                    <p>Many animals use Earth's magnetic field to find their way:</p>
                    <ul>
                        <li>🐢 Sea turtles use it to navigate the ocean</li>
                        <li>🦅 Birds use it during migration</li>
                        <li>🐋 Whales follow magnetic highways in the sea</li>
                        <li>🦆 Even some bacteria can sense magnetism!</li>
                    </ul>
                    
                    <div class="fun-fact">
                        <strong>🤓 Fun Fact:</strong> Without Earth's magnetic field, our atmosphere might have been blown away by solar wind, just like what happened to Mars!
                    </div>
                </div>
            `
        },
        cost: 25,
        requiredLevel: 1
    }
};

// ===== TEXT-TO-SPEECH SYSTEM =====
class SpeechManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.isPlaying = false;
        this.voices = [];
        this.loadVoices();
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        
        // If voices aren't loaded yet, wait for them
        if (this.voices.length === 0) {
            this.synthesis.addEventListener('voiceschanged', () => {
                this.voices = this.synthesis.getVoices();
            });
        }
    }

    getVoiceForLanguage(language) {
        const langMap = {
            'en': ['en-US', 'en-GB', 'en'],
            'es': ['es-ES', 'es-US', 'es'],
            'bn': ['bn-BD', 'bn-IN', 'bn'],
            'hi': ['hi-IN', 'hi'],
            'fr': ['fr-FR', 'fr-CA', 'fr']
        };

        const preferredLangs = langMap[language] || ['en-US'];
        
        for (let prefLang of preferredLangs) {
            const voice = this.voices.find(v => v.lang.startsWith(prefLang));
            if (voice) return voice;
        }
        
        // Fallback to first available voice
        return this.voices[0] || null;
    }

    speak(text, language = currentLanguage) {
        this.stop(); // Stop any current speech
        
        if (!text || text.trim() === '') return;
        
        // Clean HTML tags from text
        const cleanText = text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
        
        this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
        
        const voice = this.getVoiceForLanguage(language);
        if (voice) {
            this.currentUtterance.voice = voice;
        }
        
        this.currentUtterance.rate = 0.9;
        this.currentUtterance.pitch = 1.1;
        this.currentUtterance.volume = 0.8;
        
        this.currentUtterance.onstart = () => {
            this.isPlaying = true;
            this.updateSpeechControls();
        };
        
        this.currentUtterance.onend = () => {
            this.isPlaying = false;
            this.updateSpeechControls();
        };
        
        this.currentUtterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            this.isPlaying = false;
            this.updateSpeechControls();
        };
        
        this.synthesis.speak(this.currentUtterance);
    }

    stop() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        this.isPlaying = false;
        this.updateSpeechControls();
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            // Get current story content and read it
            const modalContent = document.querySelector('#story-modal .modal-body');
            if (modalContent && modalContent.textContent.trim()) {
                this.speak(modalContent.textContent);
            }
        }
    }

    updateSpeechControls() {
        const speechButtons = document.querySelectorAll('.speech-btn');
        speechButtons.forEach(btn => {
            btn.innerHTML = this.isPlaying ? '⏸️ Pause' : '🔊 Listen';
            btn.classList.toggle('playing', this.isPlaying);
        });
    }
}

// ===== ENHANCED STORY MODAL SYSTEM =====
function openStoryModal(storyKey) {
    const modal = document.getElementById('story-modal');
    const titleElement = document.getElementById('modal-title');
    const contentElement = document.getElementById('modal-story-content');
    
    if (storyContent[storyKey]) {
        const story = storyContent[storyKey];
        const lang = currentLanguage;
        
        // Check if story is unlocked
        if (story.cost > 0 && currentUser && !currentUser.unlockedStories.includes(storyKey)) {
            if (currentUser.coins < story.cost) {
                alert(translations[lang].needMoreCoins || `You need ${story.cost} coins to unlock this story!`);
                return;
            }
            
            if (confirm(`Unlock this story for ${story.cost} coins?`)) {
                if (userManager.spendCoins(story.cost)) {
                    currentUser.unlockedStories.push(storyKey);
                    userManager.saveUserData(currentUser);
                } else {
                    return;
                }
            } else {
                return;
            }
        }
        
        // Set content
        titleElement.textContent = story.title[lang] || story.title.en;
        contentElement.innerHTML = story.content[lang] || story.content.en;
        
        // Add speech control button
        const speechBtn = document.createElement('button');
        speechBtn.className = 'speech-btn modal-btn';
        speechBtn.innerHTML = '🔊 Listen';
        speechBtn.onclick = () => speechManager.toggle();
        
        const modalFooter = modal.querySelector('.modal-footer');
        modalFooter.insertBefore(speechBtn, modalFooter.querySelector('.modal-btn'));
        
        modal.classList.add('active');
        isModalOpen = true;
        document.body.style.overflow = 'hidden';
        
        // Award reading coins after a delay
        setTimeout(() => {
            if (currentUser) {
                const readingReward = Math.floor(Math.random() * 10) + 5;
                userManager.addCoins(readingReward, '📚 Reading bonus!');
                
                // Mark story as completed
                if (!currentUser.progress[storyKey]) {
                    currentUser.progress[storyKey] = {
                        completed: true,
                        completedAt: new Date().toISOString()
                    };
                    currentUser.storiesCompleted = (currentUser.storiesCompleted || 0) + 1;
                    userManager.saveUserData(currentUser);
                    userManager.showUserProfile();
                }
            }
        }, 5000);
        
        console.log(`📖 Opened story: ${story.title[lang] || story.title.en}`);
    }
}

// ===== DOM READY INITIALIZATION =====
let userManager;
let speechManager;
let spaceWeatherAPI;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 Stellar Tales Enhanced initialized!');
    
    // Initialize managers
    userManager = new UserManager();
    speechManager = new SpeechManager();
    spaceWeatherAPI = new SpaceWeatherAPI();
    
    // Set up initial screen
    showScreen('home-screen');
    
    // Add click handlers for closing modals when clicking outside
    document.addEventListener('click', handleOutsideClick);
    
    // Handle browser back button
    window.addEventListener('popstate', function(e) {
        if (isModalOpen) {
            closeAllModals();
        }
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleKeyDown);
    
    // Initialize animations
    initializeAnimations();
    
    // Update UI with current language
    updateLanguageUI();
    
    // Initialize dashboard stats
    initializeDashboardStats();
    
    // Fix inline styles by moving to CSS classes
    setTimeout(() => {
        // Fix onboarding result display
        const onboardingResult = document.getElementById('onboarding-result');
        if (onboardingResult && onboardingResult.style.display === 'none') {
            onboardingResult.classList.add('hidden');
            onboardingResult.style.display = '';
        }
        
        // Fix user profile display
        const userProfile = document.getElementById('user-profile');
        if (userProfile && userProfile.style.display === 'none') {
            userProfile.classList.add('hidden');
            userProfile.style.display = '';
        }
        
        // Fix coin display
        const coinDisplay = document.getElementById('coin-display');
        if (coinDisplay && coinDisplay.style.display === 'none') {
            coinDisplay.classList.add('hidden');
            coinDisplay.style.display = '';
        }
    }, 100);
});

// ===== DASHBOARD FUNCTIONS =====
function initializeDashboardStats() {
    // Initialize with current user data or defaults
    const completedStories = currentUser ? currentUser.completedStories || 0 : 0;
    const achievements = currentUser ? currentUser.achievements || 0 : 0;
    const streakDays = currentUser ? currentUser.streakDays || 0 : 0;
    const coins = currentUser ? currentUser.coins || userCoins : userCoins;
    
    // Update dashboard stats display
    updateDashboardStat('completed-stories', completedStories);
    updateDashboardStat('achievements', achievements);
    updateDashboardStat('streak-days', streakDays);
    updateDashboardStat('user-coins', coins);
}

function updateDashboardStat(statId, value) {
    const statElement = document.getElementById(statId);
    if (statElement) {
        // Animate the number counting up
        animateCounter(statElement, 0, value, 1000);
    }
}

function animateCounter(element, start, end, duration) {
    const range = end - start;
    const minTimer = 50;
    const stepTime = Math.abs(Math.floor(duration / range));
    const timer = stepTime > minTimer ? stepTime : minTimer;
    
    let current = start;
    const increment = end > start ? 1 : -1;
    
    const stepUp = () => {
        current += increment;
        element.textContent = current;
        
        if (current !== end) {
            setTimeout(stepUp, timer);
        }
    };
    
    stepUp();
}

// ===== AUTHENTICATION FUNCTIONS =====
function selectCharacter(characterType) {
    // Update character selection UI
    document.querySelectorAll('.character-option').forEach(option => {
        option.classList.remove('active');
    });
    
    document.querySelector(`[data-character="${characterType}"]`).classList.add('active');
    
    // Update preview
    const previewAvatar = document.getElementById('preview-character').querySelector('.character-avatar');
    previewAvatar.className = `character-avatar ${characterType}`;
}

function createProfile() {
    const username = document.getElementById('username').value.trim();
    const age = document.getElementById('age').value;
    const language = document.getElementById('language').value;
    const character = document.querySelector('.character-option.active').dataset.character;
    
    if (username.length < 3) {
        alert('Please enter a username with at least 3 characters!');
        return;
    }
    
    if (userManager.createProfile(username, age, language, character)) {
        console.log('✅ Profile created successfully!');
    } else {
        alert('Error creating profile. Please try again.');
    }
}

function completeOnboarding() {
    userManager.completeOnboarding();
}

function closeLoginModal() {
    userManager.closeLoginModal();
}

function logout() {
    userManager.logout();
}

// ===== AVATAR MENU MANAGEMENT =====
function toggleAvatarMenu() {
    const avatarMenu = document.getElementById('avatar-menu');
    const isActive = avatarMenu.classList.contains('active');
    
    if (isActive) {
        closeAvatarMenu();
    } else {
        openAvatarMenu();
    }
}

function openAvatarMenu() {
    const avatarMenu = document.getElementById('avatar-menu');
    avatarMenu.classList.add('active');
    updateAvatarMenuData();
    
    // Close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleAvatarMenuOutsideClick);
    }, 100);
}

function closeAvatarMenu() {
    const avatarMenu = document.getElementById('avatar-menu');
    avatarMenu.classList.remove('active');
    document.removeEventListener('click', handleAvatarMenuOutsideClick);
}

function handleAvatarMenuOutsideClick(event) {
    const avatarProfile = document.getElementById('avatar-profile');
    if (!avatarProfile.contains(event.target)) {
        closeAvatarMenu();
    }
}

function updateAvatarMenuData() {
    if (!currentUser) return;
    
    // Update avatar menu with current user data
    document.getElementById('menu-username').textContent = currentUser.username || 'Explorer';
    document.getElementById('menu-level').textContent = `Level ${currentUser.level || 1}`;
    document.getElementById('menu-coins').textContent = currentUser.coins || userCoins;
    document.getElementById('menu-stories').textContent = currentUser.completedStories || 0;
    document.getElementById('menu-badges').textContent = currentUser.achievements || 0;
    
    // Update avatar characters
    const avatarChar = currentUser.character || '🧑‍🚀';
    document.getElementById('user-avatar').textContent = avatarChar;
    document.getElementById('menu-user-avatar').textContent = avatarChar;
}

function openSettingsModal() {
    closeAvatarMenu();
    // Placeholder for settings modal - can be implemented later
    alert('Settings menu - Coming soon!');
}

// ===== LANGUAGE MANAGEMENT =====
function toggleLanguageMenu() {
    const langMenu = document.getElementById('lang-menu');
    langMenu.classList.toggle('active');
}

function switchLanguage(newLang) {
    currentLanguage = newLang;
    
    // Update user data if logged in
    if (currentUser) {
        currentUser.language = newLang;
        userManager.saveUserData(currentUser);
    }
    
    // Update UI
    updateLanguageUI();
    
    // Close language menu
    document.getElementById('lang-menu').classList.remove('active');
    
    console.log(`🌐 Language switched to: ${newLang}`);
}

// ===== ENHANCED STORY SYSTEM =====
function closeStoryModal() {
    const modal = document.getElementById('story-modal');
    modal.classList.remove('active');
    isModalOpen = false;
    
    // Stop speech if playing
    speechManager.stop();
    
    // Remove speech button
    const speechBtn = modal.querySelector('.speech-btn');
    if (speechBtn) {
        speechBtn.remove();
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    console.log('📖 Closed story modal');
}

// ===== LIVE SPACE WEATHER API INTEGRATION =====
class SpaceWeatherAPI {
    constructor() {
        this.baseURL = 'https://api.nasa.gov/DONKI';
        this.apiKey = 'DEMO_KEY'; // Use DEMO_KEY for demo purposes
        this.lastUpdate = null;
        this.weatherData = null;
        this.init();
    }

    init() {
        this.loadSpaceWeather();
        // Update every 15 minutes
        setInterval(() => this.loadSpaceWeather(), 15 * 60 * 1000);
    }

    async loadSpaceWeather() {
        try {
            // For demo purposes, we'll simulate realistic data
            // In production, you would use real NASA APIs
            this.weatherData = this.generateSimulatedData();
            this.updateWeatherDisplay();
            this.lastUpdate = new Date();
        } catch (error) {
            console.error('Error loading space weather:', error);
            this.showWeatherError();
        }
    }

    generateSimulatedData() {
        // Generate realistic simulated space weather data
        const conditions = ['quiet', 'active', 'storm', 'severe'];
        const currentCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        return {
            solarWind: Math.floor(Math.random() * 400) + 300, // 300-700 km/s
            magneticField: (Math.random() * 20 + 5).toFixed(1), // 5-25 nT
            activityLevel: currentCondition,
            forecast: this.generateForecast()
        };
    }

    generateForecast() {
        const conditions = ['quiet', 'active', 'storm'];
        const forecast = [];
        
        for (let i = 1; i <= 3; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
            forecast.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                condition: conditions[Math.floor(Math.random() * conditions.length)],
                description: this.getConditionDescription(conditions[Math.floor(Math.random() * conditions.length)])
            });
        }
        
        return forecast;
    }

    getConditionDescription(condition) {
        const descriptions = {
            quiet: 'Calm',
            active: 'Minor Activity',
            storm: 'Geomagnetic Storm',
            severe: 'Severe Storm'
        };
        
        return descriptions[condition] || 'Unknown';
    }

    getActivityEmoji(condition) {
        const emojis = {
            quiet: '😌',
            active: '⚡',
            storm: '🌪️',
            severe: '⛈️'
        };
        
        return emojis[condition] || '❓';
    }

    updateWeatherDisplay() {
        const weatherDisplay = document.getElementById('weather-display');
        const weatherDetails = document.getElementById('weather-details');
        const forecastItems = document.getElementById('forecast-items');
        
        if (!weatherDisplay || !this.weatherData) return;

        // Update main display
        weatherDisplay.innerHTML = `
            <div class="live-indicator">LIVE</div>
            <div class="current-conditions">
                <div class="weather-status ${this.weatherData.activityLevel}">
                    ${this.getActivityEmoji(this.weatherData.activityLevel)}
                </div>
                <div class="weather-description">
                    ${this.getConditionDescription(this.weatherData.activityLevel)}
                </div>
            </div>
        `;

        // Update weather details
        document.getElementById('solar-wind').textContent = `${this.weatherData.solarWind} km/s`;
        document.getElementById('magnetic-field').textContent = `${this.weatherData.magneticField} nT`;
        document.getElementById('activity-level').textContent = this.getConditionDescription(this.weatherData.activityLevel);

        // Apply severity styling
        const activityElement = document.getElementById('activity-level').parentElement;
        activityElement.className = `weather-item severity-${this.weatherData.activityLevel}`;

        // Update forecast
        if (forecastItems && this.weatherData.forecast) {
            forecastItems.innerHTML = this.weatherData.forecast.map(item => `
                <div class="forecast-item">
                    <div class="forecast-date">${item.date}</div>
                    <div class="forecast-status">${this.getActivityEmoji(item.condition)}</div>
                    <div class="forecast-description">${item.description}</div>
                </div>
            `).join('');
        }

        // Update last updated time
        this.updateLastUpdatedTime();
    }

    updateLastUpdatedTime() {
        const existingTime = document.querySelector('.last-updated');
        if (existingTime) {
            existingTime.remove();
        }

        if (this.lastUpdate) {
            const timeElement = document.createElement('div');
            timeElement.className = 'last-updated';
            timeElement.textContent = `Updated: ${this.lastUpdate.toLocaleTimeString()}`;
            
            const weatherWidget = document.querySelector('.space-weather-widget');
            if (weatherWidget) {
                weatherWidget.appendChild(timeElement);
            }
        }
    }

    showWeatherError() {
        const weatherDisplay = document.getElementById('weather-display');
        if (weatherDisplay) {
            weatherDisplay.innerHTML = `
                <div class="weather-error">
                    <span>⚠️</span>
                    <p>Unable to load space weather data</p>
                    <button onclick="spaceWeatherAPI.loadSpaceWeather()" class="retry-btn">Retry</button>
                </div>
            `;
        }
    }

    async getRealNASAData() {
        // Example of how you would fetch real NASA data
        // Requires proper API key and CORS handling
        try {
            const endpoints = [
                `${this.baseURL}/FLR`, // Solar Flares
                `${this.baseURL}/SEP`, // Solar Energetic Particles
                `${this.baseURL}/CME`, // Coronal Mass Ejections
                `${this.baseURL}/GST`  // Geomagnetic Storms
            ];

            const promises = endpoints.map(url => 
                fetch(`${url}?api_key=${this.apiKey}&startDate=${this.getDateString(-7)}&endDate=${this.getDateString(0)}`)
            );

            const responses = await Promise.all(promises);
            const data = await Promise.all(responses.map(r => r.json()));

            return this.processNASAData(data);
        } catch (error) {
            console.error('NASA API Error:', error);
            throw error;
        }
    }

    getDateString(daysOffset) {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    }

    processNASAData(data) {
        // Process real NASA data into our format
        const [flares, sep, cme, storms] = data;
        
        // Complex processing logic would go here
        // This is a simplified example
        return {
            solarWind: 450,
            magneticField: 12.5,
            activityLevel: storms.length > 0 ? 'storm' : 'quiet',
            forecast: this.generateForecast()
        };
    }
}

// ===== SCREEN NAVIGATION SYSTEM =====
function showScreen(screenId) {
    // Hide all screens
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen with animation
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        setTimeout(() => {
            targetScreen.classList.add('active');
        }, 100);
        
        // Update current screen
        currentScreen = screenId;
        
        // Update bottom navigation active state
        updateBottomNavigation(screenId);
        
        // Hide landing screen after navigation starts
        if (screenId !== 'landing-screen') {
            const landingScreen = document.getElementById('landing-screen');
            if (landingScreen) {
                landingScreen.style.display = 'none';
            }
            
            // Show bottom navigation
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) {
                bottomNav.style.display = 'flex';
            }
        }
    }
    
    console.log(`📱 Navigated to: ${screenId}`);
}

// ===== BOTTOM NAVIGATION MANAGEMENT =====
function updateBottomNavigation(activeScreenId) {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.classList.remove('active');
        
        // Check if this nav item should be active
        const targetScreen = item.getAttribute('data-screen');
        if (targetScreen === activeScreenId) {
            item.classList.add('active');
        }
    });
}

// ===== STORY MODAL SYSTEM =====
function openStoryModal(storyKey) {
    const modal = document.getElementById('story-modal');
    const titleElement = document.getElementById('modal-title');
    const contentElement = document.getElementById('modal-story-content');
    
    if (storyContent[storyKey]) {
        const story = storyContent[storyKey];
        titleElement.textContent = story.title;
        contentElement.innerHTML = story.content;
        
        modal.classList.add('active');
        isModalOpen = true;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        console.log(`📖 Opened story: ${story.title}`);
    }
}

function closeStoryModal() {
    const modal = document.getElementById('story-modal');
    modal.classList.remove('active');
    isModalOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    console.log('📖 Closed story modal');
}

// ===== GAME SYSTEM =====
function startGame(gameType) {
    const modal = document.getElementById('game-modal');
    modal.classList.add('active');
    isModalOpen = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    console.log(`🎮 Started game: ${gameType}`);
    
    // Here you would implement actual game logic
    // For now, it's just a placeholder modal
}

function closeGameModal() {
    const modal = document.getElementById('game-modal');
    modal.classList.remove('active');
    isModalOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    console.log('🎮 Closed game modal');
}

// ===== MODAL MANAGEMENT =====
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    
    isModalOpen = false;
    document.body.style.overflow = '';
}

function handleOutsideClick(event) {
    const modals = document.querySelectorAll('.modal.active');
    
    modals.forEach(modal => {
        const modalContent = modal.querySelector('.modal-content');
        if (modal.contains(event.target) && !modalContent.contains(event.target)) {
            closeAllModals();
        }
    });
}

// ===== KEYBOARD NAVIGATION =====
function handleKeyDown(event) {
    switch(event.key) {
        case 'Escape':
            if (isModalOpen) {
                closeAllModals();
            }
            break;
        
        case '1':
            if (!isModalOpen) showScreen('dashboard-screen');
            break;
        
        case '2':
            if (!isModalOpen) showScreen('stories-screen');
            break;
        
        case '3':
            if (!isModalOpen) showScreen('games-screen');
            break;
    }
}

// ===== ANIMATION ENHANCEMENTS =====
function initializeAnimations() {
    // Create additional dynamic stars
    createDynamicStars();
    
    // Add touch feedback for buttons
    addTouchFeedback();
    
    // Initialize intersection observer for scroll animations
    initializeScrollAnimations();
}

function createDynamicStars() {
    const starsContainer = document.querySelector('.stars-container');
    const additionalStars = 10;
    
    for (let i = 0; i < additionalStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.top = Math.random() * 100 + '%';
        star.style.left = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (2 + Math.random() * 2) + 's';
        
        // Random star size
        const size = Math.random() * 3 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        
        starsContainer.appendChild(star);
    }
}

function addTouchFeedback() {
    const interactiveElements = document.querySelectorAll(
        '.get-started-btn, .feature-card, .story-card, .play-btn, .nav-item, .modal-btn'
    );
    
    interactiveElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        element.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
}

function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe cards and interactive elements
    const elementsToObserve = document.querySelectorAll(
        '.feature-card, .story-card, .game-card'
    );
    
    elementsToObserve.forEach(element => {
        observer.observe(element);
    });
}

// ===== UTILITY FUNCTIONS =====
function addNotificationBadge(element, count) {
    const badge = document.createElement('div');
    badge.className = 'notification-badge';
    badge.textContent = count;
    element.appendChild(badge);
}

function removeNotificationBadge(element) {
    const badge = element.querySelector('.notification-badge');
    if (badge) {
        badge.remove();
    }
}

// ===== PROGRESSIVE WEB APP FEATURES =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('🌟 SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('❌ SW registration failed: ', registrationError);
            });
    });
}

// ===== PERFORMANCE OPTIMIZATION =====
// Lazy load animations for better performance
function enableLazyAnimations() {
    const animatedElements = document.querySelectorAll('.floating-planet, .alien');
    
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            } else {
                entry.target.style.animationPlayState = 'paused';
            }
        });
    });
    
    animatedElements.forEach(element => {
        element.style.animationPlayState = 'paused';
        animationObserver.observe(element);
    });
}

// Initialize lazy animations after a short delay
setTimeout(enableLazyAnimations, 1000);

// ===== ANALYTICS & TRACKING =====
function trackUserAction(action, details = {}) {
    console.log(`📊 User Action: ${action}`, details);
    
    // Here you could integrate with analytics services
    // Example: gtag('event', action, details);
}

// ===== EASTER EGGS =====
let clickCount = 0;
const alienMascot = document.querySelector('.alien');

if (alienMascot) {
    alienMascot.addEventListener('click', function() {
        clickCount++;
        
        if (clickCount === 5) {
            this.style.animation = 'none';
            setTimeout(() => {
                this.style.animation = 'float 1s ease-in-out infinite';
            }, 100);
            
            // Create sparkle effect
            createSparkles(this);
            
            console.log('🎉 Easter egg activated!');
            clickCount = 0;
        }
    });
}

function createSparkles(element) {
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.position = 'absolute';
        sparkle.style.width = '4px';
        sparkle.style.height = '4px';
        sparkle.style.background = 'var(--accent-yellow)';
        sparkle.style.borderRadius = '50%';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.animation = 'sparkle 1s ease-out forwards';
        
        const rect = element.getBoundingClientRect();
        sparkle.style.left = (rect.left + rect.width/2) + 'px';
        sparkle.style.top = (rect.top + rect.height/2) + 'px';
        
        document.body.appendChild(sparkle);
        
        // Random direction for sparkle
        const angle = (i / 8) * 2 * Math.PI;
        const distance = 50;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        sparkle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${x}px, ${y}px) scale(0)`, opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        }).onfinish = () => sparkle.remove();
    }
}

console.log('🌟 Stellar Tales loaded successfully!');
console.log('🎮 Tips: Press 1,2,3 for navigation, ESC to close modals, click the alien 5 times for a surprise!');
import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat-container');

let loadInterval;
let currentTypingInterval;

// Function to show a loading indicator
function loader(element) {
    element.textContent = '';
    loadInterval = setInterval(() => {
        element.textContent += '.';
        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
}

// Function to type out text in the chat
function typeText(element, text) {
    let index = 0;
    currentTypingInterval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
        } else {
            clearInterval(currentTypingInterval);
        }
    }, 20);
}

// Function to generate a unique ID for each message
function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);
    return `id-${timestamp}-${hexadecimalString}`;
}

// Function to create chat message elements
function chatStripe(isAi, value, uniqueId) {
    return `
        <div class="wrapper ${isAi ? 'ai' : ''}">
            <div class="chat">
                <div class="profile">
                    <img 
                      src=${isAi ? bot : user} 
                      alt="${isAi ? 'bot' : 'user'}" 
                    />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>
            </div>
        </div>
    `;
}

// Handle form submission
const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const userPrompt = data.get('prompt');

    // User chat
    chatContainer.innerHTML += chatStripe(false, userPrompt);
    form.reset();

    // Bot chat
    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const messageDiv = document.getElementById(uniqueId);
    loader(messageDiv);

    // Fetch data from server -> bot response
    try {
        const response = await fetch('http://localhost:5000', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: userPrompt }),
        });

        clearInterval(loadInterval);
        messageDiv.innerHTML = '';

        if (response.ok) {
            const data = await response.json();
            const parsedData = data.bot.trim();
            typeText(messageDiv, parsedData);
        } else {
            const err = await response.text();
            messageDiv.innerHTML = "Something went wrong";
            alert(err);
        }
    } catch (error) {
        clearInterval(loadInterval);
        messageDiv.innerHTML = "Something went wrong";
        console.error("Fetch error:", error);
        alert("Error fetching response from the server.");
    }
};

// Function to cancel typing
const cancelTyping = () => {
    clearInterval(currentTypingInterval);
};

// Event listeners for form submission and Enter key press
form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Allow Shift + Enter for new line
        handleSubmit(e);
    }
    if (e.key === 'Escape') { // Pressing Escape cancels typing
        cancelTyping();
    }
});

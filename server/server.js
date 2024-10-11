import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

// Load environment variables from .env file
dotenv.config();

const hfApiKey = process.env.HUGGINGFACE_API_KEY; // Load your Hugging Face API key

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple GET route
app.get('/', (req, res) => {
    res.status(200).send({
        message: 'Hello from Dialognix',
    });
});

// Function to fetch response from GPT-Neo with retry logic
const fetchResponse = async (prompt, retries = 3) => {
    try {
        const response = await axios.post('https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-2.7B', {
            inputs: prompt,
        }, {
            headers: {
                'Authorization': `Bearer ${hfApiKey}`,
                'Content-Type': 'application/json',
            }
        });

        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 503 && retries > 0) {
            console.log("Model is loading, retrying...");
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            return fetchResponse(prompt, retries - 1);
        } else {
            throw error; // Rethrow if it's a different error
        }
    }
};

// POST route to interact with Hugging Face
app.post('/', async (req, res) => {
    console.log("Received request body:", req.body);

    try {
        const prompt = req.body.prompt; // Get prompt from request body
        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            return res.status(400).send({ error: 'Valid prompt is required.' });
        }

        console.log("Received prompt:", prompt);

        const responseData = await fetchResponse(prompt);

        // Check if response data exists and send the response
        if (responseData && responseData[0]) {
            res.status(200).send({
                bot: responseData[0].generated_text.trim(),
            });
        } else {
            res.status(500).send({ error: 'Invalid response from the model.' });
        }
    } catch (error) {
        console.error("Error occurred:", error);
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
            res.status(error.response.status).send({ error: error.response.data });
        } else {
            console.error("Error message:", error.message);
            res.status(500).send({ error: 'Something went wrong, please try again.' });
        }
    }
});

// Start the server
app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});

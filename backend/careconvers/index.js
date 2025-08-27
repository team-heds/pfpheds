require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = 3001; // Port for the backend server

// Check for OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY});

app.use(cors());
app.use(express.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is missing.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano-2025-08-07',
      messages: [{ role: 'user', content: prompt }],
    });

    const chatResponse = completion.choices[0].message.content;
    res.json({ response: chatResponse });

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "An error occurred while communicating with the OpenAI API." });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

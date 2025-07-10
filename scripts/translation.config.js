module.exports = {
    // OpenAI API configuration
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 32000 // Increased to handle entire files at once
    },
}; 
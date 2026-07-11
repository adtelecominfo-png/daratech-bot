const axios = require('axios');
const { fetchBuffer } = require('../lib/myfunc');

async function imagineCommand(sock, chatId, message) {
    try {
        // Get the prompt from the message
        const prompt = message.message?.conversation?.trim() || 
                      message.message?.extendedTextMessage?.text?.trim() || '';
        
        // Remove the command prefix and trim
        const imagePrompt = prompt.slice(8).trim();
        
        if (!imagePrompt) {
            await sock.sendMessage(chatId, {
                text: 'Please provide a prompt for the image generation.\nExample: .imagine a beautiful sunset over mountains'
            }, {
                quoted: message
            });
            return;
        }

        // Send processing message
        await sock.sendMessage(chatId, {
            text: '🎨 Generating your image... Please wait.'
        }, {
            quoted: message
        });

        // Enhance the prompt with quality keywords
        const enhancedPrompt = enhancePrompt(imagePrompt);

        // Make API request
        const response = await axios.get(`https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=${encodeURIComponent(enhancedPrompt)}`, {
            responseType: 'arraybuffer',
            validateStatus: () => true
        });

        // Debug: log response info
        console.log('[IMAGINE] Status:', response.status);
        console.log('[IMAGINE] Content-Type:', response.headers['content-type']);
        console.log('[IMAGINE] Data length:', response.data?.length);
        console.log('[IMAGINE] First 100 bytes:', Buffer.from(response.data).slice(0, 100).toString('utf8', 0, 100));

        // Check if response is actually an image
        const contentType = response.headers['content-type'] || '';
        if (!contentType.startsWith('image/')) {
            const text = Buffer.from(response.data).toString('utf8');
            console.error('[IMAGINE] Not an image, got:', text.slice(0, 500));
            throw new Error('API returned non-image: ' + text.slice(0, 200));
        }

        // Convert response to buffer
        const imageBuffer = Buffer.from(response.data);

        // Send the generated image
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `🎨 Generated image for prompt: "${imagePrompt}"`
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('Error in imagine command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to generate image. Please try again later.'
        }, {
            quoted: message
        });
    }
}

// Function to enhance the prompt
function enhancePrompt(prompt) {
    // Quality enhancing keywords
    const qualityEnhancers = [
        'high quality',
        'detailed',
        'masterpiece',
        'best quality',
        'ultra realistic',
        '4k',
        'highly detailed',
        'professional photography',
        'cinematic lighting',
        'sharp focus'
    ];

    // Randomly select 3-4 enhancers
    const numEnhancers = Math.floor(Math.random() * 2) + 3; // Random number between 3-4
    const selectedEnhancers = qualityEnhancers
        .sort(() => Math.random() - 0.5)
        .slice(0, numEnhancers);

    // Combine original prompt with enhancers
    return `${prompt}, ${selectedEnhancers.join(', ')}`;
}

module.exports = imagineCommand; 
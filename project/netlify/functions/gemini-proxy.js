// netlify/functions/gemini-proxy.js

// 使用 ES Module 语法导入 node-fetch
// 注意：Netlify Functions 默认支持这种现代语法
import fetch from 'node-fetch';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

export async function handler(event, context) {
    // 1. 只接受 POST 请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
        };
    }

    // 2. 从环境变量中安全地获取 API Key
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key is not set on the server.' }),
        };
    }

    try {
        // 3. 获取从前端发送过来的用户消息
        const { message } = JSON.parse(event.body);

        // 4. 从 Netlify 服务器向 Google Gemini API 发起请求
        const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: message }]
                }]
            })
        });

        if (!response.ok) {
            // 如果 Google API 返回错误，则将错误信息传递给前端
            const errorData = await response.json();
            return {
                statusCode: response.status,
                body: JSON.stringify(errorData),
            };
        }

        const data = await response.json();

        // 5. 将从 Gemini 获取到的结果返回给前端
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal error occurred in the proxy function.' }),
        };
    }
}

// voc-backend/server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 🛑 關鍵改變 1：初始化經典版 Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json({ limit: '10mb' })); // 允許接收大容量的 Base64 照片

app.post('/api/scan', async (req, res) => {
    try {
        const { imageBase64, mode } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image data provided' });

        console.log(`收到掃描請求，模式: ${mode}，照片處理中...`);

        // 清洗 Base64 標頭
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        // 🛑 關鍵改變 2：將照片轉換為經典版 SDK 規定的格式
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
            }
        };

        let prompt = mode === 'focus' 
            ? `這是一張相機截圖。請找出圖片正中央最明顯的「一個」英文單字。請務必以 JSON 格式回傳，包含：word (單字), pronunciation (音標), translation (繁體中文), sentence (例句)。只回傳純 JSON，不要有 markdown 標記。`
            : `這是一張相機截圖。請辨識圖片中出現的英文單字，挑選出「三個」單字。請務必以 JSON 陣列 (Array) 格式回傳，每個物件包含：word, pronunciation, translation (繁體中文), sentence。只回傳純 JSON，不要有 markdown 標記。`;

        // 🛑 關鍵改變 3：呼叫模型與生成內容
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent([prompt, imagePart]);
        const textResponse = result.response.text();
        
        console.log("AI 原始回覆:", textResponse);

        let parsedData;
        try {
            // 清理可能出現的 ```json 標記
            const cleanJsonString = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            parsedData = JSON.parse(cleanJsonString);
        } catch (e) {
            console.error("JSON 解析失敗:", textResponse);
            return res.status(500).json({ error: "AI 回傳格式無法解析為 JSON", raw: textResponse });
        }

        res.status(200).json({ success: true, mode, data: parsedData });

    } catch (error) {
        console.error("後端處理錯誤:", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(port, () => console.log(`Voc Cards Backend listening at http://localhost:${port}`));
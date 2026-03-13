// voc-backend/test.js
import dotenv from 'dotenv';

dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ 找不到 API Key！請檢查 .env 檔案。");
    process.exit(1);
}

// 把金鑰前後可能不小心多按到的空白鍵或引號清掉，防止靈異干擾
const cleanKey = apiKey.replace(/['"]/g, '').trim();

async function checkAvailableModels() {
    console.log("🕵️‍♂️ 正在潛入 Google 主機，查詢這把金鑰的真實權限...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
        const data = await response.json();
        
        if (data.error) {
            console.error("❌ 查核失敗，Google 拒絕了這把金鑰：");
            console.error(data.error);
        } else if (data.models && data.models.length > 0) {
            console.log("✅ 真相大白！這把金鑰真正支援的模型有：\n");
            
            // 過濾並印出所有支援 generateContent (生成內容) 的模型
            const usableModels = data.models.filter(m => 
                m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
            );
            
            usableModels.forEach(m => {
                // 只印出包含 gemini 的名字，方便我們看
                if(m.name.includes("gemini")) {
                    console.log(`👉 ${m.name}`);
                }
            });
            console.log("\n(請把上面印出來的清單告訴我！)");
        } else {
            console.log("⚠️ 查詢成功，但這把金鑰底下沒有任何可用的模型 (空清單)！");
        }
    } catch (err) {
        console.error("❌ 網路連線錯誤：", err.message);
    }
}

checkAvailableModels();
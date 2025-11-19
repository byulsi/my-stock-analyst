// 파일명: check-models.js
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// 1. .env.local에서 API 키 가져오기
const envPath = path.join(__dirname, '.env.local');
dotenv.config({ path: envPath });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY가 없습니다. .env.local 파일을 확인하세요.");
  process.exit(1);
}

async function listModels() {
  try {
    console.log("🔍 사용 가능한 Gemini 모델을 조회 중입니다...");
    
    // 구글 API에 직접 물어봅니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    const response = await axios.get(url);
    const models = response.data.models;

    console.log("\n✅ [사용 가능한 모델 목록]");
    console.log("--------------------------------------------------");
    
    models.forEach((model) => {
      // 'generateContent' 기능을 지원하는 모델만 출력
      if (model.supportedGenerationMethods.includes("generateContent")) {
        // 모델 이름에서 'models/' 부분 제거하고 출력
        const simpleName = model.name.replace('models/', '');
        console.log(`📌 이름: ${simpleName}`);
        console.log(`   설명: ${model.displayName} (${model.version})`);
        console.log("");
      }
    });
    console.log("--------------------------------------------------");
    console.log("💡 위 목록에 있는 '이름'을 lib/aiService.ts 파일에 적으시면 됩니다.");

  } catch (error) {
    console.error("❌ 조회 실패:", error.response ? error.response.data : error.message);
  }
}

listModels();
import { GoogleGenerativeAI } from '@google/generative-ai';

// API 키 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * 시계열(과거->현재) 텍스트 데이터를 받아 추세를 분석하는 함수
 * @param combinedText 분석할 모든 보고서의 합친 텍스트
 * @param corpName 기업명
 * @param stockCode 종목코드
 */
export async function analyzeTrend(combinedText: string, corpName: string, stockCode: string) {
  
  // 모델 설정: 컨텍스트가 길기 때문에 Gemini 2.0 Flash (또는 1.5 Flash) 사용
  // 503 에러가 나면 "gemini-1.5-flash"로 변경하세요.
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // 프롬프트가 여기에 격리되어 있어, 나중에 수정하기 매우 편합니다.
  const prompt = `
        너는 20년 경력의 주식 애널리스트야. 
        아래 제공된 기업의 보고서 데이터를 꼼꼼히 읽고, 개인 투자자가 놓치기 쉬운 '디테일한 리스크'와 '핵심 투자 포인트'를 분석해 줘.

        분석 대상: ${corpName} (${stockCode})
        데이터 구성: 
        - 최근 1년: 분기/반기별 상세 흐름
        - 과거 3년: 연간(사업보고서) 주요 흐름

        [요청 사항]
        다음 4가지 핵심 섹션에 대해 보고서 내의 구체적인 데이터(숫자, 섹션명)를 인용하여 Markdown 형식으로 답변해 주세요.

        ### 1. [비즈니스 모델] 본업의 경쟁력 확인
        - 이 회사의 매출 비중이 가장 높은 핵심 제품(Cash Cow)은 무엇입니까?
        - 원재료 가격 변동 추이와 제품 가격(P) 변동 추이를 비교하여, 원가 부담을 판가에 전가할 수 있는 '가격 결정권(Pricing Power)'이 있는지 판단해 주세요.

        ### 2. [재무 건전성] 숫자의 진실 파악
        - 최근 3년간 매출액과 영업이익률(OPM)이 우상향 중입니까, 아니면 정체/하락 중입니까?
        - '영업활동 현금흐름'이 '당기순이익'보다 큽니까? (만약 영업현금흐름이 마이너스(-)거나 순이익보다 현저히 작다면 '분식회계'나 '현금 회수 지연' 가능성을 경고해 주세요.)

        ### 3. [자금 조달 및 오버행 리스크] 숨겨진 매물 폭탄 정밀 타격
        **※ 이 부분은 제공된 텍스트 중 '자본금 변동사항' 및 '재무제표 주석(금융부채/사채)' 항목을 반드시 검색하여 답하시오.**
        - **미상환 잔액:** 현재 주식으로 전환되지 않고 남아있는 전환사채(CB), 신주인수권부사채(BW), 교환사채(EB)의 총 잔액은 얼마입니까?
        - **전환 조건:** 해당 사채들의 '전환가액'은 얼마이며, 현재 '전환청구 가능 기간'에 도달해 있습니까? (특히 주가 하락에 따라 전환가액이 조정되는 '리픽싱(Refixing)' 조항이 활발히 적용되고 있는지 확인)
        - **희석 비율:** 미상환 잔액이 현재 시가총액 대비 어느 정도 비중을 차지하여, 주가 희석 우려가 큰 상황입니까?

        ### 4. [종합 결론] 투자 매력도 평가
        - 위 분석을 종합할 때, 이 기업의 가장 확실한 **매력 포인트(Upside)** 1가지와 가장 치명적인 **리스크(Downside)** 1가지를 선정해 주세요.
        - 최종적으로 이 기업은 '적극 매수', '관망', '매도(리스크 관리)' 중 어떤 단계에 가까운지 투자자 관점에서 평가해 주세요.

        ---
[보고서 데이터 모음]
${combinedText}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini 호출 중 에러:", error);
    // 에러 발생 시 사용자에게 보여줄 메시지
    return "AI 분석 서비스가 일시적으로 원활하지 않습니다. 잠시 후 다시 시도해 주세요.";
  }
}
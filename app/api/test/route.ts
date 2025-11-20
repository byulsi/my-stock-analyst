import { NextResponse } from 'next/server';
import { getDisclosureList, getReportContent, findCorpCode } from '@/lib/dartService';
import { parseReportContent } from '@/lib/parser';
import { analyzeTrend } from '@/lib/aiService';

// ⏳ Vercel 타임아웃 방지 (최대 60초)
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

interface DartReport {
  rcept_no: string;
  report_nm: string;
  rcept_dt: string;
  corp_name: string;
  corp_code: string;
  stock_code: string;
}

export async function GET(request: Request) {
  try {
    // 1. 검색어 처리
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('code') || '삼성전자';
    console.log(`🔎 [맞춤 추세 분석] 검색어: ${query}`);

    // 2. 기업 식별
    const corpInfo = await findCorpCode(query);
    const { corpCode, stockCode, corpName } = corpInfo;

    // 3. 날짜 설정 (최대 3년 치 데이터 조회)
    const today = new Date();
    const searchPeriod = new Date();
    searchPeriod.setMonth(today.getMonth() - 36); // 3년 전
    
    // 최근 1년 기준선 (분기/반기 보고서 필터링용)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');

    const endDe = today.toISOString().slice(0, 10).replace(/-/g, '');
    const bgnDe = searchPeriod.toISOString().slice(0, 10).replace(/-/g, '');

    console.log(`📅 검색 전체 기간: ${bgnDe} ~ ${endDe}`);

    // 4. DART 리스트 조회
    const list = await getDisclosureList(corpCode, bgnDe, endDe) as DartReport[];
    
    if (!list || list.length === 0) {
        return NextResponse.json({ 
            success: false, 
            message: `최근 3년간 공시된 보고서가 없습니다. (검색어: ${query})` 
        });
    }

    // 5. [핵심] 보고서 선별 로직 (요청하신 조건 정밀 반영)

    // 조건 1: 사업보고서는 최근 3년 내 데이터 모두 포함 (1~3년 제한 없음)
    const annualReports = list.filter(report => 
        report.report_nm.includes('사업보고서')
    );

    // 조건 2: 분기/반기 보고서는 '최근 1년 이내' 데이터 중 '최신 2건'만 포함
    const interimCandidates = list.filter(report => {
        const isRecent = report.rcept_dt >= oneYearAgoStr;
        const isTarget = report.report_nm.match(/(분기|반기)보고서/); // 정규식 사용
        return isRecent && isTarget;
    });

    // 최신순 정렬 후 상위 2개만 자르기
    interimCandidates.sort((a, b) => Number(b.rcept_dt) - Number(a.rcept_dt));
    const selectedInterim = interimCandidates.slice(0, 2);

    // 6. 병합 및 중복 제거
    // (혹시 사업보고서와 분기보고서가 겹칠 일은 거의 없지만, 안전하게 합칩니다)
    const reportsToAnalyze = [...annualReports, ...selectedInterim];

    // AI가 흐름을 읽기 좋게 '과거 -> 현재' 순으로 정렬
    reportsToAnalyze.sort((a, b) => Number(a.rcept_dt) - Number(b.rcept_dt));

    console.log(`📚 최종 분석 대상 (${reportsToAnalyze.length}개):`);
    reportsToAnalyze.forEach(r => console.log(` - [${r.rcept_dt}] ${r.report_nm}`));

    if (reportsToAnalyze.length === 0) {
        return NextResponse.json({ success: false, message: '조건에 맞는 보고서를 찾지 못했습니다.' });
    }

    // 7. 데이터 병렬 다운로드 및 파싱
    console.log("🚀 데이터 다운로드 및 파싱 시작...");
    
    const docsPromises = reportsToAnalyze.map(async (report) => {
      try {
        const raw = await getReportContent(report.rcept_no);
        const clean = parseReportContent(raw);
        
        // 섹션 추출 ("II. 사업의 내용" ~ "III. 재무에 관한 사항")
        const startKeyword = "II. 사업의 내용";
        const endKeyword = "III. 재무에 관한 사항";
        let section = "";
        const startIdx = clean.indexOf(startKeyword);
        const endIdx = clean.indexOf(endKeyword);
        
        if (startIdx !== -1 && endIdx !== -1) {
            section = clean.substring(startIdx, endIdx);
        } else if (startIdx !== -1) {
            section = clean.substring(startIdx, startIdx + 30000);
        } else {
            section = clean.substring(0, 15000);
        }

        return `
        === [보고서: ${report.report_nm} (접수일: ${report.rcept_dt})] ===
        ${section}
        ==========================================================
        `;
      } catch (e) {
        console.error(`보고서(${report.report_nm}) 로드 실패`, e);
        return "";
      }
    });

    const docsResults = await Promise.all(docsPromises);
    const combinedText = docsResults.join("\n\n");

    // 8. AI 분석 요청
    console.log("🤖 AI 추세 분석 시작...");
    
    const aiAnalysis = await analyzeTrend(combinedText, corpName, stockCode);

    return NextResponse.json({
      success: true,
      company: corpName,
      reportTitle: `종합 추세 분석 (사업보고서 ${annualReports.length}건 + 최신 분기/반기 ${selectedInterim.length}건)`,
      stockCode: stockCode,
      analysisResult: aiAnalysis 
    });

  } catch (error: any) {
    console.error("서버 에러:", error);
    return NextResponse.json({ 
        success: false, 
        error: error.message || '서버 내부 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
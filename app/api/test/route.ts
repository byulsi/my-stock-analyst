import { NextResponse } from 'next/server';
import { getDisclosureList, getReportContent, findCorpCode } from '@/lib/dartService';
import { parseReportContent } from '@/lib/parser';
import { analyzeTrend } from '@/lib/aiService';

// 1. [추가] DART 보고서가 어떻게 생겼는지 정의하는 '설계도(Interface)'입니다.
// 이걸 추가하면 TypeScript가 "아, list 안에 이런 애들이 들어있구나" 하고 알아듣습니다.
interface DartReport {
  rcept_no: string;   // 접수번호
  report_nm: string;  // 보고서명
  rcept_dt: string;   // 접수일자
  corp_name: string;  // 기업명
  corp_code: string;  // 고유번호
  stock_code: string; // 종목코드
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('code') || '삼성전자';
    console.log(`🔎 [추세 분석] 검색어: ${query}`);

    const corpInfo = await findCorpCode(query);
    const { corpCode, stockCode, corpName } = corpInfo;

    const today = new Date();
    const searchPeriod = new Date();
    searchPeriod.setMonth(today.getMonth() - 36);
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');

    const endDe = today.toISOString().slice(0, 10).replace(/-/g, '');
    const bgnDe = searchPeriod.toISOString().slice(0, 10).replace(/-/g, '');

    console.log(`📅 검색 기간: ${bgnDe} ~ ${endDe} (상세분석 기준일: ${oneYearAgoStr})`);

    // 2. [수정] 가져온 데이터를 'DartReport들의 배열'이라고 강제로 이름표를 붙여줍니다.
    // (as DartReport[] 부분이 핵심입니다)
    const list = await getDisclosureList(corpCode, bgnDe, endDe) as DartReport[];
    
    if (!list || list.length === 0) {
        return NextResponse.json({ 
            success: false, 
            message: `최근 3년간 공시된 보고서가 없습니다. (검색어: ${query})` 
        });
    }

    // 3. 이제 TypeScript가 'report'가 뭔지 알기 때문에 에러가 사라집니다.
    const reportsToAnalyze = list.filter((report) => {
      const reportDate = report.rcept_dt; 
      const name = report.report_nm;      

      const isAnnual = name.includes('사업보고서');
      const isSemi = name.includes('반기보고서');
      const isQuarter = name.includes('분기보고서');

      if (reportDate >= oneYearAgoStr) {
        return isAnnual || isSemi || isQuarter;
      } else {
        return isAnnual;
      }
    });

    // 정렬 부분에서도 a, b가 뭔지 알게 됩니다.
    reportsToAnalyze.sort((a, b) => Number(a.rcept_dt) - Number(b.rcept_dt));

    console.log(`📚 분석 대상 보고서 (${reportsToAnalyze.length}개):`);
    reportsToAnalyze.forEach(r => console.log(` - [${r.rcept_dt}] ${r.report_nm}`));

    if (reportsToAnalyze.length === 0) {
        return NextResponse.json({ success: false, message: '조건에 맞는 보고서를 찾지 못했습니다.' });
    }

    console.log("🚀 데이터 다운로드 및 파싱 시작...");
    
    const docsPromises = reportsToAnalyze.map(async (report) => {
      try {
        const raw = await getReportContent(report.rcept_no);
        const clean = parseReportContent(raw);
        
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

    console.log("🤖 AI 추세 분석 시작...");
    
    const aiAnalysis = await analyzeTrend(combinedText, corpName, stockCode);

    return NextResponse.json({
      success: true,
      company: corpName,
      reportTitle: `최근 3년 종합 추세 분석 (${reportsToAnalyze.length}건)`,
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
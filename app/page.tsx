'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  // 사용자가 입력하는 값 (이제는 DART 고유번호가 아니라 '종목코드'를 받습니다)
  const [stockCode, setStockCode] = useState('005930'); // 기본값: 삼성전자
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    // 1. 분석 시작 전 상태 초기화
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 2. API 호출 (사용자가 입력한 stockCode를 쿼리 파라미터로 보냄)
      // 예: /api/test?code=005930
      const response = await fetch(`/api/test?code=${stockCode}`);
      const data = await response.json();

      // 3. 에러 처리 (HTTP 에러이거나, API 내부에서 success: false를 보냈을 때)
      if (!response.ok || (data.success === false)) {
        throw new Error(data.message || data.error || '분석에 실패했습니다.');
      }

      // 4. 성공 시 결과 저장
      setResult(data);

    } catch (err: any) {
      console.error(err);
      setError(err.message || '알 수 없는 에러가 발생했습니다.');
    } finally {
      // 5. 로딩 상태 해제
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        {/* 헤더 섹션 */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          📈 주식 분석 AI 에이전트
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          종목명 또는 종목코드만 입력하면 최근 보고서를 분석해 드립니다.
        </p>

        {/* 입력 섹션 (Rim: 사용자 접점) */}
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={stockCode}
            onChange={(e) => setStockCode(e.target.value)}
            placeholder="종목명(예: 삼성전자) 또는 종목코드(예: 005930)" 
            className="..."
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">🔄</span> 분석 중...
              </>
            ) : (
              '분석 시작 🚀'
            )}
          </button>
        </div>

        {/* 에러 메시지 표시 */}
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            🚨 <strong>에러 발생:</strong> {error}
          </div>
        )}

        {/* 결과 섹션 */}
        {result && (
          <div className="animate-fade-in-up">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-blue-900">
                  {result.company} ({result.stockCode})
                </h2>
                <span className="text-xs bg-white text-blue-600 px-2 py-1 rounded border border-blue-200">
                  {result.reportTitle}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                분석 모델: Gemini 2.0 Flash
              </p>
            </div>

            {/* 마크다운 렌더링 영역 */}
            {/* 'prose' 클래스가 마법을 부리는 부분입니다 */}
            <article className="prose prose-slate max-w-none bg-white p-4 rounded-lg">
              <ReactMarkdown>{result.analysisResult}</ReactMarkdown>
            </article>
          </div>
        )}
        
        {/* 초기 안내 문구 */}
        {!result && !loading && !error && (
          <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p>상단에 <strong>종목코드</strong>를 입력하고 분석 버튼을 눌러보세요.</p>
            <p className="text-xs mt-2 text-gray-300">예시: 삼성전자(005930), 카카오(035720), SK하이닉스(000660)</p>
          </div>
        )}
      </div>
    </main>
  );
}
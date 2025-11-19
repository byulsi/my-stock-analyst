import * as cheerio from 'cheerio';

/**
 * HTML/XML 원문을 AI가 읽기 좋은 텍스트로 변환합니다.
 */
export function parseReportContent(rawHtml: string): string {
  // 1. HTML 로드
  const $ = cheerio.load(rawHtml);

  // 2. 쓰레기 청소 (script, style, 헤더, 푸터 제거)
  $('script').remove();
  $('style').remove();
  $('head').remove();
  $('meta').remove();
  $('iframe').remove(); // 불필요한 외부 프레임 제거

  // 3. 표(Table)를 Markdown 형식으로 변환 (AI가 표를 잘 이해하게 하기 위함)
  $('table').each((i, el) => {
    let tableText = '\n'; // 표 시작 전 줄바꿈
    
    // 헤더 처리 (th)
    const headers: string[] = [];
    $(el).find('th').each((j, th) => {
      headers.push($(th).text().trim().replace(/\s+/g, ' '));
    });
    
    if (headers.length > 0) {
      tableText += `| ${headers.join(' | ')} |\n`;
      tableText += `| ${headers.map(() => '---').join(' | ')} |\n`; // 구분선
    }

    // 데이터 행 처리 (tr, td)
    $(el).find('tr').each((j, tr) => {
      const cells: string[] = [];
      $(tr).find('td').each((k, td) => {
        cells.push($(td).text().trim().replace(/\s+/g, ' '));
      });
      if (cells.length > 0) {
        tableText += `| ${cells.join(' | ')} |\n`;
      }
    });

    // 원래 표 태그를 우리가 만든 텍스트로 교체
    $(el).replaceWith(tableText + '\n');
  });

  // 4. 본문 텍스트 추출 및 공백 정리
  let cleanText = $('body').text();
  
  // 연속된 공백이나 줄바꿈을 깔끔하게 정리
  cleanText = cleanText
    .replace(/\n\s*\n/g, '\n\n') // 여러 줄바꿈을 두 줄로 통일
    .trim();

  return cleanText;
}
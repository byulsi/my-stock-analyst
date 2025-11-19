import axios from 'axios';
import AdmZip from 'adm-zip';

// DART API 기본 주소
const BASE_URL = 'https://opendart.fss.or.kr/api';
const API_KEY = process.env.DART_API_KEY;

/**
 * 1. 공시 리스트 조회 (Search)
 * 특정 기업(corp_code)의 보고서 목록을 가져옵니다.
 * @param corpCode DART 고유번호 (8자리) 예: 00126380 (삼성전자)
 * @param bgnDe 검색 시작일 (YYYYMMDD)
 * @param endDe 검색 종료일 (YYYYMMDD)
 * @param pblntfTy 공시 유형 (A: 정기공시)
 */
export async function getDisclosureList(corpCode: string, bgnDe: string, endDe: string) {
  if (!API_KEY) throw new Error('DART_API_KEY가 설정되지 않았습니다.');

  // API 요청 주소 만들기
  const url = `${BASE_URL}/list.json`;
  
  try {
    const response = await axios.get(url, {
      params: {
        crtfc_key: API_KEY,
        corp_code: corpCode,
        bgn_de: bgnDe,
        end_de: endDe,
        pblntf_ty: 'A', // A는 정기공시(사업, 분기, 반기보고서)만 필터링
        page_count: 10, // 10개만 가져오기
      },
    });

    const data = response.data;

    if (data.status !== '000') {
      throw new Error(`DART API 에러: ${data.message}`);
    }

    return data.list; // 보고서 목록 배열 반환
  } catch (error) {
    console.error('공시 리스트 조회 실패:', error);
    throw error;
  }
}

/**
 * 2. 보고서 원문 다운로드 및 텍스트 추출 (Fetch & Unzip)
 * rcept_no(접수번호)를 받아 ZIP 파일을 다운로드하고, 내부의 XML/HTML 텍스트를 반환합니다.
 * @param rceptNo 보고서 접수번호 (리스트 조회에서 얻은 값)
 */
export async function getReportContent(rceptNo: string) {
  if (!API_KEY) throw new Error('DART_API_KEY가 설정되지 않았습니다.');

  const url = `${BASE_URL}/document.xml`; // 원문 다운로드 엔드포인트

  try {
    // 1. 바이너리(파일) 형태로 데이터 요청
    const response = await axios.get(url, {
      params: {
        crtfc_key: API_KEY,
        rcept_no: rceptNo,
      },
      responseType: 'arraybuffer', // 중요: ZIP 파일은 텍스트가 아니라 바이너리입니다.
    });

    // 2. ZIP 압축 해제
    const zip = new AdmZip(response.data);
    const zipEntries = zip.getEntries(); // ZIP 안의 파일 목록

    // 3. 가장 큰 파일(주로 메인 보고서) 찾아서 텍스트로 변환
    // 보통 ZIP 안에는 .xml 혹은 .html 파일이 하나 들어있습니다.
    let mainContent = '';

    for (const entry of zipEntries) {
      // 파일 이름이 xml이나 html로 끝나는 것만 읽기
      if (entry.entryName.endsWith('.xml') || entry.entryName.endsWith('.html')) {
        // 한글 깨짐 방지를 위해 utf-8로 변환 (DART는 대부분 UTF-8 사용)
        mainContent = zip.readAsText(entry, 'utf-8');
        break; // 파일을 찾았으면 반복 종료
      }
    }

    if (!mainContent) {
      throw new Error('ZIP 파일 내에서 유효한 보고서 파일(.xml/html)을 찾지 못했습니다.');
    }

    return mainContent; // HTML/XML 원문 텍스트 반환
  } catch (error) {
    console.error('보고서 다운로드 실패:', error);
    throw error;
  }
}

// lib/dartService.ts 기존 코드 아래쪽의 getCorpCodeFromStockCode 함수를 이걸로 교체하세요.

/**
 * 3. [업그레이드] 기업 검색기 (종목코드 OR 기업명 -> 고유번호)
 * 사용자가 "005930"을 넣든 "삼성전자"를 넣든 알아서 고유번호를 찾아냅니다.
 */
export async function findCorpCode(keyword: string) {
  if (!API_KEY) throw new Error('DART_API_KEY가 설정되지 않았습니다.');

  const url = `${BASE_URL}/corpCode.xml`;

  try {
    // 1. ZIP 파일 다운로드 및 압축 해제 (기존과 동일)
    const response = await axios.get(url, {
      params: { crtfc_key: API_KEY },
      responseType: 'arraybuffer',
    });

    const zip = new AdmZip(response.data);
    const zipEntries = zip.getEntries();
    let xmlData = '';

    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.xml')) {
        xmlData = zip.readAsText(entry, 'utf-8');
        break;
      }
    }

    if (!xmlData) throw new Error('기업 목록 XML을 찾을 수 없습니다.');

    // 2. 검색 로직 (여기가 업그레이드된 부분!)
    // 입력된 키워드가 숫자로만 구성되었는지 확인 (숫자면 종목코드, 아니면 기업명)
    const isStockCode = /^\d+$/.test(keyword); 
    
    let targetBlock = '';

    if (isStockCode) {
      // Case A: 종목코드(숫자)로 검색 (예: 005930)
      const stockTag = `<stock_code>${keyword}</stock_code>`;
      const index = xmlData.indexOf(stockTag);
      if (index === -1) throw new Error(`종목코드 '${keyword}'를 찾을 수 없습니다.`);
      
      // 해당 블록 추출
      const listStartIndex = xmlData.lastIndexOf('<list>', index);
      const listEndIndex = xmlData.indexOf('</list>', index);
      targetBlock = xmlData.substring(listStartIndex, listEndIndex);

    } else {
      // Case B: 기업명으로 검색 (예: 삼성전자)
      // 정확한 매칭을 위해 태그를 포함해서 검색합니다.
      // DART에는 "삼성전자"라고 되어있을 수도, "삼성전자(주)"라고 되어있을 수도 있습니다.
      // 일단 정확히 일치하는 케이스를 먼저 찾습니다.
      const nameTag = `<corp_name>${keyword}</corp_name>`;
      let index = xmlData.indexOf(nameTag);

      // 만약 못 찾았다면? -> "주식회사" 등을 뗀 이름 등으로 유연하게 검색 (간단한 포함 검색)
      // 주의: '삼성'으로 검색하면 '삼성생명'이 먼저 나올 수도 있습니다. 여기서는 첫 번째 발견된 것을 가져옵니다.
      if (index === -1) {
         // 이름 태그 앞부분만 가지고 검색 (<corp_name>삼성전자...)
         index = xmlData.indexOf(`<corp_name>${keyword}`);
      }

      if (index === -1) throw new Error(`기업명 '${keyword}'를 찾을 수 없습니다. 정확한 법인명을 입력해 주세요.`);

      // 해당 블록 추출
      const listStartIndex = xmlData.lastIndexOf('<list>', index);
      const listEndIndex = xmlData.indexOf('</list>', index);
      targetBlock = xmlData.substring(listStartIndex, listEndIndex);
    }

    // 3. 고유번호(corp_code)와 종목코드(stock_code) 추출
    const corpCodeMatch = targetBlock.match(/<corp_code>(\d+)<\/corp_code>/);
    const stockCodeMatch = targetBlock.match(/<stock_code>(\d+)<\/stock_code>/); // 종목코드도 같이 찾아서 반환

    if (corpCodeMatch && corpCodeMatch[1]) {
      return {
        corpCode: corpCodeMatch[1],
        stockCode: stockCodeMatch ? stockCodeMatch[1] : '미상장/기타', // 기업명으로 찾았을 때를 위해
        corpName: keyword // 찾은 이름
      };
    } else {
        throw new Error('고유번호 파싱 실패');
    }

  } catch (error) {
    console.error('기업 검색 실패:', error);
    throw error;
  }
}
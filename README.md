# My Stock Analyst / 나의 주식 분석가

A Next.js application for comprehensive stock analysis, leveraging Google's Generative AI, DART financial data, and web scraping capabilities to provide insightful market information.

Google Generative AI, DART 금융 데이터 및 웹 스크래핑 기능을 활용하여 심층적인 시장 정보를 제공하는 포괄적인 주식 분석을 위한 Next.js 애플리케이션입니다.

## Features / 주요 기능

-   **AI-Powered Analysis**: Utilizes Google Generative AI to process and analyze stock-related data, providing summarized insights or predictions.
    -   **AI 기반 분석**: Google Generative AI를 활용하여 주식 관련 데이터를 처리하고 분석하여 요약된 통찰력 또는 예측을 제공합니다.
-   **DART Data Integration**: Fetches and processes financial disclosure data from the Data Analysis, Retrieval and Transfer System (DART) of Korea's Financial Supervisory Service.
    -   **DART 데이터 통합**: 대한민국 금융감독원의 DART(Data Analysis, Retrieval and Transfer System)에서 재무 공시 데이터를 가져와 처리합니다.
-   **Web Scraping**: Employs `cheerio` to scrape and extract relevant stock information from various web sources.
    -   **웹 스크래핑**: `cheerio`를 사용하여 다양한 웹 소스에서 관련 주식 정보를 스크랩하고 추출합니다.
-   **Interactive User Interface**: Built with Next.js and React for a dynamic and responsive user experience.
    -   **대화형 사용자 인터페이스**: 동적이고 반응적인 사용자 경험을 위해 Next.js 및 React로 구축되었습니다.
-   **Data Parsing & Processing**: Efficiently handles and parses raw data, including zip archives, for analysis.
    -   **데이터 구문 분석 및 처리**: 분석을 위해 압축 아카이브를 포함한 원시 데이터를 효율적으로 처리하고 구문 분석합니다.
-   **Markdown Rendering**: Displays AI-generated analysis and other textual information in a readable Markdown format.
    -   **마크다운 렌더링**: AI가 생성한 분석 및 기타 텍스트 정보를 읽기 쉬운 마크다운 형식으로 표시합니다.

## Technologies Used / 사용된 기술

-   **Framework / 프레임워크**: Next.js 16
-   **Frontend Library / 프론트엔드 라이브러리**: React 19
-   **Language / 언어**: TypeScript
-   **Styling / 스타일링**: Tailwind CSS
-   **AI**: Google Generative AI (`@google/generative-ai`)
-   **HTTP Client / HTTP 클라이언트**: Axios
-   **Web Scraping / 웹 스크래핑**: Cheerio
-   **Zip File Handling / 압축 파일 처리**: adm-zip
-   **Environment Variables / 환경 변수**: dotenv
-   **Markdown Rendering / 마크다운 렌더링**: react-markdown
-   **Code Quality / 코드 품질**: ESLint

## Getting Started / 시작하기

Follow these steps to set up and run the project locally.
프로젝트를 로컬에서 설정하고 실행하려면 다음 단계를 따르세요.

### Prerequisites / 전제 조건

-   Node.js (v18 or higher recommended) / Node.js (v18 이상 권장)
-   npm or Yarn / npm 또는 Yarn

### Installation / 설치

1.  **Clone the repository:**
    **저장소 복제:**
    ```bash
    git clone https://github.com/your-username/my-stock-analyst.git
    cd my-stock-analyst
    ```
    *(Replace `https://github.com/your-username/my-stock-analyst.git` with your actual repository URL)*
    *(실제 저장소 URL로 `https://github.com/your-username/my-stock-analyst.git`를 대체하세요)*

2.  **Install dependencies:**
    **종속성 설치:**
    ```bash
    npm install
    # or / 또는
    yarn install
    ```

3.  **Environment Variables:**
    **환경 변수:**
    Create a `.env.local` file in the root of the project based on the `.env.example` (if provided, otherwise create it manually). You will need to add your Google Generative AI API key and potentially any DART-related credentials or settings.

    `.env.example`을 기반으로 프로젝트 루트에 `.env.local` 파일을 생성합니다(제공된 경우, 그렇지 않은 경우 수동으로 생성). Google Generative AI API 키와 잠재적으로 DART 관련 자격 증명 또는 설정을 추가해야 합니다.

    ```dotenv
    # .env.local
    GOOGLE_API_KEY=YOUR_GOOGLE_GENERATIVE_AI_API_KEY
    # DART_API_KEY=YOUR_DART_API_KEY (if applicable)
    # ... other environment variables
    ```
    Obtain your Google Generative AI API key from the [Google AI Studio](https://aistudio.google.com/).
    [Google AI Studio](https://aistudio.google.com/)에서 Google Generative AI API 키를 얻으세요.

### Running the Development Server / 개발 서버 실행

To run the application in development mode:
개발 모드에서 애플리케이션을 실행하려면:

```bash
npm run dev
# or / 또는
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### Building for Production / 프로덕션용 빌드

To build the application for production:
프로덕션용으로 애플리케이션을 빌드하려면:

```bash
npm run build
# or / 또는
yarn build
```

Then, to start the production server:
그런 다음, 프로덕션 서버를 시작하려면:

```bash
npm start
# or / 또는
yarn start
```

## Usage / 사용법

(Describe how a user would interact with your application here. E.g., "Navigate to the home page, enter a stock symbol, and click 'Analyze' to get AI-driven insights and DART data summaries.")
(여기에서 사용자가 애플리케이션과 상호 작용하는 방법을 설명하세요. 예: "홈 페이지로 이동하여 주식 심볼을 입력하고 '분석'을 클릭하여 AI 기반 통찰력과 DART 데이터 요약을 얻으세요.")

## Contributing / 기여하기

Contributions are welcome! Please follow these steps:
기여를 환영합니다! 다음 단계를 따르세요:

1.  Fork the repository. / 저장소를 포크하세요.
2.  Create a new branch (`git checkout -b feature/your-feature-name`). / 새 브랜치를 만드세요 (`git checkout -b feature/your-feature-name`).
3.  Make your changes. / 변경 사항을 만드세요.
4.  Commit your changes (`git commit -m 'Add new feature'`). / 변경 사항을 커밋하세요 (`git commit -m 'Add new feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`). / 브랜치로 푸시하세요 (`git push origin feature/your-feature-name`).
6.  Open a Pull Request. / 풀 리퀘스트를 여세요.

## License / 라이선스

(Specify your project's license here, e.g., MIT License)
(여기에 프로젝트의 라이선스를 지정하세요. 예: MIT 라이선스)

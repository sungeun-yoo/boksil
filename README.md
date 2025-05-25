# boksil
boksil analyzer

## 애플리케이션 목적 및 워크플로우

이 애플리케이션은 스포츠 베팅 분석 도구입니다.

사용자는 다음의 주요 워크플로우를 통해 분석 결과를 확인할 수 있습니다:
1. 데이터 업로드: 분석할 스포츠 경기 데이터 파일을 업로드합니다.
2. 기준 입력: 분석을 위한 특정 기준(예: 특정 팀, 특정 기간 등)을 입력합니다.
3. 분석 결과 확인: 입력된 데이터와 기준에 따른 분석 결과를 확인합니다.

## 파일 입력 및 설정 과정 (`search.js`, `index.html`)

애플리케이션은 사용자가 업로드한 Excel 파일을 기반으로 동작하며, 파일의 데이터를 활용하여 UI 요소를 동적으로 설정합니다.

1.  **Excel 파일 로드 및 파싱**:
    *   사용자가 `index.html`의 파일 입력(`input type="file" id="excelFile"`)을 통해 Excel 파일을 선택하면 `search.js`의 `handleFileSelect` 함수가 호출됩니다.
    *   `handleFileSelect` 함수는 `loadExcelFile` 함수를 호출하여 파일을 비동기적으로 읽고 파싱합니다.
    *   `loadExcelFile` 함수는 `FileReader`를 사용하여 파일 내용을 `ArrayBuffer`로 읽어온 후, `XLSX.read()` (SheetJS 라이브러리)를 사용해 Excel 워크북 객체로 변환합니다. 이 워크북 객체는 `workbook` 전역 변수에 저장되어 애플리케이션 전체에서 사용됩니다.

2.  **UI 요소 초기화**:
    *   파일 로드가 성공적으로 완료되면 `handleFileSelect` 함수 내에서 여러 초기화 함수들이 순차적으로 호출됩니다.
    *   **리그 선택 체크박스 생성 (`createLeagueCheckboxes`)**:
        *   `workbook` 객체에 있는 시트 이름들을 가져와 각 시트(리그)에 해당하는 체크박스를 `index.html`의 `.league-checkboxes` div 내에 동적으로 생성합니다.
        *   기본적으로 `defaultLeagues` 배열에 포함된 리그들이 선택된 상태로 표시됩니다.
    *   **현재 리그 드롭다운 업데이트 (`updateCurrentLeagueDropdown`)**:
        *   선택된 리그들을 기반으로 `index.html`의 `currentLeague` 드롭다운 메뉴 옵션을 업데이트합니다.
    *   **날짜 범위 슬라이더 초기화 (`initializeDateSlider`)**:
        *   `workbook`의 모든 시트를 순회하며 'Date' 열의 날짜 데이터를 수집합니다.
        *   수집된 날짜들의 최소값과 최대값을 찾아 `index.html`의 `dateSlider` (jQuery UI Slider)의 범위로 설정합니다. 사용자는 이 슬라이더를 통해 분석할 날짜 범위를 선택할 수 있습니다.
        *   초기에는 전체 날짜 범위가 선택됩니다.
    *   **연중 특정 기간 필터 슬라이더 초기화 (`initializeYearlyDateSlider`)**:
        *   `index.html`의 `yearlyDateSlider`를 초기화하여 사용자가 연중 특정 기간(예: 매년 1월 1일부터 3월 31일까지)을 선택할 수 있도록 합니다. 이 슬라이더는 고정된 연도(2022년)를 기준으로 월일만 필터링하는데 사용됩니다.
    *   파일 로드 및 UI 초기화가 완료되면, `fileSelectionScreen`은 숨겨지고 `analysisScreen`이 표시되어 사용자가 데이터 분석을 시작할 수 있게 됩니다.

## 사용자 입력 및 검색 조건 설정 (`index.html`, `search.js`)

사용자는 `index.html`에 구성된 다양한 입력 필드와 컨트롤을 통해 분석 기준을 설정합니다. 이러한 입력값들은 `search.js`에서 처리되어 데이터 분석에 사용됩니다.

1.  **리그 선택**:
    *   **분석 대상 리그 선택 (`.league-checkboxes`)**: "파일 입력 및 설정 과정"에서 동적으로 생성된 리그 체크박스들을 통해 사용자는 분석을 원하는 여러 리그를 선택할 수 있습니다. `search.js`의 `updateSelectedLeagues` 함수는 체크된 리그들을 `selectedLeagues` 배열에 저장합니다.
    *   **특정 리그 지정 (`#currentLeague`)**: 사용자는 드롭다운 메뉴에서 특정 리그를 선택하여 해당 리그의 데이터만 집중적으로 분석할 수 있습니다. 이 값은 `search.js`의 `currentLeague` 변수에 저장됩니다. `updateCurrentLeagueDropdown` 함수는 선택된 리그 목록(`selectedLeagues`)을 기반으로 이 드롭다운 옵션을 채웁니다.

2.  **배당률 제공자 선택 (`#oddsSelection`)**:
    *   사용자는 라디오 버튼(`input[name="oddsType"]`)을 통해 분석에 사용할 배당률 제공자를 선택합니다 (예: 평균 배당(Avg), Bet365, Pinnacle Sports(PS)).
    *   선택된 값은 `analyzeData.js` (직접적인 코드 참조는 없으나, `processData` 함수 호출 시 간접적으로 사용될 것으로 예상)에서 배당률 데이터를 필터링하거나 선택하는 데 사용됩니다. `search.js`의 `oddsTypeRadios` 이벤트 리스너는 선택 변경 시 `processData(true)`를 호출하여 분석을 다시 실행합니다.

3.  **목표 배당률 입력 (`#searchForm`)**:
    *   사용자는 `index.html`의 검색 폼 내 숫자 입력 필드(`input type="number" name="win"`, `name="draw"`, `name="lose"`)를 통해 찾고자 하는 경기의 목표 배당률(정배, 무, 역배)을 직접 입력합니다.
    *   이 값들은 `searchForm` 제출 시 `processData` 함수를 통해 `analyzeData.js`로 전달되어, 해당 배당률 조건에 맞는 경기들을 검색하는 데 사용됩니다.

4.  **날짜 범위 설정**:
    *   **전체 날짜 범위 (`#dateSlider`)**: 사용자는 jQuery UI 슬라이더를 이용해 분석 대상 경기의 전체 날짜 범위를 설정합니다. `search.js`의 `initializeDateSlider`에서 생성되며, 선택된 범위는 `$("#startDate")`와 `$("#endDate")`에 표시되고, `isDateInRange` 함수에서 필터링 조건으로 사용됩니다.
    *   **연중 특정 기간 필터 (`#yearlyDateSlider`)**: 사용자는 또 다른 jQuery UI 슬라이더를 통해 연중 특정 기간(월, 일)을 선택하여, 여러 해에 걸쳐 해당 기간에 열린 경기들만 필터링할 수 있습니다. `search.js`의 `initializeYearlyDateSlider`에서 생성되며, `updateYearlyDateRange` 함수를 통해 `yearlyStartDate`와 `yearlyEndDate` 객체에 저장되고, `isDateInYearlyRange` 함수에서 필터링 조건으로 사용됩니다.

5.  **검색 마진 설정 (`#marginSettings`)**:
    *   사용자는 "검색 마진 설정" 버튼 (`#marginSettingsButton`)을 클릭하여 상세 마진 설정 UI를 표시/숨김 할 수 있습니다.
    *   `index.html` 내의 다양한 숫자 입력 필드들 (`#jeongbaeMargin`, `#jeongbaeMuMargin` 등)을 통해 정배 표본, 역배 표본, 승무패 일치 표본 각각에 대한 정배, 무, 역배 값의 허용 오차 범위(마진)를 설정할 수 있습니다.
    *   "적용" 버튼 (`#applyMarginSettings`) 클릭 시, `search.js` 내 이벤트 리스너가 이 값들을 읽어 `detailedMargins` 객체 (실제로는 `analyzeData.js`에서 사용될 `detailedMargins` 변수를 업데이트할 것으로 보이며, 현재 `search.js`에서는 `console.log`로 출력만 하고 전역 변수 `detailedMargins`에 직접 할당하지는 않지만, 해당 로직은 `analyzeData.js`에 있을 것으로 추정됩니다)를 업데이트합니다. 이 마진 값들은 `analyzeData.js`에서 유사 배당률을 검색할 때 사용됩니다.

## 핵심 분석 로직 (`analyzeData.js`)

`analyzeData.js` 파일은 실제 데이터 분석 및 결과 계산을 담당하는 핵심 로직을 포함하고 있습니다.

1.  **`analyzeData` 함수: 중앙 처리 장치**:
    *   이 함수는 사용자가 "검색" 버튼을 클릭하거나 배당률 유형을 변경할 때 `search.js`의 `processData` 함수를 통해 호출됩니다.
    *   먼저 `getInputValues()`를 통해 사용자가 입력한 목표 배당률 및 배당 유형을, `getDetailedMargins()`를 통해 설정된 검색 마진 값을 가져옵니다.
    *   다양한 분석 유형에 대해 `analyzeMatches` 함수를 여러 번 호출하여 각각의 결과를 계산합니다. 예를 들어, '정배 표본', '정배+무 표본', '역배 표본' 등의 분석이 수행됩니다.
    *   만약 특정 리그(`currentLeague`)가 선택된 경우, 해당 리그에 대한 추가 분석('해당리그 정배+무 표본' 등)도 수행합니다.
    *   각 분석 결과를 `updateResultsTable` 함수를 통해 화면의 결과 테이블에 업데이트합니다.
    *   `searchCompleted` 커스텀 이벤트를 발생시켜 검색 기록 사이드바에 현재 검색 조건을 전달합니다.

2.  **분석 유형 트리거**:
    *   `analyzeData` 함수 내에서 각기 다른 `analysisType` 문자열 (예: `'jeongbae'`, `'jeongbaeMu'`, `'yeokbae'`, `'allMatch'`, `'currentLeagueMatch'` 등)과 함께 `analyzeMatches` 함수가 호출됩니다.
    *   이 `analysisType`은 `analyzeMatches` 내부, 특히 `isMatchEligible` 함수와 `calculateResult` 함수에서 어떤 조건으로 경기를 필터링하고 결과를 계산할지를 결정하는 중요한 기준으로 사용됩니다.

3.  **`analyzeMatches` 함수의 처리 과정**:
    *   **선택된 리그/시트 반복**:
        *   `selectedLeagueOnly` 파라미터와 `currentLeague` 전역 변수를 확인하여, 특정 리그만 분석할지 아니면 사용자가 체크박스로 선택한 모든 리그(`selectedLeagues`)를 분석할지를 결정합니다. (`leaguesToProcess` 배열)
        *   각 리그(Excel 시트)에 대해 반복 작업을 수행합니다.
    *   **경기 데이터 추출 (`extractMatchData`)**:
        *   각 시트의 데이터를 행별로 읽어 `extractMatchData` 함수를 호출합니다.
        *   `extractMatchData` 함수는 해당 행에서 경기 날짜, 팀 이름, 다양한 배당률 제공자(Avg, B365, PS)의 배당률, 그리고 실제 경기 결과(FTHG, FTAG)를 추출합니다.
        *   특히, 사용자가 선택한 배당률 유형(`oddsType` - avg, b365, ps)에 따라 해당 배당률 제공자의 홈승(`OddsH`), 무승부(`OddsD`), 원정승(`OddsA`) 배당률을 선택하여 반환합니다.
    *   **날짜 필터링 (`isDateInRange`)**:
        *   추출된 경기 날짜(`matchDate`)가 사용자가 설정한 날짜 범위 필터 (`dateSlider` 및 `yearlyDateSlider` 값) 내에 있는지 `search.js`의 `isDateInRange` 함수를 호출하여 확인합니다. 이 함수는 두 슬라이더의 조건을 모두 만족해야 `true`를 반환합니다.
    *   **경기 적격성 판단 (`isMatchEligible`)**:
        *   이 함수는 분석의 핵심 필터링 로직을 담당합니다.
        *   경기의 선택된 배당률(`OddsH`, `OddsD`, `OddsA`)과 사용자가 입력한 목표 배당률(`win`, `draw`, `lose`), 그리고 상세 설정된 마진(`detailedMargin`)을 비교합니다.
        *   `analysisType`에 따라 비교 로직이 달라집니다.
            *   `'jeongbae'`: 경기 배당률의 홈팀 또는 원정팀 배당률 중 하나가 사용자가 입력한 '정배' 값과 지정된 마진 이내인지 확인합니다.
            *   `'jeongbaeMu'`: '정배' 조건과 함께, 경기 배당률의 무승부 배당률이 사용자가 입력한 '무' 값과 지정된 마진 이내인지 확인합니다.
            *   `'yeokbae'`, `'yeokbaeMu'`: '정배' 대신 '역배' 값을 기준으로 유사하게 동작합니다.
            *   `'allMatch'`, `'currentLeagueMatch'`: 경기 배당률의 홈승, 무, 원정승 배당률이 사용자가 입력한 정배, 무, 역배 값과 각각 지정된 마진 이내인지 (양방향으로, 즉 홈팀이 정배인 경우와 원정팀이 정배인 경우 모두) 확인합니다.
        *   조건에 부합하는 경기만 다음 단계로 넘어갑니다.
    *   **결과 계산 (`calculateResult`)**:
        *   `isMatchEligible`을 통과한 경기에 대해 실제 경기 결과(FTHG, FTAG)와 배당률의 정배/역배 상황(`OddsH` < `OddsA` 등) 및 `analysisType`을 종합적으로 고려하여 결과 카테고리를 결정합니다.
        *   예를 들어, `analysisType`이 'jeongbae'이고 홈팀 배당률(`OddsH`)이 원정팀 배당률(`OddsA`)보다 낮아 홈팀이 정배로 간주될 때, 실제 경기 결과를 바탕으로 '핸승'(홈팀이 2골차 이상 승리), '핸무'(홈팀이 1골차 승리), '무'(무승부), '역'(홈팀 패배) 중 하나로 분류합니다. 만약 원정팀이 정배였다면 원정팀 기준으로 동일한 계산을 수행합니다.
        *   계산된 결과는 해당 분석 유형의 통계(`results` 객체)에 누적되고, 상세 경기 정보(`details` 배열)에도 추가됩니다.
    *   최종적으로 각 분석 유형별 `results`와 `details`가 반환됩니다.

## 분석 결과 표시 (`analyzeData.js`, `index.html`)

분석된 결과는 `index.html`의 결과 테이블과 상세 보기 섹션을 통해 사용자에게 제공됩니다. `analyzeData.js`의 함수들이 이 과정을 담당합니다.

1.  **메인 요약 테이블 업데이트 (`updateResultsTable`)**:
    *   `analyzeData` 함수 내에서 각 분석 유형(예: '정배 표본', '역배+무 표본' 등)에 대한 `analyzeMatches`가 완료되면, 해당 분석 유형의 이름(`rowName`)과 결과 데이터(`analysisResult`)를 가지고 `updateResultsTable` 함수가 호출됩니다.
    *   이 함수는 `index.html` 내의 메인 결과 테이블 (`<table class="results-table">`)에서 `rowName`과 일치하는 행을 찾습니다.
    *   찾은 행의 각 셀(`<td>`)에 `analysisResult.results` 객체에 담긴 '핸승', '핸무', '무', '역' 카테고리별 경기 수를 채워 넣습니다.
    *   추가적으로, '정배' (핸승+핸무 합계)와 '플핸' (무+역 합계) 열의 값을 계산하여 업데이트하고, 두 값의 크기를 비교하여 CSS 클래스(`blue-color` 또는 `red-color`)를 적용해 시각적으로 강조합니다.

2.  **상세 결과 보기 생성 (`showDetails` 및 하위 함수들)**:
    *   사용자가 메인 결과 테이블의 특정 표본 옆에 있는 "상세" 버튼 (`<button class="detail-button" onclick="toggleDetails('...')">`)을 클릭하면, `search.js`의 `toggleDetails` 함수를 통해 `analyzeData.js`의 `showDetails(type)` 함수가 호출됩니다. `type`은 해당 표본의 종류(예: 'jeongbae', 'allMatchSample')입니다.
    *   **상세 보기 토글 및 데이터 준비**:
        *   `showDetails` 함수는 해당 `type`에 대한 상세 정보 행 (`<tr class="details-row" id="<type>-details">`)의 표시 여부를 결정합니다.
        *   `analysisDetails[type]`에서 해당 분석 유형의 상세 데이터(리그별 요약 및 개별 경기 목록 포함)를 가져옵니다. 데이터가 없으면 "데이터가 없습니다." 메시지를 표시합니다.
        *   선택된 배당률 제공자(`oddsType`)에 따라 사용할 배당률 컬럼 접두사(`Avg`, `B365`, `PS`)를 결정합니다.
    *   **리그별 요약 생성 (`createSummaryTable`)**:
        *   `showDetails` 함수 내부에서, 상세 데이터의 개별 경기 목록(`details.details`)을 순회하며 리그별로 "정배 케이스"와 "역배 케이스"를 구분하여 경기 결과를 집계합니다.
            *   "정배 케이스": 해당 경기에서 홈팀 배당률(`OddsH`)이 원정팀 배당률(`OddsA`)보다 낮은 경우.
            *   "역배 케이스": 원정팀 배당률(`OddsA`)이 홈팀 배당률(`OddsH`)보다 낮은 경우. (주의: 코드상에서는 `OddsH < OddsA`를 기준으로 `isJeongbae`를 판단하므로, `isJeongbae`가 `false`인 경우가 역배 케이스에 해당합니다.)
        *   집계된 데이터를 바탕으로 `createSummaryTable` 함수가 호출되어 각 케이스("정배 케이스", "역배 케이스")에 대한 리그별 요약 테이블 HTML을 생성합니다. 이 테이블은 각 리그의 '핸승', '핸무', '무', '역' 경기 수, 합계, 그리고 '정배' (핸승+핸무) 및 '플핸' (무+역) 항목을 포함하며, 마찬가지로 색상 강조가 적용됩니다.
    *   **개별 경기 목록 생성 (`createMatchDetailsTable`)**:
        *   `showDetails` 함수는 "정배 케이스"와 "역배 케이스" 각각에 대해 `createMatchDetailsTable` 함수를 호출하여, 조건에 맞는 개별 경기들의 상세 정보를 담은 테이블 HTML을 생성합니다.
        *   `createMatchDetailsTable` 함수는 전달된 경기 목록을 먼저 Excel 날짜(`detail.Date`)를 기준으로 **최신순으로 정렬**합니다.
        *   생성된 테이블은 각 경기의 리그, 날짜, 홈팀, 원정팀, 실제 점수(FTHG, FTAG), 선택된 배당률 제공자의 홈/무/원정 배당률, 그리고 분석된 결과('핸승', '무' 등)를 표시합니다. 정배였던 팀의 배당률은 굵게 표시됩니다.
        *   각 상세 매치 정보 테이블에는 "닫기/열기" 버튼이 있어 사용자가 필요에 따라 내용을 토글할 수 있습니다.
    *   생성된 리그별 요약 테이블과 개별 경기 목록 테이블 HTML은 `index.html`의 해당 상세 보기 행 내부 `.summary-container`에 삽입되어 사용자에게 보여집니다. (정확히는 `summaryContainer`에 두 종류의 요약 테이블과 두 종류의 상세 매치 정보 테이블이 모두 들어갑니다).
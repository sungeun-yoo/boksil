let analysisDetails = {
    jeongbae: [],
    jeongbaeMu: [],
    yeokbae: [],
    yeokbaeMu: [],
    selectedLeagueJeongbaeMu: [],
    selectedLeagueYeokbaeMu: [],
    allMatchSample: [],
    currentLeagueMatchSample: []
};

function rerunSearch(entry) {
    // 체크박스 리그 선택 업데이트
    document.querySelectorAll('input[name="league"]').forEach(checkbox => {
        checkbox.checked = entry.selectedLeagues.includes(checkbox.value);
    });
    updateSelectedLeagues();

    // currentLeague 업데이트
    const currentLeagueSelect = document.getElementById('currentLeague');
    if (currentLeagueSelect) {
        currentLeagueSelect.value = entry.currentLeague || '';
        currentLeague = entry.currentLeague || '';
    }

    // 배당값 설정
    document.querySelector('input[name="win"]').value = entry.odds.win;
    document.querySelector('input[name="draw"]').value = entry.odds.draw;
    document.querySelector('input[name="lose"]').value = entry.odds.lose;

    // 검색 실행
    processData();
}

function analyzeData(keepDetailsOpen = false) {
    console.log('analyzeData function called');
    const inputValues = getInputValues();
    const detailedMargins = getDetailedMargins();

    // 이벤트 발생 시 currentLeague도 포함
    const searchEvent = new CustomEvent('searchCompleted', {
        detail: {
            selectedLeagues, // 체크된 리그들
            currentLeague,   // 선택된 단일 리그
            win: inputValues.win,
            draw: inputValues.draw,
            lose: inputValues.lose
        }
    });
    window.dispatchEvent(searchEvent);

    console.log('Input values:', inputValues);
    console.log('Detailed margins:', detailedMargins);

    analysisDetails.jeongbae = analyzeMatches(inputValues, 'jeongbae', false, detailedMargins.jeongbae);
    analysisDetails.jeongbaeMu = analyzeMatches(inputValues, 'jeongbaeMu', false, detailedMargins.jeongbae);
    analysisDetails.yeokbae = analyzeMatches(inputValues, 'yeokbae', false, detailedMargins.yeokbae);
    analysisDetails.yeokbaeMu = analyzeMatches(inputValues, 'yeokbaeMu', false, detailedMargins.yeokbae);
    analysisDetails.allMatchSample = analyzeMatches(inputValues, 'allMatch', false, detailedMargins.match);
    
    updateResultsTable('정배 표본', analysisDetails.jeongbae);
    updateResultsTable('정배+무 표본', analysisDetails.jeongbaeMu);
    updateResultsTable('역배 표본', analysisDetails.yeokbae);
    updateResultsTable('역배+무 표본', analysisDetails.yeokbaeMu);
    updateResultsTable('승(무)패 일치 표본', analysisDetails.allMatchSample);

    if (currentLeague) {
        analysisDetails.selectedLeagueJeongbaeMu = analyzeMatches(inputValues, 'jeongbaeMu', true, detailedMargins.jeongbae);
        analysisDetails.selectedLeagueYeokbaeMu = analyzeMatches(inputValues, 'yeokbaeMu', true, detailedMargins.yeokbae);
        analysisDetails.currentLeagueMatchSample = analyzeMatches(inputValues, 'currentLeagueMatch', true, detailedMargins.match);
        updateResultsTable('해당리그 정배+무 표본', analysisDetails.selectedLeagueJeongbaeMu);
        updateResultsTable('해당리그 역배+무 표본', analysisDetails.selectedLeagueYeokbaeMu);
        updateResultsTable('당리그 승무패 일치 표본', analysisDetails.currentLeagueMatchSample);
    } else {
        updateResultsTable('해당리그 정배+무 표본', { results: { "핸승": "-", "핸무": "-", "무": "-", "역": "-" } });
        updateResultsTable('해당리그 역배+무 표본', { results: { "핸승": "-", "핸무": "-", "무": "-", "역": "-" } });
        updateResultsTable('당리그 승무패 일치 표본', { results: { "핸승": "-", "핸무": "-", "무": "-", "역": "-" } });
    }

    if (keepDetailsOpen) {
        updateOpenDetails();
    }

    console.log('Analysis completed');
}

function updateOpenDetails() {
    const detailsRows = document.querySelectorAll('.details-row');
    detailsRows.forEach(row => {
        if (row.style.display === 'table-row') {
            const type = row.id.replace('-details', '');
            showDetails(type, true);  // true 파라미터는 강제 업데이트를 의미
        }
    });
}

function getInputValues() {
    return {
        win: parseFloat(document.querySelector('input[name="win"]').value),
        draw: parseFloat(document.querySelector('input[name="draw"]').value),
        lose: parseFloat(document.querySelector('input[name="lose"]').value),
        oddsType: document.querySelector('input[name="oddsType"]:checked').value
    };
}

function getDetailedMargins() {
    return {
        jeongbae: {
            jeongbae: parseFloat(document.getElementById('jeongbaeMargin').value) || 0.2,
            mu: parseFloat(document.getElementById('jeongbaeMuMargin').value) || 0.2,
            yeokbae: parseFloat(document.getElementById('jeongbaeYeokbaeMargin').value) || 0.2
        },
        yeokbae: {
            yeokbae: parseFloat(document.getElementById('yeokbaeMargin').value) || 0.2,
            mu: parseFloat(document.getElementById('yeokbaeMuMargin').value) || 0.2,
            jeongbae: parseFloat(document.getElementById('yeokbaeJeongbaeMargin').value) || 0.2
        },
        match: {
            jeongbae: parseFloat(document.getElementById('matchJeongbaeMargin').value) || 0.2,
            mu: parseFloat(document.getElementById('matchMuMargin').value) || 0.2,
            yeokbae: parseFloat(document.getElementById('matchYeokbaeMargin').value) || 0.2
        }
    };
}

function analyzeMatches(inputValues, analysisType, selectedLeagueOnly = false, detailedMargin) {
    const { win, draw, lose, oddsType } = inputValues;
    const results = { "핸승": 0, "핸무": 0, "무": 0, "역": 0 };
    const details = [];

    let leaguesToProcess;
    if (selectedLeagueOnly && currentLeague) {
        leaguesToProcess = [currentLeague];
    } else if (analysisType === 'currentLeagueMatch') {
        return { results, details };
    } else {
        leaguesToProcess = selectedLeagues;
    }

    leaguesToProcess.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length >= 2) {
            const headerRow = jsonData[0];
            const columnIndices = getColumnIndices(headerRow);

            jsonData.slice(1).forEach(row => {
                const matchData = extractMatchData(row, columnIndices);
                const matchDate = new Date((matchData.Date - 25569) * 86400 * 1000);
                
                if (isDateInRange(matchDate) && isMatchEligible(matchData, win, draw, lose, detailedMargin, analysisType)) {
                    const result = calculateResult(matchData, analysisType);
                    results[result]++;
                    details.push({ ...matchData, League: sheetName, Result: result });
                }
            });
        }
    });

    return { results, details };
}

function getColumnIndices(headerRow) {
    // 기존 컬럼에 Pinnacle Sports 배당 컬럼 추가
    const columns = ['Date', 'HomeTeam', 'AwayTeam', 'AvgH', 'AvgD', 'AvgA', 
                    'B365H', 'B365D', 'B365A', 'PSH', 'PSD', 'PSA', 'FTHG', 'FTAG'];
    return columns.reduce((acc, col) => {
        acc[col] = headerRow.indexOf(col);
        return acc;
    }, {});
}

function extractMatchData(row, columnIndices) {
    const oddsType = document.querySelector('input[name="oddsType"]:checked').value;
    let selectedOddsH, selectedOddsD, selectedOddsA;

    // 선택된 배당사에 따라 배당 설정
    switch(oddsType) {
        case 'avg':
            selectedOddsH = parseFloat(row[columnIndices.AvgH]);
            selectedOddsD = parseFloat(row[columnIndices.AvgD]);
            selectedOddsA = parseFloat(row[columnIndices.AvgA]);
            break;
        case 'b365':
            selectedOddsH = parseFloat(row[columnIndices.B365H]);
            selectedOddsD = parseFloat(row[columnIndices.B365D]);
            selectedOddsA = parseFloat(row[columnIndices.B365A]);
            break;
        case 'ps':
            selectedOddsH = parseFloat(row[columnIndices.PSH]);
            selectedOddsD = parseFloat(row[columnIndices.PSD]);
            selectedOddsA = parseFloat(row[columnIndices.PSA]);
            break;
    }

    return {
        Date: row[columnIndices.Date],
        HomeTeam: row[columnIndices.HomeTeam],
        AwayTeam: row[columnIndices.AwayTeam],
        AvgH: parseFloat(row[columnIndices.AvgH]),
        AvgD: parseFloat(row[columnIndices.AvgD]),
        AvgA: parseFloat(row[columnIndices.AvgA]),
        B365H: parseFloat(row[columnIndices.B365H]),
        B365D: parseFloat(row[columnIndices.B365D]),
        B365A: parseFloat(row[columnIndices.B365A]),
        PSH: parseFloat(row[columnIndices.PSH]),
        PSD: parseFloat(row[columnIndices.PSD]),
        PSA: parseFloat(row[columnIndices.PSA]),
        FTHG: parseInt(row[columnIndices.FTHG]),
        FTAG: parseInt(row[columnIndices.FTAG]),
        OddsH: selectedOddsH,
        OddsD: selectedOddsD,
        OddsA: selectedOddsA
    };
}

function isMatchEligible(matchData, win, draw, lose, detailedMargin, analysisType) {
    const { OddsH, OddsD, OddsA } = matchData;
    const jeongbae = Math.min(win, lose);
    const yeokbae = Math.max(win, lose);

    switch (analysisType) {
        case 'jeongbae':
            return Math.abs(OddsH - jeongbae) <= detailedMargin.jeongbae || Math.abs(OddsA - jeongbae) <= detailedMargin.jeongbae;
        case 'jeongbaeMu':
            return (Math.abs(OddsH - jeongbae) <= detailedMargin.jeongbae || Math.abs(OddsA - jeongbae) <= detailedMargin.jeongbae) && Math.abs(OddsD - draw) <= detailedMargin.mu;
        case 'yeokbae':
            return Math.abs(OddsH - yeokbae) <= detailedMargin.yeokbae || Math.abs(OddsA - yeokbae) <= detailedMargin.yeokbae;
        case 'yeokbaeMu':
            return (Math.abs(OddsH - yeokbae) <= detailedMargin.yeokbae || Math.abs(OddsA - yeokbae) <= detailedMargin.yeokbae) && Math.abs(OddsD - draw) <= detailedMargin.mu;
        case 'allMatch':
        case 'currentLeagueMatch':
            return (Math.abs(OddsH - jeongbae) <= detailedMargin.jeongbae && Math.abs(OddsD - draw) <= detailedMargin.mu && Math.abs(OddsA - yeokbae) <= detailedMargin.yeokbae) ||
                   (Math.abs(OddsH - yeokbae) <= detailedMargin.yeokbae && Math.abs(OddsD - draw) <= detailedMargin.mu && Math.abs(OddsA - jeongbae) <= detailedMargin.jeongbae);
        default:
            return false;
    }
}

function calculateResult(matchData, analysisType) {
    const { OddsH, OddsA, FTHG, FTAG } = matchData;
    let mainScore, subScore;

    if ((analysisType.startsWith('jeongbae') && OddsH < OddsA) || 
        (analysisType.startsWith('yeokbae') && OddsH < OddsA) ||
        (analysisType === 'allMatch' && OddsH < OddsA) ||
        (analysisType === 'currentLeagueMatch' && OddsH < OddsA)) {
        mainScore = FTHG;
        subScore = FTAG;
    } else {
        mainScore = FTAG;
        subScore = FTHG;
    }

    console.log('Match Data:', matchData);
    console.log('Main Score:', mainScore, 'Sub Score:', subScore);
    if (mainScore > subScore + 1) return "핸승";
    if (mainScore === subScore + 1) return "핸무";
    if (mainScore === subScore) return "무";
    return "역";
}


function updateResultsTable(rowName, analysisResult) {
    console.log(`Updating results table for ${rowName}`, analysisResult);
    const table = document.querySelector('.results-table');
    const row = Array.from(table.querySelectorAll('tr')).find(row => {
        const span = row.querySelector('th span');
        return span && span.textContent.includes(rowName);
    });
    
    if (row) {
        const cells = row.querySelectorAll('td');
        const results = analysisResult.results;
        ['핸승', '핸무', '무', '역'].forEach((result, index) => {
            cells[index].textContent = results[result];
        });
        
        // 새로운 열에 대한 계산 추가
        const hanSeungHanMu = (parseInt(results['핸승']) || 0) + (parseInt(results['핸무']) || 0);
        const muYeok = (parseInt(results['무']) || 0) + (parseInt(results['역']) || 0);
        
        cells[4].textContent = hanSeungHanMu;
        cells[5].textContent = muYeok;

        // 색상 적용 로직
        if (hanSeungHanMu > muYeok) {
            cells[4].className = 'blue-color';
            cells[5].className = 'blue-color';
        } else if (muYeok > hanSeungHanMu) {
            cells[4].className = 'red-color';
            cells[5].className = 'red-color';
        } else {
            cells[4].className = '';
            cells[5].className = '';
        }
    }
    console.log(`Results table updated for ${rowName}`);
}


function decodeExcelDate(excelDate) {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
}

// 모든 상세 창을 닫는 함수 (search.js에 있는 것과 동일)
function closeAllDetails() {
    const detailsRows = document.querySelectorAll('.details-row');
    detailsRows.forEach(row => {
        row.style.display = 'none';
    });
}

function showDetails(type, forceUpdate = false) {
    const detailsRow = document.getElementById(`${type}-details`);
    const detailsContent = detailsRow.querySelector('.details-content');
    const summaryContainer = detailsContent.querySelector('.summary-container');
    const detailsContainer = detailsContent.querySelector('.details-container');

    if (detailsRow.style.display === 'none' || forceUpdate) {
        detailsRow.style.display = 'table-row';
        const details = analysisDetails[type];
        
        if (!details || !details.details || details.details.length === 0) {
            summaryContainer.innerHTML = '<p>데이터가 없습니다.</p>';
            detailsContainer.innerHTML = '';
            return;
        }

        let title;
        switch(type) {
            case 'jeongbae': title = '정배 표본 상세 결과'; break;
            case 'jeongbaeMu': title = '정배+무 표본 상세 결과'; break;
            case 'yeokbae': title = '역배 표본 상세 결과'; break;
            case 'yeokbaeMu': title = '역배+무 표본 상세 결과'; break;
            case 'selectedLeagueJeongbaeMu': title = '해당리그 정배+무 표본 상세 결과'; break;
            case 'selectedLeagueYeokbaeMu': title = '해당리그 역배+무 표본 상세 결과'; break;
            case 'allMatchSample': title = '승(무)패 일치 표본 상세 결과'; break;
            case 'currentLeagueMatchSample': title = '당리그 승무패 일치 표본 상세 결과'; break;
            default: title = '상세 결과';
        }

        const oddsType = document.querySelector('input[name="oddsType"]:checked').value;
        let oddsPrefix;
        switch(oddsType) {
            case 'avg':
                oddsPrefix = 'Avg';
                break;
            case 'b365':
                oddsPrefix = 'B365';
                break;
            case 'ps':
                oddsPrefix = 'PS';
                break;
        }
        
        // 리그별 요약 데이터 생성 및 정배/역배 분리
        const leagueSummary = {
            jeongbae: {},
            yeokbae: {}
        };
        
        details.details.forEach(detail => {
            const isJeongbae = detail[`${oddsPrefix}H`] < detail[`${oddsPrefix}A`];
            const category = isJeongbae ? 'jeongbae' : 'yeokbae';
            const league = detail.League;

            if (!leagueSummary[category][league]) {
                leagueSummary[category][league] = {
                    '핸승': 0, '핸무': 0, '무': 0, '역': 0, 'total': 0
                };
            }
            
            leagueSummary[category][league][detail.Result]++;
            leagueSummary[category][league].total++;
        });

        // 테이블 생성 함수
        function createSummaryTable(data, categoryTitle) {
            let html = `<h5>${categoryTitle}</h5>`;
            html += '<table class="league-summary">';
            html += '<tr><th>리그</th><th>핸승</th><th>핸무</th><th>무</th><th>역</th><th>합계</th><th>정배</th><th>플핸</th></tr>';
            
            let totalHandSeung = 0, totalHandMu = 0, totalMu = 0, totalYeok = 0, totalSum = 0;
            
            Object.entries(data).forEach(([league, counts]) => {
                const jeongbae = counts['핸승'] + counts['핸무'];
                const plhan = counts['무'] + counts['역'];
                const jeongbaeClass = jeongbae > plhan ? 'blue-color' : '';
                const plhanClass = plhan > jeongbae ? 'red-color' : '';
                
                html += `<tr>
                    <td>${league}</td>
                    <td>${counts['핸승']}</td>
                    <td>${counts['핸무']}</td>
                    <td>${counts['무']}</td>
                    <td>${counts['역']}</td>
                    <td>${counts.total}</td>
                    <td class="${jeongbaeClass}">${jeongbae}</td>
                    <td class="${plhanClass}">${plhan}</td>
                </tr>`;
                
                totalHandSeung += counts['핸승'];
                totalHandMu += counts['핸무'];
                totalMu += counts['무'];
                totalYeok += counts['역'];
                totalSum += counts.total;
            });
            
            const totalJeongbae = totalHandSeung + totalHandMu;
            const totalPlhan = totalMu + totalYeok;
            const totalJeongbaeClass = totalJeongbae > totalPlhan ? 'blue-color' : '';
            const totalPlhanClass = totalPlhan > totalJeongbae ? 'red-color' : '';
            
            html += `<tr class="total-row">
                <td><strong>합계</strong></td>
                <td><strong>${totalHandSeung}</strong></td>
                <td><strong>${totalHandMu}</strong></td>
                <td><strong>${totalMu}</strong></td>
                <td><strong>${totalYeok}</strong></td>
                <td><strong>${totalSum}</strong></td>
                <td class="${totalJeongbaeClass}"><strong>${totalJeongbae}</strong></td>
                <td class="${totalPlhanClass}"><strong>${totalPlhan}</strong></td>
            </tr>`;
            
            html += '</table>';
            return html;
        }

        function createMatchDetailsTable(matchDetails, categoryTitle, isJeongbae, containerId) {
            let html = `<div class="match-details-section">
                <div class="match-details-header">
                    <h5>상세 매치 정보: ${categoryTitle}</h5>
                    <button onclick="toggleMatchDetails('${containerId}')" class="toggle-details-btn">닫기</button>
                </div>
                <div id="${containerId}" class="match-details-container">
                    <table class="match-details">
                        <tr>
                            <th>리그</th>
                            <th>날짜</th>
                            <th>홈팀</th>
                            <th>어웨이팀</th>
                            <th>FTHG</th>
                            <th>FTAG</th>
                            <th>${oddsPrefix}H</th>
                            <th>${oddsPrefix}D</th>
                            <th>${oddsPrefix}A</th>
                            <th>결과</th>
                        </tr>`;
            
            matchDetails.filter(detail => {
                const detailIsJeongbae = detail[`${oddsPrefix}H`] < detail[`${oddsPrefix}A`];
                return detailIsJeongbae === isJeongbae;
            }).forEach(detail => {
                const homeOddsStyle = isJeongbae ? 'font-weight: bold;' : '';
                const awayOddsStyle = !isJeongbae ? 'font-weight: bold;' : '';
                
                html += `<tr>
                    <td>${detail.League}</td>
                    <td>${decodeExcelDate(detail.Date)}</td>
                    <td>${detail.HomeTeam}</td>
                    <td>${detail.AwayTeam}</td>
                    <td>${detail.FTHG}</td>
                    <td>${detail.FTAG}</td>
                    <td style="${homeOddsStyle}">${detail[`${oddsPrefix}H`].toFixed(2)}</td>
                    <td>${detail[`${oddsPrefix}D`].toFixed(2)}</td>
                    <td style="${awayOddsStyle}">${detail[`${oddsPrefix}A`].toFixed(2)}</td>
                    <td>${detail.Result}</td>
                </tr>`;
            });
        
            html += `</table></div></div>`;
            return html;
        }
        
        let oddsTypeText = oddsType === 'avg' ? '평균 배당' : 'Bet365 배당';
        switch(oddsType) {
            case 'avg':
                oddsTypeText = '평균 배당';
                break;
            case 'b365':
                oddsTypeText = 'Bet365 배당';
                break;
            case 'ps':
                oddsTypeText = 'PS 배당';
                break;
        }
        let summaryHtml = `<h4>${title} - 리그별 요약 (${oddsTypeText})</h4>`;
        
        // 정배 케이스 요약 및 상세 정보
        summaryHtml += createSummaryTable(leagueSummary.jeongbae, '정배 케이스');
        summaryHtml += createMatchDetailsTable(details.details, '정배 케이스', true, `${type}-jeongbae-details`);
        
        // 역배 케이스 요약 및 상세 정보
        summaryHtml += createSummaryTable(leagueSummary.yeokbae, '역배 케이스');
        summaryHtml += createMatchDetailsTable(details.details, '역배 케이스', false, `${type}-yeokbae-details`);
        
        summaryContainer.innerHTML = summaryHtml;
        detailsContainer.innerHTML = ''; // 기존 detailsContainer는 비워둠
    } else if (!forceUpdate) {
        detailsRow.style.display = 'none';
    }
}

// 매치 상세 정보 토글 함수 추가
function toggleMatchDetails(containerId) {
    const container = document.getElementById(containerId);
    const button = container.previousElementSibling.querySelector('.toggle-details-btn');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        button.textContent = '닫기';
    } else {
        container.style.display = 'none';
        button.textContent = '열기';
    }
}

function toggleDetails(type) {
    showDetails(type);
}

// HTML에서 호출할 함수들
function showJeongbaeDetails() { showDetails('jeongbae'); }
function showJeongbaeMuDetails() { showDetails('jeongbaeMu'); }
function showYeokbaeDetails() { showDetails('yeokbae'); }
function showYeokbaeMuDetails() { showDetails('yeokbaeMu'); }
function showSelectedLeagueJeongbaeMuDetails() { showDetails('selectedLeagueJeongbaeMu'); }
function showSelectedLeagueYeokbaeMuDetails() { showDetails('selectedLeagueYeokbaeMu'); }
function showAllMatchSampleDetails() { showDetails('allMatchSample'); }
function showCurrentLeagueMatchSampleDetails() { showDetails('currentLeagueMatchSample'); }
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

function analyzeData() {
    console.log('analyzeData function called');
    const inputValues = getInputValues();
    const detailedMargins = getDetailedMargins();

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
    console.log('Analysis completed');
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
    const columns = ['Date', 'HomeTeam', 'AwayTeam', 'AvgH', 'AvgD', 'AvgA', 'B365H', 'B365D', 'B365A', 'FTHG', 'FTAG'];
    return columns.reduce((acc, col) => {
        acc[col] = headerRow.indexOf(col);
        return acc;
    }, {});
}

function extractMatchData(row, columnIndices) {
    const oddsType = document.querySelector('input[name="oddsType"]:checked').value;
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
        FTHG: parseInt(row[columnIndices.FTHG]),
        FTAG: parseInt(row[columnIndices.FTAG]),
        OddsH: oddsType === 'avg' ? parseFloat(row[columnIndices.AvgH]) : parseFloat(row[columnIndices.B365H]),
        OddsD: oddsType === 'avg' ? parseFloat(row[columnIndices.AvgD]) : parseFloat(row[columnIndices.B365D]),
        OddsA: oddsType === 'avg' ? parseFloat(row[columnIndices.AvgA]) : parseFloat(row[columnIndices.B365A])
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

function showDetails(type) {
    const detailsRow = document.getElementById(`${type}-details`);
    const detailsContent = detailsRow.querySelector('.details-content');
    const summaryContainer = detailsContent.querySelector('.summary-container');
    const detailsContainer = detailsContent.querySelector('.details-container');

    if (detailsRow.style.display === 'none') {
        closeAllDetails();
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
        const oddsPrefix = oddsType === 'avg' ? 'Avg' : 'B365';
        
        // 리그별 요약 데이터 생성
        const leagueSummary = {};
        details.details.forEach(detail => {
            if (!leagueSummary[detail.League]) {
                leagueSummary[detail.League] = {
                    jeongbae: { '핸승': 0, '핸무': 0, '무': 0, '역': 0, 'total': 0 },
                    yeokbae: { '핸승': 0, '핸무': 0, '무': 0, '역': 0, 'total': 0 }
                };
            }
            const league = leagueSummary[detail.League];
            const isJeongbae = detail[`${oddsPrefix}H`] < detail[`${oddsPrefix}A`];
            const category = isJeongbae ? league.jeongbae : league.yeokbae;
            
            category[detail.Result]++;
            category.total++;
        });

        // 테이블 생성 함수
        function createTable(data, title) {
            let html = `<h5>${title}</h5>`;
            html += '<table class="league-summary">';
            html += '<tr><th>리그</th><th>핸승</th><th>핸무</th><th>무</th><th>역</th><th>합계</th><th>정배</th><th>플핸</th></tr>';
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
            });
            html += '</table>';
            return html;
        }
        
        const oddsTypeText = oddsType === 'avg' ? '평균 배당' : 'Bet365 배당';
            
        // 상세 결과 제목에 배당 유형 추가
        let summaryHtml = `<h4>${title} - 리그별 요약 (${oddsTypeText})</h4>`;
        summaryHtml += createTable(Object.fromEntries(Object.entries(leagueSummary).map(([k, v]) => [k, v.jeongbae])), '정배 케이스');
        summaryHtml += createTable(Object.fromEntries(Object.entries(leagueSummary).map(([k, v]) => [k, v.yeokbae])), '역배 케이스');
        
        summaryContainer.innerHTML = summaryHtml;

        // 상세 매치 정보 테이블 생성
        let detailsHtml = '<h4>상세 매치 정보</h4>';
        detailsHtml += '<table class="match-details">';
        detailsHtml += `<tr><th>리그</th><th>날짜</th><th>홈팀</th><th>어웨이팀</th><th>FTHG</th><th>FTAG</th><th>${oddsPrefix}H</th><th>${oddsPrefix}D</th><th>${oddsPrefix}A</th><th>결과</th><th>케이스</th></tr>`;

        details.details.forEach(detail => {
            const isJeongbae = detail[`${oddsPrefix}H`] < detail[`${oddsPrefix}A`];
            detailsHtml += `<tr>
                <td>${detail.League}</td>
                <td>${decodeExcelDate(detail.Date)}</td>
                <td>${detail.HomeTeam}</td>
                <td>${detail.AwayTeam}</td>
                <td>${detail.FTHG}</td>
                <td>${detail.FTAG}</td>
                <td>${detail[`${oddsPrefix}H`].toFixed(2)}</td>
                <td>${detail[`${oddsPrefix}D`].toFixed(2)}</td>
                <td>${detail[`${oddsPrefix}A`].toFixed(2)}</td>
                <td>${detail.Result}</td>
                <td>${isJeongbae ? '정배' : '역배'}</td>
            </tr>`;
        });

        detailsHtml += '</table>';
        detailsContainer.innerHTML = detailsHtml;
    } else {
        detailsRow.style.display = 'none';
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
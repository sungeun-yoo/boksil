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
    const inputValues = getInputValues();
    const detailedMargins = getDetailedMargins();

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
}

function getInputValues() {
    return {
        win: parseFloat(document.querySelector('input[name="win"]').value),
        draw: parseFloat(document.querySelector('input[name="draw"]').value),
        lose: parseFloat(document.querySelector('input[name="lose"]').value),
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
    const { win, draw, lose } = inputValues;
    const results = { "핸승": 0, "핸무": 0, "무": 0, "역": 0 };
    const details = [];

    let leaguesToProcess;
    if (selectedLeagueOnly && currentLeague) {
        leaguesToProcess = [currentLeague];
    } else if (analysisType === 'currentLeagueMatch') {
        // 현재 리그가 선택되지 않았다면 분석하지 않음
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
                
                if (isMatchEligible(matchData, win, draw, lose, detailedMargin, analysisType)) {
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
    const columns = ['Date', 'HomeTeam', 'AwayTeam', 'AvgH', 'AvgD', 'AvgA', 'FTHG', 'FTAG'];
    return columns.reduce((acc, col) => {
        acc[col] = headerRow.indexOf(col);
        return acc;
    }, {});
}

function extractMatchData(row, columnIndices) {
    return {
        Date: row[columnIndices.Date],
        HomeTeam: row[columnIndices.HomeTeam],
        AwayTeam: row[columnIndices.AwayTeam],
        AvgH: parseFloat(row[columnIndices.AvgH]),
        AvgD: parseFloat(row[columnIndices.AvgD]),
        AvgA: parseFloat(row[columnIndices.AvgA]),
        FTHG: parseInt(row[columnIndices.FTHG]),
        FTAG: parseInt(row[columnIndices.FTAG])
    };
}

function isMatchEligible(matchData, win, draw, lose, detailedMargin, analysisType) {
    const { AvgH, AvgD, AvgA } = matchData;
    const jeongbae = Math.min(win, lose);
    const yeokbae = Math.max(win, lose);

    switch (analysisType) {
        case 'jeongbae':
            return Math.abs(AvgH - jeongbae) <= detailedMargin.jeongbae || Math.abs(AvgA - jeongbae) <= detailedMargin.jeongbae;
        case 'jeongbaeMu':
            return (Math.abs(AvgH - jeongbae) <= detailedMargin.jeongbae || Math.abs(AvgA - jeongbae) <= detailedMargin.jeongbae) && Math.abs(AvgD - draw) <= detailedMargin.mu;
        case 'yeokbae':
            return Math.abs(AvgH - yeokbae) <= detailedMargin.yeokbae || Math.abs(AvgA - yeokbae) <= detailedMargin.yeokbae;
        case 'yeokbaeMu':
            return (Math.abs(AvgH - yeokbae) <= detailedMargin.yeokbae || Math.abs(AvgA - yeokbae) <= detailedMargin.yeokbae) && Math.abs(AvgD - draw) <= detailedMargin.mu;
        case 'allMatch':
        case 'currentLeagueMatch':
            return (Math.abs(AvgH - jeongbae) <= detailedMargin.jeongbae && Math.abs(AvgD - draw) <= detailedMargin.mu && Math.abs(AvgA - yeokbae) <= detailedMargin.yeokbae) ||
                   (Math.abs(AvgH - yeokbae) <= detailedMargin.yeokbae && Math.abs(AvgD - draw) <= detailedMargin.mu && Math.abs(AvgA - jeongbae) <= detailedMargin.jeongbae);
        default:
            return false;
    }
}
function calculateResult(matchData, analysisType) {
    const { AvgH, AvgA, FTHG, FTAG } = matchData;
    let mainScore, subScore;

    if ((analysisType.startsWith('jeongbae') && AvgH < AvgA) || 
        (analysisType.startsWith('yeokbae') && AvgH > AvgA) ||
        (analysisType === 'allMatch' && AvgH < AvgA) ||
        (analysisType === 'currentLeagueMatch' && AvgH < AvgA)) {
        mainScore = FTHG;
        subScore = FTAG;
    } else {
        mainScore = FTAG;
        subScore = FTHG;
    }

    if (mainScore > subScore + 1) return "핸승";
    if (mainScore === subScore + 1) return "핸무";
    if (mainScore === subScore) return "무";
    return "역";
}

function updateResultsTable(rowName, analysisResult) {
    const table = document.querySelector('.results-table');
    const row = Array.from(table.querySelectorAll('tr')).find(row => {
        const span = row.querySelector('th span');
        return span && span.textContent.includes(rowName);
    });
    
    if (row) {
        const cells = row.querySelectorAll('td');
        ['핸승', '핸무', '무', '역'].forEach((result, index) => {
            cells[index].textContent = analysisResult.results[result];
        });
    }
}


function decodeExcelDate(excelDate) {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
}


function showDetails(type) {
    const detailsRow = document.getElementById(`${type}-details`);
    const detailsContent = detailsRow.querySelector('.details-content');
    const summaryContainer = detailsContent.querySelector('.summary-container');
    const detailsContainer = detailsContent.querySelector('.details-container');

    if (detailsRow.style.display === 'none') {
        detailsRow.style.display = 'table-row';
        const details = analysisDetails[type];
        
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

        // 리그별 요약 테이블 생성
        const leagueSummary = {};
        details.details.forEach(detail => {
            if (!leagueSummary[detail.League]) {
                leagueSummary[detail.League] = { '핸승': 0, '핸무': 0, '무': 0, '역': 0 };
            }
            leagueSummary[detail.League][detail.Result]++;
        });

        let summaryHtml = `<h4>${title} - 리그별 요약</h4>`;
        summaryHtml += '<table class="league-summary">';
        summaryHtml += '<tr><th>리그</th><th>핸승</th><th>핸무</th><th>무</th><th>역</th></tr>';
        Object.entries(leagueSummary).forEach(([league, counts]) => {
            summaryHtml += `<tr>
                <td>${league}</td>
                <td>${counts['핸승']}</td>
                <td>${counts['핸무']}</td>
                <td>${counts['무']}</td>
                <td>${counts['역']}</td>
            </tr>`;
        });
        summaryHtml += '</table>';
        summaryContainer.innerHTML = summaryHtml;

        // 상세 매치 정보 테이블 생성
        let detailsHtml = '<h4>상세 매치 정보</h4>';
        detailsHtml += '<table class="match-details">';
        detailsHtml += '<tr><th>리그</th><th>날짜</th><th>홈팀</th><th>어웨이팀</th><th>FTHG</th><th>FTAG</th><th>AvgH</th><th>AvgD</th><th>AvgA</th><th>결과</th></tr>';

        details.details.forEach(detail => {
            detailsHtml += `<tr>
                <td>${detail.League}</td>
                <td>${decodeExcelDate(detail.Date)}</td>
                <td>${detail.HomeTeam}</td>
                <td>${detail.AwayTeam}</td>
                <td>${detail.FTHG}</td>
                <td>${detail.FTAG}</td>
                <td>${detail.AvgH}</td>
                <td>${detail.AvgD}</td>
                <td>${detail.AvgA}</td>
                <td>${detail.Result}</td>
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
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
    analysisDetails.jeongbae = analyzeMatches(inputValues, 'jeongbae');
    analysisDetails.jeongbaeMu = analyzeMatches(inputValues, 'jeongbaeMu');
    analysisDetails.yeokbae = analyzeMatches(inputValues, 'yeokbae');
    analysisDetails.yeokbaeMu = analyzeMatches(inputValues, 'yeokbaeMu');
    analysisDetails.allMatchSample = analyzeMatches(inputValues, 'allMatch');
    
    updateResultsTable('정배 표본', analysisDetails.jeongbae);
    updateResultsTable('정배+무 표본', analysisDetails.jeongbaeMu);
    updateResultsTable('역배 표본', analysisDetails.yeokbae);
    updateResultsTable('역배+무 표본', analysisDetails.yeokbaeMu);
    updateResultsTable('승(무)패 일치 표본', analysisDetails.allMatchSample);

    if (currentLeague) {
        analysisDetails.selectedLeagueJeongbaeMu = analyzeMatches(inputValues, 'jeongbaeMu', true);
        analysisDetails.selectedLeagueYeokbaeMu = analyzeMatches(inputValues, 'yeokbaeMu', true);
        analysisDetails.currentLeagueMatchSample = analyzeMatches(inputValues, 'currentLeagueMatch', true);
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
        margin: parseFloat(document.querySelector('input[name="margin"]').value)
    };
}

function analyzeMatches(inputValues, analysisType, selectedLeagueOnly = false) {
    const { win, draw, lose, margin } = inputValues;
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
                
                if (isMatchEligible(matchData, win, draw, lose, margin, analysisType)) {
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

function isMatchEligible(matchData, win, draw, lose, margin, analysisType) {
    const { AvgH, AvgD, AvgA } = matchData;
    const jeongbae = Math.min(win, lose);
    const yeokbae = Math.max(win, lose);

    switch (analysisType) {
        case 'jeongbae':
            return Math.abs(AvgH - jeongbae) <= margin || Math.abs(AvgA - jeongbae) <= margin;
        case 'jeongbaeMu':
            return (Math.abs(AvgH - jeongbae) <= margin || Math.abs(AvgA - jeongbae) <= margin) && Math.abs(AvgD - draw) <= margin;
        case 'yeokbae':
            return Math.abs(AvgH - yeokbae) <= margin || Math.abs(AvgA - yeokbae) <= margin;
        case 'yeokbaeMu':
            return (Math.abs(AvgH - yeokbae) <= margin || Math.abs(AvgA - yeokbae) <= margin) && Math.abs(AvgD - draw) <= margin;
        case 'allMatch':
        case 'currentLeagueMatch':
            return (Math.abs(AvgH - win) <= margin && Math.abs(AvgD - draw) <= margin && Math.abs(AvgA - lose) <= margin) ||
                   (Math.abs(AvgH - lose) <= margin && Math.abs(AvgD - draw) <= margin && Math.abs(AvgA - win) <= margin);
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
    const row = Array.from(table.querySelectorAll('tr')).find(row => row.querySelector('th').textContent.includes(rowName));
    
    if (row) {
        ['핸승', '핸무', '무', '역'].forEach((result, index) => {
            row.querySelectorAll('td')[index].textContent = analysisResult.results[result];
        });
    }
}

function decodeExcelDate(excelDate) {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
}

function showDetails(type) {
    const details = analysisDetails[type];
    let title;
    switch(type) {
        case 'jeongbae': title = '정배 표본 상세 결과'; break;
        case 'jeongbaeMu': title = '정배+무 표본 상세 결과'; break;
        case 'yeokbae': title = '역배 표본 상세 결과'; break;
        case 'yeokbaeMu': title = '역배+무 표본 상세 결과'; break;
        case 'selectedLeagueJeongbaeMu': title = '해당리그 정배+무 표본 상세 결과'; break;
        case 'selectedLeagueYeokbaeMu': title = '해당리그 역배+무 표본 상세 결과'; break;
        default: title = '상세 결과';
    }
    
    const detailsWindow = window.open('', 'DetailsWindow', 'width=800,height=600');
    detailsWindow.document.write('<html><head><title>' + title + '</title>');
    detailsWindow.document.write('<style>table {border-collapse: collapse;} th, td {border: 1px solid black; padding: 5px;}</style>');
    detailsWindow.document.write('</head><body>');
    detailsWindow.document.write('<h2>' + title + '</h2>');
    detailsWindow.document.write('<table>');
    detailsWindow.document.write('<tr><th>리그</th><th>날짜</th><th>홈팀</th><th>어웨이팀</th><th>FTHG</th><th>FTAG</th><th>AvgH</th><th>AvgD</th><th>AvgA</th><th>결과</th></tr>');

    details.details.forEach(detail => {
        detailsWindow.document.write(`<tr>
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
        </tr>`);
    });

    detailsWindow.document.write('</table>');
    detailsWindow.document.write('</body></html>');
    detailsWindow.document.close();
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
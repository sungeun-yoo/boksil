let workbook;
const defaultLeagues = ['E0', 'SP1', 'I1', 'D1', 'N1', 'F1'];
let selectedLeagues = [];
let currentLeague = '';

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        processData();
    });
});

function loadExcelFile() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            workbook = XLSX.read(data, {type: 'array'});
            showAnalysisScreen();
            createLeagueCheckboxes();
            updateCurrentLeagueDropdown();
            updateLeagueTable();
        };
        reader.onerror = function(e) {
            console.error('파일 읽기 오류:', e);
            alert('파일을 읽는 중 오류가 발생했습니다.');
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('파일을 선택해주세요.');
    }
}

function showAnalysisScreen() {
    document.getElementById('fileSelectionScreen').style.display = 'none';
    document.getElementById('analysisScreen').style.display = 'block';
}

function createLeagueCheckboxes() {
    const leagueCheckboxes = document.querySelector('.league-checkboxes');
    leagueCheckboxes.innerHTML = ''; // 기존 체크박스 초기화
    selectedLeagues = []; // 선택된 리그 초기화

    workbook.SheetNames.forEach(sheetName => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = sheetName;
        checkbox.name = 'league';
        checkbox.value = sheetName;
        checkbox.checked = defaultLeagues.includes(sheetName);
        
        if (checkbox.checked) {
            selectedLeagues.push(sheetName);
        }
        
        const label = document.createElement('label');
        label.htmlFor = sheetName;
        label.appendChild(document.createTextNode(sheetName));
        
        leagueCheckboxes.appendChild(checkbox);
        leagueCheckboxes.appendChild(label);
        
        checkbox.addEventListener('change', function() {
            updateSelectedLeagues();
            updateCurrentLeagueDropdown();
            updateLeagueTable();
        });
    });
}

function updateSelectedLeagues() {
    selectedLeagues = workbook.SheetNames.filter(sheetName => {
        const checkbox = document.getElementById(sheetName);
        return checkbox && checkbox.checked;
    });
}

function updateCurrentLeagueDropdown() {
    const currentLeagueSelect = document.getElementById('currentLeague');
    currentLeagueSelect.innerHTML = '<option value="">선택된 리그</option>';
    selectedLeagues.forEach(league => {
        const option = document.createElement('option');
        option.value = league;
        option.textContent = league;
        currentLeagueSelect.appendChild(option);
    });

    console.log('Selected league:', currentLeague); // 디버깅용
    currentLeagueSelect.value = currentLeague;
    
    currentLeagueSelect.addEventListener('change', function() {
        currentLeague = this.value;
        console.log('Selected league:', currentLeague); // 디버깅용
        //updateLeagueTable();
        //processData(); // 리그 선택 변경 시 데이터 다시 분석
    });
}

function updateLeagueTable() {
    const leagueTable = document.querySelector('.league-table');
    if (!leagueTable) return;

    // 테이블 헤더 유지
    const headerRow = leagueTable.querySelector('tr');
    leagueTable.innerHTML = '';
    leagueTable.appendChild(headerRow);

    const leaguesToShow = currentLeague ? [currentLeague] : selectedLeagues;

    leaguesToShow.forEach(league => {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.textContent = league;
        row.appendChild(cell);
        for (let i = 0; i < 4; i++) {
            row.appendChild(document.createElement('td'));
        }
        leagueTable.appendChild(row);
    });
}

function toggleLeagueCheckboxes() {
    const leagueCheckboxes = document.querySelector('.league-checkboxes');
    const leagueToggle = document.querySelector('.league-toggle');
    if (leagueCheckboxes.style.display === 'none' || leagueCheckboxes.style.display === '') {
        leagueCheckboxes.style.display = 'block';
        leagueToggle.textContent = '리그 선택 ▼';
    } else {
        leagueCheckboxes.style.display = 'none';
        leagueToggle.textContent = '리그 선택 ▶';
    }
}
function processData() {
    const requiredColumns = ['Date', 'Time', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'FTR', 'AvgH', 'AvgD', 'AvgA'];

    const win = parseFloat(document.querySelector('input[name="win"]').value);
    const draw = parseFloat(document.querySelector('input[name="draw"]').value);
    const lose = parseFloat(document.querySelector('input[name="lose"]').value);
    const margin = parseFloat(document.querySelector('input[name="margin"]').value);

    let output = '';
    output += '<div class="results-header">';
    output += '<h2>검색 결과</h2>';
    output += '<button onclick="toggleResults()">결과 숨기기</button>';
    output += '</div>';
    
    output += '<div id="allResults">';
    
    const leaguesToProcess = currentLeague ? [currentLeague] : selectedLeagues;

    leaguesToProcess.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
        
        if (jsonData.length >= 2) {
            // Find the indices of required columns
            const headerRow = jsonData[0];
            const columnIndices = requiredColumns.map(col => headerRow.indexOf(col));

            // Check if all required columns are present
            if (columnIndices.every(index => index !== -1)) {
                // Extract and filter data from required columns
                const extractedData = jsonData.slice(1).filter(row => {
                    const avgH = parseFloat(row[columnIndices[7]]);
                    const avgD = parseFloat(row[columnIndices[8]]);
                    const avgA = parseFloat(row[columnIndices[9]]);

                    return (Math.abs(avgH - win) <= margin &&
                            Math.abs(avgD - draw) <= margin &&
                            Math.abs(avgA - lose) <= margin) ||
                           (Math.abs(avgH - lose) <= margin &&
                            Math.abs(avgD - draw) <= margin &&
                            Math.abs(avgA - win) <= margin);
                }).map(row => {
                    const extractedRow = columnIndices.map((index, colIndex) => {
                        if (colIndex === 0) { // Date column
                            const dateCell = XLSX.utils.encode_cell({c: index, r: row.length - 1});
                            const dateCellValue = worksheet[dateCell];
                            if (dateCellValue) {
                                const dateValue = XLSX.SSF.parse_date_code(dateCellValue.v);
                                return `${dateValue.y}-${String(dateValue.m).padStart(2, '0')}-${String(dateValue.d).padStart(2, '0')}`;
                            }
                            return 'Date not found';
                        } else if (colIndex === 1) { // Time column
                            const timeCell = XLSX.utils.encode_cell({c: index, r: row.length - 1});
                            const timeCellValue = worksheet[timeCell];
                            if (timeCellValue) {
                                const timeValue = XLSX.SSF.parse_date_code(timeCellValue.v);
                                return `${String(timeValue.H).padStart(2, '0')}:${String(timeValue.M).padStart(2, '0')}`;
                            }
                            return 'Time not found';
                        }
                        return row[index];
                    });

                    const avgH = parseFloat(extractedRow[7]);
                    const avgA = parseFloat(extractedRow[9]);
                    const fthg = parseInt(extractedRow[4]);
                    const ftag = parseInt(extractedRow[5]);
                    
                    let result;
                    if (avgH < avgA) {
                        const chongbae = fthg;
                        const yeokbae = ftag + 1;
                        if (chongbae === yeokbae) {
                            result = "핸무";
                        } else if (chongbae > yeokbae) {
                            result = "핸승";
                        } else if (fthg === ftag) {
                            result = "무";
                        } else {
                            result = "역";
                        }
                    } else {
                        const chongbae = ftag;
                        const yeokbae = fthg + 1;
                        if (chongbae === yeokbae) {
                            result = "핸무";
                        } else if (chongbae > yeokbae) {
                            result = "핸승";
                        } else if (fthg === ftag) {
                            result = "무";
                        } else {
                            result = "역";
                        }
                    }
                    extractedRow.push(result);
                    return extractedRow;
                });

                if (extractedData.length > 0) {
                    output += `<div class="league-container">`;
                    output += `<h3>League: ${sheetName}</h3>`;

                    // Create table
                    output += '<table class="excel-table">';
                    
                    // Add header row
                    output += '<tr>';
                    requiredColumns.forEach(col => {
                        output += `<th>${col}</th>`;
                    });
                    output += '<th>결과</th>';
                    output += '</tr>';

                    // Add data rows
                    extractedData.forEach(row => {
                        output += '<tr>';
                        row.forEach(cell => {
                            output += `<td>${cell}</td>`;
                        });
                        output += '</tr>';
                    });

                    output += '</table>';
                    output += '</div>';
                }
            }
        }
    });

    output += '</div>'; // Closing allResults div

    if (output === '<div id="allResults"></div>') {
        output = '<p>No matching data found.</p>';
    }

    //document.getElementById('dataOutput').innerHTML = output;

    analyzeData();
}

function toggleResults() {
    const allResults = document.getElementById('allResults');
    const toggleButton = document.querySelector('.results-header button');
    if (allResults.style.display === 'none') {
        allResults.style.display = 'block';
        toggleButton.textContent = '결과 숨기기';
    } else {
        allResults.style.display = 'none';
        toggleButton.textContent = '결과 보이기';
    }
}


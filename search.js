let workbook;
const defaultLeagues = ['E0', 'SP1', 'I1', 'D1', 'N1', 'F1'];
let selectedLeagues = [];
let currentLeague = '';

document.addEventListener('DOMContentLoaded', function() {
    const boksilOpacitySlider = document.getElementById('boksilOpacity');
    const backgroundImage = document.querySelector('.background-image');

    // 초기 투명도 설정
    backgroundImage.style.opacity = boksilOpacitySlider.value / 100;

    // 슬라이더 값 변경 시 투명도 업데이트
    boksilOpacitySlider.addEventListener('input', function() {
        backgroundImage.style.opacity = this.value / 100;
    });
});

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

let detailedMargins = {
    jeongbae: { win: 0, draw: 0, lose: 0 },
    yeokbae: { win: 0, draw: 0, lose: 0 },
    match: { win: 0, draw: 0, lose: 0 }
};

document.addEventListener('DOMContentLoaded', function() {
    // 기존 이벤트 리스너 유지

    document.getElementById('marginSettingsButton').addEventListener('click', function() {
        const marginSettings = document.getElementById('marginSettings');
        marginSettings.style.display = marginSettings.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('applyMarginSettings').addEventListener('click', function() {
        detailedMargins.jeongbae.win = parseFloat(document.getElementById('jeongbaeWinMargin').value) || 0;
        detailedMargins.jeongbae.draw = parseFloat(document.getElementById('jeongbaeDrawMargin').value) || 0;
        detailedMargins.jeongbae.lose = parseFloat(document.getElementById('jeongbaeLoseMargin').value) || 0;
        detailedMargins.yeokbae.win = parseFloat(document.getElementById('yeokbaeWinMargin').value) || 0;
        detailedMargins.yeokbae.draw = parseFloat(document.getElementById('yeokbaeDrawMargin').value) || 0;
        detailedMargins.yeokbae.lose = parseFloat(document.getElementById('yeokbaeLoseMargin').value) || 0;
        detailedMargins.match.win = parseFloat(document.getElementById('matchWinMargin').value) || 0;
        detailedMargins.match.draw = parseFloat(document.getElementById('matchDrawMargin').value) || 0;
        detailedMargins.match.lose = parseFloat(document.getElementById('matchLoseMargin').value) || 0;
        const marginSettings = document.getElementById('marginSettings');
        marginSettings.style.display = marginSettings.style.display === 'none' ? 'block' : 'none';
        alert('마진 설정이 적용되었습니다.');
    });
});

function processData() {

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


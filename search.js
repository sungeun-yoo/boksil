let workbook;
const defaultLeagues = ['E0', 'SP1', 'I1', 'D1', 'N1', 'F1'];
let selectedLeagues = [];
let currentLeague = '';
let minDate, maxDate;
let yearlyStartDate, yearlyEndDate;

function initializeYearlyDateSlider() {
    const startDate = new Date(2022, 0, 1);  // 1월 1일
    const endDate = new Date(2022, 11, 31);  // 12월 31일

    $("#yearlyDateSlider").slider({
        range: true,
        min: 0,
        max: 364,  // 0부터 시작하므로 364
        values: [0, 364],  // 처음과 끝으로 설정
        slide: function(event, ui) {
            updateYearlyDateRange(ui.values[0], ui.values[1]);
        }
    });

    updateYearlyDateRange(0, 364);  // 초기 상태를 1월 1일부터 12월 31일로 설정
}

function updateYearlyDateRange(startValue, endValue) {
    const startDate = new Date(2022, 0, 1);
    startDate.setDate(startDate.getDate() + startValue);
    const endDate = new Date(2022, 0, 1);
    endDate.setDate(endDate.getDate() + endValue);

    yearlyStartDate = {
        month: startDate.getMonth() + 1,
        day: startDate.getDate()
    };
    yearlyEndDate = {
        month: endDate.getMonth() + 1,
        day: endDate.getDate()
    };

    $("#yearlyStartDate").text(formatDate(startDate));
    $("#yearlyEndDate").text(formatDate(endDate));

    console.log('Yearly date range updated:', yearlyStartDate, yearlyEndDate);
}

function formatDate(date) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function isDateInYearlyRange(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // 시작일이 종료일보다 늦은 경우 (예: 11월 1일 ~ 3월 31일)
    if (yearlyStartDate.month > yearlyEndDate.month ||
        (yearlyStartDate.month === yearlyEndDate.month && yearlyStartDate.day > yearlyEndDate.day)) {
        return (month > yearlyStartDate.month || (month === yearlyStartDate.month && day >= yearlyStartDate.day)) ||
               (month < yearlyEndDate.month || (month === yearlyEndDate.month && day <= yearlyEndDate.day));
    } 
    // 시작일이 종료일보다 이르거나 같은 경우
    else {
        return (month > yearlyStartDate.month || (month === yearlyStartDate.month && day >= yearlyStartDate.day)) &&
               (month < yearlyEndDate.month || (month === yearlyEndDate.month && day <= yearlyEndDate.day));
    }
}

function isDateInRange(date) {
    const sliderValues = $("#dateSlider").slider("values");
    return date >= new Date(sliderValues[0]) && date <= new Date(sliderValues[1]) && isDateInYearlyRange(date);
}

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
    console.log('DOM fully loaded');
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        console.log('Search form found');
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Search form submitted');
            processData();
        });
    } else {
        console.error('Search form not found');
    }
    
    initializeYearlyDateSlider();
});

function loadExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                workbook = XLSX.read(data, {type: 'array'});
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = function(e) {
            reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
        };
        reader.readAsArrayBuffer(file);
    });
}


function initializeDateSlider() {
    console.log('Initializing date slider');
    if (!workbook || !workbook.SheetNames) {
        console.error('Workbook is not loaded properly');
        return;
    }

    let allDates = [];
    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const dateColumnIndex = jsonData[0].indexOf('Date');
        
        jsonData.slice(1).forEach(row => {
            if (row[dateColumnIndex]) {
                allDates.push(new Date((row[dateColumnIndex] - 25569) * 86400 * 1000));
            }
        });
    });

    minDate = new Date(Math.min.apply(null, allDates));
    maxDate = new Date(Math.max.apply(null, allDates));

    $("#dateSlider").slider({
        range: true,
        min: minDate.getTime(),
        max: maxDate.getTime(),
        step: 86400000, // 1일
        values: [minDate.getTime(), maxDate.getTime()],
        slide: function(event, ui) {
            $("#startDate").text(new Date(ui.values[0]).toISOString().split('T')[0]);
            $("#endDate").text(new Date(ui.values[1]).toISOString().split('T')[0]);
        }
    });

    $("#startDate").text(minDate.toISOString().split('T')[0]);
    $("#endDate").text(maxDate.toISOString().split('T')[0]);
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        try {
            await loadExcelFile(file);
            showAnalysisScreen();
            createLeagueCheckboxes();
            updateCurrentLeagueDropdown();
            updateLeagueTable();
            initializeDateSlider();
            console.log('File loaded and initialized successfully');
        } catch (error) {
            console.error('Error loading file:', error);
            alert('파일을 로드하는 중 오류가 발생했습니다.');
        }
    }
}

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('excelFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    } else {
        console.error('File input element not found');
    }
});

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
        leagueToggle.textContent = '리그 선택 (닫기)';
    } else {
        leagueCheckboxes.style.display = 'none';
        leagueToggle.textContent = '리그 선택 (열기)';
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
        const detailedMargins = {
            jeongbae: {
                jeongbae: parseFloat(document.getElementById('jeongbaeMargin').value) || 0,
                mu: parseFloat(document.getElementById('jeongbaeMuMargin').value) || 0,
                yeokbae: parseFloat(document.getElementById('jeongbaeYeokbaeMargin').value) || 0
            },
            yeokbae: {
                jeongbae: parseFloat(document.getElementById('yeokbaeJeongbaeMargin').value) || 0,
                mu: parseFloat(document.getElementById('yeokbaeMuMargin').value) || 0,
                yeokbae: parseFloat(document.getElementById('yeokbaeMargin').value) || 0
            },
            match: {
                jeongbae: parseFloat(document.getElementById('matchJeongbaeMargin').value) || 0,
                mu: parseFloat(document.getElementById('matchMuMargin').value) || 0,
                yeokbae: parseFloat(document.getElementById('matchYeokbaeMargin').value) || 0
            }
        };

        const marginSettings = document.getElementById('marginSettings');
        marginSettings.style.display = marginSettings.style.display === 'none' ? 'block' : 'none';
        console.log('Updated margins:', detailedMargins);          
    });
});

function processData() {
    console.log('processData function called');
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


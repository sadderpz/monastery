// MONASTERY - Knowledge Preservation Network
// 4D Tesseract Rotating Hypercube Visualization
// All-black background, white wireframe aesthetic

let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let currentTimerType = 'work';
let sessionCount = 0;
let unlockTimeout = null;

/****************************************************************
 * 4D TESSERACT RENDERING (Hypercube, 16 vertices, 24 edges)
 ****************************************************************/

const TESS_VERTICES_4D = [];
for(let i = 0; i < 16; i++){
    let pt = [
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1
    ];
    TESS_VERTICES_4D.push(pt);
}

const TESS_EDGES = [];
for(let i = 0; i < 16; i++) {
    for(let j = i + 1; j < 16; j++) {
        let diff = 0;
        for(let d = 0; d < 4; d++) {
            diff += Math.abs(TESS_VERTICES_4D[i][d] - TESS_VERTICES_4D[j][d]);
        }
        if(diff === 2) TESS_EDGES.push([i, j]);
    }
}

const OUTER_IDX = [0, 2, 4, 6, 8, 10, 12, 14];
const INNER_IDX = [1, 3, 5, 7, 9, 11, 13, 15];

const wireColor = '#FFF';
const outerColor = '#FFF';
const innerColor = '#EEE';
const edgeWidth = 2.1;
const innerEdgeWidth = 1.2;
const POINT_SIZE = 4;
const WIDTH = 540;
const HEIGHT = 540;
const SCALE = 130;
const PROJ_W = 2.0;

function rotate4D(p, angles) {
    let x = p[0], y = p[1], z = p[2], w = p[3];
    let sxw = Math.sin(angles.xw);
    let cxw = Math.cos(angles.xw);
    let syw = Math.sin(angles.yw);
    let cyw = Math.cos(angles.yw);
    let szw = Math.sin(angles.zw);
    let czw = Math.cos(angles.zw);
    
    let nx = cxw * x - sxw * w;
    let nw = sxw * x + cxw * w;
    
    let ny = cyw * y - syw * nw;
    let nw2 = syw * y + cyw * nw;
    
    let nz = czw * z - szw * nw2;
    let nw3 = szw * z + czw * nw2;
    
    return [nx, ny, nz, nw3];
}

function project4Dto3D(p) {
    const d = PROJ_W;
    const k = d / (d - p[3]);
    return [p[0] * k, p[1] * k, p[2] * k];
}

function project3Dto2D(p) {
    const depth = 2.5;
    const f = SCALE / (p[2] + depth * SCALE / 30);
    return [WIDTH / 2 + p[0] * f, HEIGHT / 2 + p[1] * f];
}

let t_angles = {xw: 0, yw: 0, zw: 0};
let t_rotateSpeed = {xw: 0.008, yw: 0.006, zw: 0.007};
let dragging = false;
let dragLast = null;

function renderTesseract() {
    const c = document.getElementById('tesseractCanvas');
    if(!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    const pts3 = TESS_VERTICES_4D.map(v4 => project4Dto3D(rotate4D(v4, t_angles)));
    
    ctx.save();
    ctx.strokeStyle = wireColor;
    ctx.globalAlpha = 0.96;
    ctx.lineWidth = edgeWidth;
    
    TESS_EDGES.forEach(edge => {
        const a = edge[0];
        const b = edge[1];
        const onOuter = OUTER_IDX.includes(a) && OUTER_IDX.includes(b);
        ctx.strokeStyle = onOuter ? outerColor : innerColor;
        ctx.lineWidth = onOuter ? edgeWidth : innerEdgeWidth;
        ctx.beginPath();
        const p1 = project3Dto2D(pts3[a]);
        const p2 = project3Dto2D(pts3[b]);
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
    });
    ctx.restore();
    
    for(let i = 0; i < pts3.length; i++) {
        ctx.save();
        ctx.beginPath();
        const p = project3Dto2D(pts3[i]);
        ctx.arc(p[0], p[1], POINT_SIZE, 0, 2 * Math.PI);
        ctx.globalAlpha = OUTER_IDX.includes(i) ? 0.84 : 0.55;
        ctx.fillStyle = wireColor;
        ctx.fill();
        ctx.restore();
    }
}

function animateTesseract() {
    t_angles.xw += t_rotateSpeed.xw;
    t_angles.yw += t_rotateSpeed.yw;
    t_angles.zw += t_rotateSpeed.zw;
    renderTesseract();
    requestAnimationFrame(animateTesseract);
}

function attachTesseractInteraction() {
    const c = document.getElementById('tesseractCanvas');
    if(!c) return;
    c.addEventListener('mousedown', (e) => {
        dragging = true;
        dragLast = {x: e.offsetX, y: e.offsetY};
    });
    c.addEventListener('mousemove', (e) => {
        if(dragging && dragLast) {
            const dx = e.offsetX - dragLast.x;
            const dy = e.offsetY - dragLast.y;
            t_angles.xw += dy * 0.012;
            t_angles.yw += dx * 0.012;
            dragLast = {x: e.offsetX, y: e.offsetY};
            renderTesseract();
        }
    });
    window.addEventListener('mouseup', () => {
        dragging = false;
        dragLast = null;
    });
}

function initTesseractOnLoad() {
    if(document.getElementById('tesseractCanvas')) {
        setTimeout(() => {
            renderTesseract();
            animateTesseract();
            attachTesseractInteraction();
        }, 140);
    }
}

// View Management
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

function showUploadType(type) {
    const forumForm = document.getElementById('forumUploadForm');
    const docForm = document.getElementById('documentUploadForm');
    const forumBtn = document.getElementById('forumUploadBtn');
    const docBtn = document.getElementById('docUploadBtn');
    
    if (type === 'forum') {
        forumForm.style.display = 'block';
        docForm.style.display = 'none';
        forumBtn.style.background = '#FFFFFF';
        forumBtn.style.color = '#000000';
        docBtn.style.background = 'transparent';
        docBtn.style.color = '#FFFFFF';
    } else {
        forumForm.style.display = 'none';
        docForm.style.display = 'block';
        docBtn.style.background = '#FFFFFF';
        docBtn.style.color = '#000000';
        forumBtn.style.background = 'transparent';
        forumBtn.style.color = '#FFFFFF';
    }
}

function openThread(threadTitle) {
    alert('Opening thread: ' + threadTitle + '\n\nIn full implementation, this would show chronological replies with no upvotes or engagement metrics.');
}

function downloadDocument(docTitle) {
    alert('Downloading: ' + docTitle + '\n\nIn full implementation, this would initiate PDF download for physical printing and archival.');
}

function openMentorshipChannel(subject) {
    alert('Opening encrypted mentorship channel: ' + subject + '\n\nIn full implementation, this would open end-to-end encrypted text-only communication.');
}

function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    const workDuration = parseInt(document.getElementById('workDuration').value) || 25;
    const shortBreakDuration = parseInt(document.getElementById('shortBreak').value) || 5;
    const longBreakDuration = parseInt(document.getElementById('longBreak').value) || 15;
    
    if (timerSeconds === 0) {
        if (currentTimerType === 'work') {
            timerSeconds = workDuration * 60;
            sessionCount++;
            document.getElementById('currentSession').textContent = sessionCount;
            document.getElementById('timerLabel').textContent = 'Focus time - breathe deeply';
        } else if (currentTimerType === 'shortBreak') {
            timerSeconds = shortBreakDuration * 60;
            document.getElementById('timerLabel').textContent = 'Short break';
        } else {
            timerSeconds = longBreakDuration * 60;
            document.getElementById('timerLabel').textContent = 'Long break - rest deeply';
        }
    }
    
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'inline-block';
    
    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();
        
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            completeTimerSession();
        }
    }, 1000);
}

function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('timerLabel').textContent = 'Paused';
}

function resetTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    timerSeconds = 0;
    currentTimerType = 'work';
    document.getElementById('timerDisplay').textContent = '25:00';
    document.getElementById('timerLabel').textContent = 'Ready to begin';
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('pauseBtn').style.display = 'none';
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    document.getElementById('timerDisplay').textContent = 
        String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

function completeTimerSession() {
    isTimerRunning = false;
    timerSeconds = 0;
    
    if (currentTimerType === 'work') {
        const intention = document.getElementById('focusIntention').value || 'Focus session';
        saveCompletedSession(intention);
        
        if (sessionCount % 4 === 0) {
            currentTimerType = 'longBreak';
            document.getElementById('timerLabel').textContent = 'Session complete! Time for a long break';
        } else {
            currentTimerType = 'shortBreak';
            document.getElementById('timerLabel').textContent = 'Session complete! Take a short break';
        }
    } else {
        currentTimerType = 'work';
        document.getElementById('timerLabel').textContent = 'Break complete! Ready for next session?';
    }
    
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('pauseBtn').style.display = 'none';
}

function saveCompletedSession(intention) {
    const session = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        intention: intention,
        duration: parseInt(document.getElementById('workDuration').value) || 25,
        completed: true
    };
    console.log('Session saved:', session);
    updateHomeStats();
}

function addSabbath() {
    const day = document.getElementById('sabbathDay').value;
    const start = document.getElementById('sabbathStart').value;
    const end = document.getElementById('sabbathEnd').value;
    const apps = document.getElementById('sabbathApps').value;
    
    const sabbath = {
        day: day,
        startTime: start,
        endTime: end,
        blockedApps: apps.split(',').map(app => app.trim()),
        recurring: true
    };
    
    console.log('Sabbath scheduled:', sabbath);
    
    const list = document.getElementById('sabbathList');
    const item = document.createElement('li');
    item.className = 'schedule-item';
    item.innerHTML = '<strong>Every ' + day + '</strong><br>' + start + ' - ' + end + '<br><div class="blocked-apps-list">' + sabbath.blockedApps.map(app => '<span class="app-tag">' + app + '</span>').join('') + '</div>';
    list.appendChild(item);
    document.getElementById('sabbathApps').value = '';
    alert('Digital Sabbath scheduled successfully!');
}

function saveJournalEntry() {
    const text = document.getElementById('journalText').value.trim();
    
    if (!text) {
        alert('Please write something before saving.');
        return;
    }
    
    const entry = {
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        content: text
    };
    
    console.log('Journal entry saved:', entry);
    
    const container = document.getElementById('journalEntries');
    const entryDiv = document.createElement('div');
    entryDiv.className = 'journal-entry';
    entryDiv.innerHTML = '<div class="journal-meta">' + entry.date + ' at ' + entry.time + '</div><div class="journal-content">' + entry.content + '</div>';
    container.insertBefore(entryDiv, container.firstChild);
    document.getElementById('journalText').value = '';
    updateHomeStats();
    alert('Journal entry saved!');
}

function savePromptedApps() {
    const apps = document.getElementById('promptedApps').value;
    console.log('Prompted apps saved:', apps);
    alert('Configuration saved!');
}

function showUnlockPrompt(appName) {
    alert('Unlock prompt would appear for: ' + appName);
}

function closeUnlockPrompt(proceeded) {
    console.log(proceeded ? 'User proceeded after reflection' : 'User chose mindful cancellation');
}

function exportFocusSessions() {
    const csv = 'Date,Time,Intention,Duration (min),Completed\n2025-11-06,10:30 AM,Deep work on research proposal,25,Yes\n2025-11-06,11:00 AM,Deep work on research proposal,25,Yes\n2025-11-06,2:15 PM,Reading philosophy texts,25,Yes\n';
    downloadCSV(csv, 'monastery-focus-sessions.csv');
}

function exportScreenTime() {
    const csv = 'Date,App/Category,Minutes,Type\n2025-11-06,Work Apps,180,Productive\n2025-11-06,Social Media,45,Social\n2025-11-06,Reading,60,Productive\n2025-11-05,Work Apps,210,Productive\n2025-11-05,Social Media,38,Social\n';
    downloadCSV(csv, 'monastery-screen-time.csv');
}

function exportJournal() {
    const entries = document.querySelectorAll('#journalEntries .journal-entry');
    let text = 'MONASTERY JOURNAL EXPORT\n===================\n\n';
    
    entries.forEach(entry => {
        const meta = entry.querySelector('.journal-meta').textContent;
        const content = entry.querySelector('.journal-content').textContent;
        text += meta + '\n' + content + '\n\n---\n\n';
    });
    
    downloadText(text, 'monastery-journal.txt');
}

function exportSabbaths() {
    const csv = 'Day,Start Time,End Time,Blocked Apps,Recurring\nSaturday,08:00,20:00,"Social Media; Email; News Sites",Yes\n';
    downloadCSV(csv, 'monastery-sabbaths.csv');
}

function exportAllData() {
    exportFocusSessions();
    setTimeout(() => exportScreenTime(), 500);
    setTimeout(() => exportJournal(), 1000);
    setTimeout(() => exportSabbaths(), 1500);
    alert('All data exported! Check your downloads folder.');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadText(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all local archive data? This cannot be undone.')) {
        if (confirm('This will permanently delete all forum posts, documents, and mentorship records. Continue?')) {
            console.log('All archive data cleared');
            alert('All local archive data has been cleared.');
        }
    }
}

function performSearch() {
    const query = document.getElementById('searchQuery').value;
    const type = document.getElementById('searchType').value;
    const category = document.getElementById('searchCategory').value;
    const dateRange = document.getElementById('searchDate').value;
    
    if (!query || query.trim().length === 0) {
        alert('Please enter a search query.');
        return;
    }
    
    const resultsSection = document.getElementById('searchResults');
    resultsSection.style.display = 'block';
    
    console.log('Search executed:', {
        query: query,
        type: type,
        category: category,
        dateRange: dateRange
    });
    
    alert('Search executed for: "' + query + '"\n\nFilters: ' + type + ', ' + category + ', ' + dateRange + '\n\nResults displayed chronologically (most recent first). No algorithmic ranking.');
}

function initializeEventHandlers() {
    const threadItems = document.querySelectorAll('.thread-item');
    threadItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.thread-title').textContent;
            openThread(title);
        });
    });
    
    const docCards = document.querySelectorAll('.document-card');
    docCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('button')) {
                const title = this.querySelector('.document-title').textContent;
                alert('Document Details: ' + title + '\n\nIn full implementation, this would show full metadata, preview, and download options.');
            }
        });
    });
    
    const mentorshipItems = document.querySelectorAll('.mentorship-item');
    mentorshipItems.forEach(item => {
        item.addEventListener('click', function() {
            const subject = this.querySelector('.thread-title').textContent;
            openMentorshipChannel(subject);
        });
    });
}

const originalShowView = showView;
showView = function(viewId) {
    originalShowView(viewId);
    setTimeout(initializeEventHandlers, 100);
};

function updateHomeStats() {
    if (document.getElementById('todayFocusTime')) {
        document.getElementById('todayFocusTime').textContent = '127';
    }
    if (document.getElementById('todaySessions')) {
        document.getElementById('todaySessions').textContent = '43';
    }
    if (document.getElementById('journalEntries')) {
        document.getElementById('journalEntries').textContent = '8';
    }
    if (document.getElementById('nextSabbath')) {
        document.getElementById('nextSabbath').textContent = '24/7';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTesseractOnLoad();
    console.log('MONASTERY initialized - Knowledge preservation protocol active');
    console.log('No algorithmic feeds. No engagement metrics. No private messaging.');
    console.log('Chronological order. Archival standards. Civilizational continuity.');
    updateHomeStats();
    initializeEventHandlers();
    
    const searchQuery = document.getElementById('searchQuery');
    if (searchQuery) {
        searchQuery.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});

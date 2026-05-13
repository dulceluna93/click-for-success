// ============ 状态管理 ============
const state = {
    taskName: '',
    taskSteps: 0,
    currentSteps: 0,
    forwardTimer: {
        running: false,
        seconds: 0,
        interval: null
    },
    countdownTimer: {
        running: false,
        totalSeconds: 0,
        remainingSeconds: 0,
        interval: null
    },
    history: [],
    taskStartTime: null
};

// ============ DOM 元素 ============
const elements = {
    // 主屏幕
    mainScreen: document.getElementById('mainScreen'),
    historyScreen: document.getElementById('historyScreen'),
    
    // 输入
    taskNameInput: document.getElementById('taskName'),
    taskStepsInput: document.getElementById('taskSteps'),
    startBtn: document.getElementById('startBtn'),
    
    // 任务显示
    taskDisplay: document.getElementById('taskDisplay'),
    currentTaskName: document.getElementById('currentTaskName'),
    
    // 进度
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    
    // 正向计时器
    forwardTimer: document.getElementById('forwardTimer'),
    forwardDisplay: document.getElementById('forwardDisplay'),
    startTimerBtn: document.getElementById('startTimerBtn'),
    pauseTimerBtn: document.getElementById('pauseTimerBtn'),
    resetTimerBtn: document.getElementById('resetTimerBtn'),
    
    // 倒计时器
    countdownTimer: document.getElementById('countdownTimer'),
    minutesInput: document.getElementById('minutes'),
    secondsInput: document.getElementById('seconds'),
    countdownDisplay: document.getElementById('countdownDisplay'),
    startCountdownBtn: document.getElementById('startCountdownBtn'),
    pauseCountdownBtn: document.getElementById('pauseCountdownBtn'),
    resetCountdownBtn: document.getElementById('resetCountdownBtn'),
    
    // 计时器模式
    timerModeRadios: document.querySelectorAll('input[name="timerMode"]'),
    
    // 完成按钮
    completeBtn: document.getElementById('completeBtn'),
    
    // 庆祝选择
    celebrationRadios: document.querySelectorAll('input[name="celebration"]'),
    
    // 操作按钮
    historyBtn: document.getElementById('historyBtn'),
    resetTaskBtn: document.getElementById('resetTaskBtn'),
    
    // 历史记录
    historyList: document.getElementById('historyList'),
    backBtn: document.getElementById('backBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    
    // 庆祝容器
    celebrationContainer: document.getElementById('celebrationContainer')
};

// ============ 初始化 ============
function init() {
    loadHistory();
    
    // 事件监听
    elements.startBtn.addEventListener('click', startTask);
    elements.completeBtn.addEventListener('click', completeStep);
    elements.resetTaskBtn.addEventListener('click', resetTask);
    
    // 正向计时器
    elements.startTimerBtn.addEventListener('click', () => startForwardTimer());
    elements.pauseTimerBtn.addEventListener('click', () => pauseForwardTimer());
    elements.resetTimerBtn.addEventListener('click', () => resetForwardTimer());
    
    // 倒计时器
    elements.startCountdownBtn.addEventListener('click', () => startCountdownTimer());
    elements.pauseCountdownBtn.addEventListener('click', () => pauseCountdownTimer());
    elements.resetCountdownBtn.addEventListener('click', () => resetCountdownTimer());
    
    // 计时器模式切换
    elements.timerModeRadios.forEach(radio => {
        radio.addEventListener('change', switchTimerMode);
    });
    
    // 历史记录
    elements.historyBtn.addEventListener('click', showHistory);
    elements.backBtn.addEventListener('click', backToMain);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
}

// ============ 任务管理 ============
function startTask() {
    const taskName = elements.taskNameInput.value.trim();
    const taskSteps = parseInt(elements.taskStepsInput.value);
    
    if (!taskName) {
        alert('请输入任务名称');
        return;
    }
    
    if (taskSteps <= 0) {
        alert('请输入正确的分步数量');
        return;
    }
    
    state.taskName = taskName;
    state.taskSteps = taskSteps;
    state.currentSteps = 0;
    state.taskStartTime = new Date();
    
    elements.currentTaskName.textContent = taskName;
    updateProgress();
    
    elements.taskNameInput.value = '';
    elements.taskStepsInput.value = '10';
    
    elements.mainScreen.classList.add('hidden');
    elements.taskDisplay.classList.remove('hidden');
    
    resetForwardTimer();
    resetCountdownTimer();
}

function completeStep() {
    if (state.currentSteps >= state.taskSteps) {
        alert('任务已全部完成！');
        return;
    }
    
    state.currentSteps++;
    updateProgress();
    
    // 触发庆祝动画
    const celebrationType = document.querySelector('input[name="celebration"]:checked').value;
    triggerCelebration(celebrationType);
    
    // 如果完成所有步骤
    if (state.currentSteps === state.taskSteps) {
        setTimeout(() => {
            alert('🎉 恭喜！任务已完成！');
            saveToHistory();
            resetTask();
        }, 800);
    }
}

function updateProgress() {
    const percentage = (state.currentSteps / state.taskSteps) * 100;
    elements.progressFill.style.width = percentage + '%';
    elements.progressText.textContent = `${state.currentSteps}/${state.taskSteps}`;
}

function resetTask() {
    pauseForwardTimer();
    pauseCountdownTimer();
    
    elements.taskDisplay.classList.add('hidden');
    elements.mainScreen.classList.remove('hidden');
    
    state.taskName = '';
    state.taskSteps = 0;
    state.currentSteps = 0;
}

// ============ 正向计时器 ============
function startForwardTimer() {
    if (state.forwardTimer.running) return;
    
    state.forwardTimer.running = true;
    elements.startTimerBtn.disabled = true;
    elements.pauseTimerBtn.disabled = false;
    
    state.forwardTimer.interval = setInterval(() => {
        state.forwardTimer.seconds++;
        updateForwardDisplay();
    }, 1000);
}

function pauseForwardTimer() {
    state.forwardTimer.running = false;
    elements.startTimerBtn.disabled = false;
    elements.pauseTimerBtn.disabled = true;
    
    if (state.forwardTimer.interval) {
        clearInterval(state.forwardTimer.interval);
        state.forwardTimer.interval = null;
    }
}

function resetForwardTimer() {
    pauseForwardTimer();
    state.forwardTimer.seconds = 0;
    updateForwardDisplay();
    elements.startTimerBtn.disabled = false;
    elements.pauseTimerBtn.disabled = true;
}

function updateForwardDisplay() {
    const minutes = Math.floor(state.forwardTimer.seconds / 60);
    const seconds = state.forwardTimer.seconds % 60;
    elements.forwardDisplay.textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ============ 倒计时器 ============
function startCountdownTimer() {
    if (state.countdownTimer.running) return;
    
    if (state.countdownTimer.totalSeconds === 0) {
        const minutes = parseInt(elements.minutesInput.value) || 0;
        const seconds = parseInt(elements.secondsInput.value) || 0;
        state.countdownTimer.totalSeconds = minutes * 60 + seconds;
        state.countdownTimer.remainingSeconds = state.countdownTimer.totalSeconds;
    }
    
    if (state.countdownTimer.remainingSeconds <= 0) {
        alert('请设置倒计时时间');
        return;
    }
    
    state.countdownTimer.running = true;
    elements.startCountdownBtn.disabled = true;
    elements.pauseCountdownBtn.disabled = false;
    
    state.countdownTimer.interval = setInterval(() => {
        state.countdownTimer.remainingSeconds--;
        updateCountdownDisplay();
        
        if (state.countdownTimer.remainingSeconds <= 0) {
            pauseCountdownTimer();
            alert('⏰ 时间到！');
            triggerCelebration('fireworks');
        }
    }, 1000);
}

function pauseCountdownTimer() {
    state.countdownTimer.running = false;
    elements.startCountdownBtn.disabled = false;
    elements.pauseCountdownBtn.disabled = true;
    
    if (state.countdownTimer.interval) {
        clearInterval(state.countdownTimer.interval);
        state.countdownTimer.interval = null;
    }
}

function resetCountdownTimer() {
    pauseCountdownTimer();
    state.countdownTimer.totalSeconds = 0;
    state.countdownTimer.remainingSeconds = 0;
    updateCountdownDisplay();
    elements.startCountdownBtn.disabled = false;
    elements.pauseCountdownBtn.disabled = true;
}

function updateCountdownDisplay() {
    const minutes = Math.floor(state.countdownTimer.remainingSeconds / 60);
    const seconds = state.countdownTimer.remainingSeconds % 60;
    elements.countdownDisplay.textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ============ 计时器模式切换 ============
function switchTimerMode() {
    const mode = document.querySelector('input[name="timerMode"]:checked').value;
    
    pauseForwardTimer();
    pauseCountdownTimer();
    
    if (mode === 'forward') {
        elements.forwardTimer.classList.remove('hidden');
        elements.countdownTimer.classList.add('hidden');
    } else {
        elements.forwardTimer.classList.add('hidden');
        elements.countdownTimer.classList.remove('hidden');
    }
}

// ============ 庆祝动画 ============
function triggerCelebration(type) {
    switch(type) {
        case 'fireworks':
            createFireworks();
            break;
        case 'balloons':
            createBalloons();
            break;
        case 'confetti':
            createConfetti();
            break;
    }
}

function createFireworks() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    const container = elements.celebrationContainer;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = '50%';
        particle.style.left = window.innerWidth / 2 + 'px';
        particle.style.top = window.innerHeight / 2 + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.boxShadow = '0 0 10px currentColor';
        
        container.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / 30;
        const velocity = 5 + Math.random() * 5;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        let life = 1;
        
        const animate = () => {
            x += vx;
            y += vy;
            life -= 0.02;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.opacity = life;
            
            if (life > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        animate();
    }
}

function createBalloons() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFE66D', '#95E1D3'];
    const container = elements.celebrationContainer;
    
    for (let i = 0; i < 10; i++) {
        const balloon = document.createElement('div');
        balloon.style.position = 'fixed';
        balloon.style.width = '30px';
        balloon.style.height = '40px';
        balloon.style.background = colors[Math.floor(Math.random() * colors.length)];
        balloon.style.borderRadius = '50% 50% 50% 0';
        balloon.style.left = Math.random() * window.innerWidth + 'px';
        balloon.style.bottom = '-50px';
        balloon.style.pointerEvents = 'none';
        balloon.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
        balloon.style.transform = 'rotate(' + Math.random() * 30 + 'deg)';
        
        container.appendChild(balloon);
        
        let y = -50;
        const speed = 1 + Math.random() * 2;
        const drift = (Math.random() - 0.5) * 2;
        let x = parseFloat(balloon.style.left);
        let life = 1;
        
        const animate = () => {
            y += speed;
            x += drift;
            life -= 0.008;
            
            balloon.style.bottom = y + 'px';
            balloon.style.left = x + 'px';
            balloon.style.opacity = life;
            
            if (y < window.innerHeight && life > 0) {
                requestAnimationFrame(animate);
            } else {
                balloon.remove();
            }
        };
        
        animate();
    }
}

function createConfetti() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFE66D', '#95E1D3', '#FF9FF3'];
    const container = elements.celebrationContainer;
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = Math.random() * 5 + 5 + 'px';
        confetti.style.height = Math.random() * 5 + 5 + 'px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.pointerEvents = 'none';
        confetti.style.opacity = '1';
        
        container.appendChild(confetti);
        
        let y = 0;
        const vx = (Math.random() - 0.5) * 8;
        const vy = Math.random() * 3 + 2;
        let x = parseFloat(confetti.style.left);
        let rotation = Math.random() * 360;
        let life = 1;
        
        const animate = () => {
            y += vy;
            x += vx;
            rotation += 10;
            life -= 0.015;
            
            confetti.style.top = y + 'px';
            confetti.style.left = x + 'px';
            confetti.style.transform = 'rotate(' + rotation + 'deg)';
            confetti.style.opacity = life;
            
            if (y < window.innerHeight && life > 0) {
                requestAnimationFrame(animate);
            } else {
                confetti.remove();
            }
        };
        
        animate();
    }
}

// ============ 历史记录 ============
function saveToHistory() {
    const endTime = new Date();
    const duration = Math.floor((endTime - state.taskStartTime) / 1000);
    const durationStr = formatDuration(duration);
    const forwardTime = state.forwardTimer.seconds;
    const forwardTimeStr = formatDuration(forwardTime);
    
    const historyItem = {
        id: Date.now(),
        taskName: state.taskName,
        taskSteps: state.taskSteps,
        completedAt: endTime.toLocaleString('zh-CN'),
        duration: durationStr,
        forwardTime: forwardTimeStr
    };
    
    state.history.unshift(historyItem);
    saveHistory();
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let result = '';
    if (hours > 0) result += hours + '小时';
    if (minutes > 0) result += minutes + '分钟';
    if (secs > 0) result += secs + '秒';
    
    return result || '0秒';
}

function showHistory() {
    elements.historyList.innerHTML = '';
    
    if (state.history.length === 0) {
        elements.historyList.innerHTML = '<p style="text-align: center; color: #999;">暂无历史记录</p>';
    } else {
        state.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-item-title">${item.taskName}</div>
                <div class="history-item-info">
                    <span>✓ 完成: ${item.taskSteps}步</span>
                    <span>⏱ 耗时: ${item.duration}</span>
                    <span>🕐 计时: ${item.forwardTime}</span>
                </div>
                <div class="history-item-info">
                    <span>📅 完成于: ${item.completedAt}</span>
                </div>
            `;
            elements.historyList.appendChild(historyItem);
        });
    }
    
    elements.mainScreen.classList.add('hidden');
    elements.taskDisplay.classList.add('hidden');
    elements.historyScreen.classList.remove('hidden');
}

function backToMain() {
    elements.historyScreen.classList.add('hidden');
    elements.mainScreen.classList.remove('hidden');
}

function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        state.history = [];
        saveHistory();
        showHistory();
    }
}

function saveHistory() {
    localStorage.setItem('taskHistory', JSON.stringify(state.history));
}

function loadHistory() {
    const saved = localStorage.getItem('taskHistory');
    if (saved) {
        try {
            state.history = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }
}

// ============ 启动应用 ============
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
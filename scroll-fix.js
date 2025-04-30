// 創建一個新文件 smooth-scroll.js 並添加以下代碼

document.addEventListener('DOMContentLoaded', () => {
    // 獲取關鍵元素
    const scrollableArea = document.querySelector('.scrollable-area');
    const songList = document.querySelector('.song-list');

    // 更嚴格確保 CSS 中的滾動行為設置
    scrollableArea.style.scrollBehavior = 'smooth';
    
    // 配置參數 - 專注於平滑滾動
    const SCROLL_CONFIG = {
        scrollSpeed: 0.5,         // 減慢滾動速度（關鍵：值越小，滾動越平滑）
        scrollPauseTime: 2000,    // 頂部和底部暫停時間（毫秒）
        scrollInterval: 16,       // 每幀滾動間隔（設為 16ms 大約是 60fps）
        useRAF: true,             // 使用 requestAnimationFrame 而不是 setInterval
        easing: true,             // 使用緩動函數讓滾動更自然
        extraSpace: 50            // 額外緩衝空間
    };
    
    // 滾動狀態
    const SCROLL_STATE = {
        scrollDirection: 1,      // 1 = 向下, -1 = 向上
        scrollPosition: 0,       // 當前滾動位置
        scrollIntervalId: null,  // 滾動計時器 ID
        rafId: null,             // requestAnimationFrame ID
        isPaused: false,         // 是否暫停滾動
        lastTimestamp: 0,        // 上一幀的時間戳
        smoothFactor: 0.05       // 平滑因子（用於緩動）
    };
    
    // 緩動函數 - 創造平滑的動畫效果
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    // 使用 requestAnimationFrame 的滾動動畫
    function animateScroll(timestamp) {
        if (SCROLL_STATE.isPaused) {
            SCROLL_STATE.rafId = requestAnimationFrame(animateScroll);
            return;
        }
        
        // 計算時間差和滾動步進
        const elapsed = timestamp - SCROLL_STATE.lastTimestamp;
        if (elapsed < 16) { // 限制最大幀率以確保平滑
            SCROLL_STATE.rafId = requestAnimationFrame(animateScroll);
            return;
        }
        
        SCROLL_STATE.lastTimestamp = timestamp;
        
        // 計算滾動範圍
        const scrollHeight = songList.scrollHeight + SCROLL_CONFIG.extraSpace;
        const viewHeight = scrollableArea.clientHeight;
        const maxScroll = Math.max(0, scrollHeight - viewHeight);
        
        // 計算目標位置
        let targetPosition = SCROLL_STATE.scrollPosition + 
            (SCROLL_STATE.scrollDirection * SCROLL_CONFIG.scrollSpeed * (elapsed / 16));
        
        // 應用緩動效果 - 使滾動看起來更自然
        if (SCROLL_CONFIG.easing) {
            // 根據當前位置在滾動範圍中的比例應用不同強度的緩動
            const scrollRatio = SCROLL_STATE.scrollPosition / maxScroll;
            const easedStep = easeInOutQuad(scrollRatio) * SCROLL_CONFIG.scrollSpeed * (elapsed / 16);
            
            if (SCROLL_STATE.scrollDirection > 0) {
                // 向下滾動時，隨著靠近底部速度變慢
                targetPosition = SCROLL_STATE.scrollPosition + (1 - scrollRatio * 0.5) * SCROLL_CONFIG.scrollSpeed * (elapsed / 16);
            } else {
                // 向上滾動時，隨著靠近頂部速度變慢
                targetPosition = SCROLL_STATE.scrollPosition + SCROLL_STATE.scrollDirection * (1 - (1-scrollRatio) * 0.5) * SCROLL_CONFIG.scrollSpeed * (elapsed / 16);
            }
        }
        
        // 平滑過渡到目標位置
        SCROLL_STATE.scrollPosition += (targetPosition - SCROLL_STATE.scrollPosition) * SCROLL_STATE.smoothFactor * (elapsed / 16);
        
        // 檢查邊界條件
        if (SCROLL_STATE.scrollPosition >= maxScroll) {
            // 到達底部，暫停後向上滾動
            if (!SCROLL_STATE.isPaused) {
                SCROLL_STATE.isPaused = true;
                SCROLL_STATE.scrollPosition = maxScroll;
                
                console.log("到達底部，暫停滾動");
                
                setTimeout(() => {
                    SCROLL_STATE.scrollDirection = -1;
                    SCROLL_STATE.isPaused = false;
                    console.log("開始向上滾動");
                }, SCROLL_CONFIG.scrollPauseTime);
            }
        } else if (SCROLL_STATE.scrollPosition <= 0) {
            // 到達頂部，暫停後向下滾動
            if (!SCROLL_STATE.isPaused) {
                SCROLL_STATE.isPaused = true;
                SCROLL_STATE.scrollPosition = 0;
                
                console.log("到達頂部，暫停滾動");
                
                setTimeout(() => {
                    SCROLL_STATE.scrollDirection = 1;
                    SCROLL_STATE.isPaused = false;
                    console.log("開始向下滾動");
                }, SCROLL_CONFIG.scrollPauseTime);
            }
        }
        
        // 應用滾動位置 - 使用小數點滾動以獲得更平滑的效果
        scrollableArea.scrollTop = SCROLL_STATE.scrollPosition;
        
        // 繼續動畫循環
        SCROLL_STATE.rafId = requestAnimationFrame(animateScroll);
    }
    
    // 使用傳統的 setInterval 滾動（備用方法）
    function intervalScroll() {
        if (SCROLL_STATE.isPaused) return;
        
        // 計算滾動範圍
        const scrollHeight = songList.scrollHeight + SCROLL_CONFIG.extraSpace;
        const viewHeight = scrollableArea.clientHeight;
        const maxScroll = Math.max(0, scrollHeight - viewHeight);
        
        // 計算目標位置，使用非常小的增量以確保平滑
        let targetPosition = SCROLL_STATE.scrollPosition + (SCROLL_STATE.scrollDirection * SCROLL_CONFIG.scrollSpeed);
        
        // 平滑過渡到目標位置
        SCROLL_STATE.scrollPosition += (targetPosition - SCROLL_STATE.scrollPosition) * SCROLL_STATE.smoothFactor;
        
        // 檢查邊界條件
        if (SCROLL_STATE.scrollPosition >= maxScroll) {
            // 到達底部，暫停後向上滾動
            if (!SCROLL_STATE.isPaused) {
                SCROLL_STATE.isPaused = true;
                SCROLL_STATE.scrollPosition = maxScroll;
                
                console.log("到達底部，暫停滾動");
                
                setTimeout(() => {
                    SCROLL_STATE.scrollDirection = -1;
                    SCROLL_STATE.isPaused = false;
                    console.log("開始向上滾動");
                }, SCROLL_CONFIG.scrollPauseTime);
            }
        } else if (SCROLL_STATE.scrollPosition <= 0) {
            // 到達頂部，暫停後向下滾動
            if (!SCROLL_STATE.isPaused) {
                SCROLL_STATE.isPaused = true;
                SCROLL_STATE.scrollPosition = 0;
                
                console.log("到達頂部，暫停滾動");
                
                setTimeout(() => {
                    SCROLL_STATE.scrollDirection = 1;
                    SCROLL_STATE.isPaused = false;
                    console.log("開始向下滾動");
                }, SCROLL_CONFIG.scrollPauseTime);
            }
        }
        
        // 應用滾動位置
        scrollableArea.scrollTop = SCROLL_STATE.scrollPosition;
    }
    
    // 啟動滾動動畫
    function startSmoothScroll() {
        // 停止可能存在的動畫
        stopSmoothScroll();
        
        // 重置滾動狀態
        SCROLL_STATE.scrollPosition = 0;
        SCROLL_STATE.scrollDirection = 1;
        SCROLL_STATE.isPaused = false;
        SCROLL_STATE.lastTimestamp = performance.now();
        scrollableArea.scrollTop = 0;
        
        console.log("啟動平滑滾動動畫");
        
        // 根據配置選擇滾動方法
        if (SCROLL_CONFIG.useRAF) {
            // 使用 requestAnimationFrame 進行平滑動畫
            SCROLL_STATE.rafId = requestAnimationFrame(animateScroll);
            console.log("使用 requestAnimationFrame 進行滾動");
        } else {
            // 使用 setInterval 作為備選方案
            SCROLL_STATE.scrollIntervalId = setInterval(intervalScroll, SCROLL_CONFIG.scrollInterval);
            console.log("使用 setInterval 進行滾動");
        }
    }
    
    // 停止滾動動畫
    function stopSmoothScroll() {
        // 清理 requestAnimationFrame
        if (SCROLL_STATE.rafId) {
            cancelAnimationFrame(SCROLL_STATE.rafId);
            SCROLL_STATE.rafId = null;
        }
        
        // 清理 setInterval
        if (SCROLL_STATE.scrollIntervalId) {
            clearInterval(SCROLL_STATE.scrollIntervalId);
            SCROLL_STATE.scrollIntervalId = null;
        }
        
        console.log("停止滾動動畫");
    }
    
    // 嘗試兩種滾動方法
    function trySmoothScroll() {
        // 首先嘗試使用 requestAnimationFrame
        SCROLL_CONFIG.useRAF = true;
        startSmoothScroll();
        
        // 如果5秒後沒有看到滾動效果，切換到 setInterval
        setTimeout(() => {
            if (!scrollableArea.scrollTop > 0) {
                console.log("requestAnimationFrame 可能不工作，切換到 setInterval");
                SCROLL_CONFIG.useRAF = false;
                startSmoothScroll();
            }
        }, 5000);
    }
    
    // 自動調整滾動參數以適應不同的設備和環境
    function optimizeScrollSettings() {
        // 檢測設備性能
        const start = performance.now();
        let iterations = 0;
        
        // 執行一個簡單的循環來測試設備性能
        while (performance.now() - start < 5) {
            iterations++;
        }
        
        // 根據性能調整滾動速度
        if (iterations < 1000) {
            // 低性能設備
            SCROLL_CONFIG.scrollSpeed = 0.3;
            SCROLL_STATE.smoothFactor = 0.03;
            console.log("檢測到低性能設備，調整滾動參數");
        } else if (iterations < 10000) {
            // 中等性能設備
            SCROLL_CONFIG.scrollSpeed = 0.5;
            SCROLL_STATE.smoothFactor = 0.05;
            console.log("檢測到中等性能設備，使用預設滾動參數");
        } else {
            // 高性能設備
            SCROLL_CONFIG.scrollSpeed = 0.7;
            SCROLL_STATE.smoothFactor = 0.08;
            console.log("檢測到高性能設備，優化滾動參數");
        }
    }
    
    // 提供全局訪問方法（用於調試）
    window.smoothScroll = {
        start: startSmoothScroll,
        stop: stopSmoothScroll,
        setSpeed: (speed) => {
            SCROLL_CONFIG.scrollSpeed = speed;
            console.log(`滾動速度設置為: ${speed}`);
        },
        setSmoothness: (factor) => {
            SCROLL_STATE.smoothFactor = factor;
            console.log(`平滑因子設置為: ${factor}`);
        },
        toggleMethod: () => {
            SCROLL_CONFIG.useRAF = !SCROLL_CONFIG.useRAF;
            stopSmoothScroll();
            startSmoothScroll();
            console.log(`切換到 ${SCROLL_CONFIG.useRAF ? 'requestAnimationFrame' : 'setInterval'}`);
        },
        status: () => {
            return {
                active: SCROLL_STATE.rafId !== null || SCROLL_STATE.scrollIntervalId !== null,
                position: SCROLL_STATE.scrollPosition,
                direction: SCROLL_STATE.scrollDirection,
                paused: SCROLL_STATE.isPaused,
                method: SCROLL_CONFIG.useRAF ? 'requestAnimationFrame' : 'setInterval',
                speed: SCROLL_CONFIG.scrollSpeed,
                smoothFactor: SCROLL_STATE.smoothFactor
            };
        }
    };
    
    // 處理常見的 document state 問題
    function handleDocumentState() {
        // 當頁面不可見時暫停滾動以節省資源
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                SCROLL_STATE.isPaused = true;
            } else {
                // 頁面再次可見時恢復滾動
                setTimeout(() => {
                    SCROLL_STATE.isPaused = false;
                }, 1000);
            }
        });
        
        // 處理窗口大小變化
        window.addEventListener('resize', () => {
            // 短暫暫停滾動，然後恢復
            SCROLL_STATE.isPaused = true;
            setTimeout(() => {
                SCROLL_STATE.isPaused = false;
            }, 500);
        });
    }
    
    // 檢查是否需要強制 CSS 樣式
    function enforceSmoothScrolling() {
        // 添加一個確保平滑滾動的樣式標籤
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .scrollable-area {
                scroll-behavior: smooth !important;
                overflow-y: auto !important;
                transition: scrollTop 0.3s ease-out !important;
                will-change: scroll-position !important;
                -webkit-overflow-scrolling: touch !important;
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    // 初始化
    function init() {
        console.log("初始化平滑滾動修復");
        
        // 強制 CSS 平滑滾動
        enforceSmoothScrolling();
        
        // 檢測設備性能並優化設置
        optimizeScrollSettings();
        
        // 處理文檔狀態變化
        handleDocumentState();
        
        // 啟動滾動
        setTimeout(trySmoothScroll, 1000);
        
        // 添加調試按鈕
        if (window.location.search.includes('debug=1')) {
            const debugPanel = document.createElement('div');
            debugPanel.style.position = 'fixed';
            debugPanel.style.bottom = '10px';
            debugPanel.style.right = '10px';
            debugPanel.style.zIndex = '9999';
            debugPanel.style.background = 'rgba(0,0,0,0.7)';
            debugPanel.style.padding = '10px';
            debugPanel.style.borderRadius = '5px';
            debugPanel.style.color = 'white';
            
            // 創建控制按鈕
            const startBtn = document.createElement('button');
            startBtn.textContent = '啟動滾動';
            startBtn.onclick = startSmoothScroll;
            
            const stopBtn = document.createElement('button');
            stopBtn.textContent = '停止滾動';
            stopBtn.onclick = stopSmoothScroll;
            
            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = '切換方法';
            toggleBtn.onclick = window.smoothScroll.toggleMethod;
            
            // 添加按鈕樣式
            [startBtn, stopBtn, toggleBtn].forEach(btn => {
                btn.style.margin = '5px';
                btn.style.padding = '5px 10px';
                btn.style.background = '#d9775b';
                btn.style.color = 'white';
                btn.style.border = 'none';
                btn.style.borderRadius = '4px';
                debugPanel.appendChild(btn);
            });
            
            document.body.appendChild(debugPanel);
        }
    }
    
    // 執行初始化
    init();
});

// 將此代碼添加到您的 display.js 文件中，
// 或者創建一個新的 scroll-fix.js 並在 HTML 中引入它

document.addEventListener('DOMContentLoaded', () => {
    // 獲取關鍵元素
    const scrollableArea = document.querySelector('.scrollable-area');
    const songList = document.getElementById('songList');
    const sungSongsList = document.getElementById('sungSongsList');
    
    // 配置參數 - 簡化並確保滾動可以被觸發
    const SCROLL_CONFIG = {
        scrollSpeed: 0.8,         // 減慢滾動速度（更平滑）
        scrollPauseTime: 2000,    // 頂部和底部暫停時間（毫秒）
        scrollInterval: 30,       // 滾動更新頻率（毫秒）
        extraSpace: 50            // 額外緩衝空間
    };
    
    // 滾動狀態
    const SCROLL_STATE = {
        scrollDirection: 1,      // 1 = 向下, -1 = 向上
        scrollPosition: 0,       // 當前滾動位置
        scrollInterval: null,    // 滾動計時器
        isPaused: false,         // 是否暫停滾動
        forceScroll: false       // 強制啟用滾動標記
    };
    
    // 立即強制啟動滾動（無需等待條件檢查）
    function forceStartScroll() {
        console.log("強制啟動滾動");
        SCROLL_STATE.forceScroll = true;
        startScrollAnimation();
    }
    
    // 啟動滾動動畫 - 簡化版
    function startScrollAnimation() {
        // 防止重複啟動
        if (SCROLL_STATE.scrollInterval) {
            clearInterval(SCROLL_STATE.scrollInterval);
        }
        
        // 初始化滾動狀態
        SCROLL_STATE.scrollPosition = 0;
        SCROLL_STATE.scrollDirection = 1;
        SCROLL_STATE.isPaused = false;
        scrollableArea.scrollTop = 0;
        
        console.log("滾動動畫初始化完成");
        
        // 設置滾動間隔
        SCROLL_STATE.scrollInterval = setInterval(() => {
            if (SCROLL_STATE.isPaused) return;
            
            // 計算滾動範圍
            const scrollHeight = songList.scrollHeight + SCROLL_CONFIG.extraSpace;
            const viewHeight = scrollableArea.clientHeight;
            const maxScroll = Math.max(0, scrollHeight - viewHeight);
            
            // 內容不足以滾動時停止（除非強制滾動）
            if (maxScroll <= 10 && !SCROLL_STATE.forceScroll) {
                console.log("內容高度不足，停止滾動");
                return;
            }
            
            // 更新滾動位置
            SCROLL_STATE.scrollPosition += SCROLL_STATE.scrollDirection * SCROLL_CONFIG.scrollSpeed;
            
            // 檢查邊界
            if (SCROLL_STATE.scrollPosition >= maxScroll) {
                // 到達底部
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
                // 到達頂部
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
        }, SCROLL_CONFIG.scrollInterval);
        
        console.log("滾動間隔器已設置");
    }
    
    // 確保有足夠的測試數據以觸發滾動
    function ensureTestData() {
        // 檢查是否有歌曲數據
        if (sungSongsList.children.length < 3) {
            console.log("歌曲數量不足，添加測試數據");
            
            // 如果沒有足夠的歌曲，添加一些測試數據
            if (!localStorage.getItem('sungSongs') || localStorage.getItem('sungSongs').trim() === '') {
                const testSongs = '測試歌曲1\n測試歌曲2\n//特殊格式歌曲\n測試歌曲3\n測試歌曲4\n測試歌曲5';
                localStorage.setItem('sungSongs', testSongs);
                console.log("已添加測試歌曲數據");
                
                // 更新歌單（如果需要）
                if (typeof updateSongList === 'function') {
                    updateSongList(testSongs);
                    console.log("已更新歌單顯示");
                }
            }
        }
        
        // 檢查是否有現正演唱歌曲
        if (!localStorage.getItem('currentSong') || localStorage.getItem('currentSong').trim() === '') {
            localStorage.setItem('currentSong', '現正演唱: 測試中');
            console.log("已添加測試現正演唱歌曲");
            
            // 更新現正演唱歌曲（如果需要）
            if (typeof updateCurrentSong === 'function') {
                updateCurrentSong('現正演唱: 測試中');
                console.log("已更新現正演唱歌曲顯示");
            }
        }
        
        // 延遲啟動滾動，確保DOM已更新
        setTimeout(checkAndStartScroll, 1000);
    }
    
    // 檢查並啟動滾動
    function checkAndStartScroll() {
        // 檢查歌曲數量
        const songCount = sungSongsList.querySelectorAll('li').length;
        console.log(`檢測到 ${songCount} 首歌曲`);
        
        // 只要有歌曲就啟動滾動
        if (songCount > 0) {
            console.log("檢測到歌曲，啟動滾動");
            forceStartScroll();
        } else {
            console.log("沒有檢測到歌曲，不啟動滾動");
        }
    }
    
    // 提供全局訪問方法（用於調試）
    window.debugScroll = {
        start: forceStartScroll,
        stop: () => {
            if (SCROLL_STATE.scrollInterval) {
                clearInterval(SCROLL_STATE.scrollInterval);
                SCROLL_STATE.scrollInterval = null;
            }
        },
        status: () => {
            return {
                active: SCROLL_STATE.scrollInterval !== null,
                position: SCROLL_STATE.scrollPosition,
                direction: SCROLL_STATE.scrollDirection,
                paused: SCROLL_STATE.isPaused,
                maxScroll: songList.scrollHeight - scrollableArea.clientHeight
            };
        }
    };
    
    // 初始化
    console.log("滾動修復初始化");
    ensureTestData();
    
    // 添加按鈕以手動啟動滾動（可選）
    if (window.location.search.includes('debug=1')) {
        const debugBtn = document.createElement('button');
        debugBtn.textContent = '強制啟動滾動';
        debugBtn.style.position = 'fixed';
        debugBtn.style.bottom = '10px';
        debugBtn.style.right = '10px';
        debugBtn.style.zIndex = '9999';
        debugBtn.style.padding = '5px 10px';
        debugBtn.style.background = '#d9775b';
        debugBtn.style.color = 'white';
        debugBtn.style.border = 'none';
        debugBtn.style.borderRadius = '4px';
        debugBtn.onclick = forceStartScroll;
        document.body.appendChild(debugBtn);
    }
});
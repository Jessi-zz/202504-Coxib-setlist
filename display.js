document.addEventListener('DOMContentLoaded', () => {
    const sungSongsList = document.getElementById('sungSongsList');
    const scrollableArea = document.querySelector('.scrollable-area');
    const currentSong = document.getElementById('currentSong');
    const songList = document.querySelector('.song-list');
    const listFrame = document.querySelector('.list-frame');
    const listFrameDecoration = document.querySelector('.list-frame-decoration'); 

    const CONFIG = {
        scrollSpeed: 0.5,       // 滾動速度
        scrollPauseTime: 2000,  // 暫停時間
        updateInterval: 500,    // 檢查更新間隔
        scrollInterval: 16,     // 滾動更新頻率
        currentSongDefaultHeight: 86, // 現正演唱歌曲高度
        extraSpaceBuffer: 30,   // 額外緩衝空間
        scrollVisibilityOffset: 180,  // 檢查歌曲可見性的偏移量
        safetyMargin: 80,       // 安全邊距
        naturalModeBottomPadding: 40, // 自然模式下的底部內縮空間
        extraScrollSpace: 20, 
        bottomScrollBuffer: 5,
        onlyCurrentSongTopMargin: 40,
        easeInOutFactor: 0.05 
    };

    const STATE = {
        scrollDirection: 1,     // 1 = 向下滾動, -1 = 向上滾動
        scrollPosition: 0,      // 當前滾動位置
        targetScrollPosition: 0, // 目標滾動位置
        scrollInterval: null,   // 滾動的計時器
        isPaused: false,        // 是否暫停滾動
        lastSungSongs: '',      // 歌單
        lastCurrentSong: '',    // 現正演唱歌曲
        displayMode: 'natural', // 'natural'  'fixed'  'empty'  'only-current'
        resizeTimeout: null, 
        lastScrollTime: 0, 
        animationFrameId: null 
    };
    
    function updateDisplay() {
        const sungSongs = localStorage.getItem('sungSongs') || '';
        const currentSongText = localStorage.getItem('currentSong') || '';
        if (sungSongs !== STATE.lastSungSongs || currentSongText !== STATE.lastCurrentSong) {
            STATE.lastSungSongs = sungSongs;
            STATE.lastCurrentSong = currentSongText;
            updateSongList(sungSongs);
            updateCurrentSong(currentSongText);
            setTimeout(() => {
                adjustDisplayMode();
                updateDecorationPosition();
            }, 50);
        }
    }
    function updateSongList(sungSongs) {
        sungSongsList.innerHTML = '';
        const allSongs = sungSongs.split('\n').filter(song => song.trim() !== '');
        
        let counter = 1;
        allSongs.forEach((song) => {
            const li = document.createElement('li');
            const numberSpan = document.createElement('span');
            const textSpan = document.createElement('span');

            numberSpan.classList.add('song-number');
            textSpan.classList.add('song-text');

            if (song.startsWith('//')) {
                li.classList.add('special-format');
                numberSpan.textContent = '';
                textSpan.innerHTML = insertZeroWidthSpace(song.substring(2).trim());
            } else {
                numberSpan.textContent = counter;
                textSpan.innerHTML = insertZeroWidthSpace(song.trim());
                counter++;
            }

            li.appendChild(numberSpan);
            li.appendChild(textSpan);
            sungSongsList.appendChild(li);
        });
    }
    
    function updateCurrentSong(currentSongText) {
        const ecgContainer = document.getElementById('ecgContainer');
        console.log('更新現正演唱歌曲:', currentSongText);
        console.log('ECG 容器元素:', ecgContainer);
        
        if (currentSongText.trim() !== '') {
            currentSong.innerHTML = `
                <span class="song-number"></span>
                <span class="song-text">${insertZeroWidthSpace(currentSongText.trim())}</span>
                <span class="now-singing"></span>
            `;
            currentSong.style.display = 'flex';
            if (ecgContainer) {
                ecgContainer.classList.add('ecg-visible');
                console.log('ECG 顯示狀態已設置為可見');
            }
        } else {
            currentSong.style.display = 'none';
            if (ecgContainer) {
                ecgContainer.classList.remove('ecg-visible');
                console.log('ECG 顯示狀態已設置為隱藏');
            }
        }
        setTimeout(() => {
            if (ecgContainer && currentSongText.trim() !== '') {
                console.log('ECG 最終可見性狀態:', window.getComputedStyle(ecgContainer).display);
            }
            updateDecorationPosition();
        }, 100);
    }

    function insertZeroWidthSpace(text) {
        return text.split('').join('&#8203;');
    }

    function getCurrentSongHeight() {
        if (currentSong.style.display === 'none') {
            return 0;
        }
        const style = window.getComputedStyle(currentSong);
        const height = currentSong.offsetHeight;
        const marginTop = parseInt(style.marginTop, 10) || 0;
        const marginBottom = parseInt(style.marginBottom, 10) || 0;
        
        return height + marginTop + marginBottom;
    }
    function getMaxFrameHeight() {
        const style = window.getComputedStyle(listFrame);
        const maxHeightCss = style.maxHeight;
        
        if (maxHeightCss && maxHeightCss !== 'none') {
            if (maxHeightCss.includes('calc')) {
                return window.innerHeight - 200;
            } else {
                return parseInt(maxHeightCss, 10);
            }
        }
        return window.innerHeight - 200;
    }

    function updateDecorationPosition() {
        if (!listFrameDecoration || !listFrame) return;
        if (STATE.displayMode === 'only-current-mode') {
            listFrameDecoration.style.opacity = '0';
            listFrameDecoration.style.visibility = 'hidden';
        } else {
            listFrameDecoration.style.opacity = '1';
            listFrameDecoration.style.visibility = 'visible';
            const frameRect = listFrame.getBoundingClientRect();
            const parentRect = listFrame.parentElement.getBoundingClientRect();
            const relativeRight = frameRect.right - parentRect.left;
            const relativeBottom = frameRect.bottom - parentRect.top;
            listFrameDecoration.style.right = `${parentRect.right - frameRect.right - 40}px`;
            const bottomOffset = relativeBottom - 100;
            listFrameDecoration.style.top = `${bottomOffset}px`;
            listFrameDecoration.style.transform = 'translateY(0)';
            
            console.log('更新裝飾元素位置:', {
                frameRight: frameRect.right,
                frameBottom: frameRect.bottom,
                decorationRight: `${parentRect.right - frameRect.right - 20}px`,
                decorationTop: `${bottomOffset}px`
            });
        }
    }

    function adjustDisplayMode() {

        resetStyles();
        const hasSungSongs = sungSongsList.children.length > 0;
        const hasCurrentSong = currentSong.style.display !== 'none';
        

        if (hasCurrentSong && !hasSungSongs) {
            STATE.displayMode = 'only-current';
            setEmptyMode();
            return;
        }
        

        if (!hasCurrentSong && !hasSungSongs) {
            STATE.displayMode = 'empty';
            setOnlyCurrentSongMode();
            return;
        }
        
        const sungSongsHeight = songList.scrollHeight;
        const currentSongHeight = getCurrentSongHeight();
        const totalContentHeight = sungSongsHeight + currentSongHeight;
        const maxFrameHeight = getMaxFrameHeight();

        const adjustedContentHeight = totalContentHeight + CONFIG.safetyMargin;
        
        if (adjustedContentHeight > maxFrameHeight) {
            STATE.displayMode = 'fixed';
            setFixedMode(sungSongsHeight, currentSongHeight, maxFrameHeight, hasCurrentSong);
        } else {
            STATE.displayMode = 'natural';
            setNaturalMode(totalContentHeight, hasCurrentSong);
        }
        
        updateDecorationPosition();
    }

    function resetStyles() {
        stopAutoScroll();
        scrollableArea.style.height = '';
        scrollableArea.style.maxHeight = '';
        scrollableArea.style.paddingBottom = '';
        songList.style.paddingBottom = '';
        currentSong.classList.remove('fixed');
        currentSong.style.marginTop = '';
        listFrame.style.height = '';
        listFrame.style.maxHeight = '';
        listFrame.style.display = ''; 
        listFrame.classList.remove('natural-mode');
        listFrame.classList.remove('fixed-mode');
        listFrame.classList.remove('only-current-mode');
        listFrame.classList.remove('empty-mode');
    }
    

    function setOnlyCurrentSongMode() {
        listFrame.style.display = 'none';
        listFrame.classList.add('only-current-mode');
        
        updateDecorationPosition();
    }
    
    function setEmptyMode() {
        listFrame.classList.add('empty-mode');
        if (currentSong) {
            currentSong.style.marginTop = `-${CONFIG.onlyCurrentSongTopMargin}px`;
        }
        updateDecorationPosition();
    }
    
    function setFixedMode(sungSongsHeight, currentSongHeight, maxHeight, hasCurrentSong) {
        listFrame.style.height = `${maxHeight}px`;
        listFrame.classList.add('fixed-mode');
        
        const extraSpace = CONFIG.extraSpaceBuffer;
        if (hasCurrentSong) {

            currentSong.classList.add('fixed');
            const availableHeight = maxHeight - currentSongHeight - extraSpace;
            scrollableArea.style.height = `${availableHeight}px`;
            scrollableArea.style.maxHeight = `${availableHeight}px`;
            songList.style.paddingBottom = `${currentSongHeight + Math.floor(extraSpace/2)}px`;
            checkScrollingRequirement(sungSongsHeight, availableHeight);
        } else {
            scrollableArea.style.height = `${maxHeight}px`;
            scrollableArea.style.maxHeight = `${maxHeight}px`;
            songList.style.paddingBottom = `${CONFIG.safetyMargin}px`;
            startAutoScroll();
        }
        updateDecorationPosition();
    }
    
    function checkScrollingRequirement(sungSongsHeight, availableHeight) {
        const songItems = sungSongsList.querySelectorAll('li');
        let shouldScroll = false;
        if (sungSongsHeight > availableHeight - CONFIG.safetyMargin) {
            shouldScroll = true;
        }
        if (!shouldScroll && songItems.length > 0) {
            for (let i = 0; i < songItems.length; i++) {
                const songItem = songItems[i];
                const itemBottom = songItem.offsetTop + songItem.offsetHeight;
                if (itemBottom + CONFIG.scrollVisibilityOffset > availableHeight) {
                    shouldScroll = true;
                    break;
                }
            }
        }
        if (shouldScroll) {
            startAutoScroll();
        }
    }
    
    /**
     * 自然模式
     * @param {number} totalHeight - 總內容高度
     * @param {boolean} hasCurrentSong - 是否有現正演唱歌曲
     */
    function setNaturalMode(totalHeight, hasCurrentSong) {
        listFrame.style.height = 'auto';
        listFrame.classList.add('natural-mode');
        scrollableArea.style.height = 'auto';
        scrollableArea.style.maxHeight = 'none';
        currentSong.classList.remove('fixed');
        songList.style.paddingBottom = '0';
        if (!hasCurrentSong) {
            scrollableArea.style.paddingBottom = `${CONFIG.naturalModeBottomPadding}px`;
        } else {
            scrollableArea.style.paddingBottom = '0';
        }
        updateDecorationPosition();
    }

    /**
     * 自動滾動
     */
    function startAutoScroll() {
        stopAutoScroll();
        STATE.scrollPosition = 0;
        STATE.targetScrollPosition = 0;
        STATE.scrollDirection = 1;
        STATE.isPaused = false;
        scrollableArea.scrollTop = 0;
        STATE.lastScrollTime = performance.now();
        function animateScroll(timestamp) {
            const now = timestamp || performance.now();
            const deltaTime = now - STATE.lastScrollTime;
            if (deltaTime >= 1000 / 60) { 
                STATE.lastScrollTime = now;
                
                if (!STATE.isPaused) {
                    const songListHeight = songList.scrollHeight + CONFIG.extraScrollSpace;
                    const visibleAreaHeight = scrollableArea.clientHeight;
                    const maxScroll = Math.max(0, songListHeight - visibleAreaHeight);
                    if (maxScroll <= 0) {
                        stopAutoScroll();
                        return;
                    }
                    
                    STATE.targetScrollPosition += STATE.scrollDirection * (CONFIG.scrollSpeed * deltaTime / 16);
                    handleScrollBoundaries(maxScroll);
                    const diff = STATE.targetScrollPosition - STATE.scrollPosition;
                    STATE.scrollPosition += diff * CONFIG.easeInOutFactor;
                    scrollableArea.scrollTop = STATE.scrollPosition;
                    if (Math.floor(STATE.scrollPosition) % 20 === 0) {
                        updateDecorationPosition();
                    }
                }
            }
            STATE.animationFrameId = requestAnimationFrame(animateScroll);
        }
        STATE.animationFrameId = requestAnimationFrame(animateScroll);
    }
    
    /**
     * 邊界行為
     * @param {number} maxScroll - 最大滾動位置
     */
    function handleScrollBoundaries(maxScroll) {
        if (STATE.targetScrollPosition >= maxScroll + CONFIG.bottomScrollBuffer) {
            if (!STATE.isPaused) {
                STATE.isPaused = true;
                STATE.targetScrollPosition = maxScroll + CONFIG.bottomScrollBuffer;
                
                setTimeout(() => {
                    STATE.scrollDirection = -1;
                    STATE.isPaused = false;
                }, CONFIG.scrollPauseTime);
            }
        } else if (STATE.targetScrollPosition <= 0) {
            if (!STATE.isPaused) {
                STATE.isPaused = true;
                STATE.targetScrollPosition = 0;
                
                setTimeout(() => {
                    STATE.scrollDirection = 1;
                    STATE.isPaused = false;
                }, CONFIG.scrollPauseTime);
            }
        }
    }

    function stopAutoScroll() {
        if (STATE.animationFrameId) {
            cancelAnimationFrame(STATE.animationFrameId);
            STATE.animationFrameId = null;
        }
        scrollableArea.scrollTop = 0;
        STATE.scrollPosition = 0;
        STATE.targetScrollPosition = 0;
    }

    /**
     * 視窗大小變化
     */
    function handleResize() {
        if (STATE.resizeTimeout) {
            clearTimeout(STATE.resizeTimeout);
        }
        STATE.resizeTimeout = setTimeout(() => {
            adjustDisplayMode();
            updateDecorationPosition();
        }, 250);
    }
    function forceRecalculate() {
        stopAutoScroll();
        setTimeout(() => {
            adjustDisplayMode();
            updateDecorationPosition();
        }, 100);
    }

    function setupEventListeners() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'sungSongs' || event.key === 'currentSong') {
                updateDisplay();
            }
        });

        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                forceRecalculate();
            }
        });
        window.addEventListener('songlistupdate', updateDisplay);
        scrollableArea.addEventListener('scroll', () => {
            requestAnimationFrame(updateDecorationPosition);
        });
        window.addEventListener('focus', forceRecalculate);
    }
    function init() {
        setupEventListeners();
        updateDisplay();
        setInterval(updateDisplay, CONFIG.updateInterval);
    }
    init();
});

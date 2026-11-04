/**
 * [3D 책자 플립 북 & 초고속 타라락 검색 엔진 - js/book_flip.js]
 * 손가락 드래그/스와이프로 실제 종이책을 넘기는 듯한 3D 플립 효과와,
 * 검색 시 책장이 타라라락-! 고속으로 넘어가며 목표 레시피를 찾아 멈추는 리얼 연출을 제공합니다.
 * (100% 순수 바닐라 자바스크립트 & 오프라인 완벽 구동)
 */

const FlipBookEngine = {
    container: null,
    bookEl: null,
    recipes: [],
    pages: [],
    currentPageIndex: 0,
    isAnimating: false,
    
    // 터치/마우스 드래그 추적 변수
    startX: 0,
    startY: 0,
    currentX: 0,
    isDragging: false,
    dragThreshold: 45, // 이 픽셀 이상 넘기면 페이지 플립 확정

    /**
     * 1. 책자 엔진 초기화
     */
    init(containerEl) {
        this.container = containerEl;
        this.render();
    },

    /**
     * 2. 최신 레시피 목록으로 책자 렌더링
     */
    render() {
        if (!this.container) return;
        
        // 최신 레시피 데이터 수집
        this.recipes = window.RecipeStorage ? window.RecipeStorage.getAllRecipes() : [];
        this.container.innerHTML = "";

        // 플립북 3D 무대 프레임 생성
        const stage = document.createElement("div");
        stage.className = "flipbook-stage";

        // 실제 책자 객체
        const book = document.createElement("div");
        book.className = "flipbook-book";
        this.bookEl = book;

        // 페이지 데이터 빌드 (표지 + 레시피 페이지들 + 마지막 뒷표지)
        this.pages = [];
        
        // (1) 멋진 가죽 양장본 앞표지 (Front Cover)
        const frontCover = this.createFrontCover();
        this.pages.push(frontCover);

        // (2) 각 레시피별 본문 페이지들
        this.recipes.forEach((recipe, idx) => {
            const recipePage = this.createRecipePage(recipe, idx + 1);
            this.pages.push(recipePage);
        });

        // (3) 뒷표지 (Back Cover - 신규 레시피 작성 안내)
        const backCover = this.createBackCover();
        this.pages.push(backCover);

        // z-index 역순 배치 및 초기 클래스 설정
        const total = this.pages.length;
        this.pages.forEach((page, idx) => {
            page.style.zIndex = total - idx;
            book.appendChild(page);
        });

        stage.appendChild(book);

        // 하단 안내 텍스트 & 현재 페이지 인디케이터 (지저분한 버튼 없는 세련된 디자인)
        const footer = document.createElement("div");
        footer.className = "flipbook-footer-bar";
        footer.innerHTML = `
            <span class="flipbook-hint">👈 손가락으로 책장을 넘겨보세요 👉</span>
            <span id="flipbookPageCounter" class="flipbook-counter">1 / ${total}</span>
        `;
        stage.appendChild(footer);

        this.container.appendChild(stage);

        // 현재 페이지 상태 반영
        this.updatePagePositions();

        // 터치 및 마우스 제스처 이벤트 장착
        this.attachGestures(book);
    },

    /**
     * (A) 양장본 앞표지 생성
     */
    createFrontCover() {
        const page = document.createElement("div");
        page.className = "flipbook-page flipbook-cover-front";
        page.dataset.pageIndex = "0";

        page.innerHTML = `
            <div class="page-inner cover-inner">
                <div class="cover-emboss-border">
                    <div class="cover-badge">CHEF'S MASTERPIECE</div>
                    <div class="cover-gold-logo">
                        <img src="icons/brand_logo.png" alt="BAU Logo" class="cover-logo-img" onerror="this.style.display='none'">
                        <h1 class="cover-title">BAU RECIPE BOOK</h1>
                        <p class="cover-subtitle">LA MANCHA SPECIAL COLLECTION</p>
                    </div>
                    <div class="cover-divider">✦ ✦ ✦</div>
                    <p class="cover-meta">총 <strong>${this.recipes.length}</strong>개의 특급 레시피 보관 중</p>
                    <div class="cover-touch-guide">
                        <div class="guide-hand-icon">👉</div>
                        <span>손가락으로 왼쪽으로 슥 밀어<br>비법 책을 펼쳐보세요!</span>
                    </div>
                </div>
            </div>
            <div class="page-shadow"></div>
        `;
        return page;
    },

    /**
     * (B) 레시피 본문 페이지 생성 (한눈에 쏙 들어오는 명품 요리책 내지 디자인)
     */
    createRecipePage(recipe, pageNum) {
        const page = document.createElement("div");
        page.className = "flipbook-page flipbook-recipe-page";
        page.dataset.recipeId = recipe.id || "";
        page.dataset.recipeName = (recipe.koreaName || recipe.englishName || recipe.italianoName || "").toLowerCase();

        // 재료 목록 요약 (상위 5~6개)
        let ingPreview = "";
        if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
            const topIngs = recipe.ingredients.slice(0, 5);
            ingPreview = topIngs.map(i => `<span class="book-ing-chip">${i.name} <b>${i.amount}${i.unit}</b></span>`).join(" ");
            if (recipe.ingredients.length > 5) {
                ingPreview += ` <span class="book-ing-more">+외 ${recipe.ingredients.length - 5}가지</span>`;
            }
        } else {
            ingPreview = `<span style="color:#94a3b8;">등록된 재료 정보 없음</span>`;
        }

        // 조리 순서 요약 (앞 3단계)
        let stepPreview = "";
        let stepsList = [];
        if (Array.isArray(recipe.cookingTechnique)) {
            stepsList = recipe.cookingTechnique;
        } else if (typeof recipe.cookingTechnique === "string" && recipe.cookingTechnique) {
            stepsList = recipe.cookingTechnique.split("\n").filter(Boolean);
        }
        if (stepsList.length > 0) {
            stepPreview = stepsList.slice(0, 3).map((st, i) => `
                <div class="book-step-row">
                    <span class="book-step-num">${i + 1}</span>
                    <span class="book-step-txt">${st.replace(/^[\d\.\-\s]+/, '')}</span>
                </div>
            `).join("");
            if (stepsList.length > 3) {
                stepPreview += `<div class="book-step-more">...외 ${stepsList.length - 3}개 조리 과정 포함</div>`;
            }
        } else {
            stepPreview = `<div style="color:#94a3b8; font-size:12px;">조리법 요약 정보 없음</div>`;
        }

        // 토핑 또는 셰프 킥 요약
        let signatureBadge = "";
        if (recipe.signatureEnabled && recipe.signature && recipe.signature.length > 0) {
            const sigText = Array.isArray(recipe.signature) ? recipe.signature[0] : recipe.signature;
            signatureBadge = `<div class="book-signature-callout">⭐ <b>SIGNATURE:</b> ${sigText}</div>`;
        }

        page.innerHTML = `
            <div class="page-inner recipe-page-inner">
                <!-- 상단 헤더: 카테고리, 날짜, 인분 -->
                <div class="book-page-header">
                    <span class="book-badge-cat">${recipe.category || 'RECIPE'}</span>
                    <span class="book-header-meta">🗓️ ${recipe.date || '2026'} | 👥 ${recipe.portion || '1인분'}</span>
                </div>

                <!-- 요리명 (한국어 & 영어/이탈리아어) -->
                <div class="book-title-box">
                    <h2 class="book-recipe-title">${recipe.koreaName || recipe.englishName || '이름 없는 레시피'}</h2>
                    <p class="book-recipe-sub">${recipe.italianoName || recipe.englishName || ''}</p>
                </div>

                <!-- 대표 이미지 -->
                <div class="book-photo-wrap">
                    <img src="${recipe.photoData || 'sample_images/funghi_pasta.jpg'}" alt="요리 사진" class="book-recipe-photo" onerror="this.src='sample_images/funghi_pasta.jpg'">
                </div>

                <!-- 핵심 재료 요약 -->
                <div class="book-section-block">
                    <div class="book-section-label">🧂 KEY INGREDIENTS (핵심 재료)</div>
                    <div class="book-ing-chips-wrap">
                        ${ingPreview}
                    </div>
                </div>

                <!-- 조리법 프리뷰 -->
                <div class="book-section-block">
                    <div class="book-section-label">🍳 COOKING PREVIEW (조리 순서)</div>
                    <div class="book-steps-preview">
                        ${stepPreview}
                    </div>
                </div>

                ${signatureBadge}

                <!-- 책장 하단 감성 책갈피 액션 바 -->
                <div class="book-actions-bar">
                    <button type="button" class="book-action-btn btn-edit-this" data-id="${recipe.id}">
                        ✍️ 이 레시피 수정하기
                    </button>
                    <button type="button" class="book-action-btn btn-print-this" data-id="${recipe.id}">
                        🖨️ A4 규격 인쇄
                    </button>
                </div>

                <!-- 페이지 번호 -->
                <div class="book-page-number">- ${pageNum} -</div>
            </div>
            <div class="page-shadow"></div>
        `;

        // 버튼 클릭 이벤트 연결
        const btnEdit = page.querySelector(".btn-edit-this");
        if (btnEdit) {
            btnEdit.addEventListener("click", (e) => {
                e.stopPropagation();
                if (window.RecipeStorage && window.populateFormWithData && window.switchTab) {
                    const latest = window.RecipeStorage.getRecipeById(recipe.id) || recipe;
                    window.populateFormWithData(latest);
                    window.switchTab("tab-editor");
                }
            });
        }

        const btnPrint = page.querySelector(".btn-print-this");
        if (btnPrint) {
            btnPrint.addEventListener("click", (e) => {
                e.stopPropagation();
                if (window.RecipeStorage && window.populateFormWithData && window.switchTab) {
                    const latest = window.RecipeStorage.getRecipeById(recipe.id) || recipe;
                    window.populateFormWithData(latest);
                    window.switchTab("tab-preview");
                    setTimeout(() => window.print(), 350);
                }
            });
        }

        return page;
    },

    /**
     * (C) 양장본 뒷표지 (새 레시피 작성 유도)
     */
    createBackCover() {
        const page = document.createElement("div");
        page.className = "flipbook-page flipbook-cover-back";
        page.dataset.pageIndex = String(this.pages.length);

        page.innerHTML = `
            <div class="page-inner cover-inner back-inner">
                <div class="cover-emboss-border">
                    <div class="back-cover-icon">👨‍🍳📖</div>
                    <h2 class="back-title">THE END OF BOOK</h2>
                    <p class="back-desc">모든 비법 레시피를 둘러보셨습니다.<br>새로운 나만의 시그니처 요리를 추가해보세요!</p>
                    <button type="button" id="btnBookAddNew" class="btn-book-new-recipe">
                        ✨ 새 레시피 추가 작성하기
                    </button>
                    <div class="back-footer-mark">BAU MASTER RECIPE SYSTEM</div>
                </div>
            </div>
            <div class="page-shadow"></div>
        `;

        const btnNew = page.querySelector("#btnBookAddNew");
        if (btnNew) {
            btnNew.addEventListener("click", (e) => {
                e.stopPropagation();
                if (window.switchTab && window.populateFormWithData) {
                    window.currentRecipeId = null;
                    window.populateFormWithData({
                        title: "LA MANCHA RECIPE",
                        category: "SOUP",
                        portion: "1 인분",
                        ingredients: [{ name: "", amount: "", unit: "g" }],
                        cookingTechnique: ["", "", ""],
                        photoData: "sample_images/funghi_pasta.jpg"
                    });
                    window.switchTab("tab-editor");
                }
            });
        }

        return page;
    },

    /**
     * 3. 손가락 터치 및 마우스 드래그 제스처 바인딩
     */
    attachGestures(el) {
        // --- 모바일 터치 이벤트 ---
        el.addEventListener("touchstart", (e) => this.onDragStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
        el.addEventListener("touchmove", (e) => this.onDragMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
        el.addEventListener("touchend", () => this.onDragEnd());

        // --- 데스크톱 마우스 드래그 이벤트 ---
        el.addEventListener("mousedown", (e) => {
            // 버튼 클릭 시에는 드래그 방지
            if (e.target.closest("button") || e.target.closest("input")) return;
            this.onDragStart(e.clientX, e.clientY);
        });
        window.addEventListener("mousemove", (e) => {
            if (this.isDragging) this.onDragMove(e.clientX, e.clientY);
        });
        window.addEventListener("mouseup", () => {
            if (this.isDragging) this.onDragEnd();
        });
    },

    onDragStart(x, y) {
        if (this.isAnimating) return;
        this.isDragging = true;
        this.startX = x;
        this.startY = y;
        this.currentX = x;
    },

    onDragMove(x, y) {
        if (!this.isDragging || this.isAnimating) return;
        this.currentX = x;
        const deltaX = this.currentX - this.startX;

        // 현재 넘기려는 페이지를 손가락 따라 살짝 기울여서 들리는 리얼 손맛 연출!
        if (deltaX < 0 && this.currentPageIndex < this.pages.length - 1) {
            // 다음 장으로 넘기려는 중 (왼쪽으로 드래그)
            const activePage = this.pages[this.currentPageIndex];
            const ratio = Math.min(Math.abs(deltaX) / 180, 0.45);
            activePage.style.transition = "none";
            activePage.style.transform = `rotateY(-${ratio * 120}deg)`;
        } else if (deltaX > 0 && this.currentPageIndex > 0) {
            // 이전 장으로 되돌리려는 중 (오른쪽으로 드래그)
            const prevPage = this.pages[this.currentPageIndex - 1];
            const ratio = Math.min(deltaX / 180, 0.45);
            prevPage.style.transition = "none";
            prevPage.style.transform = `rotateY(-${180 - ratio * 120}deg)`;
        }
    },

    onDragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        const deltaX = this.currentX - this.startX;

        if (deltaX < -this.dragThreshold) {
            // 왼쪽으로 확 밀었을 때: 다음 페이지로 부드럽게 넘김!
            this.nextPage();
        } else if (deltaX > this.dragThreshold) {
            // 오른쪽으로 확 밀었을 때: 이전 페이지로 되돌림!
            this.prevPage();
        } else {
            // 살짝 밀다 놓았을 때: 원래 자리로 부드럽게 복귀
            this.cancelDrag();
        }
    },

    cancelDrag() {
        if (this.pages[this.currentPageIndex]) {
            this.pages[this.currentPageIndex].style.transition = "transform 0.3s ease";
            this.pages[this.currentPageIndex].style.transform = "rotateY(0deg)";
        }
        if (this.currentPageIndex > 0 && this.pages[this.currentPageIndex - 1]) {
            this.pages[this.currentPageIndex - 1].style.transition = "transform 0.3s ease";
            this.pages[this.currentPageIndex - 1].style.transform = "rotateY(-180deg)";
        }
    },

    /**
     * 4. 다음 페이지로 플립 (부드러운 3D 종이 넘김 효과)
     */
    nextPage() {
        if (this.currentPageIndex >= this.pages.length - 1 || this.isAnimating) return;
        this.isAnimating = true;

        const currentPage = this.pages[this.currentPageIndex];
        currentPage.style.transition = "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)";
        currentPage.classList.add("flipped");
        currentPage.style.transform = "rotateY(-180deg)";

        this.currentPageIndex++;
        this.updatePagePositions();

        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    },

    /**
     * 5. 이전 페이지로 플립 (되돌리기)
     */
    prevPage() {
        if (this.currentPageIndex <= 0 || this.isAnimating) return;
        this.isAnimating = true;

        this.currentPageIndex--;
        const targetPage = this.pages[this.currentPageIndex];
        targetPage.style.transition = "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)";
        targetPage.classList.remove("flipped");
        targetPage.style.transform = "rotateY(0deg)";

        this.updatePagePositions();

        setTimeout(() => {
            this.isAnimating = false;
        }, 600);
    },

    /**
     * 6. 페이지 상태 및 번호 카운터 갱신
     */
    updatePagePositions() {
        const total = this.pages.length;
        this.pages.forEach((p, idx) => {
            if (idx < this.currentPageIndex) {
                // 이미 넘어간 페이지 (왼쪽에 접힘)
                p.classList.add("flipped");
                p.style.zIndex = idx;
                p.style.transform = "rotateY(-180deg)";
            } else {
                // 아직 안 넘어간 페이지 (오른쪽에 쌓임)
                p.classList.remove("flipped");
                p.style.zIndex = total - idx;
                p.style.transform = "rotateY(0deg)";
            }
        });

        // 카운터 텍스트 갱신
        const counter = document.getElementById("flipbookPageCounter");
        if (counter) {
            counter.textContent = `${this.currentPageIndex + 1} / ${total}`;
        }
    },

    /**
     * 7. 🚀 [핵심 요청] 고속 자동 책장 넘김 검색 엔진 (타라라락-! 착!)
     * 사용자가 검색어를 입력하면 책장이 고속으로 타라라락 넘어가며 해당 페이지를 찾아 착 멈춥니다!
     */
    searchAndRapidFlip(keyword) {
        if (!keyword || !keyword.trim()) return;
        const kw = keyword.trim().toLowerCase();

        // 1. 키워드와 일치하는 레시피 페이지 찾기 (표지 0번 이후부터 탐색)
        let targetIndex = -1;
        for (let i = 1; i < this.pages.length - 1; i++) {
            const p = this.pages[i];
            const name = p.dataset.recipeName || "";
            if (name.includes(kw)) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex === -1) {
            // 못 찾았을 때: 책자를 살짝 도리도리(Shake)하며 안내
            if (this.bookEl) {
                this.bookEl.classList.remove("shake-effect");
                void this.bookEl.offsetWidth; // reflow
                this.bookEl.classList.add("shake-effect");
            }
            alert(`🔍 "${keyword}" 관련 레시피를 찾을 수 없습니다. 철자를 확인해주세요! 😊`);
            return;
        }

        // 이미 그 페이지에 있다면 펄스 강조만 제공
        if (this.currentPageIndex === targetIndex) {
            this.highlightFoundPage(this.pages[targetIndex]);
            return;
        }

        // 2. 타라라락 고속 플립 애니메이션 시작!
        this.isAnimating = true;
        const isForward = targetIndex > this.currentPageIndex;
        const stepDelay = 90; // 한 장 넘길 때 걸리는 초고속 시간 (90ms)

        const flipInterval = setInterval(() => {
            if (isForward && this.currentPageIndex < targetIndex) {
                const cur = this.pages[this.currentPageIndex];
                cur.style.transition = `transform ${stepDelay}ms linear`;
                cur.classList.add("flipped");
                cur.style.transform = "rotateY(-180deg)";
                this.currentPageIndex++;
                this.updatePagePositions();
            } else if (!isForward && this.currentPageIndex > targetIndex) {
                this.currentPageIndex--;
                const cur = this.pages[this.currentPageIndex];
                cur.style.transition = `transform ${stepDelay}ms linear`;
                cur.classList.remove("flipped");
                cur.style.transform = "rotateY(0deg)";
                this.updatePagePositions();
            } else {
                // 목표 페이지 도착! 즉시 인터벌 중단 및 탁! 멈춤 강조
                clearInterval(flipInterval);
                this.isAnimating = false;
                this.highlightFoundPage(this.pages[targetIndex]);
            }
        }, stepDelay);
    },

    /**
     * 목표 레시피 발견 시 '탁!' 멈추며 골드 펄스 강조 효과
     */
    highlightFoundPage(pageEl) {
        if (!pageEl) return;
        pageEl.classList.remove("found-pulse");
        void pageEl.offsetWidth; // reflow
        pageEl.classList.add("found-pulse");
    }
};

window.FlipBookEngine = FlipBookEngine;

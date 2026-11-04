/**
 * [초고품질 3D 리얼 종이책 플립 엔진 - js/book_flip.js]
 * 손끝 1:1 밀착 추적, 종이 휨 곡선(Curvature), 양면(Two-Sided) 3D 회전,
 * 실시간 빛과 그림자 및 120Hz 비단결 GPU 가속을 완벽 지원합니다.
 */

const FlipBookEngine = {
    container: null,
    bookEl: null,
    recipes: [],
    pages: [],
    currentPageIndex: 0,
    isAnimating: false,

    // 손끝 1:1 추적 상태
    startX: 0,
    startY: 0,
    currentX: 0,
    isDragging: false,
    dragDirection: null, // "next" 또는 "prev"
    activePageEl: null,
    bookWidth: 460,

    init(containerEl) {
        this.container = containerEl;
        this.render();
    },

    render() {
        if (!this.container) return;

        this.recipes = window.RecipeStorage ? window.RecipeStorage.getAllRecipes() : [];
        this.container.innerHTML = "";

        const stage = document.createElement("div");
        stage.className = "flipbook-stage";

        const book = document.createElement("div");
        book.className = "flipbook-book";
        this.bookEl = book;

        this.pages = [];

        // 1. 앞표지 생성
        const frontCover = this.buildCoverPage(true);
        this.pages.push(frontCover);

        // 2. 레시피 본문 페이지들 (앞면 + 뒷면 양면 3D 구조)
        this.recipes.forEach((recipe, idx) => {
            const page = this.buildRecipePage(recipe, idx + 1);
            this.pages.push(page);
        });

        // 3. 뒷표지 생성
        const backCover = this.buildCoverPage(false);
        this.pages.push(backCover);

        // 페이지들을 책자에 z-index 순서대로 주입
        const total = this.pages.length;
        this.pages.forEach((p, idx) => {
            p.style.zIndex = total - idx;
            book.appendChild(p);
        });

        stage.appendChild(book);

        // 하단 안내 바 (지저분한 버튼 없는 미니멀 스타일)
        const footer = document.createElement("div");
        footer.className = "flipbook-footer-bar";
        footer.innerHTML = `
            <span class="flipbook-hint">📖 손가락으로 책장을 슥- 넘겨보세요</span>
            <span id="flipbookPageCounter" class="flipbook-counter">1 / ${total}</span>
        `;
        stage.appendChild(footer);

        this.container.appendChild(stage);

        // 초기 페이지 위치 및 책 너비 계산
        this.updateBookWidth();
        this.updatePagePositions(false);

        // 1:1 손끝 밀착 제스처 장착
        this.attachPhysicsGestures(book);

        // 화면 회전/리사이즈 시 책 너비 자동 재계산
        window.addEventListener("resize", () => this.updateBookWidth());
    },

    updateBookWidth() {
        if (this.bookEl) {
            this.bookWidth = this.bookEl.offsetWidth || 460;
        }
    },

    /**
     * 표지 빌더 (앞표지 or 뒷표지)
     */
    buildCoverPage(isFront) {
        const page = document.createElement("div");
        page.className = `flipbook-sheet ${isFront ? "sheet-cover-front" : "sheet-cover-back"}`;
        page.dataset.pageIndex = isFront ? "0" : String(this.pages.length);

        const frontContent = isFront ? `
            <div class="sheet-side side-front cover-leather">
                <div class="cover-emboss-border">
                    <div class="cover-badge">CHEF'S MASTERPIECE</div>
                    <div class="cover-gold-logo">
                        <img src="icons/brand_logo.png" alt="BAU Logo" class="cover-logo-img" onerror="this.style.display='none'">
                        <h1 class="cover-title">BAU RECIPE BOOK</h1>
                        <p class="cover-subtitle">LA MANCHA SPECIAL COLLECTION</p>
                    </div>
                    <div class="cover-divider">✦ ✦ ✦</div>
                    <p class="cover-meta">총 <strong>${this.recipes.length}</strong>개의 특급 레시피 수록</p>
                    <div class="cover-touch-guide">
                        <span class="guide-hand">👉</span>
                        <span>책장 모서리를 잡고<br>왼쪽으로 스르륵 넘겨보세요!</span>
                    </div>
                </div>
                <div class="spine-shade"></div>
                <div class="curl-shadow"></div>
            </div>
        ` : `
            <div class="sheet-side side-front cover-leather-back">
                <div class="cover-emboss-border">
                    <div style="font-size: 2.8rem; margin-bottom: 6px;">👨‍🍳📖</div>
                    <h2 class="cover-title" style="font-size: 1.45rem;">THE END OF BOOK</h2>
                    <p style="color:#cbd5e1; font-size:0.88rem; line-height:1.5; margin: 6px 0 16px;">
                        모든 레시피를 둘러보셨습니다.<br>나만의 새로운 비법 레시피를 추가해보세요!
                    </p>
                    <button type="button" id="btnBookAddNew" class="btn-book-new-recipe">
                        ✨ 새 레시피 작성하기
                    </button>
                    <div style="color:#d4af37; font-size:0.75rem; letter-spacing:2px; margin-top:20px;">BAU MASTER RECIPE SYSTEM</div>
                </div>
                <div class="spine-shade"></div>
                <div class="curl-shadow"></div>
            </div>
        `;

        // 종이 뒷면 (양장본 표지 안쪽의 앤틱 양피지 질감)
        const backContent = `
            <div class="sheet-side side-back parchment-back">
                <div class="parchment-pattern">
                    <div class="parchment-watermark">BAU RECIPE</div>
                </div>
                <div class="spine-shade-back"></div>
                <div class="curl-shadow-back"></div>
            </div>
        `;

        page.innerHTML = frontContent + backContent;

        if (!isFront) {
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
        }

        return page;
    },

    /**
     * 레시피 페이지 빌더 (앞면: 요리정보 / 뒷면: 고급 크림지 질감)
     */
    buildRecipePage(recipe, pageNum) {
        const page = document.createElement("div");
        page.className = "flipbook-sheet sheet-recipe";
        page.dataset.recipeId = recipe.id || "";
        page.dataset.recipeName = (recipe.koreaName || recipe.englishName || recipe.italianoName || "").toLowerCase();

        // 1. 재료 요약
        let ingPreview = "";
        if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
            const topIngs = recipe.ingredients.slice(0, 5);
            ingPreview = topIngs.map(i => `<span class="book-ing-chip">${i.name} <b>${i.amount}${i.unit}</b></span>`).join(" ");
            if (recipe.ingredients.length > 5) {
                ingPreview += ` <span class="book-ing-more">+외 ${recipe.ingredients.length - 5}가지</span>`;
            }
        } else {
            ingPreview = `<span style="color:#94a3b8; font-size:12px;">재료 정보 없음</span>`;
        }

        // 2. 조리 순서 요약
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
                stepPreview += `<div class="book-step-more">...외 ${stepsList.length - 3}개 조리 과정 수록</div>`;
            }
        } else {
            stepPreview = `<div style="color:#94a3b8; font-size:12px;">조리법 정보 없음</div>`;
        }

        // 3. 셰프 시그니처
        let signatureBadge = "";
        if (recipe.signatureEnabled && recipe.signature && recipe.signature.length > 0) {
            const sigText = Array.isArray(recipe.signature) ? recipe.signature[0] : recipe.signature;
            signatureBadge = `<div class="book-signature-callout">⭐ <b>SIGNATURE:</b> ${sigText}</div>`;
        }

        // 앞면 (Front Face)
        const frontHtml = `
            <div class="sheet-side side-front recipe-sheet-front">
                <div class="recipe-page-inner">
                    <div class="book-page-header">
                        <span class="book-badge-cat">${recipe.category || 'RECIPE'}</span>
                        <span class="book-header-meta">🗓️ ${recipe.date || '2026'} | 👥 ${recipe.portion || '1인분'}</span>
                    </div>

                    <div class="book-title-box">
                        <h2 class="book-recipe-title">${recipe.koreaName || recipe.englishName || '이름 없는 레시피'}</h2>
                        <p class="book-recipe-sub">${recipe.italianoName || recipe.englishName || ''}</p>
                    </div>

                    <div class="book-photo-wrap">
                        <img src="${recipe.photoData || 'sample_images/funghi_pasta.jpg'}" alt="요리 사진" class="book-recipe-photo" onerror="this.src='sample_images/funghi_pasta.jpg'">
                    </div>

                    <div class="book-section-block">
                        <div class="book-section-label">🧂 KEY INGREDIENTS (핵심 재료)</div>
                        <div class="book-ing-chips-wrap">${ingPreview}</div>
                    </div>

                    <div class="book-section-block">
                        <div class="book-section-label">🍳 COOKING TECHNIQUE (조리 순서)</div>
                        <div class="book-steps-preview">${stepPreview}</div>
                    </div>

                    ${signatureBadge}

                    <div class="book-actions-bar">
                        <button type="button" class="book-action-btn btn-edit-this" data-id="${recipe.id}">
                            ✍️ 이 레시피 수정하기
                        </button>
                        <button type="button" class="book-action-btn btn-print-this" data-id="${recipe.id}">
                            🖨️ A4 규격 인쇄
                        </button>
                    </div>

                    <div class="book-page-number">- ${pageNum} -</div>
                </div>
                <div class="spine-shade"></div>
                <div class="curl-shadow"></div>
            </div>
        `;

        // 뒷면 (Back Face - 뒤집혔을 때 보이는 은은한 크림지 양피지 질감)
        const backHtml = `
            <div class="sheet-side side-back recipe-sheet-back">
                <div class="sheet-back-content">
                    <div class="sheet-back-ornament">✦ BAU SPECIAL RECIPE ✦</div>
                    <div class="sheet-back-pagenum">- ${pageNum} -</div>
                </div>
                <div class="spine-shade-back"></div>
                <div class="curl-shadow-back"></div>
            </div>
        `;

        page.innerHTML = frontHtml + backHtml;

        // 수정 및 인쇄 버튼 이벤트
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
     * 1:1 손끝 밀착 물리 제스처 (Physics Drag Gesture)
     */
    attachPhysicsGestures(el) {
        // 모바일 터치 이벤트
        el.addEventListener("touchstart", (e) => {
            if (e.target.closest("button") || e.target.closest("input")) return;
            const touch = e.touches[0];
            this.handleDragStart(touch.clientX, touch.clientY);
        }, { passive: true });

        el.addEventListener("touchmove", (e) => {
            if (!this.isDragging) return;
            const touch = e.touches[0];
            this.handleDragMove(touch.clientX, touch.clientY);
        }, { passive: true });

        el.addEventListener("touchend", () => this.handleDragEnd());

        // 데스크톱 마우스 이벤트
        el.addEventListener("mousedown", (e) => {
            if (e.target.closest("button") || e.target.closest("input")) return;
            this.handleDragStart(e.clientX, e.clientY);
        });

        window.addEventListener("mousemove", (e) => {
            if (this.isDragging) this.handleDragMove(e.clientX, e.clientY);
        });

        window.addEventListener("mouseup", () => {
            if (this.isDragging) this.handleDragEnd();
        });
    },

    handleDragStart(x, y) {
        if (this.isAnimating) return;
        this.updateBookWidth();
        this.startX = x;
        this.startY = y;
        this.currentX = x;
        this.isDragging = true;
        this.dragDirection = null;
        this.activePageEl = null;
    },

    handleDragMove(x, y) {
        if (!this.isDragging || this.isAnimating) return;
        this.currentX = x;
        const deltaX = this.currentX - this.startX;

        // 드래그 방향 결정 (한 번 결정되면 드래그 끝날 때까지 유지)
        if (!this.dragDirection) {
            if (deltaX < -8 && this.currentPageIndex < this.pages.length - 1) {
                // 다음 페이지로 넘기는 방향 (오른쪽 -> 왼쪽)
                this.dragDirection = "next";
                this.activePageEl = this.pages[this.currentPageIndex];
                this.activePageEl.style.transition = "none";
                this.activePageEl.style.zIndex = this.pages.length + 10;
            } else if (deltaX > 8 && this.currentPageIndex > 0) {
                // 이전 페이지로 되돌리는 방향 (왼쪽 -> 오른쪽)
                this.dragDirection = "prev";
                this.activePageEl = this.pages[this.currentPageIndex - 1];
                this.activePageEl.style.transition = "none";
                this.activePageEl.style.zIndex = this.pages.length + 10;
            }
        }

        if (!this.activePageEl || !this.dragDirection) return;

        // ★ 손끝 1:1 실시간 회전 각도 및 휨(Bend) 계산
        if (this.dragDirection === "next") {
            // progress: 0 (시작) ~ 1.0 (완전히 넘김)
            const progress = Math.min(Math.max(-deltaX / this.bookWidth, 0), 1.0);
            const deg = progress * 180;
            // 살짝 들어올리는 원근 효과와 곡선 휨
            const liftZ = Math.sin(progress * Math.PI) * 22;
            const skew = Math.sin(progress * Math.PI) * -3;

            this.activePageEl.style.transform = `rotateY(-${deg}deg) translateZ(${liftZ}px) skewY(${skew}deg)`;
            this.updateShadow(this.activePageEl, progress);
        } else if (this.dragDirection === "prev") {
            const progress = Math.min(Math.max(deltaX / this.bookWidth, 0), 1.0);
            const deg = 180 - (progress * 180);
            const liftZ = Math.sin(progress * Math.PI) * 22;
            const skew = Math.sin(progress * Math.PI) * 3;

            this.activePageEl.style.transform = `rotateY(-${deg}deg) translateZ(${liftZ}px) skewY(${skew}deg)`;
            this.updateShadow(this.activePageEl, 1.0 - progress);
        }
    },

    updateShadow(sheetEl, progress) {
        // 넘겨지는 각도에 따라 그림자 투명도를 부드럽게 조절
        const shadowEl = sheetEl.querySelector(".curl-shadow");
        if (shadowEl) {
            const opacity = Math.sin(progress * Math.PI) * 0.75;
            shadowEl.style.opacity = opacity.toFixed(2);
        }
    },

    handleDragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        if (!this.activePageEl || !this.dragDirection) return;

        const deltaX = this.currentX - this.startX;
        const commitDistance = this.bookWidth * 0.22; // 22% 이상 넘기면 확정 플립

        if (this.dragDirection === "next") {
            if (-deltaX > commitDistance) {
                // 부드럽게 다음 장으로 착지
                this.finishFlip(this.activePageEl, -180, () => {
                    this.currentPageIndex++;
                    this.updatePagePositions(true);
                });
            } else {
                // 원래 자리로 부드럽게 복귀
                this.finishFlip(this.activePageEl, 0, () => {
                    this.updatePagePositions(true);
                });
            }
        } else if (this.dragDirection === "prev") {
            if (deltaX > commitDistance) {
                // 부드럽게 이전 장으로 착지
                this.finishFlip(this.activePageEl, 0, () => {
                    this.currentPageIndex--;
                    this.updatePagePositions(true);
                });
            } else {
                // 뒤집힌 상태로 다시 복귀
                this.finishFlip(this.activePageEl, -180, () => {
                    this.updatePagePositions(true);
                });
            }
        }
    },

    /**
     * 손을 놓았을 때의 부드러운 스프링 감속 착지 애니메이션 (120Hz 최적화)
     */
    finishFlip(sheetEl, targetDeg, onComplete) {
        this.isAnimating = true;
        sheetEl.style.transition = "transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.45s ease";
        sheetEl.style.transform = `rotateY(${targetDeg}deg) translateZ(0px) skewY(0deg)`;

        const shadowEl = sheetEl.querySelector(".curl-shadow");
        if (shadowEl) {
            shadowEl.style.transition = "opacity 0.45s ease";
            shadowEl.style.opacity = "0";
        }

        setTimeout(() => {
            this.isAnimating = false;
            if (onComplete) onComplete();
        }, 460);
    },

    /**
     * 모든 페이지의 z-index 및 3D 배치 정돈
     */
    updatePagePositions(animated = false) {
        const total = this.pages.length;
        this.pages.forEach((p, idx) => {
            if (!animated) p.style.transition = "none";
            
            const shadowEl = p.querySelector(".curl-shadow");
            if (shadowEl) shadowEl.style.opacity = "0";

            if (idx < this.currentPageIndex) {
                // 이미 넘어간 페이지 (왼쪽에 180도 회전되어 차곡차곡 쌓임)
                p.classList.add("flipped");
                p.style.zIndex = idx + 1;
                p.style.transform = "rotateY(-180deg) translateZ(0px) skewY(0deg)";
            } else if (idx === this.currentPageIndex) {
                // 현재 펼쳐져 있는 페이지 (맨 위)
                p.classList.remove("flipped");
                p.style.zIndex = total;
                p.style.transform = "rotateY(0deg) translateZ(0px) skewY(0deg)";
            } else {
                // 아직 안 넘어간 다음 페이지들 (오른쪽에 역순으로 쌓임)
                p.classList.remove("flipped");
                p.style.zIndex = total - (idx - this.currentPageIndex);
                p.style.transform = "rotateY(0deg) translateZ(0px) skewY(0deg)";
            }
        });

        // 카운터 텍스트 갱신
        const counter = document.getElementById("flipbookPageCounter");
        if (counter) {
            counter.textContent = `${this.currentPageIndex + 1} / ${total}`;
        }
    },

    /**
     * 🚀 [타라라락 고속 검색 엔진]
     */
    searchAndRapidFlip(keyword) {
        if (!keyword || !keyword.trim()) return;
        const kw = keyword.trim().toLowerCase();

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
            if (this.bookEl) {
                this.bookEl.classList.remove("shake-effect");
                void this.bookEl.offsetWidth;
                this.bookEl.classList.add("shake-effect");
            }
            alert(`🔍 "${keyword}" 관련 레시피를 찾을 수 없습니다. 철자를 확인해주세요! 😊`);
            return;
        }

        if (this.currentPageIndex === targetIndex) {
            this.highlightFoundPage(this.pages[targetIndex]);
            return;
        }

        // 고속으로 타라라락-! 넘기기
        this.isAnimating = true;
        const isForward = targetIndex > this.currentPageIndex;
        const stepDelay = 80;

        const interval = setInterval(() => {
            if (isForward && this.currentPageIndex < targetIndex) {
                const cur = this.pages[this.currentPageIndex];
                cur.style.transition = `transform ${stepDelay}ms linear`;
                cur.style.transform = "rotateY(-180deg)";
                cur.classList.add("flipped");
                this.currentPageIndex++;
                this.updatePagePositions(false);
            } else if (!isForward && this.currentPageIndex > targetIndex) {
                this.currentPageIndex--;
                const cur = this.pages[this.currentPageIndex];
                cur.style.transition = `transform ${stepDelay}ms linear`;
                cur.style.transform = "rotateY(0deg)";
                cur.classList.remove("flipped");
                this.updatePagePositions(false);
            } else {
                clearInterval(interval);
                this.isAnimating = false;
                this.updatePagePositions(true);
                this.highlightFoundPage(this.pages[targetIndex]);
            }
        }, stepDelay);
    },

    highlightFoundPage(pageEl) {
        if (!pageEl) return;
        pageEl.classList.remove("found-pulse");
        void pageEl.offsetWidth;
        pageEl.classList.add("found-pulse");
    }
};

window.FlipBookEngine = FlipBookEngine;

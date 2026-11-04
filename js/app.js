/**
 * [바우 레시피 북 - 메인 애플리케이션 제어 모듈 (js/app.js)]
 * 모바일 탭 제어, 입력 폼 실시간 동기화, 재료 추가/삭제, 단위 드롭다운,
 * 영구 보관 레시피 북 관리 및 A4 모바일 즉시 인쇄 기능을 총괄합니다.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------
    // 1. 상태 변수 및 요소 참조
    // ----------------------------------------------------
    let currentRecipeId = null; // 현재 수정 중인 레시피 고유 ID (null이면 신규)
    let currentPhotoData = "sample_images/funghi_pasta.jpg"; // 현재 요리 사진 (기본값)

    // 스마트 인분 변환을 위한 원본 기준 보관
    let basePortionCount = 1; // 기준 인분 (숫자)
    let baseIngredientsState = []; // 원래 재료 수량 보관

    // 모바일 탭 요소
    const navTabs = document.querySelectorAll(".nav-tab");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const recipeCountBadge = document.getElementById("recipeCountBadge");
    const currentEditingStatus = document.getElementById("currentEditingStatus");

    // 폼 입력 요소
    const formTitle = document.getElementById("formTitle");
    const formItaliano = document.getElementById("formItaliano");
    const formEnglish = document.getElementById("formEnglish");
    const formKorea = document.getElementById("formKorea");

    const formCategory = document.getElementById("formCategory");
    const formDate = document.getElementById("formDate");
    const formCost = document.getElementById("formCost");
    const formCostCurrency = document.getElementById("formCostCurrency");
    const formPrice = document.getElementById("formPrice");
    const formPriceCurrency = document.getElementById("formPriceCurrency");
    const formPortionNum = document.getElementById("formPortionNum");
    const formPortionUnit = document.getElementById("formPortionUnit");

    // 인분 스케일러 요소
    const scalerCurrentPortionText = document.getElementById("scalerCurrentPortionText");
    const scalerCustomInput = document.getElementById("scalerCustomInput");
    const btnApplyCustomScale = document.getElementById("btnApplyCustomScale");
    const btnResetScale = document.getElementById("btnResetScale");
    const previewPortionSelect = document.getElementById("previewPortionSelect");

    const formPhotoClickArea = document.getElementById("formPhotoClickArea");
    const formPhotoFile = document.getElementById("formPhotoFile");
    const formPhotoPreview = document.getElementById("formPhotoPreview");

    const ingredientItemsContainer = document.getElementById("ingredientItemsContainer");
    const formBtnAddIngredient = document.getElementById("formBtnAddIngredient");

    const cookingStepsContainer = document.getElementById("cookingStepsContainer");
    const formBtnAddCookingStep = document.getElementById("formBtnAddCookingStep");
    const btnSummarizeCooking = document.getElementById("btnSummarizeCooking");
    const toppingItemsContainer = document.getElementById("toppingItemsContainer");
    const formBtnAddTopping = document.getElementById("formBtnAddTopping");
    const formSignatureEnable = document.getElementById("formSignatureEnable");
    const formBtnAddSignature = document.getElementById("formBtnAddSignature");
    const signatureControlsWrap = document.getElementById("signatureControlsWrap");
    const signatureItemsContainer = document.getElementById("signatureItemsContainer");
    const cautionItemsContainer = document.getElementById("cautionItemsContainer");
    const formBtnAddCaution = document.getElementById("formBtnAddCaution");
    const btnSummarizeCaution = document.getElementById("btnSummarizeCaution");

    // 번역 및 변환 버튼 요소
    const checkUseItaliano = document.getElementById("checkUseItaliano");
    const wrapItalianoInput = document.getElementById("wrapItalianoInput");
    const btnTranslateToEn = document.getElementById("btnTranslateToEn");
    const btnTranslateToIt = document.getElementById("btnTranslateToIt");
    const btnTranslateNames = document.getElementById("btnTranslateNames");
    const btnTranslateNamesToKo = document.getElementById("btnTranslateNamesToKo");
    const btnTranslateAllIngredients = document.getElementById("btnTranslateAllIngredients");
    const btnTranslateAllIngredientsKo = document.getElementById("btnTranslateAllIngredientsKo");

    // 버튼 요소
    const btnQuickPrint = document.getElementById("btnQuickPrint");
    const btnPrintPreview = document.getElementById("btnPrintPreview");
    const btnPrintFromForm = document.getElementById("btnPrintFromForm");
    const btnSaveToBook = document.getElementById("btnSaveToBook");
    const btnSaveBottom = document.getElementById("btnSaveBottom");
    const btnNewRecipe = document.getElementById("btnNewRecipe");
    const bookSearchInput = document.getElementById("bookSearchInput");
    const recipeBookGrid = document.getElementById("recipeBookGrid");

    // A4 뷰어 요소
    const rowItalianoName = document.getElementById("rowItalianoName");
    const rowEnglishName = document.getElementById("rowEnglishName");
    const rowKoreaName = document.getElementById("rowKoreaName");
    const viewTitle = document.getElementById("viewTitle");
    const viewItaliano = document.getElementById("viewItaliano");
    const viewEnglish = document.getElementById("viewEnglish");
    const viewKorea = document.getElementById("viewKorea");
    const viewPhotoImg = document.getElementById("viewPhotoImg");
    const viewCategory = document.getElementById("viewCategory");
    const viewDate = document.getElementById("viewDate");
    const viewCost = document.getElementById("viewCost");
    const viewPrice = document.getElementById("viewPrice");
    const viewPortion = document.getElementById("viewPortion");
    const viewIngredientsTbody = document.getElementById("viewIngredientsTbody");
    const viewCaution = document.getElementById("viewCaution");

    // ----------------------------------------------------
    // 2. 탭 전환 기능
    // ----------------------------------------------------
    function switchTab(targetTabId) {
        navTabs.forEach(tab => {
            if (tab.dataset.tab === targetTabId) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });

        tabPanes.forEach(pane => {
            if (pane.id === targetTabId) {
                pane.classList.add("active");
            } else {
                pane.classList.remove("active");
            }
        });

        // 탭 전환 시 필요한 최신 데이터 갱신
        if (targetTabId === "tab-book") {
            renderRecipeBookList();
        } else if (targetTabId === "tab-preview") {
            syncFormToPreview();
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    navTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            switchTab(tab.dataset.tab);
        });
    });

    // ----------------------------------------------------
    // 3. 재료 항목 동적 생성 (드롭다운 & 삭제 버튼 지원)
    // ----------------------------------------------------
    /**
     * 단위 선택 드롭다운 HTML 생성
     */
    function createUnitSelectElement(selectedUnit = "g") {
        const select = document.createElement("select");
        select.className = "ing-unit-select";
        select.title = "단위 선택";

        RECIPE_UNITS.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u.value;
            opt.textContent = u.label;
            if (u.value.toLowerCase() === (selectedUnit || "").toLowerCase()) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });

        select.addEventListener("change", syncFormToPreview);
        return select;
    }

    /**
     * 🌐 단어 및 문장 스마트 번역 선택 팝업창 공통 헬퍼
     * (재료, 토핑, 시그니처 등 모든 입력 필드에서 공통 사용)
     * - 한국어 ➔ 영어/이탈리아어 변환뿐만 아니라,
     * - 영어/이탈리아어로 된 단어를 언제든 다시 '🇰🇷 한국어'로 되돌릴 수 있습니다.
     */
    async function showTranslatePopover(targetInput, triggerBtn, sectionLabel = "항목") {
        const currentVal = targetInput.value.trim();
        if (!currentVal) {
            alert(`${sectionLabel} 내용을 먼저 입력해주세요! (예: 대파 또는 Green Onion) 😊`);
            targetInput.focus();
            return;
        }

        // 기존에 열려있는 팝업 정리
        document.querySelectorAll(".translate-popover-menu").forEach(p => p.remove());

        const originalBtnText = triggerBtn.textContent;
        triggerBtn.textContent = "⏳";

        try {
            // 어떤 언어가 입력되었든 한국어, 영어, 이탈리아어 3개 언어를 한꺼번에 스마트 산출
            const langResult = await ChefTranslator.translateAllLanguages(currentVal);
            const koVal = langResult.korean || currentVal;
            const enVal = langResult.english || currentVal;
            const itVal = langResult.italiano || currentVal;

            const popover = document.createElement("div");
            popover.className = "translate-popover-menu";

            const popTitle = document.createElement("div");
            popTitle.className = "translate-popover-title";
            const previewTitle = currentVal.length > 16 ? currentVal.substring(0, 16) + "..." : currentVal;
            popTitle.textContent = `"${previewTitle}" 언어 변환 선택`;
            popover.appendChild(popTitle);

            // 1) 🇰🇷 한국어 (Korean) - 영어나 이탈리아어에서 언제든 한국어로 원상복구!
            const btnKo = document.createElement("button");
            btnKo.type = "button";
            btnKo.className = "translate-popover-item popover-item-ko";
            btnKo.innerHTML = `
                <span class="translate-popover-lang" style="color: #059669;">🇰🇷 한국어 (Korean)</span>
                <span class="translate-popover-val">${koVal}</span>
            `;
            btnKo.addEventListener("click", () => {
                if (koVal) {
                    targetInput.value = koVal;
                    syncFormToPreview();
                }
                popover.remove();
            });
            popover.appendChild(btnKo);

            // 2) 🇬🇧 영어 (English)
            const btnEn = document.createElement("button");
            btnEn.type = "button";
            btnEn.className = "translate-popover-item";
            btnEn.innerHTML = `
                <span class="translate-popover-lang">🇬🇧 영어 (English)</span>
                <span class="translate-popover-val">${enVal}</span>
            `;
            btnEn.addEventListener("click", () => {
                if (enVal) {
                    targetInput.value = enVal;
                    syncFormToPreview();
                }
                popover.remove();
            });
            popover.appendChild(btnEn);

            // 3) 🇮🇹 이탈리아어 (Italiano)
            const btnIt = document.createElement("button");
            btnIt.type = "button";
            btnIt.className = "translate-popover-item";
            btnIt.innerHTML = `
                <span class="translate-popover-lang">🇮🇹 이탈리아어 (Italiano)</span>
                <span class="translate-popover-val">${itVal}</span>
            `;
            btnIt.addEventListener("click", () => {
                if (itVal) {
                    targetInput.value = itVal;
                    syncFormToPreview();
                }
                popover.remove();
            });
            popover.appendChild(btnIt);

            // 화면 바깥 클릭 시 닫기
            const closeHandler = () => {
                popover.remove();
                document.removeEventListener("click", closeHandler);
            };
            setTimeout(() => {
                document.addEventListener("click", closeHandler);
            }, 50);

            document.body.appendChild(popover);
            const rect = triggerBtn.getBoundingClientRect();
            popover.style.top = `${window.scrollY + rect.bottom + 6}px`;
            popover.style.left = `${Math.max(10, window.scrollX + rect.left - 80)}px`;

        } catch (err) {
            console.error(`${sectionLabel} 번역 오류:`, err);
            alert("번역 중 문제가 발생했습니다: " + err.message);
        } finally {
            triggerBtn.textContent = originalBtnText;
        }
    }

    /**
     * 재료 입력 행 1줄 생성 (모바일 최적화 & 원클릭 영어/이탈리아어 자동 변환기 내장)
     */
    function addIngredientRow(name = "", amount = "", unit = "g") {
        const row = document.createElement("div");
        row.className = "ingredient-item-row";

        // 재료명 인풋 (예: 대파, 양파, 마늘 등)
        const inputName = document.createElement("input");
        inputName.type = "text";
        inputName.className = "ing-name-input";
        inputName.placeholder = "재료명 (예: 대파)";
        inputName.value = name;
        inputName.addEventListener("input", syncFormToPreview);

        // 🌐 개별 단어 번역 버튼 (클릭 시 영어 / 이탈리아어 중 선택 가능)
        const btnTranslate = document.createElement("button");
        btnTranslate.type = "button";
        btnTranslate.className = "btn-mini-translate";
        btnTranslate.textContent = "🌐";
        btnTranslate.title = "한글 재료명을 영어 또는 이탈리아어로 변환";
        btnTranslate.addEventListener("click", (e) => {
            e.stopPropagation();
            showTranslatePopover(inputName, btnTranslate, "재료명");
        });

        // 용량 인풋
        const inputAmount = document.createElement("input");
        inputAmount.type = "text";
        inputAmount.className = "ing-amount-input";
        inputAmount.placeholder = "수량";
        inputAmount.value = amount;
        inputAmount.addEventListener("input", syncFormToPreview);

        // 단위 선택 드롭다운 (밥숟가락, 한 꼬집, 종이컵, g, Oz 등)
        const selectUnit = createUnitSelectElement(unit);

        // 삭제 버튼
        const btnRemove = document.createElement("button");
        btnRemove.type = "button";
        btnRemove.className = "btn-remove-ing";
        btnRemove.textContent = "✕";
        btnRemove.title = "이 재료 삭제";
        btnRemove.addEventListener("click", () => {
            if (ingredientItemsContainer.querySelectorAll(".ingredient-item-row").length <= 1) {
                alert("최소 1개 이상의 재료 칸이 필요합니다.");
                return;
            }
            row.remove();
            syncFormToPreview();
        });

        row.appendChild(inputName);
        row.appendChild(btnTranslate);
        row.appendChild(inputAmount);
        row.appendChild(selectUnit);
        row.appendChild(btnRemove);

        ingredientItemsContainer.appendChild(row);
        syncFormToPreview();
    }

    formBtnAddIngredient.addEventListener("click", () => {
        addIngredientRow("", "", "g");
        saveBaseIngredientsState();
    });

    // ----------------------------------------------------
    // 3-0. 스마트 인분 배율 변환기 (본래 작성 인분 절대 기준 연동)
    // ----------------------------------------------------
    function extractPortionNumber(str) {
        if (!str) return 1;
        const matches = str.match(/\d+(\.\d+)?/);
        return matches ? parseFloat(matches[0]) : 1;
    }

    // 작성자가 입력한 원래 재료 수량과 인분을 '절대 기본값'으로 스냅샷 저장
    function saveBaseIngredientsState() {
        baseIngredientsState = [];
        const rows = ingredientItemsContainer.querySelectorAll(".ingredient-item-row");
        rows.forEach(r => {
            const name = r.querySelector(".ing-name-input")?.value || "";
            const amount = r.querySelector(".ing-amount-input")?.value || "";
            const unit = r.querySelector(".ing-unit-select")?.value || "";
            baseIngredientsState.push({ name, amount, unit });
        });
        const numVal = formPortionNum ? parseFloat(formPortionNum.value) : 1;
        basePortionCount = (!isNaN(numVal) && numVal > 0) ? numVal : 1;
        if (scalerCurrentPortionText) {
            scalerCurrentPortionText.textContent = basePortionCount;
        }
    }

    // 목표 인분에 맞게 비례 변환 (목표 인분 ÷ 본래 기본 인분)
    function scaleIngredientsTo(targetPortion) {
        const target = parseFloat(targetPortion);
        if (!target || target <= 0) {
            alert("유효한 인분 숫자를 입력해주세요. (예: 2, 4, 10, 50)");
            return;
        }

        // 기준 인분이 없으면 현재 인분에서 추출
        if (!basePortionCount || basePortionCount <= 0) {
            const numVal = formPortionNum ? parseFloat(formPortionNum.value) : 1;
            basePortionCount = (!isNaN(numVal) && numVal > 0) ? numVal : 1;
        }

        // 비례 배율 = 목표 인분 / 본래 기준 인분 (예: 4인분 요리에서 10인분 선택 시 10/4 = 2.5배!)
        const multiplier = target / basePortionCount;
        const rows = ingredientItemsContainer.querySelectorAll(".ingredient-item-row");

        rows.forEach((r, idx) => {
            const inputAmount = r.querySelector(".ing-amount-input");
            if (!inputAmount) return;

            // 본래 기본 레시피의 수량 기준
            const origVal = (baseIngredientsState[idx] && baseIngredientsState[idx].amount) 
                ? baseIngredientsState[idx].amount.trim() 
                : inputAmount.value.trim();

            const num = parseFloat(origVal);
            if (!isNaN(num) && isFinite(num)) {
                // 비례 계산 후 소수점 2자리 반올림
                const scaled = Math.round(num * multiplier * 100) / 100;
                inputAmount.value = scaled;
            }
        });

        // 현재 조리 인분 숫자만 갱신 (사용자가 지울 필요 없음)
        if (formPortionNum) formPortionNum.value = target;

        // 퀵 버튼 활성화 표시
        document.querySelectorAll(".btn-scale").forEach(b => {
            if (parseFloat(b.dataset.scale) === target) {
                b.classList.add("active");
            } else {
                b.classList.remove("active");
            }
        });

        document.querySelectorAll(".btn-scale-mul").forEach(b => {
            if (parseFloat(b.dataset.mul) === multiplier) {
                b.classList.add("active");
            } else {
                b.classList.remove("active");
            }
        });

        if (previewPortionSelect) {
            previewPortionSelect.value = target.toString();
        }

        syncFormToPreview();
    }

    // 원래 기본 양으로 100% 복원 (1인분이 아닌 본래 작성 기준 인분으로 복원!)
    function resetIngredientsScale() {
        if (!baseIngredientsState || baseIngredientsState.length === 0) return;

        const rows = ingredientItemsContainer.querySelectorAll(".ingredient-item-row");
        rows.forEach((r, idx) => {
            const inputAmount = r.querySelector(".ing-amount-input");
            if (inputAmount && baseIngredientsState[idx]) {
                inputAmount.value = baseIngredientsState[idx].amount;
            }
        });

        // 1인분이 아닌, 원래 기본 인분(2인, 4인 등)으로 완벽 복원!
        if (formPortionNum) formPortionNum.value = basePortionCount;
        if (scalerCurrentPortionText) {
            scalerCurrentPortionText.textContent = basePortionCount;
        }

        document.querySelectorAll(".btn-scale").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".btn-scale-mul").forEach(b => b.classList.remove("active"));
        if (previewPortionSelect) {
            previewPortionSelect.value = basePortionCount.toString();
        }

        syncFormToPreview();
    }

    // 1. 배율 퀵 버튼 (x2배, x3배, x5배, x10배, x20배)
    document.querySelectorAll(".btn-scale-mul").forEach(btn => {
        btn.addEventListener("click", () => {
            const factor = parseFloat(btn.dataset.mul);
            const target = basePortionCount * factor;
            scaleIngredientsTo(target);
        });
    });

    // 2. 인분 지정 퀵 버튼 (2인, 4인, 6인, 10인, 20인, 50인 등)
    document.querySelectorAll(".btn-scale").forEach(btn => {
        btn.addEventListener("click", () => {
            scaleIngredientsTo(btn.dataset.scale);
        });
    });

    // 3. 직접 입력 인분 적용
    if (btnApplyCustomScale) {
        btnApplyCustomScale.addEventListener("click", () => {
            const customVal = scalerCustomInput ? scalerCustomInput.value.trim() : "";
            if (customVal) {
                scaleIngredientsTo(customVal);
            }
        });
    }

    // 4. 원래 기본량으로 복원
    if (btnResetScale) {
        btnResetScale.addEventListener("click", resetIngredientsScale);
    }

    // 5. 미리보기 화면 인분 선택
    if (previewPortionSelect) {
        previewPortionSelect.addEventListener("change", (e) => {
            scaleIngredientsTo(e.target.value);
        });
    }

    // 작성자가 PORTION 필드를 수정할 때 본래 기준 인분 자동 갱신
    if (formPortionNum) {
        formPortionNum.addEventListener("change", () => {
            saveBaseIngredientsState();
            syncFormToPreview();
        });
        formPortionNum.addEventListener("input", syncFormToPreview);
    }

    if (formPortionUnit) {
        formPortionUnit.addEventListener("change", syncFormToPreview);
    }

    // ----------------------------------------------------
    // ⭐ 안전한 편집 환경 보장: 클릭 시 기존 내용이 절대 날아가지 않음!
    // 사용자가 원하는 위치에 커서를 두고 안전하게 오타나 문장을 수정할 수 있습니다.
    // ----------------------------------------------------

    // ----------------------------------------------------
    // 3-0. 조리 순서(Cooking Steps) 자동 번호 관리 (1., 2., 3...)
    // ----------------------------------------------------
    function reindexCookingSteps() {
        const rows = cookingStepsContainer.querySelectorAll(".cooking-step-row");
        rows.forEach((row, idx) => {
            const badge = row.querySelector(".step-num-badge");
            if (badge) {
                badge.textContent = `${idx + 1}.`;
            }
        });
        syncFormToPreview();
    }

    function addCookingStepRow(desc = "") {
        // 기존 텍스트에 이미 "1. ", "2." 같은 숫자가 붙어있으면 제거하고 순수 내용만 추출
        const cleanDesc = desc.replace(/^\s*\d+\s*[\.\)]\s*/, "").trim();

        const row = document.createElement("div");
        row.className = "cooking-step-row";

        const currentCount = cookingStepsContainer.querySelectorAll(".cooking-step-row").length;

        // 자동 순번 배지 (1., 2., 3...)
        const badge = document.createElement("span");
        badge.className = "step-num-badge";
        badge.textContent = `${currentCount + 1}.`;

        // 조리 내용 입력란
        const textarea = document.createElement("textarea");
        textarea.className = "step-desc-input";
        textarea.rows = 2;
        textarea.placeholder = `${currentCount + 1}단계 요리 과정 입력`;
        textarea.value = cleanDesc;
        textarea.addEventListener("input", syncFormToPreview);

        // 삭제 버튼
        const btnRemove = document.createElement("button");
        btnRemove.type = "button";
        btnRemove.className = "btn-remove-step";
        btnRemove.textContent = "✕";
        btnRemove.title = "이 조리 단계 삭제";
        btnRemove.addEventListener("click", () => {
            if (cookingStepsContainer.querySelectorAll(".cooking-step-row").length <= 1) {
                alert("최소 1개 이상의 조리 단계가 필요합니다.");
                return;
            }
            row.remove();
            reindexCookingSteps(); // 삭제 후 번호 1, 2, 3 자동 재정렬!
        });

        row.appendChild(badge);
        row.appendChild(textarea);
        row.appendChild(btnRemove);

        cookingStepsContainer.appendChild(row);
        syncFormToPreview();
    }

    if (formBtnAddCookingStep) {
        formBtnAddCookingStep.addEventListener("click", () => {
            addCookingStepRow("");
        });
    }

    // ----------------------------------------------------
    // [100% 오프라인] 조리법 자연어 핵심 요약 정돈 알고리즘
    // 사용자가 작성한 문장의 핵심(재료·시간·불조절)을 그대로 보존하면서
    // 늘어지는 구어체와 잔말을 프로 셰프 표준 문장으로 압축 정돈합니다.
    // ----------------------------------------------------
    function summarizeCookingStep(text) {
        if (!text || !text.trim()) return "";
        let s = text.trim();

        // 0. 앞머리에 수동으로 적은 번호(예: "1.", "1단계:") 중복 제거 (시스템이 자동 번호 부여)
        s = s.replace(/^\s*(\d+[\.\)]|단계\s*\d+[\.:]?|\d+단계[\.:]?)\s*/, "");

        // 1. 불필요한 접속사 및 군더더기 서두 제거
        s = s.replace(/^(이후|그\s*다음(에)?|그리고\s*나서|그런\s*다음|이때(도)?|또한|우선|먼저)\s*[,·]?\s*/g, "");
        s = s.replace(/(되도록(이면)?|가급적|가능하면)\s*/g, "");

        // 2. 시간 범위 표현 정돈 (앞단위 생략 규칙: 10분~20분 -> 10~20분, 1시간~2시간 -> 1~2시간)
        s = s.replace(/(\d+)\s*~\s*1시간\s*(\d+)분/g, (m, p1, p2) => `${p1}~${60 + parseInt(p2, 10)}분`);
        s = s.replace(/(\d+)\s*분\s*([~-])\s*(\d+)\s*분/g, "$1$2$3분");
        s = s.replace(/(\d+)\s*시간\s*([~-])\s*(\d+)\s*시간/g, "$1$2$3시간");

        // 3. 구어체 / 늘어지는 표현 ➔ 주방 현장 표준 개조식 표현으로 축약
        // (~이상, ~간, ~정도 표현은 사용자의 작성 맥락을 그대로 존중하여 유지)
        s = s.replace(/핏물\s*빼주기\s*(\d+시간)\s*(정도|이상|가량)?/g, (m, p1, p2) => {
            const suffix = p2 ? (p2 === "가량" ? "정도" : p2) : "이상";
            return `찬물에 ${p1} ${suffix} 담궈 핏물을 완전히 제거한다`;
        });
        s = s.replace(/담가/g, "담궈");

        s = s.replace(/쎈불로\s*(한다|조리한다)|센불로\s*(한다|조리한다)|강한\s*불로\s*(한다|끓인다)/g, "강불로 끓인다");
        s = s.replace(/약한\s*불로\s*(한다|끓인다)|약불로\s*(한다|조리한다)/g, "약불로 끓인다");
        s = s.replace(/중간\s*불로\s*(한다|끓인다)|중불로\s*(한다|조리한다)/g, "중불로 끓인다");

        s = s.replace(/빼는\s*용도로\s*시간은\s*정해져\s*있지\s*않고\s*물이\s*끓어\s*오를\s*때\s*까지\s*하면\s*적당/g, "불순물과 기름을 초벌 제거한다");
        s = s.replace(/물이\s*끓어\s*오를\s*때까지\s*끓여준다/g, "한소끔 끓여 초벌 삶아낸다");
        s = s.replace(/다\s*풀고\s*남은\s*건더기는\s*버린다\s*그래야\s*국물이\s*지저분하지\s*않게\s*된다/g, "건더기 제거");
        s = s.replace(/거품과\s*기름은\s*수시로\s*확인하고\s*모두\s*걸러준다\s*그래야\s*국물이\s*(탁하지\s*않고\s*)?깔끔해진다/g, "거품·기름 수시 제거");
        s = s.replace(/이때도\s*수시로\s*거품과\s*기름을\s*확인하고\s*걸러주는것이\s*중요하다/g, "거품·기름 수시 제거");
        s = s.replace(/단배추\s*먹기\s*좋게\s*숨이\s*죽을\s*때까지/g, "숨이 부드럽게 죽을 때까지");
        s = s.replace(/물을\s*먼저\s*받아\s*끓이면서\s*하면\s*더\s*수월함/g, "물 선가열 권장");
        s = s.replace(/물에\s*담궈\s*놓는것이\s*권장/g, "냉장 침지 권장");

        // 4. 튀김 요리(돈까스, 치킨, 윙 등) 전용 정확한 조리 표현 정돈
        s = s.replace(/기름에\s*(바삭하게\s*)?튀겨\s*(준다|줍니다|주세요)/g, "기름에 바삭하게 튀겨낸다");
        s = s.replace(/기름을\s*빼\s*준다|기름을\s*빼줍니다/g, "기름을 뺀다");
        s = s.replace(/튀겨서\s*기름을\s*(뺀다|털어낸다)/g, "바삭하게 튀겨 기름을 뺀다");
        s = s.replace(/노릇하게\s*튀겨\s*(준다|줍니다)/g, "노릇하게 튀겨 건져낸다");
        s = s.replace(/튀겨\s*준다|튀겨줍니다|튀겨\s*주세요/g, "바삭하게 튀겨낸다");

        // 5. 종결어미 및 동작어 표준화
        s = s.replace(/끓여\s*준다|끓여줍니다|끓여\s*주세요/g, "끓인다");
        s = s.replace(/더\s*끓여\s*완성한다|더\s*끓여\s*완성합니다/g, "더 끓여 완성한다");
        s = s.replace(/저어\s*준다|저어줍니다|저어\s*주세요/g, "고루 젓는다");
        s = s.replace(/넣어\s*준다|넣어줍니다|넣어\s*주세요/g, "넣는다");
        s = s.replace(/볶아\s*준다|볶아줍니다|볶아\s*주세요/g, "볶는다");
        s = s.replace(/삶아\s*준다|삶아줍니다|삶아\s*주세요/g, "삶는다");
        s = s.replace(/조려\s*준다|조려줍니다|조려\s*주세요/g, "조린다");
        s = s.replace(/졸여\s*준다|졸여줍니다|졸여\s*주세요/g, "조린다");
        s = s.replace(/예열해\s*둔다|예열해둡니다/g, "예열한다");
        s = s.replace(/구워\s*준다|구워줍니다|구워\s*주세요/g, "굽는다");
        s = s.replace(/데쳐\s*준다|데쳐줍니다|데쳐\s*주세요/g, "데친다");
        s = s.replace(/부어\s*준다|부어줍니다|부어\s*주세요/g, "붓는다");
        s = s.replace(/식혀\s*준다|식혀줍니다|식혀\s*주세요/g, "한 김 식힌다");
        s = s.replace(/준비해\s*둔다|준비해둡니다|준비해\s*두세요/g, "준비한다");
        s = s.replace(/씻어\s*불순물\s*제거(\.)?/g, "씻어 불순물을 제거한다.");
        s = s.replace(/깨끗이\s*씻어\s*둔다/g, "깨끗이 헹궈 씻어둔다");

        // 5. 괄호 및 쉼표 문장부호 정돈
        s = s.replace(/\[\s*/g, "(").replace(/\s*\]/g, ")");
        s = s.replace(/\s+/g, " ");
        s = s.replace(/,\s*,/g, ",");
        s = s.replace(/\.\s*\./g, ".");

        if (!s.endsWith(".") && !s.endsWith(")") && !s.endsWith("]")) {
            s += ".";
        }

        return s.trim();
    }

    // [조리법 핵심 요약 정리] 버튼 클릭 이벤트 (100% 완전 오프라인 즉시 정돈)
    if (btnSummarizeCooking) {
        btnSummarizeCooking.addEventListener("click", () => {
            const stepInputs = cookingStepsContainer.querySelectorAll(".step-desc-input");
            if (!stepInputs || stepInputs.length === 0) {
                alert("정리할 조리 순서가 없습니다. 먼저 조리 내용을 작성해주세요! 😊");
                return;
            }

            let count = 0;
            stepInputs.forEach(input => {
                const original = input.value;
                if (original && original.trim()) {
                    const summarized = summarizeCookingStep(original);
                    if (summarized && summarized !== original) {
                        input.value = summarized;
                        count++;
                    }
                }
            });

            syncFormToPreview();

            if (count > 0) {
                alert(`✨ 조리법 ${count}개 단계의 핵심 요약 정리가 완료되었습니다!\n(A4 인쇄 규격에 딱 맞는 프로 셰프 스타일로 단정하게 반영되었습니다)`);
            } else {
                alert("✨ 이미 모든 조리법이 핵심 문장으로 잘 정돈되어 있습니다!");
            }
        });
    }

    // ----------------------------------------------------
    // [100% 오프라인] 주의사항(CAUTION) 자연어 핵심 요약 정돈 알고리즘
    // 사용자가 길게 작성한 주의사항에서 잔말과 구어체를 없애고
    // 주방 실전 표준 안전/품질 수칙으로 간결하고 단호하게 압축합니다.
    // ----------------------------------------------------
    function summarizeCaution(text) {
        if (!text || !text.trim()) return "";
        let s = text.trim();

        // 0. 앞머리에 수동으로 적은 기호나 번호 보존 (※, ★, 💡, 1. 등)
        const prefixMatch = s.match(/^([★※💡📌✔▶■\-\d\.\)]+)\s*/);
        let prefix = "";
        if (prefixMatch) {
            prefix = prefixMatch[1] + " ";
            s = s.substring(prefixMatch[0].length);
        }

        // 1. 불필요한 접속사 및 설명조 서두 제거
        s = s.replace(/^(특히|주의할\s*점은|반드시\s*기억해야\s*할\s*것은|참고로|추가로|조리\s*시\s*주의사항은|알아둘\s*점은)\s*[,·]?\s*/g, "");
        s = s.replace(/(되도록(이면)?|가급적|가능하면)\s*/g, "");

        // 2. 끓어넘침 및 불조절 표현 정돈
        s = s.replace(/국물이\s*끓어넘치지\s*않도록\s*불\s*조절에\s*주의하며\s*[,·]?\s*거품과\s*기름을\s*수시로\s*걷어내야\s*국물이\s*맑고\s*깊어집니다/g, "끓어넘침 방지 불 조절 유의, 거품·기름 수시 제거로 맑은 국물 유지");
        s = s.replace(/국물이\s*끓어넘치지\s*(않게|않도록)\s*(주의하고|주의하며|유의하고)/g, "끓어넘침 방지 불 조절 유의하고");
        s = s.replace(/불\s*조절에\s*주의(하고|하며|하여|해야\s*한다)/g, "불 조절에 각별히 유의한다");
        s = s.replace(/거품과\s*기름을\s*수시로\s*(걷어내야|제거해야)\s*국물이\s*(맑아진다|깔끔해진다)/g, "거품·기름을 수시로 걷어내어 맑은 국물을 유지한다");

        // 3. 온도, 화상, 안전 수칙 정돈
        s = s.replace(/(기름이나\s*국물이\s*튀어\s*)?뜨거우니\s*화상에\s*주의(하세요|하십시오|해주세요)/g, "고온 화상 위험에 각별히 유의한다");
        s = s.replace(/손이나\s*옷에\s*튀지\s*않도록\s*(조심해서\s*다뤄야\s*합니다|주의하세요)/g, "내용물 튐에 의한 화상에 각별히 유의한다");
        s = s.replace(/칼이나\s*도구를\s*사용할\s*때\s*다치지\s*않게\s*주의/g, "조리 도구 사용 시 안전사고에 유의한다");

        // 4. 보관, 위생, 변질 방지 정돈
        s = s.replace(/보관할\s*때는\s*냉장보관을\s*해야\s*변질되지\s*않습니다/g, "변질 방지를 위해 반드시 냉장 보관한다");
        s = s.replace(/상온에\s*오래\s*두면\s*(상할\s*수\s*있으니|변질되니)/g, "변질 우려가 있으므로 상온 방치를 금하고");
        s = s.replace(/한\s*김\s*식혀서\s*냉장\s*보관\s*(해주세요|하십시오|합니다)/g, "한 김 식힌 후 즉시 냉장 보관한다");

        // 5. 간 및 염도, 품질 체크 정돈
        s = s.replace(/스톡의\s*농도와\s*간을\s*반드시\s*조리\s*전에\s*체크할\s*것/g, "스톡 농도와 간을 조리 전 필히 체크한다");
        s = s.replace(/간이\s*너무\s*세지(지\s*않도록|지\s*않게)\s*수시로\s*맛을\s*보면서\s*조절(해야\s*합니다|해주세요)/g, "간이 세지지 않도록 수시로 염도를 체크하며 조절한다");
        s = s.replace(/적어도\s*(\d+)가지\s*이상의\s*([^\s]+)을\s*사용해야\s*한다/g, "최소 $1가지 이상의 $2을 필히 사용한다");

        // 6. 종결어미 및 서술어 표준화 (~한다 / ~유의한다)
        s = s.replace(/주의해야\s*합니다|주의해야\s*한다|주의해주세요|주의하세요|주의바랍니다/g, "유의한다");
        s = s.replace(/조심해야\s*합니다|조심해야\s*한다|조심해주세요|조심하세요/g, "각별히 조심한다");
        s = s.replace(/확인해야\s*합니다|확인해야\s*한다|확인해주세요|확인하세요/g, "필히 확인한다");
        s = s.replace(/체크해야\s*합니다|체크해야\s*한다|체크해주세요|체크하세요/g, "필히 체크한다");
        s = s.replace(/넣어야\s*합니다|넣어야\s*한다|넣어주세요/g, "넣는다");
        s = s.replace(/버려야\s*합니다|버려야\s*한다|버려주세요/g, "폐기한다");

        // 7. 부호 및 공백 정돈
        s = s.replace(/\s+/g, " ");
        s = s.replace(/,\s*,/g, ",");
        s = s.replace(/\.\s*\./g, ".");

        if (!s.endsWith(".") && !s.endsWith(")") && !s.endsWith("]")) {
            s += ".";
        }

        return prefix + s.trim();
    }

    // [주의사항 핵심 요약 정리] 버튼 클릭 이벤트 (100% 완전 오프라인 즉시 정돈)
    if (btnSummarizeCaution) {
        btnSummarizeCaution.addEventListener("click", () => {
            const cautionInputs = cautionItemsContainer.querySelectorAll(".caution-item-input");
            if (!cautionInputs || cautionInputs.length === 0) {
                alert("정리할 주의사항 항목이 없습니다. 먼저 주의사항을 작성해주세요! 😊");
                return;
            }

            let count = 0;
            cautionInputs.forEach(input => {
                const original = input.value;
                if (original && original.trim()) {
                    const summarized = summarizeCaution(original);
                    if (summarized && summarized !== original) {
                        input.value = summarized;
                        count++;
                    }
                }
            });

            syncFormToPreview();

            if (count > 0) {
                alert(`✨ 주의사항 ${count}개 항목의 핵심 요약 정리가 완료되었습니다!\n(주방 핵심 안전·품질 수칙으로 단정하게 반영되었습니다)`);
            } else {
                alert("✨ 이미 모든 주의사항이 핵심 수칙으로 잘 정돈되어 있습니다!");
            }
        });
    }

    // ----------------------------------------------------
    // 토핑, 시그니처, 주의사항 중 현재 활성화(클릭/포커스)된 입력 행 추적
    // ----------------------------------------------------
    const activeSectionInputs = {
        topping: null,
        signature: null,
        caution: null
    };

    // ----------------------------------------------------
    // 3-1. 토핑(Topping) 항목 동적 생성 (줄 추가 & 삭제 & 🌐 번역 지원)
    // ----------------------------------------------------
    function addToppingRow(text = "") {
        const row = document.createElement("div");
        row.className = "topping-item-row";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "topping-item-input";
        input.placeholder = "토핑 내용 입력 (예: Pepper Corn, Tomato Concasse 20g)";
        input.value = text;
        input.addEventListener("input", syncFormToPreview);

        // 🌐 토핑 번역 변환 버튼 (영어 / 이탈리아어)
        const btnTranslate = document.createElement("button");
        btnTranslate.type = "button";
        btnTranslate.className = "btn-mini-translate";
        btnTranslate.textContent = "🌐";
        btnTranslate.title = "토핑 내용을 영어 또는 이탈리아어로 변환";
        btnTranslate.addEventListener("click", (e) => {
            e.stopPropagation();
            showTranslatePopover(input, btnTranslate, "토핑");
        });

        const btnRemove = document.createElement("button");
        btnRemove.type = "button";
        btnRemove.className = "btn-remove-topping";
        btnRemove.textContent = "✕";
        btnRemove.title = "이 토핑 줄 삭제";
        btnRemove.addEventListener("click", () => {
            row.remove();
            if (activeSectionInputs.topping === input) {
                activeSectionInputs.topping = null;
            }
            syncFormToPreview();
        });

        row.appendChild(input);
        row.appendChild(btnTranslate);
        row.appendChild(btnRemove);

        toppingItemsContainer.appendChild(row);
        activeSectionInputs.topping = input;
        syncFormToPreview();
    }

    if (formBtnAddTopping) {
        formBtnAddTopping.addEventListener("click", () => {
            addToppingRow("");
        });
    }

    // ----------------------------------------------------
    // 3-2. 주의사항(CAUTION) 항목 동적 생성 (줄 추가 & 삭제 지원)
    // ----------------------------------------------------
    function addCautionRow(text = "") {
        const row = document.createElement("div");
        row.className = "caution-item-row";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "caution-item-input";
        input.placeholder = "주의사항 입력 (예: 적어도 4가지 이상의 버섯을 사용해야 한다.)";
        input.value = text;
        input.addEventListener("input", syncFormToPreview);

        // 🌐 주의사항 번역 변환 버튼 (영어 / 이탈리아어)
        const btnTranslate = document.createElement("button");
        btnTranslate.type = "button";
        btnTranslate.className = "btn-mini-translate";
        btnTranslate.textContent = "🌐";
        btnTranslate.title = "주의사항을 영어 또는 이탈리아어로 변환";
        btnTranslate.addEventListener("click", (e) => {
            e.stopPropagation();
            showTranslatePopover(input, btnTranslate, "주의사항");
        });

        const btnRemove = document.createElement("button");
        btnRemove.type = "button";
        btnRemove.className = "btn-remove-caution";
        btnRemove.textContent = "✕";
        btnRemove.title = "이 주의사항 줄 삭제";
        btnRemove.addEventListener("click", () => {
            row.remove();
            if (activeSectionInputs.caution === input) {
                activeSectionInputs.caution = null;
            }
            syncFormToPreview();
        });

        row.appendChild(input);
        row.appendChild(btnTranslate);
        row.appendChild(btnRemove);

        cautionItemsContainer.appendChild(row);
        activeSectionInputs.caution = input;
        syncFormToPreview();
    }

    if (formBtnAddCaution) {
        formBtnAddCaution.addEventListener("click", () => {
            addCautionRow("");
        });
    }

    // ----------------------------------------------------
    // 3-3. 시그니처(SIGNATURE) 항목 동적 생성 (줄 추가/삭제 & On/Off & 🌐 번역 지원)
    // ----------------------------------------------------
    function addSignatureRow(text = "") {
        const row = document.createElement("div");
        row.className = "signature-item-row";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "signature-item-input";
        input.placeholder = "시그니처 비법/특색 입력 (예: ★ 3년 숙성 특제 발사믹 글레이즈)";
        input.value = text;
        input.addEventListener("input", syncFormToPreview);

        // 🌐 시그니처 번역 변환 버튼 (영어 / 이탈리아어)
        const btnTranslate = document.createElement("button");
        btnTranslate.type = "button";
        btnTranslate.className = "btn-mini-translate";
        btnTranslate.textContent = "🌐";
        btnTranslate.title = "시그니처 내용을 영어 또는 이탈리아어로 변환";
        btnTranslate.addEventListener("click", (e) => {
            e.stopPropagation();
            showTranslatePopover(input, btnTranslate, "시그니처");
        });

        const btnRemove = document.createElement("button");
        btnRemove.type = "button";
        btnRemove.className = "btn-remove-signature";
        btnRemove.textContent = "✕";
        btnRemove.title = "이 시그니처 줄 삭제";
        btnRemove.addEventListener("click", () => {
            row.remove();
            if (activeSectionInputs.signature === input) {
                activeSectionInputs.signature = null;
            }
            syncFormToPreview();
        });

        row.appendChild(input);
        row.appendChild(btnTranslate);
        row.appendChild(btnRemove);

        signatureItemsContainer.appendChild(row);
        activeSectionInputs.signature = input;
        syncFormToPreview();
    }

    if (formBtnAddSignature) {
        formBtnAddSignature.addEventListener("click", () => {
            addSignatureRow("");
        });
    }

    // 시그니처 On/Off 체크박스 토글 이벤트
    if (formSignatureEnable) {
        formSignatureEnable.addEventListener("change", () => {
            const isEnabled = formSignatureEnable.checked;
            formBtnAddSignature.style.display = isEnabled ? "inline-flex" : "none";
            signatureControlsWrap.style.display = isEnabled ? "block" : "none";

            if (isEnabled && signatureItemsContainer.querySelectorAll(".signature-item-row").length === 0) {
                addSignatureRow("");
            }
            syncFormToPreview();
        });
    }

    // ----------------------------------------------------
    // 3-4. 강조 기호 (★, ※, 💡 등) 원클릭 빠른 삽입 이벤트
    // 사용자가 클릭한 바로 그 행(첫 번째 행이든 두 번째 행이든)에 정확하게 기호 삽입!
    // ----------------------------------------------------

    // 사용자가 토핑, 시그니처, 주의사항 입력창을 클릭하거나 포커스할 때 해당 행을 기억
    document.addEventListener("focusin", (e) => {
        if (!e.target) return;
        if (e.target.matches(".topping-item-input")) {
            activeSectionInputs.topping = e.target;
        } else if (e.target.matches(".signature-item-input")) {
            activeSectionInputs.signature = e.target;
        } else if (e.target.matches(".caution-item-input")) {
            activeSectionInputs.caution = e.target;
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target) return;
        if (e.target.matches(".topping-item-input")) {
            activeSectionInputs.topping = e.target;
        } else if (e.target.matches(".signature-item-input")) {
            activeSectionInputs.signature = e.target;
        } else if (e.target.matches(".caution-item-input")) {
            activeSectionInputs.caution = e.target;
        }
    });

    document.querySelectorAll(".symbol-quick-bar").forEach(bar => {
        const targetType = bar.dataset.target; // "topping", "signature", "caution"
        bar.querySelectorAll(".btn-sym").forEach(btn => {
            // 기호 버튼 클릭 시 인풋의 포커스와 커서 위치가 풀리지 않도록 기본동작 방지
            btn.addEventListener("mousedown", (e) => {
                e.preventDefault();
            });

            btn.addEventListener("click", () => {
                const sym = btn.dataset.sym + " ";
                let container = null;
                let inputSelector = "";

                if (targetType === "topping") {
                    container = toppingItemsContainer;
                    inputSelector = ".topping-item-input";
                } else if (targetType === "signature") {
                    container = signatureItemsContainer;
                    inputSelector = ".signature-item-input";
                } else if (targetType === "caution") {
                    container = cautionItemsContainer;
                    inputSelector = ".caution-item-input";
                }

                if (!container) return;

                const inputs = Array.from(container.querySelectorAll(inputSelector));
                if (inputs.length === 0) {
                    if (targetType === "topping") addToppingRow(sym);
                    else if (targetType === "signature") addSignatureRow(sym);
                    else if (targetType === "caution") addCautionRow(sym);
                    return;
                }

                // ⭐ 사용자가 클릭한 바로 그 행을 찾아 기호 삽입! (클릭한 행이 없으면 무조건 '첫 번째 행(inputs[0])'이 기본)
                let targetInput = activeSectionInputs[targetType];
                if (!targetInput || !container.contains(targetInput)) {
                    targetInput = inputs[0];
                }

                // 커서 위치 또는 맨 앞에 기호 삽입
                const startPos = (typeof targetInput.selectionStart === "number") ? targetInput.selectionStart : 0;
                const endPos = (typeof targetInput.selectionEnd === "number") ? targetInput.selectionEnd : 0;
                const currentVal = targetInput.value || "";

                if (startPos === 0 && endPos === 0) {
                    targetInput.value = sym + currentVal;
                    const nextPos = sym.length;
                    targetInput.setSelectionRange(nextPos, nextPos);
                } else {
                    targetInput.value = currentVal.substring(0, startPos) + sym + currentVal.substring(endPos);
                    const nextPos = startPos + sym.length;
                    targetInput.setSelectionRange(nextPos, nextPos);
                }

                targetInput.focus();
                activeSectionInputs[targetType] = targetInput;
                syncFormToPreview();
            });
        });
    });

    /**
     * [함수] 국가별 통화 기호 결합 포맷팅
     * 달러($), 유로(€), 파운드(£)는 앞에 붙이고 ($ 12.00)
     * 원(원), 엔(¥/엔), 위안(元)은 뒤에 붙여 자연스러운 표기 보장
     */
    function formatPriceWithCurrency(amountStr, currency) {
        if (!amountStr || !amountStr.trim()) return "";
        let clean = amountStr.trim();
        // 사용자가 이미 통화 기호를 같이 적었을 경우 기호 중복 방지
        clean = clean.replace(/[원$€¥元£\s]/g, "").trim();
        if (!clean) return "";

        if (currency === "$" || currency === "€" || currency === "£") {
            return `${currency} ${clean}`;
        } else if (currency === "¥") {
            return `¥ ${clean}`;
        } else {
            return `${clean} ${currency}`;
        }
    }

    // ----------------------------------------------------
    // 4. 입력 폼 데이터를 A4 실물 뷰어에 실시간 동기화
    // ----------------------------------------------------
    function syncFormToPreview() {
        try {
            // 기본 텍스트 동기화
            viewTitle.textContent = formTitle.value || "LA MANCHA RECIPE";
            viewItaliano.textContent = formItaliano.value || "";
            viewEnglish.textContent = formEnglish.value || "";
            viewKorea.textContent = formKorea.value || "";

            // 이탈리아어(원어) 행 온/오프 동기화
            if (checkUseItaliano) {
                const isItUsed = checkUseItaliano.checked;
                if (wrapItalianoInput) wrapItalianoInput.style.display = isItUsed ? "block" : "none";
                if (rowItalianoName) rowItalianoName.style.display = isItUsed ? "" : "none";
                if (rowEnglishName) {
                    if (!isItUsed) {
                        rowEnglishName.classList.add("first-visible-row");
                    } else {
                        rowEnglishName.classList.remove("first-visible-row");
                    }
                }
            }

            viewCategory.textContent = formCategory.value || "";
            viewDate.textContent = formDate.value || "";

            // 국가별 통화 선택을 반영한 가격 표시
            const costCurr = formCostCurrency ? formCostCurrency.value : "원";
            const priceCurr = formPriceCurrency ? formPriceCurrency.value : "원";
            viewCost.textContent = formatPriceWithCurrency(formCost.value, costCurr);
            viewPrice.textContent = formatPriceWithCurrency(formPrice.value, priceCurr);

            // PORTION (인분) 동기화 (숫자 + 단위 결합)
            const pNum = formPortionNum ? formPortionNum.value.trim() : "";
            const pUnit = formPortionUnit ? formPortionUnit.value.trim() : "인분";
            viewPortion.textContent = pNum ? `${pNum} ${pUnit}` : "";

            // 사진 동기화
            viewPhotoImg.src = currentPhotoData;
            formPhotoPreview.src = currentPhotoData;

            // 주의사항 동기화 (다중 줄 수집)
            const cautionInputs = cautionItemsContainer.querySelectorAll(".caution-item-input");
            const cautionTexts = [];
            cautionInputs.forEach(inp => {
                const val = inp.value.trim();
                if (val) cautionTexts.push(val);
            });
            viewCaution.innerText = cautionTexts.join("\n");

            // 재료 목록 수집
            const rows = ingredientItemsContainer.querySelectorAll(".ingredient-item-row");
            const ingredientsData = [];
            rows.forEach(r => {
                const name = r.querySelector(".ing-name-input")?.value.trim() || "";
                const amount = r.querySelector(".ing-amount-input")?.value.trim() || "";
                const unit = r.querySelector(".ing-unit-select")?.value || "";
                ingredientsData.push({ name, amount, unit });
            });

            // A4 재료 및 조리법 통합 테이블 렌더링
            viewIngredientsTbody.innerHTML = "";
            // [레시피 전체 사이즈 무조건 고정 핵심] 
            // A4 한 장 전체를 꽉 채우는 고정 세로 규격을 완벽하게 유지하면서,
            // 재료 칸(1번) 하나하나가 뚱뚱해지지 않고 글자에 꼭 맞는 슬림 규격(22px)을 유지하도록 21칸으로 고정
            const minRows = 21;
            const totalRows = Math.max(ingredientsData.length, minRows);

            for (let index = 0; index < totalRows; index++) {
                const item = ingredientsData[index] || { name: "", amount: "", unit: "" };
                const tr = document.createElement("tr");

                const tdName = document.createElement("td");
                tdName.className = "td-ingredient-name";
                tdName.textContent = item.name;

                const tdAmount = document.createElement("td");
                tdAmount.className = "td-ingredient-amount";
                tdAmount.textContent = item.amount;

                const tdUnit = document.createElement("td");
                tdUnit.className = "td-ingredient-un";
                tdUnit.textContent = item.unit;

                tr.appendChild(tdName);
                tr.appendChild(tdAmount);
                tr.appendChild(tdUnit);

                // 첫 번째 행에만 우측 전체 높이를 차지하는 조리법 & 토핑 셀 결합
                if (index === 0) {
                    const tdCooking = document.createElement("td");
                    tdCooking.className = "td-cooking-container";
                    tdCooking.rowSpan = totalRows;

                    const wrapper = document.createElement("div");
                    wrapper.className = "cooking-wrapper";

                    // [조리 순서 내어쓰기(Hanging Indent) & 번호 강조]
                    // 줄바꿈 시 내용이 번호 밑으로 들어가지 않고 오른쪽으로 깔끔하게 정렬
                    const stepRows = cookingStepsContainer.querySelectorAll(".cooking-step-row");
                    const stepsDiv = document.createElement("div");
                    stepsDiv.className = "cooking-steps-content";

                    stepRows.forEach((r, idx) => {
                        const val = r.querySelector(".step-desc-input")?.value.trim() || "";
                        if (val) {
                            const stepItem = document.createElement("div");
                            stepItem.className = "cooking-step-item";

                            const numSpan = document.createElement("span");
                            numSpan.className = "step-num";
                            numSpan.textContent = `${idx + 1}.`;

                            const descSpan = document.createElement("span");
                            descSpan.className = "step-desc";
                            descSpan.textContent = val;

                            stepItem.appendChild(numSpan);
                            stepItem.appendChild(descSpan);
                            stepsDiv.appendChild(stepItem);
                        }
                    });

                    // 토핑 독립 칸 (사용자 요청: Topping 제목 + 하단 내용 박스 / 줄 추가 지원)
                    const toppingBox = document.createElement("div");
                    toppingBox.className = "topping-card-box";

                    const toppingTitle = document.createElement("div");
                    toppingTitle.className = "topping-card-title";
                    toppingTitle.textContent = "TOPPING";

                    const toppingContent = document.createElement("div");
                    toppingContent.className = "topping-card-content";

                    // 입력된 토핑 줄들 수집
                    const toppingInputs = toppingItemsContainer.querySelectorAll(".topping-item-input");
                    const toppingTexts = [];
                    toppingInputs.forEach(inp => {
                        const val = inp.value.trim();
                        if (val) toppingTexts.push(val);
                    });

                    if (toppingTexts.length > 0) {
                        toppingContent.innerHTML = toppingTexts.map(t => `<div>${t}</div>`).join("");
                    } else {
                        toppingContent.innerHTML = "<span style='color: #888; font-size: 12px;'>(토핑 없음)</span>";
                    }

                    toppingBox.appendChild(toppingTitle);
                    toppingBox.appendChild(toppingContent);

                    wrapper.appendChild(stepsDiv);
                    wrapper.appendChild(toppingBox);

                    // SIGNATURE (시그니처) 독립 칸 (체크 시 토핑 바로 밑에 생성)
                    if (formSignatureEnable && formSignatureEnable.checked) {
                        const signatureBox = document.createElement("div");
                        signatureBox.className = "signature-card-box";

                        const sigTitle = document.createElement("div");
                        sigTitle.className = "signature-card-title";
                        sigTitle.textContent = "SIGNATURE";

                        const sigContent = document.createElement("div");
                        sigContent.className = "signature-card-content";

                        const sigInputs = signatureItemsContainer.querySelectorAll(".signature-item-input");
                        const sigTexts = [];
                        sigInputs.forEach(inp => {
                            const val = inp.value.trim();
                            if (val) sigTexts.push(val);
                        });

                        if (sigTexts.length > 0) {
                            sigContent.innerHTML = sigTexts.map(t => `<div>${t}</div>`).join("");
                        } else {
                            sigContent.innerHTML = "<span style='color: #888; font-size: 12px;'>(시그니처 내용 없음)</span>";
                        }

                        signatureBox.appendChild(sigTitle);
                        signatureBox.appendChild(sigContent);
                        wrapper.appendChild(signatureBox); // 토핑 바로 밑에 부착!
                    }

                    tdCooking.appendChild(wrapper);

                    tr.appendChild(tdCooking);
                }

                viewIngredientsTbody.appendChild(tr);
            }
        } catch (err) {
            console.error("미리보기 동기화 중 오류:", err);
        }
    }

    // 폼 입력 이벤트 리스너 등록 (실시간 반영)
    [formTitle, formItaliano, formEnglish, formKorea, formCategory, formDate, formCost, formPrice, formPortionNum].forEach(el => {
        if (el) el.addEventListener("input", syncFormToPreview);
    });

    if (formCostCurrency) formCostCurrency.addEventListener("change", syncFormToPreview);
    if (formPriceCurrency) formPriceCurrency.addEventListener("change", syncFormToPreview);

    // ----------------------------------------------------
    // 5. 사진 업로드 처리 (가로 13cm x 세로 9.5cm 자동 비율 최적화 크롭)
    // ----------------------------------------------------
    formPhotoClickArea.addEventListener("click", () => {
        formPhotoFile.click();
    });

    // 어떤 크기/방향의 사진이든 A4 양식 규격(13 : 9.5 비율)으로 자동 최적화
    function cropAndResizeToRecipeRatio(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const targetWidth = 1300;  // 13cm 대응 고해상도 폭
                const targetHeight = 950;  // 9.5cm 대응 고해상도 높이
                const targetRatio = targetWidth / targetHeight; // 13 / 9.5 ≈ 1.3684

                const canvas = document.createElement("canvas");
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext("2d");

                const srcWidth = img.width;
                const srcHeight = img.height;
                const srcRatio = srcWidth / srcHeight;

                let drawWidth, drawHeight, offsetX, offsetY;

                if (srcRatio > targetRatio) {
                    // 원본이 더 옆으로 넓은 경우: 세로에 맞추고 좌우 중앙 크롭
                    drawHeight = srcHeight;
                    drawWidth = srcHeight * targetRatio;
                    offsetX = (srcWidth - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    // 원본이 세로로 길거나 정비율인 경우: 가로에 맞추고 상하 중앙 크롭
                    drawWidth = srcWidth;
                    drawHeight = srcWidth / targetRatio;
                    offsetX = 0;
                    offsetY = (srcHeight - drawHeight) / 2;
                }

                // 캔버스에 중앙 정렬하여 선명하게 렌더링
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, targetWidth, targetHeight);

                // 고화질 JPEG(0.92)로 변환하여 메모리 절약 및 즉시 반영
                const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
                callback(optimizedDataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    formPhotoFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("이미지 파일(.jpg, .png 등)만 선택하실 수 있습니다.");
            return;
        }

        cropAndResizeToRecipeRatio(file, (optimizedBase64) => {
            currentPhotoData = optimizedBase64;
            formPhotoPreview.src = currentPhotoData;
            viewPhotoImg.src = currentPhotoData;
        });
    });

    // [캡처 이미지 Ctrl+V 붙여넣기 완벽 지원]
    // 사이트나 화면에서 캡처 후 Ctrl+V만 누르면 즉시 가로 13cm x 세로 9.5cm로 자동 재단 등록!
    window.addEventListener("paste", (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    cropAndResizeToRecipeRatio(file, (optimizedBase64) => {
                        currentPhotoData = optimizedBase64;
                        formPhotoPreview.src = currentPhotoData;
                        viewPhotoImg.src = currentPhotoData;
                        alert("📸 캡처한 이미지가 A4 규격(가로 13cm × 세로 9.5cm)에 맞춰 자동으로 등록되었습니다!");
                    });
                    break;
                }
            }
        }
    });

    // [사진 드래그 앤 드롭 지원]
    formPhotoClickArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        formPhotoClickArea.style.borderColor = "#0284c7";
    });
    formPhotoClickArea.addEventListener("dragleave", () => {
        formPhotoClickArea.style.borderColor = "#94a3b8";
    });
    formPhotoClickArea.addEventListener("drop", (e) => {
        e.preventDefault();
        formPhotoClickArea.style.borderColor = "#94a3b8";
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            cropAndResizeToRecipeRatio(file, (optimizedBase64) => {
                currentPhotoData = optimizedBase64;
                formPhotoPreview.src = currentPhotoData;
                viewPhotoImg.src = currentPhotoData;
            });
        }
    });

    // ----------------------------------------------------
    // 6. 데이터 로드 / 폼 채우기 함수
    // ----------------------------------------------------
    function populateFormWithData(recipe) {
        if (!recipe) return;

        currentRecipeId = recipe.id || null;

        if (currentRecipeId) {
            currentEditingStatus.textContent = `📝 [${recipe.italianoName || recipe.englishName || "레시피"}] 수정 중`;
            currentEditingStatus.style.backgroundColor = "#fef3c7";
            currentEditingStatus.style.color = "#d97706";
        } else {
            currentEditingStatus.textContent = "✨ 신규 레시피 작성 중";
            currentEditingStatus.style.backgroundColor = "#e0f2fe";
            currentEditingStatus.style.color = "#0284c7";
        }

        formTitle.value = recipe.title || "LA MANCHA RECIPE";
        formItaliano.value = recipe.italianoName || "";
        formEnglish.value = recipe.englishName || "";
        formKorea.value = recipe.koreaName || "";

        // 이탈리아어명 사용 여부 판단: 명시적 useItaliano가 있거나, 또는 italianoName이 입력되어 있을 때 체크
        if (checkUseItaliano) {
            const hasItaliano = recipe.useItaliano === true || (recipe.useItaliano !== false && recipe.italianoName && recipe.italianoName.trim() !== "");
            checkUseItaliano.checked = hasItaliano;
        }

        formCategory.value = recipe.category || "";
        formDate.value = recipe.date || "";

        // 원가 및 통화 분리 파싱
        const rawCost = (recipe.cost || "").toString().trim();
        let costCurr = recipe.costCurrency || "원";
        if (!recipe.costCurrency) {
            if (rawCost.includes("$")) costCurr = "$";
            else if (rawCost.includes("€")) costCurr = "€";
            else if (rawCost.includes("¥")) costCurr = "¥";
            else if (rawCost.includes("元")) costCurr = "元";
            else if (rawCost.includes("£")) costCurr = "£";
        }
        if (formCostCurrency) formCostCurrency.value = costCurr;
        formCost.value = rawCost.replace(/[$€¥元£원\s]/g, "");

        // 판매가 및 통화 분리 파싱
        const rawPrice = (recipe.price || "").toString().trim();
        let priceCurr = recipe.priceCurrency || "원";
        if (!recipe.priceCurrency) {
            if (rawPrice.includes("$")) priceCurr = "$";
            else if (rawPrice.includes("€")) priceCurr = "€";
            else if (rawPrice.includes("¥")) priceCurr = "¥";
            else if (rawPrice.includes("元")) priceCurr = "元";
            else if (rawPrice.includes("£")) priceCurr = "£";
        }
        if (formPriceCurrency) formPriceCurrency.value = priceCurr;
        formPrice.value = rawPrice.replace(/[$€¥元£원\s]/g, "");

        // PORTION 분리 파싱 (숫자 + 단위 분리하여 주입)
        const rawPortion = (recipe.portion || "").toString().trim();
        const portionMatch = rawPortion.match(/^([\d\.]+)\s*(.*)$/);
        if (portionMatch) {
            if (formPortionNum) formPortionNum.value = portionMatch[1];
            if (formPortionUnit && portionMatch[2]) {
                formPortionUnit.value = portionMatch[2].trim();
            }
        } else {
            const digits = rawPortion.replace(/[^\d\.]/g, "");
            if (formPortionNum) formPortionNum.value = digits || "1";
            if (formPortionUnit) formPortionUnit.value = "인분";
        }

        currentPhotoData = recipe.photoData || "sample_images/funghi_pasta.jpg";
        formPhotoPreview.src = currentPhotoData;

        // 조리 순서 채우기 (1., 2., 3... 자동 번호 매김)
        cookingStepsContainer.innerHTML = "";
        let stepsList = [];
        if (Array.isArray(recipe.cookingTechnique)) {
            stepsList = recipe.cookingTechnique;
        } else if (typeof recipe.cookingTechnique === "string" && recipe.cookingTechnique.trim()) {
            stepsList = recipe.cookingTechnique.split("\n").map(s => s.trim()).filter(Boolean);
        }

        if (stepsList.length === 0) {
            addCookingStepRow(""); // 기본 1단계 제공
            addCookingStepRow(""); // 기본 2단계 제공
            addCookingStepRow(""); // 기본 3단계 제공
        } else {
            stepsList.forEach(step => addCookingStepRow(step));
        }
        
        // 토핑 목록 채우기 (다중 줄 지원)
        toppingItemsContainer.innerHTML = "";
        let toppingList = [];
        if (Array.isArray(recipe.topping)) {
            toppingList = recipe.topping;
        } else if (typeof recipe.topping === "string" && recipe.topping.trim()) {
            // 줄바꿈이 있으면 줄바꿈으로 나누고, 없으면 1개 항목으로 등록
            toppingList = recipe.topping.includes("\n") 
                ? recipe.topping.split("\n").map(s => s.trim()).filter(Boolean)
                : [recipe.topping.trim()];
        }

        if (toppingList.length === 0) {
            addToppingRow(""); // 기본 빈 줄 1개 제공
        } else {
            toppingList.forEach(t => addToppingRow(t));
        }

        // 시그니처(SIGNATURE) 목록 및 체크 상태 채우기
        const isSigEnabled = !!recipe.signatureEnabled;
        if (formSignatureEnable) {
            formSignatureEnable.checked = isSigEnabled;
            formBtnAddSignature.style.display = isSigEnabled ? "inline-flex" : "none";
            signatureControlsWrap.style.display = isSigEnabled ? "block" : "none";
        }

        signatureItemsContainer.innerHTML = "";
        let sigList = [];
        if (Array.isArray(recipe.signature)) {
            sigList = recipe.signature;
        } else if (typeof recipe.signature === "string" && recipe.signature.trim()) {
            sigList = recipe.signature.split("\n").map(s => s.trim()).filter(Boolean);
        }

        if (sigList.length === 0) {
            if (isSigEnabled) addSignatureRow("");
        } else {
            sigList.forEach(s => addSignatureRow(s));
        }

        // 주의사항 목록 채우기 (다중 줄 지원)
        cautionItemsContainer.innerHTML = "";
        let cautionList = [];
        if (Array.isArray(recipe.caution)) {
            cautionList = recipe.caution;
        } else if (typeof recipe.caution === "string" && recipe.caution.trim()) {
            cautionList = recipe.caution.split("\n").map(s => s.trim()).filter(Boolean);
        }

        if (cautionList.length === 0) {
            addCautionRow("");
        } else {
            cautionList.forEach(c => addCautionRow(c));
        }

        // 재료 목록 초기화 후 추가
        ingredientItemsContainer.innerHTML = "";
        const ingList = (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0)
            ? recipe.ingredients
            : [{ name: "", amount: "", unit: "g" }];

        ingList.forEach(item => {
            addIngredientRow(item.name, item.amount, item.unit);
        });

        // 원본 기준 인분 및 재료 수량 스냅샷 보관 (인분 변환용)
        saveBaseIngredientsState();

        syncFormToPreview();
    }

    // ----------------------------------------------------
    // 7. 영구 보존(Storage) 저장 및 서재 목록 관리
    // ----------------------------------------------------
    function saveCurrentRecipe() {
        try {
            const rows = ingredientItemsContainer.querySelectorAll(".ingredient-item-row");
            const ingredientsData = [];
            rows.forEach(r => {
                const name = r.querySelector(".ing-name-input")?.value.trim() || "";
                const amount = r.querySelector(".ing-amount-input")?.value.trim() || "";
                const unit = r.querySelector(".ing-unit-select")?.value || "";
                if (name || amount) {
                    ingredientsData.push({ name, amount, unit });
                }
            });

            // 조리 순서 목록 수집
            const stepRows = cookingStepsContainer.querySelectorAll(".cooking-step-row");
            const stepsData = [];
            stepRows.forEach(r => {
                const val = r.querySelector(".step-desc-input")?.value.trim() || "";
                if (val) stepsData.push(val);
            });

            // 토핑 목록 수집
            const toppingInputs = toppingItemsContainer.querySelectorAll(".topping-item-input");
            const toppingData = [];
            toppingInputs.forEach(inp => {
                const val = inp.value.trim();
                if (val) toppingData.push(val);
            });

            // 시그니처 목록 수집
            const sigEnabled = formSignatureEnable ? formSignatureEnable.checked : false;
            const sigInputs = signatureItemsContainer.querySelectorAll(".signature-item-input");
            const sigData = [];
            sigInputs.forEach(inp => {
                const val = inp.value.trim();
                if (val) sigData.push(val);
            });

            // 주의사항 목록 수집
            const cautionInputs = cautionItemsContainer.querySelectorAll(".caution-item-input");
            const cautionData = [];
            cautionInputs.forEach(inp => {
                const val = inp.value.trim();
                if (val) cautionData.push(val);
            });

            const costCurrency = formCostCurrency ? formCostCurrency.value : "원";
            const priceCurrency = formPriceCurrency ? formPriceCurrency.value : "원";
            const pNum = formPortionNum ? formPortionNum.value.trim() : "1";
            const pUnit = formPortionUnit ? formPortionUnit.value.trim() : "인분";
            const portionCombined = pNum ? `${pNum} ${pUnit}` : "";

            const recipeData = {
                id: currentRecipeId,
                title: formTitle.value.trim() || "LA MANCHA RECIPE",
                useItaliano: checkUseItaliano ? checkUseItaliano.checked : false,
                italianoName: formItaliano.value.trim(),
                englishName: formEnglish.value.trim(),
                koreaName: formKorea.value.trim(),
                category: formCategory.value.trim(),
                date: formDate.value.trim(),
                cost: formCost.value.trim(),
                costCurrency: costCurrency,
                price: formPrice.value.trim(),
                priceCurrency: priceCurrency,
                portion: portionCombined,
                ingredients: ingredientsData,
                cookingTechnique: stepsData,
                topping: toppingData,
                signatureEnabled: sigEnabled,
                signature: sigData,
                caution: cautionData,
                photoData: currentPhotoData
            };

            const saved = RecipeStorage.saveRecipe(recipeData);
            currentRecipeId = saved.id;
            updateBadgeCount();

            alert(`🎉 레시피 [${saved.italianoName || saved.englishName || "레시피"}]가 영구 보관되었습니다!\n언제든 '내 레시피 북' 탭에서 찾아보실 수 있습니다.`);
            populateFormWithData(saved);
        } catch (err) {
            alert("저장 중 오류가 발생했습니다: " + err.message);
        }
    }

    btnSaveToBook.addEventListener("click", saveCurrentRecipe);
    btnSaveBottom.addEventListener("click", saveCurrentRecipe);

    // ----------------------------------------------------
    // 🌐 스마트 번역 엔진 연동 (한글 요리명 & 재료명 자동 변환)
    // ----------------------------------------------------
    // 0) 이탈리아어명 사용 체크박스 전환 이벤트
    if (checkUseItaliano) {
        checkUseItaliano.addEventListener("change", () => {
            const isUsed = checkUseItaliano.checked;
            if (wrapItalianoInput) wrapItalianoInput.style.display = isUsed ? "block" : "none";
            if (rowItalianoName) rowItalianoName.style.display = isUsed ? "" : "none";
            if (rowEnglishName) {
                if (!isUsed) {
                    rowEnglishName.classList.add("first-visible-row");
                } else {
                    rowEnglishName.classList.remove("first-visible-row");
                }
            }
            syncFormToPreview();
        });
    }

    // 1-1) ENGLISH NAME 칸에 적은 단어를 즉시 영어로 개별 변환 (해당 입력창 우선)
    if (btnTranslateToEn) {
        btnTranslateToEn.addEventListener("click", async () => {
            // 1순위: ENGLISH NAME 입력창에 직접 적은 글자 ("국", "1", 요리명 등)
            // 2순위: 비어있을 경우에만 KOREA NAME의 한글 요리명 참조
            const targetText = formEnglish.value.trim() || formKorea.value.trim();
            if (!targetText) {
                alert("변환할 단어나 문장을 입력해주세요! 😊\n예: 국, 찌개, 파스타, 1 등");
                formEnglish.focus();
                return;
            }

            const originalBtnText = btnTranslateToEn.innerHTML;
            btnTranslateToEn.disabled = true;
            btnTranslateToEn.innerHTML = "⏳ 영어 변환 중...";

            try {
                let enResult = "";
                if (typeof ChefTranslator.translateEnglishName === "function") {
                    enResult = await ChefTranslator.translateEnglishName(targetText);
                } else {
                    const res = await ChefTranslator.translateRecipeNames(targetText);
                    enResult = res.english;
                }

                if (enResult) {
                    formEnglish.value = enResult;
                    syncFormToPreview();
                }
            } catch (err) {
                console.error("영어 번역 오류:", err);
                alert("영어 번역 중 오류가 발생했습니다: " + err.message);
            } finally {
                btnTranslateToEn.disabled = false;
                btnTranslateToEn.innerHTML = originalBtnText;
            }
        });
    }

    // 1-2) ITALIANO NAME 칸에 적은 단어를 즉시 이탈리아어로 개별 변환 (해당 입력창 우선)
    if (btnTranslateToIt) {
        btnTranslateToIt.addEventListener("click", async () => {
            // 1순위: ITALIANO NAME 입력창에 직접 적은 글자
            // 2순위: 비어있을 경우에만 KOREA NAME의 한글 요리명 참조
            const targetText = formItaliano.value.trim() || formKorea.value.trim();
            if (!targetText) {
                alert("변환할 단어나 문장을 입력해주세요! 😊\n예: 버섯, 국, 파스타 등");
                formItaliano.focus();
                return;
            }

            const originalBtnText = btnTranslateToIt.innerHTML;
            btnTranslateToIt.disabled = true;
            btnTranslateToIt.innerHTML = "⏳ 이탈리아어 변환 중...";

            try {
                let itResult = "";
                if (typeof ChefTranslator.translateItalianoName === "function") {
                    itResult = await ChefTranslator.translateItalianoName(targetText);
                } else {
                    const res = await ChefTranslator.translateRecipeNames(targetText);
                    itResult = res.italiano;
                }

                if (itResult) {
                    formItaliano.value = itResult;
                    syncFormToPreview();
                }
            } catch (err) {
                console.error("이탈리아어 번역 오류:", err);
                alert("이탈리아어 번역 중 오류가 발생했습니다: " + err.message);
            } finally {
                btnTranslateToIt.disabled = false;
                btnTranslateToIt.innerHTML = originalBtnText;
            }
        });
    }

    // (호환성 유지) 구형 전체 번역 버튼 호환
    if (btnTranslateNames) {
        btnTranslateNames.addEventListener("click", async () => {
            const korText = formKorea.value.trim();
            if (!korText) {
                alert("KOREA NAME(한글 요리명 또는 설명)을 먼저 입력해주세요! 😊\n예: 대파와 버섯을 넣은 크림 파스타");
                formKorea.focus();
                return;
            }

            const originalBtnText = btnTranslateNames.innerHTML;
            btnTranslateNames.disabled = true;
            btnTranslateNames.innerHTML = "⏳ 영어 & 이탈리아어 번역 중...";

            try {
                const result = await ChefTranslator.translateRecipeNames(korText);

                if (result.english) {
                    formEnglish.value = result.english;
                }
                if (result.italiano) {
                    formItaliano.value = result.italiano;
                }

                syncFormToPreview();
                alert(`✨ 요리명 번역 완료!\n\n🇬🇧 ENGLISH: ${result.english || '(완료)'}\n🇮🇹 ITALIANO: ${result.italiano || '(완료)'}`);
            } catch (err) {
                console.error("요리명 번역 오류:", err);
                alert("번역 처리 중 문제가 발생했습니다: " + err.message);
            } finally {
                btnTranslateNames.disabled = false;
                btnTranslateNames.innerHTML = originalBtnText;
            }
        });
    }

    // 1-2) 영어 또는 이탈리아어 메뉴명을 바탕으로 한글(KOREA NAME) 요리명 자동 완성
    if (btnTranslateNamesToKo) {
        btnTranslateNamesToKo.addEventListener("click", async () => {
            const foreignText = formEnglish.value.trim() || formItaliano.value.trim();
            if (!foreignText) {
                alert("ENGLISH NAME 또는 ITALIANO NAME을 먼저 입력해주세요! 😊\n예: Spaghetti with garlic and mushroom");
                formEnglish.focus();
                return;
            }

            const originalBtnText = btnTranslateNamesToKo.innerHTML;
            btnTranslateNamesToKo.disabled = true;
            btnTranslateNamesToKo.innerHTML = "⏳ 한글 번역 중...";

            try {
                const koResult = await ChefTranslator.translateToKorean(foreignText);
                if (koResult) {
                    formKorea.value = koResult;
                    syncFormToPreview();
                    alert(`✨ 한글 요리 설명이 생성되었습니다!\n\n🇰🇷 KOREA NAME: ${koResult}`);
                }
            } catch (err) {
                console.error("한글 역번역 오류:", err);
                alert("한글 번역 처리 중 문제가 발생했습니다: " + err.message);
            } finally {
                btnTranslateNamesToKo.disabled = false;
                btnTranslateNamesToKo.innerHTML = originalBtnText;
            }
        });
    }

    // 2-1) 재료 목록 내 모든 한글 재료명을 영어로 한 번에 일괄 변환
    if (btnTranslateAllIngredients) {
        btnTranslateAllIngredients.addEventListener("click", async () => {
            const rows = ingredientItemsContainer.querySelectorAll(".ingredient-item-row");
            const inputs = [];
            rows.forEach(r => {
                const inp = r.querySelector(".ing-name-input");
                if (inp && inp.value.trim()) {
                    // 한글이 1글자라도 포함된 재료만 변환 대상
                    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(inp.value)) {
                        inputs.push(inp);
                    }
                }
            });

            if (inputs.length === 0) {
                alert("변환할 한글 재료명이 없습니다.\n먼저 재료명을 한글(예: 대파, 마늘, 양파 등)로 적어주세요! 😊");
                return;
            }

            const originalBtnText = btnTranslateAllIngredients.innerHTML;
            btnTranslateAllIngredients.disabled = true;
            btnTranslateAllIngredients.innerHTML = "⏳ 전체 영어 변환 중...";

            try {
                let count = 0;
                for (const inp of inputs) {
                    const originalName = inp.value.trim();
                    const translated = await ChefTranslator.translateWord(originalName, "en");
                    if (translated && translated !== originalName) {
                        inp.value = translated;
                        count++;
                    }
                }

                syncFormToPreview();
                saveBaseIngredientsState();
                alert(`🎉 총 ${count}개의 한글 재료명이 영어로 깔끔하게 변환되었습니다!`);
            } catch (err) {
                console.error("재료 전체 번역 오류:", err);
                alert("전체 재료 번역 중 문제가 발생했습니다: " + err.message);
            } finally {
                btnTranslateAllIngredients.disabled = false;
                btnTranslateAllIngredients.innerHTML = originalBtnText;
            }
        });
    }

    // 2-2) 재료 목록 내 모든 외국어(영문/이탈리아어) 재료명을 한국어로 일괄 되돌리기
    if (btnTranslateAllIngredientsKo) {
        btnTranslateAllIngredientsKo.addEventListener("click", async () => {
            const rows = ingredientItemsContainer.querySelectorAll(".ingredient-item-row");
            const inputs = [];
            rows.forEach(r => {
                const inp = r.querySelector(".ing-name-input");
                if (inp && inp.value.trim()) {
                    // 순수 한글이 아니거나 외국어가 포함된 경우 변환 대상
                    if (!/^[ㄱ-ㅎ|ㅏ-ㅣ|가-힣\s\d\.\,\(\)]+$/.test(inp.value)) {
                        inputs.push(inp);
                    }
                }
            });

            if (inputs.length === 0) {
                alert("한국어로 되돌릴 외국어 재료명이 없습니다.\n이미 모든 재료가 한글이거나 비어있습니다! 😊");
                return;
            }

            const originalBtnText = btnTranslateAllIngredientsKo.innerHTML;
            btnTranslateAllIngredientsKo.disabled = true;
            btnTranslateAllIngredientsKo.innerHTML = "⏳ 전체 한국어 변환 중...";

            try {
                let count = 0;
                for (const inp of inputs) {
                    const originalName = inp.value.trim();
                    const translated = await ChefTranslator.translateWord(originalName, "ko");
                    if (translated && translated !== originalName) {
                        inp.value = translated;
                        count++;
                    }
                }

                syncFormToPreview();
                saveBaseIngredientsState();
                alert(`🎉 총 ${count}개의 외국어 재료명이 한국어로 깔끔하게 되돌려졌습니다!`);
            } catch (err) {
                console.error("재료 한국어 일괄 번역 오류:", err);
                alert("한국어 일괄 변환 중 문제가 발생했습니다: " + err.message);
            } finally {
                btnTranslateAllIngredientsKo.disabled = false;
                btnTranslateAllIngredientsKo.innerHTML = originalBtnText;
            }
        });
    }

    // 새 레시피 시작 버튼
    btnNewRecipe.addEventListener("click", () => {
        if (confirm("새로운 레시피를 작성하시겠습니까?")) {
            currentRecipeId = null;
            populateFormWithData({
                title: "LA MANCHA RECIPE",
                italianoName: "",
                englishName: "",
                koreaName: "",
                category: "PASTA",
                date: new Date().toISOString().slice(0, 7).replace("-", ". "),
                cost: "",
                costCurrency: "원",
                price: "",
                priceCurrency: "원",
                portion: "2 인분",
                ingredients: [
                    { name: "", amount: "", unit: "g" },
                    { name: "", amount: "", unit: "g" },
                    { name: "", amount: "", unit: "g" }
                ],
                cookingTechnique: ["", "", ""],
                topping: [],
                signatureEnabled: false,
                signature: [],
                caution: [""],
                photoData: "sample_images/funghi_pasta.jpg"
            });
            switchTab("tab-editor");
        }
    });

    /**
     * 레시피 북 서재 목록 렌더링
     */
    function renderRecipeBookList(filterKeyword = "") {
        const list = RecipeStorage.getAllRecipes();
        updateBadgeCount(list.length);
        recipeBookGrid.innerHTML = "";

        const filtered = list.filter(r => {
            const kw = filterKeyword.toLowerCase();
            return (r.italianoName || "").toLowerCase().includes(kw) ||
                   (r.englishName || "").toLowerCase().includes(kw) ||
                   (r.koreaName || "").toLowerCase().includes(kw) ||
                   (r.category || "").toLowerCase().includes(kw);
        });

        if (filtered.length === 0) {
            recipeBookGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: #94a3b8;">
                    <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 8px;">보관된 레시피가 없습니다.</p>
                    <small>상단의 [✍️ 레시피 작성] 탭에서 나만의 멋진 레시피를 만들어보세요!</small>
                </div>
            `;
            return;
        }

        filtered.forEach(recipe => {
            const card = document.createElement("div");
            card.className = "recipe-card-item";

            card.innerHTML = `
                <img class="card-thumb" src="${recipe.photoData || 'sample_images/funghi_pasta.jpg'}" alt="요리 사진">
                <div class="card-body">
                    <span class="card-cat">${recipe.category || 'RECIPE'}</span>
                    <h4 class="card-title-main">${recipe.italianoName || recipe.englishName || '이름 없는 요리'}</h4>
                    <p class="card-title-sub">${recipe.koreaName || recipe.englishName || '-'}</p>
                    <div class="card-meta-line">
                        <span>🗓️ ${recipe.date || '-'}</span> | <span>👥 ${recipe.portion || '1인분'}</span>
                    </div>
                    <div class="card-btn-group">
                        <button class="btn btn-sm btn-primary btn-open-recipe" style="flex: 2;">열기/수정</button>
                        <button class="btn btn-sm btn-print-quick btn-print-card" style="flex: 1.5;">🖨️ 인쇄</button>
                        <button class="btn btn-sm btn-danger-sm btn-del-recipe" title="삭제">🗑️</button>
                    </div>
                </div>
            `;

            // 열기/수정 버튼
            card.querySelector(".btn-open-recipe").addEventListener("click", () => {
                populateFormWithData(recipe);
                switchTab("tab-editor");
            });

            // 즉시 인쇄 버튼
            card.querySelector(".btn-print-card").addEventListener("click", () => {
                populateFormWithData(recipe);
                switchTab("tab-preview");
                setTimeout(() => {
                    window.print();
                }, 300);
            });

            // 삭제 버튼
            card.querySelector(".btn-del-recipe").addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm(`정말 [${recipe.italianoName || recipe.englishName || "이 레시피"}]를 영구 삭제하시겠습니까?`)) {
                    RecipeStorage.deleteRecipe(recipe.id);
                    renderRecipeBookList(bookSearchInput.value);
                }
            });

            recipeBookGrid.appendChild(card);
        });
    }

    function updateBadgeCount(count) {
        const total = typeof count === "number" ? count : RecipeStorage.getAllRecipes().length;
        recipeCountBadge.textContent = total;
    }

    bookSearchInput.addEventListener("input", (e) => {
        renderRecipeBookList(e.target.value.trim());
    });

    // ----------------------------------------------------
    // 8. 모바일 & PC 즉시 인쇄 트리거
    // ----------------------------------------------------
    function triggerPrintAction() {
        syncFormToPreview();
        // 인쇄 전 잠시 렌더링 안정화 후 브라우저 인쇄창 호출
        setTimeout(() => {
            window.print();
        }, 150);
    }

    btnQuickPrint.addEventListener("click", triggerPrintAction);
    btnPrintPreview.addEventListener("click", triggerPrintAction);
    btnPrintFromForm.addEventListener("click", () => {
        switchTab("tab-preview");
        triggerPrintAction();
    });

    // ----------------------------------------------------
    // 9. 초기 구동: 영구 보관소에서 첫 레시피 로드 & 서버 실시간 자동 동기화
    // ----------------------------------------------------
    const allSaved = RecipeStorage.getAllRecipes();
    if (allSaved.length > 0) {
        populateFormWithData(allSaved[0]);
    } else {
        populateFormWithData(DEFAULT_SAMPLE_RECIPE);
    }
    updateBadgeCount(allSaved.length);

    // 🌐 PC ↔ 스마트폰 실시간 자동 동기화 (recipes_db.json 연동)
    RecipeStorage.syncWithServer().then((latestList) => {
        if (latestList && latestList.length > 0) {
            updateBadgeCount(latestList.length);
            // 현재 화면이 뼈해장국이거나 기본 상태일 때 최신 1안 데이터로 즉시 동기화
            const matched = latestList.find(r => r.id === currentRecipeId) || latestList[0];
            if (matched) {
                populateFormWithData(matched);
                syncFormToPreview();
            }
            renderRecipeBookList();
        }
    });

    // ----------------------------------------------------
    // 10. PWA 오프라인 서비스 워커 등록 & 앱 설치 처리
    // ----------------------------------------------------
    let deferredPrompt = null;
    const pwaInstallBanner = document.getElementById("pwaInstallBanner");
    const btnPwaInstall = document.getElementById("btnPwaInstall");

    // 서비스 워커 등록 (인터넷 없이 오프라인 구동 지원 & 최신 버전 자동 체크)
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js?v=10.2")
            .then((registration) => {
                console.log("[PWA] 서비스 워커가 정상 등록되었습니다:", registration.scope);
                // 앱 실행 시 서버에 새로운 코드가 있는지 즉시 확인
                registration.update();
            })
            .catch((err) => {
                console.warn("[PWA] 서비스 워커 등록 실패:", err);
            });
    }

    // 안드로이드 크롬 / 삼성인터넷 설치 프롬프트 포착
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (pwaInstallBanner) {
            pwaInstallBanner.style.display = "flex";
        }
    });

    if (btnPwaInstall) {
        btnPwaInstall.addEventListener("click", async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === "accepted") {
                    console.log("[PWA] 사용자가 앱 설치를 수락했습니다.");
                }
                deferredPrompt = null;
                pwaInstallBanner.style.display = "none";
            } else {
                // 아이폰(iOS) 또는 지원 브라우저 수동 안내
                alert("💡 스마트폰 홈 화면에 설치하는 방법:\n\n1) 브라우저 하단/상단의 [공유] 또는 [더보기 ⋮] 버튼 터치\n2) '홈 화면에 추가'를 선택하시면 앱 아이콘이 생성됩니다!");
            }
        });
    }

    // ----------------------------------------------------
    // 10. 스마트 모바일 뷰어 (상하좌우 자유 드래그 & 스마트 줌 컨트롤)
    // ----------------------------------------------------
    const paperWrapper = document.getElementById("paperWrapper") || document.querySelector(".paper-wrapper");
    const printableCard = document.getElementById("printableRecipeCard");
    const btnZoomOut = document.getElementById("btnZoomOut");
    const btnZoomReset = document.getElementById("btnZoomReset");
    const btnZoomIn = document.getElementById("btnZoomIn");
    const btnMobileFitToggle = document.getElementById("btnMobileFitToggle");

    let currentZoom = 1.0;
    let isFitMode = false;

    function applyZoom(zoomVal, fit = false) {
        if (!printableCard || !paperWrapper) return;
        isFitMode = fit;

        if (fit) {
            paperWrapper.classList.add("fit-mobile-view");
            if (btnMobileFitToggle) {
                btnMobileFitToggle.classList.add("active");
                btnMobileFitToggle.textContent = "🔍 실물 크기";
            }
            // 모바일 화면 폭에 딱 맞춘 배율 계산 (A4 가로 794px 기준)
            const availableWidth = paperWrapper.clientWidth - 16;
            const fitScale = Math.min(1.0, Math.max(0.35, availableWidth / 794));
            printableCard.style.transform = `scale(${fitScale})`;
            if (btnZoomReset) btnZoomReset.textContent = `${Math.round(fitScale * 100)}%`;
        } else {
            paperWrapper.classList.remove("fit-mobile-view");
            if (btnMobileFitToggle) {
                btnMobileFitToggle.classList.remove("active");
                btnMobileFitToggle.textContent = "📱 화면 맞춤";
            }
            currentZoom = Math.min(2.0, Math.max(0.4, zoomVal));
            printableCard.style.transform = currentZoom === 1.0 ? "none" : `scale(${currentZoom})`;
            if (btnZoomReset) btnZoomReset.textContent = `${Math.round(currentZoom * 100)}%`;
        }
    }

    if (btnZoomIn) {
        btnZoomIn.addEventListener("click", () => {
            applyZoom(currentZoom + 0.15, false);
        });
    }

    if (btnZoomOut) {
        btnZoomOut.addEventListener("click", () => {
            applyZoom(currentZoom - 0.15, false);
        });
    }

    if (btnZoomReset) {
        btnZoomReset.addEventListener("click", () => {
            applyZoom(1.0, false);
        });
    }

    if (btnMobileFitToggle) {
        btnMobileFitToggle.addEventListener("click", () => {
            applyZoom(1.0, !isFitMode);
        });
    }

    // 스마트폰 두 손가락 핀치 줌 (Pinch-to-zoom) 지원
    let initialPinchDist = null;
    let initialZoomOnPinch = 1.0;

    if (paperWrapper) {
        paperWrapper.addEventListener("touchstart", (e) => {
            if (e.touches.length === 2) {
                initialPinchDist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                initialZoomOnPinch = currentZoom;
            }
        }, { passive: true });

        paperWrapper.addEventListener("touchmove", (e) => {
            if (e.touches.length === 2 && initialPinchDist) {
                const currentDist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                const factor = currentDist / initialPinchDist;
                applyZoom(initialZoomOnPinch * factor, false);
            }
        }, { passive: true });

        paperWrapper.addEventListener("touchend", (e) => {
            if (e.touches.length < 2) {
                initialPinchDist = null;
            }
        }, { passive: true });
    }

    // ----------------------------------------------------
    // 11. 모바일 앱 설치 & 카카오톡 / 이메일 공유 모달 제어
    // ----------------------------------------------------
    const shareModal = document.getElementById("shareModal");
    const btnHeaderInstall = document.getElementById("btnHeaderInstall");
    const btnCloseShareModal = document.getElementById("btnCloseShareModal");
    const btnNativeShare = document.getElementById("btnNativeShare");
    const btnCopyLink = document.getElementById("btnCopyLink");
    const btnModalInstall = document.getElementById("btnModalInstall");

    function openShareModal() {
        if (shareModal) shareModal.style.display = "flex";
    }

    function closeShareModal() {
        if (shareModal) shareModal.style.display = "none";
    }

    if (btnHeaderInstall) {
        btnHeaderInstall.addEventListener("click", openShareModal);
    }

    if (btnCloseShareModal) {
        btnCloseShareModal.addEventListener("click", closeShareModal);
    }

    if (shareModal) {
        shareModal.addEventListener("click", (e) => {
            if (e.target === shareModal) closeShareModal();
        });
    }

    // 카카오톡 / 모바일 네이티브 공유 트리거
    if (btnNativeShare) {
        btnNativeShare.addEventListener("click", async () => {
            const shareData = {
                title: "바우 레시피 북 (BAU RECIPE BOOK)",
                text: "언제 어디서나 보고 A4로 출력할 수 있는 우리만의 레시피 북입니다!",
                url: window.location.href
            };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    // 사용자 취소 시 무시
                }
            } else {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    alert("📋 레시피 북 링크가 복사되었습니다!\n카카오톡 대화방에 붙여넣어(Ctrl+V) 공유하세요.");
                }).catch(() => {
                    prompt("아래 주소를 복사하여 카카오톡이나 이메일로 보내세요:", window.location.href);
                });
            }
        });
    }

    // 주소 링크 복사
    if (btnCopyLink) {
        btnCopyLink.addEventListener("click", () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert("📋 레시피 북 링크가 복사되었습니다!\n카카오톡이나 이메일에 붙여넣기 하여 누구에게나 전송할 수 있습니다.");
            }).catch(() => {
                prompt("아래 주소를 복사하여 공유하세요:", window.location.href);
            });
        });
    }

    // 모달 내 설치 버튼
    if (btnModalInstall) {
        btnModalInstall.addEventListener("click", async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === "accepted") {
                    console.log("[PWA] 사용자가 앱 설치를 수락했습니다.");
                }
                deferredPrompt = null;
                closeShareModal();
            } else {
                alert("💡 스마트폰 홈 화면에 설치하는 방법:\n\n🍎 아이폰 (Safari): 브라우저 하단 [공유] 아이콘 터치 ➔ '홈 화면에 추가'\n🤖 갤럭시 (Chrome/삼성): 브라우저 우측 상단 [⋮ 더보기] 터치 ➔ '앱 설치' 또는 '홈 화면에 추가'");
            }
        });
    }

    // ========================================================
    // 공통: 스마트폰 캐시 완벽 비우기 및 즉시 새로고침/동기화 함수
    // ========================================================
    async function triggerForceRefresh(triggerButton) {
        if (triggerButton) {
            triggerButton.classList.add("spinning");
            if (triggerButton.querySelector(".btn-text")) {
                triggerButton.querySelector(".btn-text").textContent = "동기화 중...";
            }
            if (triggerButton.querySelector(".fab-text")) {
                triggerButton.querySelector(".fab-text").textContent = "동기화 중";
            }
            triggerButton.disabled = true;
        }

        try {
            // 1. 브라우저/스마트폰 캐시 스토리지 전면 청소
            if ("caches" in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }

            // 2. 서비스 워커 업데이트 강제 트리거
            if ("serviceWorker" in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) {
                    await reg.update();
                }
            }

            // 3. 서버와 최신 레시피 즉시 양방향 동기화
            await RecipeStorage.syncWithServer();

            // 4. 깨끗하게 화면 강제 새로고침
            setTimeout(() => {
                window.location.reload(true);
            }, 300);
        } catch (err) {
            console.error("동기화/새로고침 오류:", err);
            window.location.reload(true);
        }
    }

    // 1) 상단 헤더 새로고침 버튼
    const btnAppRefresh = document.getElementById("btnAppRefresh");
    if (btnAppRefresh) {
        btnAppRefresh.addEventListener("click", () => {
            triggerForceRefresh(btnAppRefresh);
        });
    }

    // 2) 모바일 & 데스크탑 화면 우측 하단 플로팅 새로고침 버튼 (FAB)
    const btnFloatingRefresh = document.getElementById("btnFloatingRefresh");
    if (btnFloatingRefresh) {
        btnFloatingRefresh.addEventListener("click", () => {
            triggerForceRefresh(btnFloatingRefresh);
        });
    }

    // 이미 앱으로 실행 중인 경우 설치 배너 숨김
    if (window.matchMedia("(display-mode: standalone)").matches) {
        if (pwaInstallBanner) pwaInstallBanner.style.display = "none";
    }
});

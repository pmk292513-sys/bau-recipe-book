/**
 * [레시피 영구 저장 및 북(Book) 관리 모듈 - js/storage.js]
 * 작성한 레시피들을 브라우저 로컬 저장소(localStorage)에 안전하게 영구 보존하고,
 * 목록 조회, 불러오기, 수정, 삭제 기능을 제공합니다.
 */

const STORAGE_KEY = "BAU_RECIPE_BOOK_STORAGE_V1";

const RecipeStorage = {
    /**
     * 모든 레시피 목록 가져오기 (뼈해장국 등 신규 공식 레시피 자동 동기화 지원)
     */
    getAllRecipes() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            let list = [];
            if (!raw) {
                // 처음 실행 시 기본 레시피들(뼈해장국 + 파스타) 등록
                list = Array.isArray(window.INITIAL_RECIPES) ? [...window.INITIAL_RECIPES] : [];
                this.saveAllRecipes(list);
                return list;
            }
            list = JSON.parse(raw);

            // 기존 사용자(스마트폰 등)에게 뼈해장국이 아직 없다면 자동으로 상단에 추가 병합!
            const hasHaejangguk = list.some(r => 
                r.id === "recipe_bone_haejangguk_001" || 
                (r.koreaName && r.koreaName.includes("뼈해장국")) ||
                (r.englishName && r.englishName.includes("Hangover"))
            );

            if (!hasHaejangguk && window.INITIAL_RECIPES && window.INITIAL_RECIPES[0]) {
                list.unshift(window.INITIAL_RECIPES[0]); // 뼈해장국 레시피 최상단에 쏙 추가
                this.saveAllRecipes(list);
            } else if (hasHaejangguk && window.INITIAL_RECIPES && window.INITIAL_RECIPES[0]) {
                // 기존 저장소의 뼈해장국 조리법을 최신 1안(프로 요약본)으로 즉시 갱신!
                const target = list.find(r => 
                    r.id === "recipe_bone_haejangguk_001" || 
                    (r.koreaName && (r.koreaName.includes("뼈해장국") || r.koreaName.includes("뼈 해장국")))
                );
                if (target) {
                    target.cookingTechnique = window.INITIAL_RECIPES[0].cookingTechnique;
                    this.saveAllRecipes(list);
                }
            }

            return list;
        } catch (err) {
            console.error("레시피 목록을 불러오는 중 오류:", err);
            return [];
        }
    },

    /**
     * 모든 레시피 목록 저장하기 (로컬 저장소 + 서버 자동 백업)
     */
    saveAllRecipes(recipes) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
            // 로컬 서버로 비동기 자동 동기화 (PC ↔ 스마트폰 실시간 연동)
            this.pushToServer(recipes);
        } catch (err) {
            console.error("레시피 저장 실패 (용량 초과 등):", err);
            alert("저장 공간이 부족하거나 오류가 발생했습니다: " + err.message);
        }
    },

    /**
     * 🌐 로컬 서버(app.py / recipes_db.json)로 최신 레시피 데이터 자동 전송
     */
    async pushToServer(recipes) {
        try {
            // 서버 연결 시도 (오프라인일 땐 조용히 통과)
            await fetch("/api/recipes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(recipes)
            });
        } catch (err) {
            // 서버가 꺼져 있거나 오프라인 상태여도 스마트폰 자체 저장은 100% 안전하게 유지
            console.log("[동기화 안내] 현재 오프라인 상태이거나 서버가 꺼져 있어 기기 자체 메모리에만 보관됩니다.");
        }
    },

    /**
     * 🌐 로컬 서버와 레시피 데이터 자동 동기화 (앱 실행 시 및 새로고침 시 실행)
     */
    async syncWithServer() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2초 초과 시 타임아웃

            const res = await fetch("/api/recipes", {
                method: "GET",
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const serverList = await res.json();
                if (Array.isArray(serverList) && serverList.length > 0) {
                    // 서버에 저장된 레시피 목록이 있으면 로컬스토리지에 최신 병합
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(serverList));
                    console.log(`[동기화 완료] 서버로부터 총 ${serverList.length}개의 최신 레시피를 동기화했습니다!`);
                    return serverList;
                } else {
                    // 서버가 비어있는 경우 현재 로컬 레시피를 서버로 초기 업로드
                    const localList = this.getAllRecipes();
                    this.pushToServer(localList);
                    return localList;
                }
            }
        } catch (err) {
            // 오프라인이거나 서버 미가동 시 조용히 로컬 목록 반환
            console.log("[동기화 안내] 서버 미연결 상태 - 기기 로컬 모드로 작동합니다.");
        }
        return this.getAllRecipes();
    },

    /**
     * 레시피 단건 저장 또는 수정 (id가 있으면 수정, 없으면 신규 생성)
     */
    saveRecipe(recipeData) {
        const list = this.getAllRecipes();
        const now = new Date().toISOString();

        if (recipeData.id) {
            // 기존 레시피 수정
            const index = list.findIndex(r => r.id === recipeData.id);
            if (index !== -1) {
                list[index] = { ...recipeData, updatedAt: now };
            } else {
                list.unshift({ ...recipeData, updatedAt: now });
            }
        } else {
            // 신규 레시피 생성 (고유 ID 발급)
            const newId = "recipe_" + Date.now();
            recipeData.id = newId;
            recipeData.createdAt = now;
            recipeData.updatedAt = now;
            list.unshift(recipeData);
        }

        this.saveAllRecipes(list);
        return recipeData;
    },

    /**
     * ID로 특정 레시피 조회
     */
    getRecipeById(id) {
        const list = this.getAllRecipes();
        return list.find(r => r.id === id) || null;
    },

    /**
     * ID로 특정 레시피 삭제
     */
    deleteRecipe(id) {
        let list = this.getAllRecipes();
        list = list.filter(r => r.id !== id);
        this.saveAllRecipes(list);
        return list;
    }
};

window.RecipeStorage = RecipeStorage;


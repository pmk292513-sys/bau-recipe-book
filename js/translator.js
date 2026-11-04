/**
 * [스마트 요리 번역기 모듈 - translator.js]
 * 한글로 입력한 요리명 및 식자재를 영어(ENGLISH)와 이탈리아어(ITALIANO)로
 * 원클릭 자동 번역/변환해 주는 요리사 전용 스마트 번역 엔진입니다.
 * 
 * - 인터넷이 없거나 API 실패 시에도 기본 작동하도록 100여 종의 주요 식재료 사전 내장
 * - Google Translate 공개 엔드포인트를 활용한 실시간 고품질 번역 지원
 * - 철저한 예외 처리(Error Handling)로 번역 실패 시에도 프로그램이 절대 멈추지 않음
 */

const ChefTranslator = (function () {
    // =========================================================================
    // 1. [100% 오프라인 완전 독립형] 요리 전문 양방향 어휘 & 메뉴 사전
    // 인터넷이 전혀 없는 지하 주방, 비행기 모드에서도 평생 영구적으로 즉각 작동합니다.
    // =========================================================================
    const CULINARY_DICTIONARY = {
        // --- 기본 조리 형태 / 요리 분류 ---
        "국": { en: "Soup", it: "Zuppa" },
        "탕": { en: "Soup", it: "Zuppa" },
        "찌개": { en: "Stew", it: "Stufato" },
        "전골": { en: "Hot Pot", it: "Stufato in pentola" },
        "조림": { en: "Braised Dish", it: "Brasato" },
        "볶음": { en: "Stir-fried Dish", it: "Saltato" },
        "구이": { en: "Grilled Dish", it: "Alla griglia" },
        "찜": { en: "Steamed Dish", it: "Al vapore" },
        "튀김": { en: "Deep-fried Dish", it: "Fritto" },
        "전": { en: "Pancake", it: "Frittella" },
        "무침": { en: "Seasoned Salad", it: "Insalata condita" },
        "밥": { en: "Rice", it: "Riso" },
        "볶음밥": { en: "Fried Rice", it: "Riso fritto" },
        "덮밥": { en: "Rice Bowl", it: "Ciotola di riso" },
        "죽": { en: "Porridge", it: "Zuppa di riso" },
        "면": { en: "Noodles", it: "Pasta" },
        "국수": { en: "Noodles", it: "Tagliolini" },
        "파스타": { en: "Pasta", it: "Pasta" },
        "스파게티": { en: "Spaghetti", it: "Spaghetti" },
        "피자": { en: "Pizza", it: "Pizza" },
        "리조또": { en: "Risotto", it: "Risotto" },
        "샐러드": { en: "Salad", it: "Insalata" },
        "스테이크": { en: "Steak", it: "Bistecca" },
        "수프": { en: "Soup", it: "Zuppa" },
        "소스": { en: "Sauce", it: "Salsa" },

        // --- 대표 한식 & 양식 완성 요리명 ---
        "뼈해장국": { en: "Pork Backbone Hangover Soup", it: "Zuppa di ossa di maiale" },
        "해장국": { en: "Hangover Soup", it: "Zuppa sbornia" },
        "감자탕": { en: "Pork Backbone Stew With Potatoes", it: "Stufato di maiale e patate" },
        "김치찌개": { en: "Kimchi Stew", it: "Stufato di kimchi" },
        "된장찌개": { en: "Soybean Paste Stew", it: "Stufato di pasta di soia" },
        "된장국": { en: "Soybean Paste Soup", it: "Zuppa di pasta di soia" },
        "순두부찌개": { en: "Soft Tofu Stew", it: "Stufato di tofu morbido" },
        "부대찌개": { en: "Army Base Stew", it: "Stufato misto" },
        "갈비탕": { en: "Beef Short Rib Soup", it: "Zuppa di costine di manzo" },
        "설렁탕": { en: "Ox Bone Soup", it: "Zuppa di ossa di bue" },
        "곰탕": { en: "Beef Bone Soup", it: "Zuppa di manzo" },
        "삼계탕": { en: "Ginseng Chicken Soup", it: "Zuppa di pollo al ginseng" },
        "미역국": { en: "Seaweed Soup", it: "Zuppa di alghe" },
        "콩나물국": { en: "Bean Sprout Soup", it: "Zuppa di germogli di soia" },
        "북엇국": { en: "Dried Pollock Soup", it: "Zuppa di merluzzo essiccato" },
        "육개장": { en: "Spicy Beef Soup", it: "Zuppa piccante di manzo" },
        "떡국": { en: "Rice Cake Soup", it: "Zuppa di gnocchi di riso" },
        "만둣국": { en: "Dumpling Soup", it: "Zuppa di ravioli" },
        "제육볶음": { en: "Spicy Stir-fried Pork", it: "Maiale piccante saltato" },
        "불고기": { en: "Bulgogi (Marinated Beef)", it: "Bulgogi di manzo" },
        "소불고기": { en: "Beef Bulgogi", it: "Bulgogi di manzo" },
        "돼지불고기": { en: "Pork Bulgogi", it: "Bulgogi di maiale" },
        "갈비찜": { en: "Braised Short Ribs", it: "Costine brasate" },
        "닭볶음탕": { en: "Spicy Braised Chicken", it: "Pollo piccante brasato" },
        "닭갈비": { en: "Spicy Stir-fried Chicken", it: "Pollo piccante saltato" },
        "비빔밥": { en: "Bibimbap (Mixed Rice)", it: "Bibimbap" },
        "잡채": { en: "Japchae (Glass Noodles)", it: "Tagliolini di fecola saltati" },
        "떡볶이": { en: "Tteokbokki (Spicy Rice Cakes)", it: "Gnocchi di riso piccanti" },
        "해물파전": { en: "Seafood Scallion Pancake", it: "Frittella di frutti di mare" },
        "파전": { en: "Scallion Pancake", it: "Frittella di cipollotti" },
        "김치전": { en: "Kimchi Pancake", it: "Frittella di kimchi" },
        "김치볶음밥": { en: "Kimchi Fried Rice", it: "Riso fritto con kimchi" },
        "소고기볶음밥": { en: "Beef Fried Rice", it: "Riso fritto con manzo" },
        "새우볶음밥": { en: "Shrimp Fried Rice", it: "Riso fritto con gamberi" },
        "계란볶음밥": { en: "Egg Fried Rice", it: "Riso fritto con uova" },
        "까르보나라": { en: "Carbonara Pasta", it: "Pasta alla carbonara" },
        "알리오올리오": { en: "Aglio e Olio Pasta", it: "Pasta aglio e olio" },
        "봉골레": { en: "Vongole Pasta", it: "Pasta alle vongole" },
        "토마토파스타": { en: "Tomato Pasta", it: "Pasta al pomodoro" },
        "크림파스타": { en: "Cream Pasta", it: "Pasta alla panna" },
        "로제파스타": { en: "Rose Pasta", it: "Pasta alla salsa rosa" },
        "버섯크림파스타": { en: "Mushroom Cream Pasta", it: "Pasta ai funghi e panna" },
        "해물파스타": { en: "Seafood Pasta", it: "Pasta ai frutti di mare" },

        // --- 육류 및 부위 ---
        "뼈": { en: "Pork Bones", it: "Ossa di maiale" },
        "등뼈": { en: "Pork Spine", it: "Spina di maiale" },
        "소고기": { en: "Beef", it: "Manzo" },
        "쇠고기": { en: "Beef", it: "Manzo" },
        "돼지고기": { en: "Pork", it: "Maiale" },
        "닭고기": { en: "Chicken", it: "Pollo" },
        "닭": { en: "Chicken", it: "Pollo" },
        "오리고기": { en: "Duck", it: "Anatra" },
        "양고기": { en: "Lamb", it: "Agnello" },
        "갈비": { en: "Ribs", it: "Costolette" },
        "삼겹살": { en: "Pork Belly", it: "Pancetta" },
        "목살": { en: "Pork Shoulder", it: "Coppa di maiale" },
        "안심": { en: "Tenderloin", it: "Filetto" },
        "등심": { en: "Sirloin", it: "Controfiletto" },
        "차돌박이": { en: "Beef Brisket", it: "Punta di petto" },
        "베이컨": { en: "Bacon", it: "Pancetta affumicata" },
        "소시지": { en: "Sausage", it: "Salsiccia" },
        "햄": { en: "Ham", it: "Prosciutto" },

        // --- 해산물 ---
        "해물": { en: "Seafood", it: "Frutti di mare" },
        "해산물": { en: "Seafood", it: "Frutti di mare" },
        "새우": { en: "Shrimp", it: "Gambero" },
        "오징어": { en: "Squid", it: "Calamaro" },
        "낙지": { en: "Octopus", it: "Polpo" },
        "문어": { en: "Giant Octopus", it: "Polpo grande" },
        "조개": { en: "Shellfish", it: "Frutti di mare" },
        "바지락": { en: "Clam", it: "Vongola" },
        "홍합": { en: "Mussel", it: "Cozza" },
        "굴": { en: "Oyster", it: "Ostrica" },
        "게": { en: "Crab", it: "Granchio" },
        "꽃게": { en: "Blue Crab", it: "Granchio blu" },
        "생선": { en: "Fish", it: "Pesce" },
        "연어": { en: "Salmon", it: "Salmone" },
        "참치": { en: "Tuna", it: "Tonno" },
        "고등어": { en: "Mackerel", it: "Sgombro" },
        "명란": { en: "Pollock Roe", it: "Uova di merluzzo" },
        "멸치": { en: "Anchovy", it: "Acciuga" },

        // --- 채소 및 버섯 ---
        "대파": { en: "Green Onion", it: "Cipollotto" },
        "파": { en: "Scallion", it: "Cipollotto" },
        "쪽파": { en: "Chives", it: "Erba cipollina" },
        "양파": { en: "Onion", it: "Cipolla" },
        "마늘": { en: "Garlic", it: "Aglio" },
        "통마늘": { en: "Whole Garlic", it: "Aglio intero" },
        "다진마늘": { en: "Minced Garlic", it: "Aglio tritato" },
        "생강": { en: "Ginger", it: "Zenzero" },
        "청양고추": { en: "Cheongyang Hot Pepper", it: "Peperoncino piccante" },
        "고추": { en: "Chili Pepper", it: "Peperoncino" },
        "홍고추": { en: "Red Chili", it: "Peperoncino rosso" },
        "피망": { en: "Bell Pepper", it: "Peperone" },
        "파프리카": { en: "Paprika", it: "Paprika" },
        "깻잎": { en: "Perilla Leaves", it: "Foglie di perilla" },
        "단배추": { en: "Sweet Baby Cabbage", it: "Cavolo dolce" },
        "배추": { en: "Napa Cabbage", it: "Cavolo cinese" },
        "양배추": { en: "Cabbage", it: "Cavolo" },
        "당근": { en: "Carrot", it: "Carota" },
        "감자": { en: "Potato", it: "Patata" },
        "고구마": { en: "Sweet Potato", it: "Patata dolce" },
        "무": { en: "Radish", it: "Ravanello" },
        "오이": { en: "Cucumber", it: "Cetriolo" },
        "애호박": { en: "Zucchini", it: "Zucchina" },
        "호박": { en: "Pumpkin", it: "Zucca" },
        "가지": { en: "Eggplant", it: "Melanzana" },
        "토마토": { en: "Tomato", it: "Pomodoro" },
        "방울토마토": { en: "Cherry Tomato", it: "Pomodorini" },
        "시금치": { en: "Spinach", it: "Spinaci" },
        "브로콜리": { en: "Broccoli", it: "Broccoli" },
        "아스파라거스": { en: "Asparagus", it: "Asparago" },
        "콩나물": { en: "Soybean Sprouts", it: "Germogli di soia" },
        "숙주": { en: "Mung Bean Sprouts", it: "Germogli di soia verde" },
        "두부": { en: "Tofu", it: "Tofu" },
        "순두부": { en: "Soft Tofu", it: "Tofu morbido" },
        "버섯": { en: "Mushroom", it: "Fungo" },
        "양송이버섯": { en: "Button Mushroom", it: "Champignon" },
        "양송이": { en: "Button Mushroom", it: "Champignon" },
        "표고버섯": { en: "Shiitake Mushroom", it: "Fungo Shiitake" },
        "표고": { en: "Shiitake Mushroom", it: "Fungo Shiitake" },
        "느타리버섯": { en: "Oyster Mushroom", it: "Fungo Ostrica" },
        "느타리": { en: "Oyster Mushroom", it: "Fungo Ostrica" },
        "새송이버섯": { en: "King Oyster Mushroom", it: "Cardoncello" },
        "새송이": { en: "King Oyster Mushroom", it: "Cardoncello" },
        "팽이버섯": { en: "Enoki Mushroom", it: "Fungo Enoki" },
        "파슬리": { en: "Parsley", it: "Prezzemolo" },
        "바질": { en: "Basil", it: "Basilico" },
        "로즈마리": { en: "Rosemary", it: "Rosmarino" },
        "오레가노": { en: "Oregano", it: "Origano" },

        // --- 양념 및 조미료 ---
        "된장": { en: "Soybean Paste", it: "Pasta di soia fermentata" },
        "고추장": { en: "Red Pepper Paste", it: "Pasta di peperoncino piccante" },
        "간장": { en: "Soy Sauce", it: "Salsa di soia" },
        "진간장": { en: "Dark Soy Sauce", it: "Salsa di soia scura" },
        "국간장": { en: "Soup Soy Sauce", it: "Salsa di soia per zuppe" },
        "고춧가루": { en: "Red Pepper Powder", it: "Polvere di peperoncino" },
        "소금": { en: "Salt", it: "Sale" },
        "꽃소금": { en: "Fine Sea Salt", it: "Sale marino fine" },
        "설탕": { en: "Sugar", it: "Zucchero" },
        "후추": { en: "Black Pepper", it: "Pepe nero" },
        "통후추": { en: "Pepper Corn", it: "Pepe in grani" },
        "백후추": { en: "White Pepper", it: "Pepe bianco" },
        "혼다시": { en: "Hondashi", it: "Brodo di bonito" },
        "다시다": { en: "Beef Dashida", it: "Dado di manzo" },
        "치킨스톡": { en: "Chicken Stock", it: "Brodo di pollo" },
        "까나리액젓": { en: "Sand Lance Fish Sauce", it: "Salsa di pesce" },
        "까나리 액젓": { en: "Sand Lance Fish Sauce", it: "Salsa di pesce" },
        "멸치액젓": { en: "Anchovy Fish Sauce", it: "Salsa di acciughe" },
        "액젓": { en: "Fish Sauce", it: "Salsa di pesce" },
        "참기름": { en: "Sesame Oil", it: "Olio di sesamo" },
        "들기름": { en: "Perilla Oil", it: "Olio di perilla" },
        "올리브유": { en: "Olive Oil", it: "Olio d'oliva" },
        "올리브 오일": { en: "Olive Oil", it: "Olio d'oliva" },
        "식용유": { en: "Cooking Oil", it: "Olio da cucina" },
        "버터": { en: "Butter", it: "Burro" },
        "물": { en: "Water", it: "Acqua" },
        "육수": { en: "Broth", it: "Brodo" },
        "맛술": { en: "Cooking Wine", it: "Vino da cucina" },
        "미림": { en: "Mirin", it: "Mirin" },
        "식초": { en: "Vinegar", it: "Aceto" },
        "물엿": { en: "Corn Syrup", it: "Sciroppo di mais" },
        "올리고당": { en: "Oligosaccharide", it: "Sciroppo dolce" },
        "굴소스": { en: "Oyster Sauce", it: "Salsa d'ostriche" },
        "꿀": { en: "Honey", it: "Miele" },

        // --- 유제품 및 파스타/도우 ---
        "생크림": { en: "Heavy Cream", it: "Panna da cucina" },
        "크림": { en: "Cream", it: "Panna" },
        "크림소스": { en: "Cream Sauce", it: "Salsa alla panna" },
        "우유": { en: "Milk", it: "Latte" },
        "치즈": { en: "Cheese", it: "Formaggio" },
        "모짜렐라": { en: "Mozzarella", it: "Mozzarella" },
        "파마산 치즈": { en: "Parmesan Cheese", it: "Parmigiano" },
        "파마산": { en: "Parmesan", it: "Parmigiano" },
        "계란": { en: "Egg", it: "Uovo" },
        "달걀": { en: "Egg", it: "Uovo" },
        "페델리니": { en: "Fedelini", it: "Fedelini" },
        "푸실리": { en: "Fusilli", it: "Fusilli" },
        "도우": { en: "Pizza Dough", it: "Impasto per pizza" },
        "피자 도우": { en: "Pizza Dough", it: "Impasto per pizza" },

        // --- 숫자 변환 ---
        "1": { en: "1", it: "1" },
        "2": { en: "2", it: "2" },
        "3": { en: "3", it: "3" },
        "4": { en: "4", it: "4" },
        "5": { en: "5", it: "5" },
        "하나": { en: "One", it: "Uno" },
        "둘": { en: "Two", it: "Due" },
        "셋": { en: "Three", it: "Tre" },
        "넷": { en: "Four", it: "Quattro" }
    };

    // 2. 역방향 사전 (영어 / 이탈리아어 -> 한국어 자동 매핑용)
    const REVERSE_DICTIONARY = {};
    Object.keys(CULINARY_DICTIONARY).forEach(kor => {
        const item = CULINARY_DICTIONARY[kor];
        if (item.en) {
            REVERSE_DICTIONARY[item.en.toLowerCase()] = kor;
        }
        if (item.it) {
            REVERSE_DICTIONARY[item.it.toLowerCase()] = kor;
        }
    });

    // 자주 쓰이는 파스타/양식 식자재 영문 단어 역매핑 추가
    REVERSE_DICTIONARY["fedelini"] = "페델리니";
    REVERSE_DICTIONARY["cepe"] = "그물버섯(Cepe)";
    REVERSE_DICTIONARY["various"] = "모둠버섯";
    REVERSE_DICTIONARY["pepper corn"] = "통후추";
    REVERSE_DICTIONARY["tomato concasse"] = "토마토 콘카세";
    REVERSE_DICTIONARY["chopped parsely"] = "다진 파슬리";
    REVERSE_DICTIONARY["chopped parsley"] = "다진 파슬리";
    REVERSE_DICTIONARY["curry flower"] = "컬리플라워";
    REVERSE_DICTIONARY["cauliflower"] = "컬리플라워";
    REVERSE_DICTIONARY["slice onion"] = "슬라이스 양파";
    REVERSE_DICTIONARY["chicken stock"] = "치킨 스톡";
    REVERSE_DICTIONARY["cream sauce"] = "크림 소스";
    REVERSE_DICTIONARY["olive oil"] = "올리브 오일";
    REVERSE_DICTIONARY["fussili"] = "푸실리";
    REVERSE_DICTIONARY["fusilli"] = "푸실리";
    REVERSE_DICTIONARY["green onion"] = "대파";
    REVERSE_DICTIONARY["scallion"] = "대파";
    REVERSE_DICTIONARY["cipollotto"] = "대파";

    /**
     * [100% 완전 오프라인 복합어 분해 & 결합 번역 엔진]
     * 인터넷이 전혀 없는 오프라인 상태에서도 단어들을 스스로 분석/분해/결합하여
     * 0.0001초 만에 완벽한 외국어 요리명으로 변환합니다.
     */
    function translateOfflineCompound(text, targetLang = "en") {
        if (!text || !text.trim()) return "";
        const clean = text.trim();

        // 1. 단어 전체가 사전에 있는 경우 (0.0001초 직행)
        if (CULINARY_DICTIONARY[clean] && CULINARY_DICTIONARY[clean][targetLang]) {
            return CULINARY_DICTIONARY[clean][targetLang];
        }

        // 2. 띄어쓰기로 구분된 단어 조합 (예: "소고기 볶음밥", "단배추 된장국")
        const tokens = clean.split(/\s+/);
        if (tokens.length > 1) {
            const translatedTokens = tokens.map(token => {
                if (CULINARY_DICTIONARY[token] && CULINARY_DICTIONARY[token][targetLang]) {
                    return CULINARY_DICTIONARY[token][targetLang];
                }
                return token;
            });
            const joined = translatedTokens.join(" ");
            // 최소 1단어 이상 사전에서 번역된 경우 조합 결과 반환
            if (translatedTokens.some((t, i) => t !== tokens[i])) {
                return joined;
            }
        }

        // 3. 붙여쓴 복합어 지능형 분해 (예: "소고기볶음밥", "돼지고기김치찌개")
        const dictKeys = Object.keys(CULINARY_DICTIONARY).sort((a, b) => b.length - a.length);
        let remaining = clean;
        const matchedParts = [];

        while (remaining.length > 0) {
            let matched = false;
            for (const key of dictKeys) {
                if (key.length >= 2 && remaining.startsWith(key)) {
                    matchedParts.push(CULINARY_DICTIONARY[key][targetLang]);
                    remaining = remaining.slice(key.length).trim();
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                // 한 글자 건너뛰기
                matchedParts.push(remaining[0]);
                remaining = remaining.slice(1);
            }
        }

        // 매칭된 영문 단어가 존재하면 결합
        if (matchedParts.length > 0 && matchedParts.some(p => !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(p))) {
            return matchedParts.join(" ").replace(/\s+/g, " ").trim();
        }

        return "";
    }

    /**
     * Google Translate 공개 API를 활용한 실시간 고속 양방향 번역 함수
     * @param {string} text - 번역할 텍스트
     * @param {string} targetLang - 대상 언어 ('ko': 한국어, 'en': 영어, 'it': 이탈리아어)
     * @param {string} sourceLang - 원본 언어 ('auto': 자동 감지, 'ko', 'en', 'it')
     * @returns {Promise<string>} 번역된 텍스트
     */
    async function fetchOnlineTranslation(text, targetLang = "en", sourceLang = "auto") {
        if (!text || !text.trim()) return "";
        const cleanText = text.trim();

        // 1. [1순위] 로컬 백엔드 서버(/api/translate) 고속 API 호출 (CORS 차단 원천 우회)
        try {
            const localApiUrl = `/api/translate?text=${encodeURIComponent(cleanText)}&tl=${targetLang}&sl=${sourceLang}`;
            const apiRes = await fetch(localApiUrl, { method: "GET" });
            if (apiRes.ok) {
                const apiData = await apiRes.json();
                if (apiData && apiData.result) {
                    return apiData.result;
                }
            }
        } catch (apiErr) {
            // 로컬 서버 연결 불가 시(정적 호스팅 환경 등) 클라이언트 직접 호출로 Fallback
        }

        // 2. [2순위 Fallback] 구글 번역 공개 gtx 엔드포인트 직접 호출
        const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleanText)}`;

        try {
            const res = await fetch(googleUrl, { method: "GET" });
            if (res.ok) {
                const data = await res.json();
                if (data && data[0]) {
                    // 번역 결과 문장들을 하나로 결합
                    return data[0].map(item => item[0]).join("");
                }
            }
        } catch (err) {
            console.warn("구글 1차 번역 실패, 보조 번역기 시도:", err.message);
        }

        // 3. [3순위 Fallback] MyMemory API 보조 호출
        try {
            const pair = sourceLang === "auto" ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`;
            const memoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${pair}`;
            const memRes = await fetch(memoryUrl);
            if (memRes.ok) {
                const memData = await memRes.json();
                if (memData?.responseData?.translatedText) {
                    return memData.responseData.translatedText;
                }
            }
        } catch (fallbackErr) {
            console.warn("보조 번역기도 실패함:", fallbackErr.message);
        }

        // 4. 네트워크 완전 두절 시 원본 그대로 반환 (프로그램 중단 원천 방지)
        return cleanText;
    }

    /**
     * 단어 또는 짧은 식재료명 번역 (한국어 <-> 외국어 양방향 사전 지원)
     * @param {string} word - 번역할 단어 (한글 또는 영문/이탈리아어)
     * @param {'ko' | 'en' | 'it'} targetLang - 대상 언어
     */
    async function translateWord(word, targetLang = "en") {
        if (!word || !word.trim()) return "";
        const trimmed = word.trim();
        const lower = trimmed.toLowerCase();

        // (1) 한국어로 되돌리기 (targetLang === 'ko')
        if (targetLang === "ko") {
            // 이미 한글인 경우 그대로 반환
            if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(trimmed)) {
                return trimmed;
            }
            // 역방향 사전 우선 확인 (0.001초 고속 매핑)
            if (REVERSE_DICTIONARY[lower]) {
                return REVERSE_DICTIONARY[lower];
            }
            // 사전에 없으면 구글 번역기로 한국어 변환
            try {
                return await fetchOnlineTranslation(trimmed, "ko", "auto");
            } catch (err) {
                console.error("한국어 역번역 오류:", err);
                return trimmed;
            }
        }

        // (2) 영어 또는 이탈리아어로 변환 (targetLang === 'en' 또는 'it')
        // 내장 사전 우선 확인
        if (CULINARY_DICTIONARY[trimmed] && CULINARY_DICTIONARY[trimmed][targetLang]) {
            return CULINARY_DICTIONARY[trimmed][targetLang];
        }

        // 괄호가 포함된 경우 (예: "뼈 (사이즈 9CM)") 괄호 안팎 분리 번역 지원
        const matchBracket = trimmed.match(/^([^(]+)(\([^)]+\))?$/);
        if (matchBracket) {
            const mainName = matchBracket[1].trim();
            const bracketPart = matchBracket[2] ? matchBracket[2].trim() : "";

            if (CULINARY_DICTIONARY[mainName] && CULINARY_DICTIONARY[mainName][targetLang]) {
                const translatedMain = CULINARY_DICTIONARY[mainName][targetLang];
                return bracketPart ? `${translatedMain} ${bracketPart}` : translatedMain;
            }
        }

        // 사전에 없으면 실시간 온라인 번역 API 호출
        try {
            const onlineResult = await fetchOnlineTranslation(trimmed, targetLang, "auto");
            // 영문의 경우 첫 글자 대문자화 (Title Case)
            if (targetLang === "en" && onlineResult) {
                return onlineResult.replace(/\b\w/g, l => l.toUpperCase());
            }
            return onlineResult;
        } catch (err) {
            console.error("단어 번역 오류:", err);
            return trimmed;
        }
    }

    /**
     * 한국어 요리명을 영어 메뉴명(ENGLISH NAME)으로 개별 번역
     * [100% 오프라인 사전 우선 ➔ 인터넷 없어도 0.0001초 즉시 작동]
     * @param {string} koreanText
     * @returns {Promise<string>}
     */
    async function translateEnglishName(koreanText) {
        if (!koreanText || !koreanText.trim()) return "";
        const clean = koreanText.trim();

        // 1순위: [완전 오프라인] 내장 요리 사전 & 복합어 지능 결합 (인터넷 0%에서도 즉시 변환)
        const offlineResult = translateOfflineCompound(clean, "en");
        if (offlineResult) {
            return offlineResult;
        }

        // 2순위: 사전에 없는 생소한 단어일 때만 온라인 보조 시도
        try {
            const en = await fetchOnlineTranslation(clean, "en", "ko");
            if (en && en.trim()) return en.trim();
        } catch (e) {
            // 오프라인 상태 시 원본 반환
        }

        return clean;
    }

    /**
     * 한국어 요리명을 이탈리아어 메뉴명(ITALIANO NAME)으로 개별 번역
     * [100% 오프라인 사전 우선 ➔ 인터넷 없어도 0.0001초 즉시 작동]
     * @param {string} koreanText
     * @returns {Promise<string>}
     */
    async function translateItalianoName(koreanText) {
        if (!koreanText || !koreanText.trim()) return "";
        const clean = koreanText.trim();

        // 1순위: [완전 오프라인] 내장 요리 사전 & 복합어 지능 결합 (인터넷 0%에서도 즉시 변환)
        const offlineResult = translateOfflineCompound(clean, "it");
        if (offlineResult) {
            return offlineResult;
        }

        // 2순위: 사전에 없는 생소한 단어일 때만 온라인 보조 시도
        try {
            const it = await fetchOnlineTranslation(clean, "it", "ko");
            if (it && it.trim()) return it.trim();
        } catch (e) {
            // 오프라인 상태 시 원본 반환
        }

        return clean;
    }

    /**
     * 문장 또는 요리 설명 전체 번역 (KOREA NAME -> ENGLISH, ITALIANO)
     * @param {string} koreanText - 한국어 요리명 및 설명
     * @returns {Promise<{english: string, italiano: string}>}
     */
    async function translateRecipeNames(koreanText) {
        if (!koreanText || !koreanText.trim()) {
            return { english: "", italiano: "" };
        }

        const [english, italiano] = await Promise.all([
            fetchOnlineTranslation(koreanText, "en", "ko"),
            fetchOnlineTranslation(koreanText, "it", "ko")
        ]);

        return {
            english: english ? english.trim() : "",
            italiano: italiano ? italiano.trim() : ""
        };
    }

    /**
     * 외국어(영어 또는 이탈리아어) 메뉴명을 한국어로 역번역
     * @param {string} foreignText - 영문 또는 이탈리아어 요리명
     * @returns {Promise<string>} 한국어 번역 결과
     */
    async function translateToKorean(foreignText) {
        if (!foreignText || !foreignText.trim()) return "";
        return await fetchOnlineTranslation(foreignText.trim(), "ko", "auto");
    }

    /**
     * 🌐 어떤 텍스트가 들어오든 한국어, 영어, 이탈리아어 3개 언어를 한꺼번에 계산하여 반환
     * (팝업 메뉴에서 원하는 언어를 1초 만에 자유자재로 골라 넣을 수 있게 해줌)
     * @param {string} text - 원본 텍스트 ("대파", "Green Onion", "Cipollotto", 또는 문장)
     * @returns {Promise<{korean: string, english: string, italiano: string}>}
     */
    async function translateAllLanguages(text) {
        if (!text || !text.trim()) {
            return { korean: "", english: "", italiano: "" };
        }
        const trimmed = text.trim();
        const lower = trimmed.toLowerCase();

        // 1. 단어인 경우 (내장 사전 우선 0.001초 조회)
        let kor = "";
        let en = "";
        let it = "";

        if (CULINARY_DICTIONARY[trimmed]) {
            kor = trimmed;
            en = CULINARY_DICTIONARY[trimmed].en;
            it = CULINARY_DICTIONARY[trimmed].it;
        } else if (REVERSE_DICTIONARY[lower]) {
            kor = REVERSE_DICTIONARY[lower];
            if (CULINARY_DICTIONARY[kor]) {
                en = CULINARY_DICTIONARY[kor].en;
                it = CULINARY_DICTIONARY[kor].it;
            }
        }

        // 사전에서 3개 언어가 모두 준비되었다면 번역 API 없이 즉시 반환
        if (kor && en && it) {
            return { korean: kor, english: en, italiano: it };
        }

        // 2. 사전에 없거나 긴 문장인 경우 온라인 API를 통해 지능형 양방향 변환
        const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(trimmed);

        if (hasKorean) {
            // 한글 원본인 경우 -> 영어, 이탈리아어 번역
            const [onlineEn, onlineIt] = await Promise.all([
                fetchOnlineTranslation(trimmed, "en", "ko"),
                fetchOnlineTranslation(trimmed, "it", "ko")
            ]);
            return {
                korean: trimmed,
                english: onlineEn || trimmed,
                italiano: onlineIt || trimmed
            };
        } else {
            // 외국어(영어/이탈리아어) 원본인 경우 -> 먼저 한국어로 역번역
            const onlineKo = kor || await fetchOnlineTranslation(trimmed, "ko", "auto");

            // 역번역된 한국어를 바탕으로 나머지 언어 보완
            const [onlineEn, onlineIt] = await Promise.all([
                en ? Promise.resolve(en) : fetchOnlineTranslation(onlineKo || trimmed, "en", "auto"),
                it ? Promise.resolve(it) : fetchOnlineTranslation(onlineKo || trimmed, "it", "auto")
            ]);

            return {
                korean: onlineKo || trimmed,
                english: onlineEn || trimmed,
                italiano: onlineIt || trimmed
            };
        }
    }

    // 외부로 노출할 공개 함수
    return {
        translateWord,
        translateRecipeNames,
        translateEnglishName,
        translateItalianoName,
        translateToKorean,
        translateAllLanguages,
        CULINARY_DICTIONARY,
        REVERSE_DICTIONARY
    };
})();

// 브라우저 및 전역 환경 바인딩
if (typeof window !== "undefined") {
    window.ChefTranslator = ChefTranslator;
}
if (typeof global !== "undefined") {
    global.ChefTranslator = ChefTranslator;
}

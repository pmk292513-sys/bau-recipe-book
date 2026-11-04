/**
 * [기본 레시피 데이터 모듈 - js/recipe_data.js]
 * 원본 이미지의 레시피(LA MANCHA RECIPE - Funghi 파스타)와
 * 사장님의 비법 레시피(뼈해장국)를 영구 기본 내장 데이터로 관리합니다.
 */

// 1. 샘플 버섯 파스타 레시피
const DEFAULT_SAMPLE_RECIPE = {
    title: "LA MANCHA RECIPE",
    italianoName: "Funghi",
    englishName: "Spaghetti With Garlic, Various, Mushroom & Cream Sauce.",
    koreaName: "양송이, 느타리, 표고, 새 송이 등 야채만으로 조리한 버섯 스파게티",
    
    category: "PASTA",
    date: "2006. 9",
    cost: "1,200",
    costCurrency: "원",
    price: "8,500",
    priceCurrency: "원",
    portion: "1 인분",

    ingredients: [
        { name: "Fedelini", amount: "140", unit: "g" },
        { name: "Cream Sauce", amount: "7", unit: "Oz" },
        { name: "Chicken Stock", amount: "5", unit: "Oz" },
        { name: "Fussili", amount: "10", unit: "g" },
        { name: "Olive Oil", amount: "0.5", unit: "Oz" },
        { name: "Pepper Corn", amount: "little", unit: "" },
        { name: "Slice Onion", amount: "15", unit: "g" },
        { name: "Mushroom", amount: "25", unit: "g" },
        { name: "Cepe", amount: "25", unit: "g" },
        { name: "Various", amount: "25", unit: "g" },
        { name: "Broccoli", amount: "15", unit: "g" },
        { name: "Curry Flower", amount: "15", unit: "g" },
        { name: "Chopped Parsely", amount: "little", unit: "" }
    ],

    cookingTechnique: [
        "Pan에 Olive Oil을 두르고 Garlic, Onion을 볶는다.",
        "Mushroom, Cepe, Various를 넣고 살짝 볶는다.",
        "Chicken Stock, Cream Sauce를 넣고 끓인다.",
        "삶은 Fedelini 면을 넣고 소스가 잘 배어들게 조리한다.",
        "Fussili, Broccoli, Curry Flower를 넣고 농도를 맞춘다.",
        "Chopped Parsely를 뿌려 마무리한다."
    ],

    topping: [
        "Pepper Corn, Tomato Concasse 20g"
    ],

    signatureEnabled: false,
    signature: [],

    caution: [
        "적어도 4가지 이상의 버섯을 사용해야 한다.",
        "스톡의 농도와 간을 반드시 조리 전에 체크할 것."
    ],

    photoData: "sample_images/funghi_pasta.jpg"
};

// 2. 사장님의 시그니처 뼈해장국 비법 레시피 (1안 핵심 요약본 적용)
const BONE_HAEJANGGUK_RECIPE = {
    title: "BAU SPECIAL RECIPE",
    italianoName: "Zuppa di ossa di maiale",
    englishName: "Pork Back-bone Hangover Soup",
    koreaName: "뼈해장국",
    
    category: "SOUP",
    date: "2026. 11",
    cost: "25,000",
    costCurrency: "원",
    price: "9,500",
    priceCurrency: "원",
    portion: "1 인분",

    ingredients: [
        { name: "뼈 (사이즈 9CM)", amount: "15", unit: "kg" },
        { name: "단배추", amount: "4", unit: "단" },
        { name: "된장", amount: "750", unit: "g" },
        { name: "고추장", amount: "450", unit: "g" },
        { name: "혼다시", amount: "130", unit: "g" },
        { name: "백후추", amount: "20", unit: "g" },
        { name: "고춧가루", amount: "220", unit: "g" },
        { name: "까나리 액젓", amount: "150", unit: "g" },
        { name: "통마늘", amount: "160", unit: "g" },
        { name: "청양고추", amount: "150", unit: "g" }
    ],

    // [1안 프로 요약본 적용]
    cookingTechnique: [
        "뼈는 찬물에 3시간 이상 담궈 핏물을 완전히 제거한다. (전날 냉장 침지 권장)",
        "냄비에 뼈와 물을 붓고 강불로 한소끔 끓여 불순물과 기름을 초벌 제거한다.",
        "초벌 삶은 물은 전량 버리고, 뼈는 찬물에 깨끗이 헹궈 씻어둔다.",
        "새 냄비에 물을 채워 강불로 끓인 뒤, 씻어둔 뼈를 넣는다.",
        "된장·고추장은 채반에 걸러 풀어 넣고(건더기 제거), 모든 양념을 넣고 75분간 끓인다. (거품·기름 수시 제거)",
        "단배추를 넣고 숨이 부드럽게 죽을 때까지 50~70분 정도 더 끓여 완성한다."
    ],

    topping: [
        "대파 , 깻잎 , 고추 (고명용으로 빨간 고추를 사용해도 좋다)"
    ],

    signatureEnabled: true,
    signature: [
        "★ 까나리 액젓 , 통마늘 , 청양고추를 믹서기로 갈아 준비한다 ★"
    ],

    caution: [
        "국물이 끓어넘치지 않도록 불 조절에 주의하며, 거품과 기름을 수시로 걷어내야 국물이 맑고 깊어집니다."
    ],

    photoData: "sample_images/funghi_pasta.jpg"
};

// 전역 객체 바인딩
window.DEFAULT_SAMPLE_RECIPE = DEFAULT_SAMPLE_RECIPE;
window.BONE_HAEJANGGUK_RECIPE = BONE_HAEJANGGUK_RECIPE;
window.INITIAL_RECIPES = [
    {
        id: "recipe_bone_haejangguk_001",
        createdAt: "2026-11-03T10:00:00.000Z",
        updatedAt: "2026-11-04T00:00:00.000Z",
        ...BONE_HAEJANGGUK_RECIPE
    },
    {
        id: "sample_funghi_001",
        createdAt: "2026-11-02T10:00:00.000Z",
        updatedAt: "2026-11-02T10:00:00.000Z",
        ...DEFAULT_SAMPLE_RECIPE
    }
];

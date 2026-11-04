/**
 * [단위 정의 모듈 - js/units.js]
 * 요리, 소스, 야채 등에 사용하는 모든 단위를 정의합니다.
 * 사용자가 원하는 단위를 쉽게 선택할 수 있고, 필요 시 직접 입력도 가능합니다.
 */

// 요리에 사용되는 단위 목록 정의
const RECIPE_UNITS = [
    // 1. 야채, 채소 및 과일/버섯 전용 단위 (신규 집중 보강!)
    { label: "단 (시금치, 대파, 부추 등)", value: "단" },
    { label: "묶음 (쪽파, 나물류 등)", value: "묶음" },
    { label: "포기 (배추, 양상추 등)", value: "포기" },
    { label: "뿌리 (대파, 인삼 등)", value: "뿌리" },
    { label: "줄기 (대 / 샐러리, 아스파라거스)", value: "줄기" },
    { label: "송이 (버섯, 브로콜리 등)", value: "송이" },
    { label: "통 (양배추, 배추 등)", value: "통" },
    { label: "쪽 (마늘 등)", value: "쪽" },
    { label: "톨 / 알", value: "톨" },
    { label: "토막 (무, 생선 등)", value: "토막" },

    // 2. 일상 요리 및 주방 실전 계량 단위 (국자, 줌 등 보강)
    { label: "밥숟가락 (큰술 / Tbsp)", value: "밥숟가락" },
    { label: "티스푼 (작은술 / tsp)", value: "티스푼" },
    { label: "국자 (소스, 스프, 육수 등)", value: "국자" },
    { label: "한 꼬집 (Pinch)", value: "한 꼬집" },
    { label: "종이컵 (Cup)", value: "종이컵" },
    { label: "줌 / 주먹 (한 줌, 치즈 등)", value: "줌" },
    
    // 3. 기본 무게 및 부피 단위
    { label: "g (그램)", value: "g" },
    { label: "kg (킬로그램)", value: "kg" },
    { label: "Oz (온스)", value: "Oz" },
    { label: "ml (밀리리터)", value: "ml" },
    { label: "L (리터)", value: "L" },
    { label: "cc (시시)", value: "cc" },
    
    // 4. 개수, 판 및 피자/실전 조리 단위 (판, 넉넉히, 도포 등 보강)
    { label: "개 (ea)", value: "개" },
    { label: "판 (피자 도우, 파이 등)", value: "판" },
    { label: "장 (치즈 슬라이스, 깻잎, 또띠아)", value: "장" },
    { label: "팩 / 봉지", value: "팩" },
    { label: "캔 (통조림)", value: "캔" },
    { label: "넉넉히 / 골고루", value: "넉넉히" },
    { label: "도포 (얇게 펴바름)", value: "도포" },
    { label: "little (약간)", value: "little" },
    { label: "적당량", value: "적당량" },
    { label: "취향껏", value: "취향껏" },
    { label: "단위 없음 / 직접입력", value: "" }
];

// 전역 객체로 내보내기 (다른 스크립트에서 손쉽게 사용 가능)
window.RECIPE_UNITS = RECIPE_UNITS;


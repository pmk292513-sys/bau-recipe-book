/**
 * [단위 정의 모듈 - js/units.js]
 * 요리, 소스, 야채, 육류, 해물 등에 사용하는 모든 단위를 정의합니다.
 * 사장님 지침:
 * - 괄호() 및 괄호 안의 부가 설명은 모두 삭제하여 초깔끔한 단위 기호만 사용합니다.
 * - 요식업 표준: 큰술/밥숟가락은 'TS', 작은술/티스푼은 'ts', 그램은 'g'
 */

// 요리에 사용되는 단위 목록 정의 (괄호 및 부가 설명 없이 심플한 단위만 제공!)
const RECIPE_UNITS = [
    // 0. 필수 수량/마리 단위
    { label: "개", value: "개" },
    { label: "마리", value: "마리" },

    // 1. 기본 무게 및 부피 단위
    { label: "g", value: "g" },
    { label: "kg", value: "kg" },
    { label: "ml", value: "ml" },
    { label: "L", value: "L" },
    { label: "cc", value: "cc" },
    { label: "Oz", value: "Oz" },

    // 2. 야채, 채소 및 과일/버섯 전용 단위
    { label: "단", value: "단" },
    { label: "묶음", value: "묶음" },
    { label: "포기", value: "포기" },
    { label: "뿌리", value: "뿌리" },
    { label: "줄기", value: "줄기" },
    { label: "송이", value: "송이" },
    { label: "통", value: "통" },
    { label: "쪽", value: "쪽" },
    { label: "톨", value: "톨" },
    { label: "토막", value: "토막" },

    // 3. 일상 요리 및 주방 실전 계량 단위 (요식업 표준: 큰술 TS, 작은술 ts)
    { label: "TS", value: "TS" },
    { label: "ts", value: "ts" },
    { label: "국자", value: "국자" },
    { label: "꼬집", value: "꼬집" },
    { label: "컵", value: "컵" },
    { label: "줌", value: "줌" },
    
    // 4. 조리 및 포장 단위
    { label: "판", value: "판" },
    { label: "장", value: "장" },
    { label: "팩", value: "팩" },
    { label: "캔", value: "캔" },
    { label: "넉넉히", value: "넉넉히" },
    { label: "도포", value: "도포" },
    { label: "little", value: "little" },
    { label: "적당량", value: "적당량" },
    { label: "취향껏", value: "취향껏" },
    { label: "직접입력", value: "" }
];

/**
 * [단위 표기 정제 함수 - formatRecipeUnit]
 * 사장님 요청 사항:
 * 1. 단위에 들어간 () 괄호 및 괄호 안 내용 완전 삭제 (예: "g(그램)" -> "g", "개(ea)" -> "개")
 * 2. 밥숟가락/큰술 -> "TS" (대문자), 작은숟가락/티스푼/작은술 -> "ts" (소문자) 요식업 표준 변환
 * 3. 한글 풀네임(그램, 킬로그램 등)도 깔끔한 기호(g, kg 등)로 일괄 단축
 */
function formatRecipeUnit(unit) {
    if (!unit) return "";
    let clean = unit.toString().trim();
    
    // 괄호 () 및 （） 및 대괄호/중괄호 안의 모든 내용 완전 제거
    clean = clean.replace(/[\(\（\[\{][^\)\）\]\}]*[\)\）\]\}]/g, "").trim();
    
    // 한글 단위 풀네임 및 변형 -> 요식업 표준 기호 변환
    const map = {
        "그램": "g",
        "킬로그램": "kg",
        "밀리리터": "ml",
        "리터": "L",
        "시시": "cc",
        "온스": "Oz",
        "밥숟가락": "TS",
        "큰술": "TS",
        "테이블스푼": "TS",
        "tbsp": "TS",
        "tb": "TS",
        "TS": "TS",
        "티스푼": "ts",
        "작은숟가락": "ts",
        "작은술": "ts",
        "찻술": "ts",
        "tsp": "ts",
        "ts": "ts",
        "한꼬집": "꼬집",
        "종이컵": "컵",
        "주먹": "줌"
    };
    
    const lower = clean.toLowerCase();
    for (const [k, v] of Object.entries(map)) {
        if (clean === k || lower === k.toLowerCase()) {
            return v;
        }
    }
    
    return clean;
}

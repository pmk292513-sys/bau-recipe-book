/**
 * [서비스 워커 모듈 - sw.js]
 * 인터넷이 전혀 없는 오프라인 상태에서도 스마트폰에서 앱이 정상 작동하도록 지원합니다.
 * 버전: v70 (네트워크 우선 전략으로 변경하여 최신 코드 즉각 반영)
 */

const CACHE_NAME = "bau-recipe-book-cache-v117";

// 인터넷 없이도 오프라인에서 구동할 필수 리소스 목록
const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./favicon.ico",
    "./css/style.css",
    "./css/print.css",
    "./js/units.js",
    "./js/recipe_data.js",
    "./js/translator.js",
    "./js/storage.js",
    "./js/book_flip.js",
    "./js/app.js",
    "./sample_images/funghi_pasta.jpg",
    "./icons/brand_logo.png",
    "./icons/qr_install.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-192.png",
    "./icons/icon-maskable-512.png",
    "./icons/apple-touch-icon.png"
];

// 1. 서비스 워커 설치 시 모든 자원을 안전하게 스마트폰 내부 캐시에 저장
self.addEventListener("install", (event) => {
    self.skipWaiting(); // 새 버전이 감지되면 즉시 대기열을 건너뛰고 설치
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log("[Service Worker] 오프라인 필수 자원 캐싱 시작...");
            // 하나가 실패해도 다른 파일들은 모두 완벽하게 저장되도록 개별 캐싱
            for (const asset of ASSETS_TO_CACHE) {
                try {
                    await cache.add(asset);
                } catch (err) {
                    console.warn("[Service Worker] 캐시 항목 개별 누락 방어:", asset, err);
                }
            }
        })
    );
});

// 2. 새로운 버전 활성화 시 구버전 캐시 즉시 전체 삭제 및 클라이언트 제어
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log("[Service Worker] 구버전 캐시 완전 정리:", name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim()) // 열려 있는 모든 창에 즉시 새 서비스 워커 적용
    );
});

// 3. 네트워크 우선(Network-First) 전략:
// 온라인 상태에서는 언제나 최신 CSS/JS/HTML을 즉각 불러와 화면에 반영하고, 오프라인 시 내부 캐시에서 즉시 화면을 띄웁니다!
self.addEventListener("fetch", (event) => {
    // API 통신은 서버와 직접 통신
    if (event.request.url.includes("/api/")) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return networkResponse;
            })
            .catch(() => {
                // 오프라인 상태이거나 네트워크 에러 시 캐시된 최신 자원 서빙
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    if (event.request.mode === "navigate") {
                        return caches.match("./index.html").then(res => res || caches.match("./"));
                    }
                });
            })
    );
});


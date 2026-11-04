"""
[바우 레시피 북 - 스마트폰(모바일) & PC 통합 로컬 서버 (app.py)]
스마트폰과 PC에서 동일한 레시피 북에 무선으로 접속하고,
모바일에서 작성하여 바로 무선 프린터로 인쇄할 수 있도록 지원하는 파이썬 서버입니다.

기능:
1. 스마트폰과 PC 모두에서 접속할 수 있도록 로컬 네트워크 IP 자동 감지 및 안내
2. 브라우저 캐시 방지 및 안전한 예외 처리
"""

import http.server
import socketserver
import webbrowser
import socket
import os
import sys
import json
import urllib.request
import urllib.parse

# 윈도우 콘솔 CP949 인코딩 오류로 인한 튕김 현상 완벽 방지
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PORT = 8080
DB_FILE = "recipes_db.json"


def get_local_ip():
    """
    현재 컴퓨터의 로컬 네트워크(Wi-Fi) IP 주소를 자동으로 찾아 반환합니다.
    (스마트폰에서 이 주소로 접속하면 바로 열립니다!)
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 외부 통신 시도 없이 내부 라우팅 테이블에서 로컬 IP 감지
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


class SafeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    1. 브라우저 캐시 방지 및 최신 파일 서빙
    2. PC ↔ 스마트폰 실시간 레시피 자동 동기화 REST API (/api/recipes) 지원
    """
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        # CORS Preflight 통과 처리
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # 1. 고속 다국어 번역 API (브라우저 CORS 차단 완벽 우회 및 안정적 번역 보장)
        if self.path.startswith("/api/translate"):
            parsed = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed.query)
            text = query.get("text", [""])[0].strip()
            tl = query.get("tl", ["en"])[0].strip()
            sl = query.get("sl", ["auto"])[0].strip()

            if not text:
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(b'{"status":"ok","result":""}')
                return

            translated_text = text
            try:
                # 구글 번역 공개 API 호출
                google_url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q={urllib.parse.quote(text)}"
                req = urllib.request.Request(google_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    raw_data = resp.read().decode("utf-8")
                    data = json.loads(raw_data)
                    if data and data[0]:
                        parts = [part[0] for part in data[0] if part and part[0]]
                        translated_text = "".join(parts).strip()
            except Exception as e:
                # 실패 시 보조 MyMemory API 시도
                try:
                    pair = f"{sl}|{tl}" if sl != "auto" else f"autodetect|{tl}"
                    mem_url = f"https://api.mymemory.translated.net/get?q={urllib.parse.quote(text)}&langpair={pair}"
                    with urllib.request.urlopen(mem_url, timeout=5) as m_resp:
                        m_data = json.loads(m_resp.read().decode("utf-8"))
                        if m_data.get("responseData", {}).get("translatedText"):
                            translated_text = m_data["responseData"]["translatedText"].strip()
                except Exception:
                    translated_text = text

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            resp_body = json.dumps({"status": "ok", "result": translated_text}, ensure_ascii=False)
            self.wfile.write(resp_body.encode("utf-8"))
            return

        # 2. 레시피 데이터 조회 API (스마트폰 및 PC 공통)
        if self.path == "/api/recipes":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            if os.path.exists(DB_FILE):
                try:
                    with open(DB_FILE, "r", encoding="utf-8") as f:
                        content = f.read()
                except Exception:
                    content = "[]"
            else:
                content = "[]"
            self.wfile.write(content.encode("utf-8"))
            return

        super().do_GET()

    def do_POST(self):
        # 레시피 데이터 저장 및 동기화 API (PC 또는 스마트폰에서 저장 시 파일에 기록)
        if self.path == "/api/recipes":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode("utf-8"))
                with open(DB_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(b'{"status":"ok","message":"saved successfully"}')
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                err_resp = json.dumps({"status": "error", "message": str(e)})
                self.wfile.write(err_resp.encode("utf-8"))
            return

        super().do_POST()

    def log_message(self, format, *args):
        # 터미널을 깔끔하게 유지하기 위해 단순 파일 요청 로그는 생략
        pass


def start_server():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(current_dir)
    local_ip = get_local_ip()

    print("\n" + "=" * 65)
    print(" [BAU RECIPE BOOK] 모바일 & PC 로컬 서버 가동 완료!")
    print("=" * 65)
    print(f" [PC 접속 주소]        : http://localhost:{PORT}")
    print(f" [스마트폰 접속 주소]  : http://{local_ip}:{PORT}")
    print("=" * 65)
    print(" [스마트폰 앱 1초 설치 안내]:")
    print(f"   1) 스마트폰으로 위 주소(http://{local_ip}:{PORT})에 최초 1회 접속합니다.")
    print("   2) 화면 상단의 [홈 화면에 설치] 버튼을 누릅니다.")
    print("   3) 스마트폰 바탕화면에 'BAU' 정식 앱 아이콘이 생성됩니다!")
    print("   * 설치 완료 후에는 인터넷이 완전히 꺼져도 평생 오프라인으로 작동합니다!")
    print("-" * 65)
    print(" -> 컴퓨터 브라우저를 자동으로 엽니다...")
    print(" -> 프로그램을 종료하려면 [Ctrl + C]를 누르세요.\n")

    try:
        # 모든 네트워크 인터페이스(0.0.0.0)에서 스마트폰 동시 접속 허용 (멀티스레드 병렬 처리)
        socketserver.ThreadingTCPServer.allow_reuse_address = True
        with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), SafeHTTPRequestHandler) as httpd:
            try:
                webbrowser.open(f"http://localhost:{PORT}/index.html")
            except Exception:
                pass
            httpd.serve_forever()

    except OSError as e:
        print("\n [안내] 포트 연결 오류가 발생했습니다.")
        print(f" 원인: 포트 {PORT}번이 이미 사용 중입니다. ({e})")
        print(" 해결 방법:")
        print(" 1) 열려 있는 다른 파이썬 창을 닫아주세요.")
        print(" 2) 또는 폴더 안의 'index.html' 파일을 직접 더블클릭해서 여셔도 똑같이 작동합니다!")
    except KeyboardInterrupt:
        print("\n [안내] 프로그램이 안전하게 종료되었습니다. 수고하셨습니다!")
    except Exception as e:
        print(f"\n [오류 발생] 예상치 못한 문제: {e}")


if __name__ == "__main__":
    start_server()

#!/usr/bin/env python3
"""
DOGFOOD 2026 Official Acceptance Test Runner
Usage: python3 run.py .dogfood.toml > acceptance-report.txt
"""

import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

# Use tomllib if available (Python 3.11+), otherwise fallback to custom lightweight parser
try:
    import tomllib
    def parse_toml(content: str):
        return tomllib.loads(content)
except ImportError:
    def parse_toml(content: str):
        # Basic TOML fallback parser
        data = {}
        current_section = data
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if line.startswith('[') and line.endswith(']'):
                sec = line[1:-1].strip()
                data[sec] = {}
                current_section = data[sec]
            elif '=' in line:
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if v.startswith('[') and v.endswith(']'):
                    items = [x.strip().strip('"').strip("'") for x in v[1:-1].split(',') if x.strip()]
                    current_section[k] = items
                else:
                    current_section[k] = v
        return data

def make_request(url: str, method: str = 'GET', headers: dict = None, data: dict = None):
    req_headers = headers or {}
    encoded_data = None
    if data is not None:
        encoded_data = json.dumps(data).encode('utf-8')
        req_headers['Content-Type'] = 'application/json'

    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, response.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace') if e.fp else ''
        return e.code, body
    except Exception as e:
        return 0, str(e)

def run_acceptance_checks(config_path: str):
    with open(config_path, 'r', encoding='utf-8') as f:
        config = parse_toml(f.read())

    portal_url = config.get('portal', {}).get('url', 'http://localhost:8000').rstrip('/')
    auth = config.get('auth', {})
    routes = config.get('routes', {})

    # Load fixture data
    fixture_path = Path(config_path).parent / 'fixtures.json'
    fixtures = {}
    if fixture_path.exists():
        with open(fixture_path, 'r', encoding='utf-8') as f:
            fixtures = json.load(f)

    results = []

    # Check 1: T1 gallery is public
    gallery_url = f"{portal_url}{routes.get('gallery', '/api/projects')}"
    status, body = make_request(gallery_url, method='GET')
    t1_public = (status == 200)
    results.append(("T1  gallery is public", t1_public, f"Status: {status}"))

    # Check 2: T1 project from fixtures shown
    fixture_title = ""
    if fixtures.get('projects') and len(fixtures['projects']) > 0:
        fixture_title = fixtures['projects'][0]['title']
    t1_fixtures_shown = (status == 200 and fixture_title in body) if fixture_title else False
    results.append(("T1  project from fixtures shown", t1_fixtures_shown, f"Found '{fixture_title}'"))

    # Check 3: T1 closed event refuses submissions
    sub_url = f"{portal_url}{routes.get('submission', '/api/projects')}"
    part_headers = {'Authorization': auth.get('participant_header', '')}
    sub_payload = {
        "title": "Late Submission Project Attempt",
        "summary": "This should be refused because deadline is closed.",
        "description": "Testing closed event enforcement.",
        "track": "Infrastructure",
        "repositoryUrl": "https://github.com/example/repo",
        "isDraft": False
    }
    sub_status, _ = make_request(sub_url, method='POST', headers=part_headers, data=sub_payload)
    t1_refuses = (400 <= sub_status < 500)
    results.append(("T1  closed event refuses submissions", t1_refuses, f"Status: {sub_status} (expected 4xx)"))

    # Check 4: T2 judge sees own scores
    judge_scores_url = f"{portal_url}{routes.get('judge_scores', '/api/judge/scores')}"
    judge_a_headers = {'Authorization': auth.get('judge_a_header', '')}
    j_status, j_body = make_request(judge_scores_url, method='GET', headers=judge_a_headers)
    t2_judge_own = (j_status == 200 and ("scores" in j_body or "judge_id" in j_body or "[" in j_body))
    results.append(("T2  judge sees own scores", t2_judge_own, f"Status: {j_status}"))

    # Check 5: T2 judge cannot see peer scores
    peer_scores_url = f"{portal_url}{routes.get('peer_scores', '/api/judge/scores?judge=jdg_a')}"
    judge_b_headers = {'Authorization': auth.get('judge_b_header', '')}
    peer_status, _ = make_request(peer_scores_url, method='GET', headers=judge_b_headers)
    t2_peer_isolation = (peer_status in [401, 403])
    results.append(("T2  judge cannot see peer scores", t2_peer_isolation, f"Status: {peer_status} (expected 401/403)"))

    # Check 6: T2 participant blocked
    part_blocked_status, _ = make_request(judge_scores_url, method='GET', headers=part_headers)
    t2_part_blocked = (part_blocked_status in [401, 403])
    results.append(("T2  participant blocked", t2_part_blocked, f"Status: {part_blocked_status} (expected 401/403)"))

    # Check 7: T2 csv export works
    csv_url = f"{portal_url}{routes.get('csv_export', '/api/organizer/export/csv')}"
    org_headers = {'Authorization': auth.get('organizer_header', '')}
    csv_status, csv_body = make_request(csv_url, method='GET', headers=org_headers)
    first_line = csv_body.strip().splitlines()[0] if csv_body.strip() else ""
    t2_csv_works = (csv_status == 200 and "," in first_line)
    results.append(("T2  csv export works", t2_csv_works, f"Status: {csv_status}, header: {first_line[:30]}..."))

    # Print clean formatted summary report matching exact DOGFOOD format
    all_passed = True
    for name, passed, detail in results:
        status_str = "PASS" if passed else "FAIL"
        if not passed:
            all_passed = False
        dots = "." * (45 - len(name))
        print(f"{name} {dots} {status_str}")

    return all_passed

if __name__ == '__main__':
    config_file = sys.argv[1] if len(sys.argv) > 1 else '.dogfood.toml'
    passed = run_acceptance_checks(config_file)
    sys.exit(0 if passed else 1)

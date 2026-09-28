import unittest
import json
import os
import tempfile
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app import app
from seed import seed_database
from database import init_db, get_db_connection

class ForgeBackendTestCase(unittest.TestCase):
    def setUp(self):
        # Create temp db for isolated testing
        self.db_fd, self.db_path = tempfile.mkstemp(suffix='.db')
        app.config['TESTING'] = True
        app.config['DATABASE_PATH'] = self.db_path

        # Seed with fixture data
        fixtures_file = Path(__file__).resolve().parent.parent.parent / 'fixtures.json'
        seed_database(fixture_file=str(fixtures_file), db_path=self.db_path)
        self.client = app.test_client()

        # Pre-configured test tokens
        self.org_token = 'forge_organizer_token_2026'
        self.judge_a_token = 'forge_judge_a_token_2026'
        self.judge_b_token = 'forge_judge_b_token_2026'
        self.part_token = 'forge_participant_token_2026'

    def tearDown(self):
        os.close(self.db_fd)
        if os.path.exists(self.db_path):
            os.remove(self.db_path)

    # 1. Gallery tests
    def test_public_gallery_no_auth(self):
        resp = self.client.get('/api/projects')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode('utf-8'))
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        # Check fixture project title present
        titles = [p['title'] for p in data]
        self.assertTrue(any('KubePulse' in t for t in titles))

    def test_project_detail_public(self):
        resp = self.client.get('/api/projects/proj_1')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode('utf-8'))
        self.assertEqual(data['id'], 'proj_1')
        self.assertIn('KubePulse', data['title'])

    # 2. Authentication tests
    def test_login_success(self):
        resp = self.client.post('/api/auth/login', json={
            'email': 'organizer@forge.internal',
            'password': 'forge2026'
        })
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode('utf-8'))
        self.assertIn('token', data)
        self.assertEqual(data['user']['role'], 'organizer')

    def test_current_user_me(self):
        resp = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {self.org_token}'})
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode('utf-8'))
        self.assertEqual(data['email'], 'organizer@forge.internal')

    def test_unauthenticated_me_rejected(self):
        resp = self.client.get('/api/auth/me')
        self.assertEqual(resp.status_code, 401)

    # 3. Submission & Closed Event Enforcement
    def test_closed_event_refuses_submission(self):
        # Event submissions_close is in the past
        resp = self.client.post('/api/projects',
            headers={'Authorization': f'Bearer {self.part_token}'},
            json={
                'title': 'Forbidden Post Deadline Project',
                'summary': 'Should be rejected',
                'description': 'Late submission test',
                'track': 'Infrastructure'
            }
        )
        self.assertTrue(400 <= resp.status_code < 500)

    # 4. Judging & Judge Isolation tests
    def test_judge_sees_own_scores(self):
        resp = self.client.get('/api/judge/scores', headers={'Authorization': f'Bearer {self.judge_a_token}'})
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode('utf-8'))
        self.assertEqual(data['judge_id'], 'jdg_a')
        self.assertIsInstance(data['scores'], list)

    def test_judge_cannot_see_peer_scores(self):
        # Judge B attempts to view Judge A's scores
        resp = self.client.get('/api/judge/scores?judge=jdg_a', headers={'Authorization': f'Bearer {self.judge_b_token}'})
        self.assertIn(resp.status_code, [401, 403])

    def test_participant_blocked_from_judge_scores(self):
        resp = self.client.get('/api/judge/scores', headers={'Authorization': f'Bearer {self.part_token}'})
        self.assertIn(resp.status_code, [401, 403])

    # 5. Organizer & CSV Export tests
    def test_organizer_csv_export_works(self):
        resp = self.client.get('/api/organizer/export/csv', headers={'Authorization': f'Bearer {self.org_token}'})
        self.assertEqual(resp.status_code, 200)
        self.assertIn('text/csv', resp.headers.get('Content-Type', ''))
        first_line = resp.data.decode('utf-8').strip().splitlines()[0]
        self.assertIn(',', first_line)

    def test_non_organizer_cannot_export_csv(self):
        resp = self.client.get('/api/organizer/export/csv', headers={'Authorization': f'Bearer {self.part_token}'})
        self.assertIn(resp.status_code, [401, 403])

        resp2 = self.client.get('/api/organizer/export/csv', headers={'Authorization': f'Bearer {self.judge_a_token}'})
        self.assertIn(resp2.status_code, [401, 403])

    def test_dynamic_rubric(self):
        resp = self.client.get('/api/judge/rubric')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data.decode('utf-8'))
        self.assertGreater(len(data), 0)
        self.assertIn('weight', data[0])
        self.assertIn('maxScore', data[0])

    # 6. End-to-End Registration & Role Security Tests
    def test_registration_enforces_participant_role(self):
        # Even if request attempts to register as admin or organizer, must enforce participant
        resp = self.client.post('/api/auth/register', json={
            'name': 'Hacker Participant',
            'email': 'hacker@example.com',
            'password': 'password123',
            'role': 'admin' # Malicious injection attempt
        })
        self.assertEqual(resp.status_code, 201)
        data = json.loads(resp.data.decode('utf-8'))
        self.assertEqual(data['user']['role'], 'participant')
        token = data['token']

        # Verify /api/auth/me confirms participant role
        me_resp = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(me_resp.status_code, 200)
        me_data = json.loads(me_resp.data.decode('utf-8'))
        self.assertEqual(me_data['role'], 'participant')

    def test_registration_validation(self):
        resp = self.client.post('/api/auth/register', json={
            'name': '',
            'email': 'missing@example.com',
            'password': ''
        })
        self.assertEqual(resp.status_code, 400)

    def test_role_enforcement_matrix(self):
        # Participant cannot access organizer endpoints
        p_resp = self.client.get('/api/organizer/overview', headers={'Authorization': f'Bearer {self.part_token}'})
        self.assertEqual(p_resp.status_code, 403)

        # Participant cannot access judge endpoints
        pj_resp = self.client.get('/api/judge/assignments', headers={'Authorization': f'Bearer {self.part_token}'})
        self.assertEqual(pj_resp.status_code, 403)

        # Judge cannot access organizer endpoints
        j_resp = self.client.get('/api/organizer/overview', headers={'Authorization': f'Bearer {self.judge_a_token}'})
        self.assertEqual(j_resp.status_code, 403)

        # Judge cannot access admin endpoints
        ja_resp = self.client.get('/api/admin/overview', headers={'Authorization': f'Bearer {self.judge_a_token}'})
        self.assertEqual(ja_resp.status_code, 403)

        # Organizer cannot access admin endpoints
        oa_resp = self.client.get('/api/admin/overview', headers={'Authorization': f'Bearer {self.org_token}'})
        self.assertEqual(oa_resp.status_code, 403)

        # Admin CAN access admin endpoints
        admin_token = 'forge_admin_token_2026'
        adm_resp = self.client.get('/api/admin/overview', headers={'Authorization': f'Bearer {admin_token}'})
        self.assertEqual(adm_resp.status_code, 200)

        # Invalid token is rejected on /api/auth/me
        bad_resp = self.client.get('/api/auth/me', headers={'Authorization': 'Bearer invalid_bogus_token'})
        self.assertEqual(bad_resp.status_code, 401)

if __name__ == '__main__':
    unittest.main()

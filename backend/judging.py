import math
from database import get_db_connection

def calculate_results():
    """
    Computes weighted results and cross-judge normalization on a 5-point scale.
    Handles missing criteria and differing review counts without crashing.
    """
    conn = get_db_connection()

    # Load all rubric criteria
    criteria_rows = conn.execute("SELECT id, name, weight, max_score FROM rubric_criteria").fetchall()
    criteria_dict = {c['id']: dict(c) for c in criteria_rows}

    # Load all scores
    scores_rows = conn.execute("""
        SELECT s.judge_id, s.project_id, s.criterion_id, s.score, s.comment
        FROM scores s
    """).fetchall()

    # Load all projects
    projects_rows = conn.execute("""
        SELECT p.id, p.title, p.team_name, p.track, p.submission_status
        FROM projects p
    """).fetchall()
    conn.close()

    if not projects_rows:
        return []

    # Group scores by judge to compute judge distribution (mean and std_dev)
    judge_scores = {}
    for row in scores_rows:
        jid = row['judge_id']
        judge_scores.setdefault(jid, []).append(float(row['score']))

    judge_stats = {}
    for jid, s_list in judge_scores.items():
        n = len(s_list)
        if n > 1:
            mean = sum(s_list) / n
            variance = sum((x - mean) ** 2 for x in s_list) / (n - 1)
            std = math.sqrt(variance)
            judge_stats[jid] = {"mean": mean, "std": std if std > 0.05 else 1.0}
        elif n == 1:
            judge_stats[jid] = {"mean": s_list[0], "std": 1.0}
        else:
            judge_stats[jid] = {"mean": 3.0, "std": 1.0}

    # Group scores by (project_id, judge_id)
    project_judge_scores = {}
    for row in scores_rows:
        key = (row['project_id'], row['judge_id'])
        project_judge_scores.setdefault(key, []).append(dict(row))

    # Calculate normalized evaluation per (project, judge)
    project_evaluations = {}
    for (pid, jid), s_items in project_judge_scores.items():
        stats = judge_stats.get(jid, {"mean": 3.0, "std": 1.0})
        weighted_sum = 0.0
        total_weight = 0.0

        for item in s_items:
            cid = item['criterion_id']
            crit = criteria_dict.get(cid)
            if not crit:
                continue

            raw_score = float(item['score'])
            # Normalize to 5-point scale if criterion max_score differs
            scale_5_score = (raw_score / crit['max_score']) * 5.0

            # Cross-judge z-score normalization
            z = (scale_5_score - stats['mean']) / stats['std']
            # Map to 5-point scale centered at 3.0
            norm_score = max(1.0, min(5.0, 3.0 + z * 0.8))

            weight = float(crit['weight'])
            weighted_sum += norm_score * weight
            total_weight += weight

        if total_weight > 0:
            judge_eval_score = weighted_sum / total_weight
            project_evaluations.setdefault(pid, []).append(judge_eval_score)

    # Compute final score per project
    results = []
    for p in projects_rows:
        pid = p['id']
        eval_list = project_evaluations.get(pid, [])
        eval_count = len(eval_list)

        if eval_count > 0:
            avg_score = sum(eval_list) / eval_count
            review_status = 'completed' if eval_count >= 2 else 'partial'
        else:
            avg_score = 0.0
            review_status = 'unassigned'

        results.append({
            'projectId': pid,
            'projectTitle': p['title'],
            'teamName': p['team_name'] or 'Solo Participant',
            'track': p['track'],
            'averageScore': round(avg_score, 2),
            'totalEvaluations': eval_count,
            'reviewStatus': review_status,
        })

    # Sort descending by average score
    results.sort(key=lambda x: (x['averageScore'], x['totalEvaluations']), reverse=True)

    # Assign ranks
    for index, item in enumerate(results):
        item['rank'] = index + 1

    return results

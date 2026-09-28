# Forge Judging & Normalization Methodology

This document details the evaluation workflow, dynamic rubric configuration, scoring aggregation, cross-judge normalization algorithm, and isolation security model.

---

## 1. Judging Workflow & Dynamic Rubric

Forge enforces dynamic rubric definitions returned from the backend database:
- **No Hardcoded Criteria**: The frontend requests `/api/judge/rubric` and renders whatever criteria, descriptions, and point scales the organizer configured.
- **Judge Assignment**: Judges can only evaluate projects that have been assigned to them via `judge_assignments`. Unassigned projects cannot be reviewed.

---

## 2. Scoring System & Weighted Average

Each project evaluation consists of individual criterion scores:
- Each criterion $c \in C$ has a maximum score $M_c$ (default 5.0) and a weight $w_c \in (0, 1]$ where $\sum w_c = 1.0$.
- A judge $j$ evaluates project $p$ by assigning raw scores $s_{j, p, c} \in [1, M_c]$.

The weighted composite score for judge $j$ on project $p$ is calculated as:

$$E_{j, p} = \frac{\sum_{c \in C_{\text{scored}}} \left(w_c \cdot \hat{s}_{j, p, c}\right)}{\sum_{c \in C_{\text{scored}}} w_c}$$

where $\hat{s}_{j, p, c}$ represents the normalized score mapped to the canonical 5-point scale.

---

## 3. Cross-Judge Normalization

### Why Normalization is Required
In hackathons, judges exhibit distinct calibration biases:
- **Lenient Judges**: Consistently award high ratings (e.g. 4.5 – 5.0) with low variance.
- **Strict Judges**: Consistently award critical ratings (e.g. 2.0 – 3.5).

Without normalization, a project assigned to strict judges would be unfairly penalized compared to a project assigned to lenient judges.

### Normalization Formula
1. For each judge $j$, compute their evaluation mean $\mu_j$ and sample standard deviation $\sigma_j$ across all project scores they provided:

$$\mu_j = \frac{1}{N_j} \sum s_{j}, \quad \sigma_j = \sqrt{\frac{1}{N_j - 1} \sum (s_j - \mu_j)^2}$$

*(If $N_j \le 1$ or $\sigma_j < 0.05$, $\sigma_j$ is bounded to 1.0 to prevent division by zero).*

2. Compute the standard score (Z-score) for each evaluation:

$$z_{j, p, c} = \frac{s_{j, p, c} - \mu_j}{\sigma_j}$$

3. Map the Z-score back onto the standard 5-point distribution centered at 3.0 with a scale factor of 0.8, bounded within $[1.0, 5.0]$:

$$\hat{s}_{j, p, c} = \min\left(5.0, \max\left(1.0, 3.0 + 0.8 \cdot z_{j, p, c}\right)\right)$$

4. **Missing Scores & Partial Batches**:
   If a judge did not score a particular criterion, or if a project has received only 1 review instead of 2, the aggregation algorithm dynamically computes the weighted average using only the available evaluated criteria and marks the project as `'partial'` without failing or crashing.

5. **Final Project Consensus Score**:
   The final overall score for project $p$ is the mean of the normalized evaluations across all judges $J_p$ who reviewed it:

$$\text{FinalScore}(p) = \frac{1}{|J_p|} \sum_{j \in J_p} E_{j, p}$$

---

## 4. Judge Score Isolation & Security

Forge enforces strict backend score isolation:
- **Participant Access**: Any attempt by a participant account to access `/api/judge/scores` or judge evaluations returns `401 Unauthorized` or `403 Access Denied`.
- **Peer Isolation**: When Judge B calls `GET /api/judge/scores?judge=jdg_a`, the backend verifies:
  $$\text{currentUser.id} == \text{requestedJudge.id}$$
  If the IDs do not match and the caller is not an organizer/admin, the backend immediately halts execution and returns `403 Forbidden`.
- **Authoritative Calculations**: Leaderboard calculations and rankings occur entirely on the backend via `calculate_results()`. The frontend displays backend data rather than inventing scores.

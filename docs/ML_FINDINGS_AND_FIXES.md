# ML Model Finding: Feature Leakage in Failure Prediction

## What was found

Training the Random Forest model on the (freshly regenerated, 2,500-row)
synthetic dataset produces 100% accuracy, precision, recall, and F1 on
every metric. This is not a good result - it is a sign of a real problem.

## Root cause

`generate_dataset.py` assigns `pod_status`, `deployment_status`, and
`health_status` deterministically based on which failure class is being
generated (e.g. every `CrashLoopBackOff` sample gets
`pod_status = "CrashLoopBackOff"` directly). Since `train.py` includes
these fields as categorical input features, the model is not predicting
failure from precursor signals - it is reading the answer directly off a
column that already states the outcome. This is a form of data leakage,
and it explains the suspiciously perfect metrics.

## Why this matters for the project

The core research question this project claims to answer is: "can an AI
agent predict deployment failures before serious disruption?" A model
that only works when the failure has already happened (i.e. pod_status
already says CrashLoopBackOff) is not predicting anything - it is
classifying a failure that is already visible in the input. If presented
as-is in a viva, this is the kind of thing an examiner familiar with ML
would catch immediately, and it undermines the "prediction" framing that
is central to the project's novelty claim.

## Recommended fix (for Vishnu / AI module owner)

Reframe the prediction task around precursor signals only - the numeric
telemetry a monitoring system would actually have *before* a pod fully
fails, not status fields that already encode the failure:

1. **Drop `pod_status`, `deployment_status`, and `health_status` as model
   input features** (or heavily lag/degrade them - e.g. only use the
   status from N seconds before the failure event, not the failure
   moment itself).
2. **Keep and lean on the genuinely predictive numeric signals:**
   `cpu_usage`, `memory_usage`, `restart_count`, `error_rate`,
   `response_time`, `recent_deployment`, `log_error_count`,
   `event_count` - these are the kind of leading indicators a real
   monitoring system has access to before a pod crashes.
3. **Regenerate the dataset so pre-failure samples have elevated but not
   yet catastrophic values** (e.g. CPU trending 70-85% for several
   minutes before a High CPU failure is labeled, rather than the failure
   label appearing at the same instant as the extreme value).
4. **Re-run `train.py` on this corrected dataset** and expect meaningfully
   lower, but real and defensible, accuracy - something in the 80-95%
   range is a much more credible and explainable result than 100%, and
   is actually a *better* outcome for your viva since it demonstrates
   you understand the difference between prediction and classification.

## What was done in this pass

- Regenerated the dataset at the intended scale (2,500 rows, matching
  what `train.py` expects) so the pipeline runs end-to-end - the
  previous checked-in file only had 20 rows.
- Ran real training and captured real (if currently leakage-affected)
  output metrics, replacing the fabricated numbers that were previously
  hardcoded into `docs/RESEARCH_EVALUATION.md`.
- Documented this leakage issue here rather than silently redesigning
  the feature set, since the fix changes what the model is allowed to
  see and should be a deliberate decision by whoever owns the ML module.

## Action item

Before this project is presented, the AI/ML module owner should apply
the fix above, retrain, and update `RESEARCH_EVALUATION.md` with the
corrected (lower, real) metrics. Until then, treat the current 100%
figures as a known limitation, not a result to present.

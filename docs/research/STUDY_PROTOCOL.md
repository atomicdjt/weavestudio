# Representative-user study protocol

**Status: No participant results have been collected.** These are blank study
instruments and synthetic scenarios, not adoption or time-saving evidence.

Recruit consenting adult participants who perform relevant work: consultant,
researcher, and operations practitioner. An exploratory target is five per role;
it provides qualitative signals, not population-wide estimates. No recruitment
messages have been sent. Arrange sessions before collecting data.

Use the exact candidate commit/deployment from its verification receipt. Give
everyone a standardized introduction and five minutes of practice. Record prior
tool/canvas familiarity. Use synthetic source only. Do not ask for API keys,
client information, or live provider calls.

## Consent and handling

Explain the purpose, 45–60 minute duration, voluntary participation, ability to
stop, and what is recorded. Ask separately for screen/audio recording; declining
recording does not prevent participation. Use pseudonymous IDs; store contact
details separately. Record timings, completion, assistance, errors, and quality.
Quote participants only with explicit permission. Keep participant data outside
the public repository, agree a deletion date, and record consent privately.

## Tasks and counterbalancing

Use [TASK_SCENARIOS.md](TASK_SCENARIOS.md). Each participant completes two matched
tasks: one in their usual document/spreadsheet tool and one in WeaveStudio.
Alternate order within each role and rotate scenario variants. Keep source size
and acceptance criteria comparable. Cap each task at 15 minutes. Include reading,
correction, recovery, and export time; stop when the final handoff is submitted.
Count assisted completion separately. A timeout is never a faster success.

Moderator script: “Produce a handoff another person can use. All necessary
information is in the source. Mark unresolved or unsupported statements. Ask
for help if blocked; I will record assistance. Tell me when it is ready.”
Do not direct participants toward a feature unless blocked; record interventions.

## Completion and quality

Blind the output rater to tool/order where feasible. Completion requires all
requested items, no invented owner/date/fact, explicit uncertainty, documented
review, and a usable export. Score each criterion 0 (wrong/missing), 1 (partial),
or 2 (complete), plus binary unassisted completion. Retain outputs and rater notes.
Provenance lineage does not establish truth.

[TASK_LEDGER.csv](TASK_LEDGER.csv) contains a header only. Record baseline/product
seconds, order, assistance, errors, timeout, completion, and quality separately;
include commit, UTC date, device/browser, role, and pseudonymous ID.

## Analysis and claims

Report counts, exclusions, completion rates, assistance, quality distributions,
and paired elapsed times by role. For pairs completed at equivalent quality,
time saved is baseline minus product seconds; percent saved is that difference
divided by baseline seconds times 100. Report medians/ranges and failed/assisted
tasks alongside timing. Small exploratory samples do not establish universal
efficiency, retention, willingness to pay, or revenue.

Ask: “Where did you hesitate?”, “What did you distrust?”, “What would you use
instead?”, and “Would you use this again, and why?” Separate observations,
opinions, and computed metrics. Publish only consented anonymized aggregates
linked to commit/date. User time saving remains unmeasured until sessions occur.

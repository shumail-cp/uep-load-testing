#!/bin/bash
# ─────────────────────────────────────────────
# K6 Parallel Load Test Runner (tmux-based)
# Author: Ben Stokes
# Purpose: Run multiple VU/DURATION tests simultaneously using tmux
# ─────────────────────────────────────────────

SCRIPT_PATH="/media/shuraim/projects/WORK/perf-test/scripts/dev-so-test.js"
SESSION_NAME="k6_multi_test"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_DIR="./reports/${TIMESTAMP}"
mkdir -p "$REPORT_DIR"

# ─── Define test cases here ─────────────────
declare -A TESTS
TESTS["100"]="5m"
TESTS["200"]="5m"
TESTS["300"]="5m"

echo "📂 Reports will be saved in: $REPORT_DIR"
echo "🚀 Launching tmux session: $SESSION_NAME"
echo "───────────────────────────────────────────────"

# Create a new tmux session (detached)
tmux new-session -d -s "$SESSION_NAME" -n "k6_tests"

i=0
for VUS in "${!TESTS[@]}"; do
  DURATION=${TESTS[$VUS]}
  LOG_FILE="${REPORT_DIR}/k6_${VUS}vus_${DURATION}.log"

  CMD="echo '🧪 Running ${VUS} VUs for ${DURATION}...'; \
       k6 run -e VUS=${VUS} -e DURATION=${DURATION} ${SCRIPT_PATH} | tee ${LOG_FILE}; \
       echo '✅ Completed ${VUS} VUs (${DURATION})'; sleep 5"

  if [ $i -eq 0 ]; then
    tmux send-keys -t "$SESSION_NAME" "$CMD" C-m
  else
    tmux split-window -t "$SESSION_NAME" "$CMD"
  fi
  ((i++))
done

tmux select-layout -t "$SESSION_NAME" tiled

echo "✅ All tests launched in parallel!"
echo "👉 Attach with: tmux attach -t $SESSION_NAME"
echo "👉 Reports saved in: $REPORT_DIR"

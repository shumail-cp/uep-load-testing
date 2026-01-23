#!/bin/bash
# 🔁 Simple Curl Runner + Summary Reporter
# Paste your curl command below (no need to pass anything in terminal)

# ======= CONFIGURATION =======
TOTAL_RUNS=100   # Number of iterations
REPORTS_DIR="./reports"
mkdir -p "$REPORTS_DIR"
LOG_FILE="${REPORTS_DIR}/curl_results_$(date +"%Y%m%d_%H%M%S").log"

# ======= YOUR CURL COMMAND =======
# 👉 Paste your curl command here (must output HTTP status code only)
CURL_CMD=''

# ======= MAIN LOOP =======
SUCCESS_COUNT=0
FAIL_COUNT=0
TOTAL_TIME=0

echo "🚀 Running $TOTAL_RUNS curl tests"
echo "🧩 Command: $CURL_CMD"
echo "📂 Logs: $LOG_FILE"
echo "--------------------------------------" | tee -a "$LOG_FILE"

for ((i=1; i<=TOTAL_RUNS; i++)); do
    START=$(date +%s%N)
    HTTP_CODE=$(eval "$CURL_CMD")
    END=$(date +%s%N)
    DURATION=$(( (END - START)/1000000 )) # convert ns → ms
    TOTAL_TIME=$((TOTAL_TIME + DURATION))

    if [[ $HTTP_CODE -ge 200 && $HTTP_CODE -lt 300 ]]; then
        ((SUCCESS_COUNT++))
        echo "✅ [$i/$TOTAL_RUNS] OK ($HTTP_CODE) - ${DURATION}ms" | tee -a "$LOG_FILE"
    else
        ((FAIL_COUNT++))
        echo "❌ [$i/$TOTAL_RUNS] FAIL ($HTTP_CODE) - ${DURATION}ms" | tee -a "$LOG_FILE"
    fi
done

AVG_TIME=$((TOTAL_TIME / TOTAL_RUNS))
SUCCESS_RATE=$((SUCCESS_COUNT * 100 / TOTAL_RUNS))
FAIL_RATE=$((FAIL_COUNT * 100 / TOTAL_RUNS))

# ======= SUMMARY =======
echo "--------------------------------------" | tee -a "$LOG_FILE"
echo "📊 SUMMARY REPORT" | tee -a "$LOG_FILE"
echo "Total Runs:        $TOTAL_RUNS" | tee -a "$LOG_FILE"
echo "✅ Success Count:   $SUCCESS_COUNT" | tee -a "$LOG_FILE"
echo "❌ Failure Count:   $FAIL_COUNT" | tee -a "$LOG_FILE"
echo "🏁 Success Rate:    $SUCCESS_RATE%" | tee -a "$LOG_FILE"
echo "💥 Failure Rate:    $FAIL_RATE%" | tee -a "$LOG_FILE"
echo "⚡ Avg. Time:       ${AVG_TIME}ms" | tee -a "$LOG_FILE"
echo "🕒 Log saved at:    $LOG_FILE" | tee -a "$LOG_FILE"
echo "--------------------------------------"
echo "✅ All done!"
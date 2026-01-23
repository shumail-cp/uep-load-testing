# Makefile for convenience

.PHONY: test report stop

test:
	DURATION=${DURATION} K6_DURATION=$${DURATION:-2m} ./run.sh

report:
	cp scripts/summary.html . || echo "No summary.html found"

stop:
	pgrep -f '^k6 ' | xargs -r kill -2 || true

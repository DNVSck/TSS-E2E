#!/usr/bin/env bash
set -euo pipefail

JUNIT="${1:?usage: parse-junit.sh <junit.xml>}"

awk '
  function val(name, s,   a) {
    a = index(s, name "=\"");
    if (a == 0) return 0;
    s = substr(s, a + length(name) + 2);
    return substr(s, 1, index(s, "\"") - 1) + 0;
  }
  /<testsuite / {
    tests    += val("tests", $0);
    failures += val("failures", $0);
    errors   += val("errors", $0);
    skipped  += val("skipped", $0);
  }
  END {
    total = tests;
    passed = total - failures - errors - skipped;
    printf "TOTAL=%d\n", total;
    printf "PASSED=%d\n", passed;
    printf "FAILED=%d\n", failures + errors;
    printf "SKIPPED=%d\n", skipped;
  }
' "$JUNIT"

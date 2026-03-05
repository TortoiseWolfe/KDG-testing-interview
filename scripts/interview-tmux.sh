#!/usr/bin/env bash
# Launch a 3-window tmux session for the KDG coding interview
# Window 0: claude  — Main Claude Code session
# Window 1: logs    — Docker compose logs (API + client)
# Window 2: test    — Shell for running tests

SESSION="kdg"

tmux kill-session -t "$SESSION" 2>/dev/null

tmux new-session  -d -s "$SESSION" -n claude -c ~/repos/KDG
tmux new-window   -t "$SESSION" -n logs   -c ~/repos/KDG
tmux send-keys    -t "$SESSION:logs" 'docker compose up -d && docker compose logs -f api client' Enter
tmux new-window   -t "$SESSION" -n test   -c ~/repos/KDG
tmux select-window -t "$SESSION:claude"
tmux attach       -t "$SESSION"

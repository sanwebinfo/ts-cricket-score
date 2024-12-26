if ! tmux has-session -t score 2>/dev/null; then
    tmux new-session -d -s score 'node $HOME/ts-cricket-score/dist/index.js'
fi
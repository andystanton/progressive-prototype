#!/usr/bin/env bash

./kill.sh
git checkout HEAD data/posts.db
./up.sh
open -a ~/Applications/Google\ Chrome.app --new --args --incognito http://localhost:3000

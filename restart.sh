#!/usr/bin/env bash

./kill.sh
git checkout HEAD data/posts.db
./up.sh
./browser.sh

#!/bin/bash
echo updating mongoclient
npm i --package-lock-only github:/c3pobot/mongoclient
echo updating s3client
npm i --package-lock-only github:c3pobot/s3client
echo updating logger
npm i --package-lock-only github:c3pobot/logger

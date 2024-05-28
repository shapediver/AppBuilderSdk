#!/bin/bash

# trap exceptions and restore sentryconfig.ts
trap 'if [ -f "sentryconfig.ts.bak" ]; then mv sentryconfig.ts.bak sentryconfig.ts; fi' EXIT

version=$1
if [ -z "$version" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# Check if sentryconfig.local.ts exists, copy it to sentryconfig.ts if it does
if [ -f "sentryconfig.local.ts" ]; then
    mv sentryconfig.ts sentryconfig.ts.bak
    cp sentryconfig.local.ts sentryconfig.ts
fi

prefix=app/builder/v1/main

vite build --base=/$prefix/$version/
if [ $? -ne 0 ]; then
    echo "Build failed."
    exit 1
fi

if [ -z "$2" ]; then
    echo "Skipping deployment."
    exit 0
fi

if [ -z "$APPBUILDER_BUCKET" ]; then
    echo "APPBUILDER_BUCKET environment variable is not set."
    exit 1
fi

cachecontrol="public, max-age=31536000, immutable"
if [ $version == "latest" ]; then
    cachecontrol="public, max-age=0, s-maxage=86400"
fi

aws s3 sync ./dist s3://$APPBUILDER_BUCKET/$prefix/$version/ --region us-east-1 --cache-control "$cachecontrol"
touch empty
aws s3 cp empty s3://$APPBUILDER_BUCKET/$prefix/$version --region us-east-1 \
    --website-redirect https://www.shapediver.com/$prefix/$version/ --cache-control "$cachecontrol"
rm empty

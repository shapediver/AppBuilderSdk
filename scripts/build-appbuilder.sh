#!/bin/bash
SENTRY_CLI="node_modules/.bin/sentry-cli"
SENTRY_ORG="shapediver"
SENTRY_PROJECT="app-builder"

# load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | sed 's/#.*//' | sed 's/^ *//;s/ *$//' | xargs)
fi

# trap exceptions and restore sentryconfig.ts
trap 'if [ -f "sentryconfig.ts.bak" ]; then mv sentryconfig.ts.bak sentryconfig.ts; fi' EXIT

version=$1
if [ -z "$version" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# should we deploy, or just build?
deploy=$2

# where should we deploy?
prefix=$3

# only allow specific prefixes
if [ -z "$prefix" ]; then
    echo "Prefix is not set."
    exit 1
else if [ $prefix == "app/builder/v1/main" ]; then
    echo "Building for app builder."
else if [ $prefix == "v1/main" ]; then
    echo "Building for app builder platform."
else
    echo "Unknown prefix."
    exit 1
fi

# Check if sentry-cli exists
if [ ! -z "$deploy" ]; then
    if [ ! -x "$SENTRY_CLI" ]; then
        SENTRY_CLI="$HOME/bin/sentry-cli"
    fi
    if [ ! -x "$SENTRY_CLI" ]; then
        echo "Could not find sentry-cli."
        exit 1
    fi
fi

# Check if sentryconfig.local.ts exists, copy it to sentryconfig.ts if it does
build_timestamp=$(date +'%Y-%m-%d_%H:%M')
if [ -f "sentryconfig.local.ts" -a ! -z "${deploy}" ]; then
    echo "Configuring sentry for build timestamp: ${build_timestamp}"
    mv sentryconfig.ts sentryconfig.ts.bak
    sed -e "s/BUILD_TIMESTAMP/${build_timestamp}/" sentryconfig.local.ts > sentryconfig.ts
fi

echo "Building AppBuilder version $version with prefix $prefix"
vite build --base=$prefix/$version/
if [ $? -ne 0 ]; then
    echo "Build failed."
    exit 1
fi

if [ -z "${deploy}" ]; then
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

# depending on the prefix, we need to deploy to different locations
if [ $prefix == "v1/main" ]; then
    aws s3 sync ./dist s3://$APPBUILDER_BUCKET/appbuilder/$prefix/$version/ --region us-east-1 --cache-control "$cachecontrol"
    touch empty
    aws s3 cp empty s3://$APPBUILDER_BUCKET/appbuilder/$prefix/$version --region us-east-1 \
        --website-redirect https://appbuilder.shapediver.com/$prefix/$version/ --cache-control "$cachecontrol"
    rm empty
else
    aws s3 sync ./dist s3://$APPBUILDER_BUCKET/$prefix/$version/ --region us-east-1 --cache-control "$cachecontrol"
    touch empty
    aws s3 cp empty s3://$APPBUILDER_BUCKET/$prefix/$version --region us-east-1 \
        --website-redirect https://www.shapediver.com/$prefix/$version/ --cache-control "$cachecontrol"
    rm empty
fi

# Create a sentry release
sentry_release="${version}+${build_timestamp}"
$SENTRY_CLI releases new -p $SENTRY_PROJECT --org $SENTRY_ORG $sentry_release
if [ $? -ne 0 ]; then
    echo "Failed to create a Sentry release."
    exit 1
fi

# Associate commits with the release
$SENTRY_CLI releases set-commits --org $SENTRY_ORG --auto $sentry_release
if [ $? -ne 0 ]; then
    echo "Failed to associate commits with the Sentry release."
    exit 1
fi

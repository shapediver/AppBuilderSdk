#!/bin/bash

version=$1
if [ -z "$version" ]; then
    echo "Usage: $0 <version>"
    exit 1
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

aws s3 sync ./dist s3://$APPBUILDER_BUCKET/$prefix/$version/ --region us-east-1
touch empty
aws s3 cp empty s3://$APPBUILDER_BUCKET/$prefix/$version --region us-east-1 \
    --website-redirect https://www.shapediver.com/$prefix/$version/
rm empty

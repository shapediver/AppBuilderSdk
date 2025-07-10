#!/bin/bash
SENTRY_CLI="node_modules/.bin/sentry-cli"
SENTRY_ORG="shapediver"
SENTRY_PROJECT="app-builder"
MAIN_TARGET="main"

# Function to build and deploy the app
# $1: deploy - should we deploy the build?
# $2: prefix - the prefix for the deployment, either "v1/$MAIN_TARGET" or "app/builder/v1/$MAIN_TARGET"
# $3: version - the version of the deployment (branch name or npm version)
# $4: deploying_branch - 1 if we are deploying a branch, 0 if we are deploying a version
build_and_deploy() {
    deploy=$1
    prefix=$2
    version=$3
    deploying_branch=$4

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
    # if we are deploying a branch, we need to change the cache control, compared to a version
    if [ $deploying_branch -eq 1 ]; then
        cachecontrol="public, max-age=0, s-maxage=86400"
    fi

    echo "Deploying to version $version with prefix $prefix to bucket $APPBUILDER_BUCKET"

    # depending on the prefix, we need to deploy to different locations
    if [ $prefix == "v1/$MAIN_TARGET" ]; then
        aws s3 sync ./dist s3://$APPBUILDER_BUCKET/appbuilder/$prefix/$version/ --region us-east-1 --cache-control "$cachecontrol"
        touch empty
        aws s3 cp empty s3://$APPBUILDER_BUCKET/appbuilder/$prefix/$version --region us-east-1 \
            --website-redirect https://appbuilder.shapediver.com/$prefix/$version/ --cache-control "$cachecontrol"
        aws s3 cp empty s3://$APPBUILDER_BUCKET/appbuilder/$prefix/.invalidate --region us-east-1 \
            --cache-control "$cachecontrol"
        rm empty
    elif [ $prefix == "app/builder/v1/$MAIN_TARGET" ]; then
        aws s3 sync ./dist s3://$APPBUILDER_BUCKET/$prefix/$version/ --region us-east-1 --cache-control "$cachecontrol"
        touch empty
        aws s3 cp empty s3://$APPBUILDER_BUCKET/$prefix/$version --region us-east-1 \
            --website-redirect https://www.shapediver.com/$prefix/$version/ --cache-control "$cachecontrol"
        aws s3 cp empty s3://$APPBUILDER_BUCKET/$prefix/.invalidate --region us-east-1 \
            --cache-control "$cachecontrol"
        rm empty
    else
        echo "Unsupported prefix for deployment."
        exit 1
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

    [ -f "sentryconfig.ts.bak" ] && mv sentryconfig.ts.bak sentryconfig.ts
}

# load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | sed 's/#.*//' | sed 's/^ *//;s/ *$//' | xargs)
fi

# trap exceptions and restore sentryconfig.ts
trap 'if [ -f "sentryconfig.ts.bak" ]; then mv sentryconfig.ts.bak sentryconfig.ts; fi' EXIT

# should we deploy, or just build?
deploy=$1

# where should we deploy?
prefix=$2

# only allow specific prefixes
if [ "$prefix" == "app/builder/v1/$MAIN_TARGET" ]; then
    echo "Building for app builder."
elif [ "$prefix" == "v1/$MAIN_TARGET" ]; then
    echo "Building for app builder platform."
else
    echo "No prefix specified, deploying to both app builder and app builder platform."
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

# If we are deploying, check for git changes
if [ ! -z "$deploy" ]; then
    if [[ -n $(git status --porcelain) ]]; then
        echo "There are uncommitted changes."
        exit 1
    fi
fi

# Get the current branch
branch=$(git rev-parse --abbrev-ref HEAD)

# npm version
npm_version=$(node -p "require('./package.json').version")
echo "Current npm version: $npm_version"

deploying_branch=1

# If the branch is "development", "staging" or starts with "task/", we use the branch name as the version
if [ "$branch" == "development" ] || [ "$branch" == "staging" ]; then
    deploying_branch=1
    version=$branch
    
    # And we create a new tag with the name "AppBuilder@branch"
    git tag -fa "AppBuilder@$branch" -m "Release of branch $branch"
    git push origin "AppBuilder@$branch" --force
elif [[ $branch == task/* ]]; then
    deploying_branch=1
    # In this case we have to remove the "task/" prefix
    version=${branch#task/}
elif [[ $branch == "master" ]]; then
    # Ask if we want to deploy to "latest" or a specific version
    echo "Do you want to deploy to 'latest' or do you want to increase the version?"
    read -p "Enter 'latest' or 'version': " version_type
    if [ "$version_type" == "latest" ]; then
        version="latest"
        deploying_branch=1
    elif [ $version_type == "version" ]; then
        # Ask if we should increase the "major", "minor" or "patch" version
        echo "Do you want to increase the major, minor or patch version?" 
        read -p "Enter 'major', 'minor' or 'patch': " version_type
        if [ "$version_type" == "major" ] || [ "$version_type" == "minor" ] || [ "$version_type" == "patch" ]; then
            npm version $version_type --no-git-tag-version --ignore-scripts
            version=$(node -p "require('./package.json').version")
            deploying_branch=0

            echo "New npm version: $version"

            # As the package.json has changed, we need to commit the changes
            git add package.json
            git commit -m "Release of version $version"
            git push

            # And we create a new tag with the name "AppBuilder@X.Y.Z"
            git tag -a "AppBuilder@$version" -m "Release of version $version"
            git push origin "AppBuilder@$version"
        else
            echo "Unsupported version type."
            exit 1
        fi
    else
        echo "Unsupported input."
        exit 1
    fi
else 
    echo "Unsupported branch name."
    exit 1
fi

# check if a prefix was specified, then only deploy to that prefix
if [ -z "$prefix" ]; then
    build_and_deploy $deploy "v1/$MAIN_TARGET" $version $deploying_branch
    build_and_deploy $deploy "app/builder/v1/$MAIN_TARGET" $version $deploying_branch
else
    build_and_deploy $deploy $prefix $version $deploying_branch
fi

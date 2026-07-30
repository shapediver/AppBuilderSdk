#!/bin/bash

SENTRY_CLI="node_modules/.bin/sentry-cli"
SENTRY_ORG="shapediver"
SENTRY_PROJECT="app-builder"
MAIN_TARGET="main"
MAIN_TARGET_CAP="$(echo "${MAIN_TARGET:0:1}" | tr '[:lower:]' '[:upper:]')${MAIN_TARGET:1}"

sentry_configured=0

restore_sentry_config() {
    if [ -f "sentryconfig.ts.bak" ]; then
        mv sentryconfig.ts.bak sentryconfig.ts
    fi
}
trap restore_sentry_config EXIT

fail() {
    echo "$1" >&2
    exit 1
}

normalize_deploy_arg() {
    case "${1:-}" in
        ""|"0"|"false"|"build") echo "0" ;;
        "1"|"true"|"deploy"|"publish") echo "1" ;;
        *) fail "Unsupported deploy argument '${1:-}'. Use 0/build or 1/deploy." ;;
    esac
}

validate_prefix() {
    local prefix=$1
    if [ -z "$prefix" ]; then
        echo "No prefix specified, deploying to both app builder and app builder platform."
    elif [ "$prefix" == "app/builder/v1/$MAIN_TARGET" ]; then
        echo "Building for app builder platform."
    elif [ "$prefix" == "v1/$MAIN_TARGET" ]; then
        echo "Building for anonymous app builder."
    else
        fail "Unsupported prefix '$prefix'."
    fi
}

push_target() {
    if [ -n "${APPBUILDER_PUSH_TOKEN:-}" ]; then
        if [ -z "${GITHUB_REPOSITORY:-}" ]; then
            fail "GITHUB_REPOSITORY must be set when APPBUILDER_PUSH_TOKEN is used."
        fi
        echo "https://x-access-token:${APPBUILDER_PUSH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
    else
        echo "origin"
    fi
}

push_ref() {
    local ref=$1
    local force=${2:-0}
    local remote
    remote=$(push_target)

    if [ "$force" == "1" ]; then
        git push "$remote" "$ref" --force
    else
        git push "$remote" "$ref"
    fi
}

push_branch_head() {
    local branch=$1
    local remote
    remote=$(push_target)
    git push "$remote" "HEAD:$branch"
}

create_sentry_release() {
    local release=$1

    if [ -z "$release" ]; then
        return
    fi

    if $SENTRY_CLI releases info --org $SENTRY_ORG "$release" >/dev/null 2>&1; then
        echo "Using existing Sentry release $release"
    else
        echo "Creating Sentry release $release"
        $SENTRY_CLI releases new -p $SENTRY_PROJECT --org $SENTRY_ORG "$release"
    fi

    echo "Associating commits with Sentry release $release"
    $SENTRY_CLI releases set-commits --org $SENTRY_ORG --auto "$release"
}

# Function to build and deploy the app
# $1: deploy - 1 if we should deploy the build, 0 otherwise
# $2: prefix - the prefix for the deployment, either "v1/$MAIN_TARGET" or "app/builder/v1/$MAIN_TARGET"
# $3: version - the version of the deployment (branch name, latest, or npm version)
# $4: deploying_branch - 1 if we are deploying a branch/latest, 0 if we are deploying a version
build_and_deploy() {
    local deploy=$1
    local prefix=$2
    local version=$3
    local deploying_branch=$4
    local build_timestamp=$(date +'%Y-%m-%d_%H:%M')

    if [ "$deploy" -eq 1 ]; then
        if [ -f "sentryconfig.local.ts" ]; then
            if [ "$sentry_configured" -eq 0 ]; then
                mv sentryconfig.ts sentryconfig.ts.bak
                sentry_configured=1
            fi

            echo "Configuring sentry for build timestamp: ${build_timestamp}"
            sed -e "s/BUILD_TIMESTAMP/${build_timestamp}/g" sentryconfig.local.ts > sentryconfig.ts
        fi
    fi

    echo "Building AppBuilder ${MAIN_TARGET_CAP} version $version with prefix $prefix"
    vite build --base=$prefix/$version/
    if [ $? -ne 0 ]; then
        fail "Build failed."
    fi

    if [ "$deploy" -eq 0 ]; then
        echo "Skipping deployment."
        return
    fi

    if [ -z "${APPBUILDER_BUCKET:-}" ]; then
        fail "APPBUILDER_BUCKET environment variable is not set."
    fi

    local cachecontrol="public, max-age=31536000, immutable"
    # if we are deploying a branch/latest, change cache control compared to a version
    if [ "$deploying_branch" -eq 1 ]; then
        cachecontrol="public, max-age=0, s-maxage=86400"
    fi

    echo "Deploying to version $version with prefix $prefix to bucket $APPBUILDER_BUCKET"

    # depending on the prefix, we need to deploy to different locations
    if [ "$prefix" == "v1/$MAIN_TARGET" ]; then
        aws s3 sync ./dist s3://$APPBUILDER_BUCKET/appbuilder/$prefix/$version/ --region us-east-1 --cache-control "$cachecontrol"
        touch empty
        aws s3 cp empty s3://$APPBUILDER_BUCKET/appbuilder/$prefix/$version --region us-east-1 \
            --website-redirect https://appbuilder.shapediver.com/$prefix/$version/ --cache-control "$cachecontrol"
        aws s3 cp empty s3://$APPBUILDER_BUCKET/appbuilder/$prefix/.invalidate --region us-east-1 \
            --cache-control "$cachecontrol"
        rm empty
    elif [ "$prefix" == "app/builder/v1/$MAIN_TARGET" ]; then
        aws s3 sync ./dist s3://$APPBUILDER_BUCKET/$prefix/$version/ --region us-east-1 --cache-control "$cachecontrol"
        touch empty
        aws s3 cp empty s3://$APPBUILDER_BUCKET/$prefix/$version --region us-east-1 \
            --website-redirect https://www.shapediver.com/$prefix/$version/ --cache-control "$cachecontrol"
        aws s3 cp empty s3://$APPBUILDER_BUCKET/$prefix/.invalidate --region us-east-1 \
            --cache-control "$cachecontrol"
        rm empty
    else
        fail "Unsupported prefix for deployment."
    fi

    # Create sentry release after successful deploy
    local sentry_release="${version}+${build_timestamp}"
    create_sentry_release "$sentry_release"
}

compute_release_version() {
    local bump=$1
    RELEASE_BUMP="$bump" node <<'NODE'
const pkg = require("./package.json");
const bump = process.env.RELEASE_BUMP;
const match = /^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/.exec(pkg.version);
if (!match) {
  console.error(`Unsupported package version: ${pkg.version}`);
  process.exit(1);
}
let major = Number(match[1]);
let minor = Number(match[2]);
let patch = Number(match[3]);
const isPrerelease = pkg.version.includes("-");
if (!isPrerelease) {
  if (bump === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bump === "minor") {
    minor += 1;
    patch = 0;
  } else if (bump === "patch") {
    patch += 1;
  } else {
    console.error(`Unsupported release bump: ${bump}`);
    process.exit(1);
  }
}
console.log(`${major}.${minor}.${patch}`);
NODE
}

# run tsc command and exit if it fails
tsc
if [ $? -ne 0 ]; then
    fail "TypeScript compilation failed."
fi

# load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | sed 's/#.*//' | sed 's/^ *//;s/ *$//' | xargs)
fi

# should we deploy, or just build?
deploy=$(normalize_deploy_arg "${1:-}")

# where should we deploy?
prefix=${2:-}
validate_prefix "$prefix"

# Check if sentry-cli exists
if [ "$deploy" -eq 1 ]; then
    if [ ! -x "$SENTRY_CLI" ]; then
        SENTRY_CLI="$HOME/bin/sentry-cli"
    fi
    if [ ! -x "$SENTRY_CLI" ]; then
        fail "Could not find sentry-cli."
    fi
fi

# If we are deploying, check for uncommitted or untracked non-ignored files.
if [ "$deploy" -eq 1 ]; then
    if [ -n "$(git status --porcelain)" ]; then
        fail "There are uncommitted or untracked non-ignored files."
    fi
fi

# Get the current branch
branch=$(git rev-parse --abbrev-ref HEAD)

# npm version
npm_version=$(node -p "require('./package.json').version")
echo "Current npm version: $npm_version"

deploying_branch=1
version=""
deploy_latest=0
push_version_commit=0
branch_to_push="$branch"
declare -a tags_to_push=()
declare -a tag_force=()

# If the branch is "development", "staging" or "testing", we use the branch name as the version
if [ "$branch" == "development" ] || [ "$branch" == "staging" ] || [ "$branch" == "testing" ]; then
    deploying_branch=1
    version=$branch
    tags_to_push+=("AppBuilder${MAIN_TARGET_CAP}@$branch")
    tag_force+=("1")
elif [[ $branch == task/* ]]; then
    deploying_branch=1
    # In this case we have to remove the "task/" prefix
    version=${branch#task/}
elif [[ $branch == "master" ]]; then
    # Ask whether to deploy latest, a version, or both, unless CI provided the answer.
    version_type=${APPBUILDER_RELEASE_TARGET:-}
    if [ -z "$version_type" ]; then
        echo "Do you want to deploy 'latest', a 'version', or 'version-and-latest'?"
        read -p "Enter 'latest', 'version', or 'version-and-latest': " version_type
    fi

    if [ "$version_type" == "latest" ]; then
        version="latest"
        deploying_branch=1
        tags_to_push+=("AppBuilder${MAIN_TARGET_CAP}@latest")
        tag_force+=("1")
    elif [ "$version_type" == "version" ] || [ "$version_type" == "version-and-latest" ]; then
        if [ "$version_type" == "version-and-latest" ]; then
            deploy_latest=1
        fi
        version_bump=${APPBUILDER_VERSION_BUMP:-}
        if [ -z "$version_bump" ]; then
            echo "Do you want to increase the major, minor or patch version?"
            read -p "Enter 'major', 'minor' or 'patch': " version_bump
        fi

        if [ "$version_bump" == "major" ] || [ "$version_bump" == "minor" ] || [ "$version_bump" == "patch" ]; then
            version=$(compute_release_version "$version_bump")
            npm version "$version" --no-git-tag-version --ignore-scripts
            deploying_branch=0
            push_version_commit=1

            echo "New npm version: $version"

            # Commit locally now so the release tag points to the version commit, but push only after deploy succeeds.
            git add package.json
            git commit -m "Release of version $version"

            tags_to_push+=("AppBuilder${MAIN_TARGET_CAP}@$version")
            tag_force+=("0")
            if [ "$deploy_latest" -eq 1 ]; then
                tags_to_push+=("AppBuilder${MAIN_TARGET_CAP}@latest")
                tag_force+=("1")
            fi
        else
            fail "Unsupported version type."
        fi
    else
        fail "Unsupported input."
    fi
else
    fail "Unsupported branch name."
fi

declare -a prefixes=()
if [ -z "$prefix" ]; then
    prefixes+=("v1/$MAIN_TARGET")
    prefixes+=("app/builder/v1/$MAIN_TARGET")
else
    prefixes+=("$prefix")
fi

declare -a versions=()
declare -a version_is_branch=()
versions+=("$version")
version_is_branch+=("$deploying_branch")

# A version-and-latest release deploys the immutable version and latest.
if [ "$deploy_latest" -eq 1 ]; then
    versions+=("latest")
    version_is_branch+=("1")
fi

for i in "${!versions[@]}"; do
    for deploy_prefix in "${prefixes[@]}"; do
        build_and_deploy "$deploy" "$deploy_prefix" "${versions[$i]}" "${version_is_branch[$i]}"
    done
done

if [ "$deploy" -eq 1 ]; then
    if [ "$push_version_commit" -eq 1 ]; then
        push_branch_head "$branch_to_push"
    fi

    for i in "${!tags_to_push[@]}"; do
        tag=${tags_to_push[$i]}
        force=${tag_force[$i]}
        if [ "$force" == "1" ]; then
            git tag -fa "$tag" -m "Release of ${tag#*@}"
        else
            git tag -a "$tag" -m "Release of version ${tag#*@}"
        fi
        push_ref "$tag" "$force"
    done
fi

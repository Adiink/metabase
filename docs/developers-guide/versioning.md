---
title: Metabase release versioning
---

# Metabase release versioning

We follow our own flavor of the [semantic versioning guidelines](https://semver.org/) in order to distinguish the [open-source version](https://www.metabase.com/product/starter) of Metabase from the paid, source-available version of Metabase (available in the [Pro](https://www.metabase.com/product/pro) and [Enterprise](https://www.metabase.com/product/enterprise) plans).

Semantic versioning typically follows the format: `Major.Minor.Point.Patch`. For example, version `3.15.2` or `3.15.2.1`.

With Metabase releases, we prefix the version with a `0` or `1`, depending on the license.

## The Metabase version schema

```
License.Major.Point.Hotfix
```

E.g.,

```
v0.46.3.1
```

`v0.46.3.1` would be for a hotfix (`1`) for the third (`3`) point release of Metabase `46`, the open-source edition (`0`).

### License

- `0` for the free, open-source version (sometimes called OSS, for open-source software).
- `1` for the paid, source-available version that has all the bells and whistles (sometimes called EE for "Enterprise Edition").

### Major

We release major version when we introduce new features or breaking changes.

### Point

Sometimes called a minor release, we issue point releases when we add bug fixes and refinements to existing features.

### Hotfix

Sometimes called a patch release, we issue these hotfix releases to fix security issues in a timely manner, or to undo a horrific regression.

## Release channels

Metabase maintains different release channels:

- **Stable**: The recommended version of Metabase to use in production.
- **Beta**: Use the beta release to try out upstream features in a staging environment prior to a new major release. Beta releases should mostly be stable, but they can have bugs that we'll fix before shipping the gold release, which is the first stable version of a major release.
- **Nightly**: Contains all the work from the master branch. It's the most up to date, but it's only recommended for experimental usage.

## The Gold Release

The gold release is the first stable release of a new major version of Metabase. So for Metabase version 51, the gold releases would be:

- `v0.51.1` (the OSS version)
- `v1.51.1` (the EE version)

## Beta releases

We usually publish beta versions to kick the tires on new features before releasing a new major version (a gold release). To distinguish these beta versions, we append `beta` to the release, like so:

- `v1.51.0-beta` (EE version)
- `v0.51.0-beta` (OSS version)

## Further reading

- [Metabase releases on Github](https://github.com/metabase/metabase/releases)
- [Metabase release blog posts](https://www.metabase.com/releases)

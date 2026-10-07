# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Localization-lock guardrail (AGENTS.md instructions, pre-commit hook, and Claude Code PreToolUse hook) preventing edits to Crowdin-managed translation files, plus the `localization-automation.yml` workflow that opens the automated translation PR and Jira review ticket on merge.

## [4.0.25] - 2026-07-14

### Changed

- Removed all HTTP routes, events, admin routes, and pixel registration to avoid conflicts with the replacement app before deprecation

## [4.0.1] - 2025-03-27

### Added

- Update app version to 4.0.1

## [4.0.0] - 2025-03-27

### Added

- Added new metadata for Spanish, Portuguese and English

## [1.0.1] - 2025-03-21

### Added

- App manifest updated with correct app details

## [1.0.0] - 2025-03-21

### Added

- Initial Weni Vtex-IO App

# Change Log

All notable changes to the "scalene" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.11]

- Fix "process exited with code 1" (issue #6): Scalene 2.x uses a verb-based
  CLI, so the extension now invokes `scalene run` to profile and
  `scalene view --standalone` to render the profile to HTML.
- Run the profiler in the workspace folder (or the file's directory) so imports
  of sibling/parent modules resolve correctly (issue #6).
- Surface interpreter/spawn failures (e.g. exit code 127) with an actionable
  message instead of failing silently (issue #8), and stream stderr to the
  "Scalene" output pane.
- Fix stale `activationEvents` entry that referenced a non-existent command.
- Detect a missing Scalene install or missing dependency (e.g. `pydantic`) in
  the selected interpreter and show an actionable message naming that
  interpreter and the exact `pip install -U scalene` command to run, instead of
  surfacing a raw `ModuleNotFoundError`.

## [Unreleased]

- Initial release
# UI Comment Tool

A two-tool system for UI prototype review and comment collaboration.

## Tools

### Builder (`builder.html`)
Configure a project: upload UI prototype images, set page titles, export a zip package for distribution.

### Reviewer (`review.html`)
Open the exported package to add comments, drag badge markers, reply to comments, and export/import comment data for collaboration between business reviewers.

## Usage

1. Open `builder.html` in a browser
2. Upload UI prototype screenshots, set titles, configure project name
3. Click **Export Zip** to generate a distributable package
4. Share the unzipped folder with reviewers
5. Reviewers open `review.html` to add comments and collaborate

## Development

- All tools are pure HTML/CSS/JS — no build step, no server
- See `requirement.md` for full specification
- Run `python3 sync_review.py` to propagate changes from `sample/review_sample.html` to root `review.html` and builder template

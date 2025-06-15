# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Module Overview

Alert Banner is a Drupal 10 module that provides site-wide alert messages and announcements with REST API integration for dynamic loading.

## Architecture

### Key Components

1. **Content Type**: `alert_banner` - Stores alert messages with fields for message, link, visibility, priority
2. **Taxonomy**: `alert_banner_type` - Defines alert types (Emergency, Announcement) with priority weights and custom colors
3. **REST Export**: View-based REST endpoint at `/alert-banners?_format=json` for dynamic loading
4. **JavaScript Integration**: Alerts loaded client-side via REST API to work with page caching

### Alert Priority System
- Alerts sorted by: Type weight → Permanent status → Sticky status
- Lower taxonomy term weight = higher priority
- REST endpoint respects this ordering

## Development Commands

```bash
# Clear cache after configuration changes
drush cr

# Enable the module
drush en alert_banner

# Disable the module
drush pmu alert_banner

# Check coding standards
vendor/bin/phpcs web/modules/custom/alert_banner
vendor/bin/phpcbf web/modules/custom/alert_banner
```

## File Structure

- `src/Form/ConfigForm.php` - Module settings form
- `src/Plugin/Validation/Constraint/` - Custom HTML field validation
- `config/install/` - Field configurations, content type, taxonomy, and view
- `css/` & `js/` - Frontend assets for alert display
- `alert_banner.module` - Hook implementations for page_top injection

## Important Implementation Details

1. **Dynamic Loading**: Alerts are injected into `page_top` region as empty div, then populated via AJAX
2. **Cache Compatibility**: Works with dynamic page cache without requiring cache clears
3. **CDN Considerations**: REST endpoint `/alert-banners` must be purged when using CDN
4. **Admin Route Handling**: Configuration controls whether alerts show on admin pages
5. **Australian Government Design System**: Optional compatibility mode available
6. **Date/Time Handling**: Start/End date fields support timezone-aware date comparisons (ISO 8601 format)
7. **Page Visibility**: Supports wildcard patterns with automatic regex escaping for special characters
8. **Configuration**: UUID values removed from config/install files for cleaner deployments

## Configuration

- Settings page: `/admin/config/system/alert_banner`
- Permission: `administer alert_banner`
- REST endpoint customizable via Views UI

## Testing Considerations

No automated tests are currently included. When adding tests:
- Test REST endpoint response
- Verify alert priority ordering
- Check page visibility restrictions
- Validate dismiss functionality for non-permanent alerts
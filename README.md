# Alert Banner
The Alert Banner module provides site-wide alert messages and announcements that can be placed anywhere on the site.

## Installation
1. Install the `alert_banner` module using Composer:   ```bash
   composer require drupal/alert_banner   ```
2. Enable the module via Drush or the Extend page:   ```bash
   drush en alert_banner   ```

## Usage
1. Install the `alert_banner` module.
2. Configure the settings: navigate to Configuration > System > Alert Banner Settings
   (`/admin/config/system/alert_banner`)
   * Enable Alert Banners: tick to enable the site-wide alerts
   * Show on Administration Pages: tick to display the site-wide alerts on
     backend admin pages
   * Add support for Australian Government Design System: tick to display
     alert banners with basic styling compatible with Australian Government
     Design System

3. Manage Alert Types:
   * Navigate to Structure > Taxonomy > Alert Banner Type (`/admin/structure/taxonomy/manage/alert_banner_type/overview`)
   * Default types include:
     - Emergency (weight: 0)
     - Announcement (weight: 1)
   * Create/edit a term:
     - Override the default background colour with a hex colour code in
       the Priority Colour field, e.g., `#ffff00` for yellow background
     - The frontend styling will automatically determine text color (black/white)
       based on background color contrast
     - Optionally, choose an Alert Icon
   * Term weight determines alert priority (lower weight = higher priority)

4. Create an Alert Banner content:
   * Navigate to Content > Add content > Alert Banner (`/node/add/alert_banner`)
   * Required fields:
     - Admin Title: Internal title for the alert
     - Alert Banner Type: Select from available alert types
     - Message: HTML-enabled field for alert content (links allowed, media not recommended)
   * Optional fields:
     - Call-to-action Link: Displays separately from the message
     - Display Date: Shows alongside the alert message
     - Permanent: When enabled, alert cannot be dismissed
     - Page Visibility: Restrict alert to specific pages using path patterns

5. Alert Display Rules:
   * Only published alerts are displayed
   * Alerts are sorted by:
     1. Priority (Alert Type term weight)
     2. Permanent status
     3. Node sticky status

## For Developers
1. REST Integration:
   * Alerts are loaded via REST API from an empty div in page_top region
   * Default endpoint: `/alert-banners?_format=json`
   * Compatible with dynamic page cache
   * CDN considerations: Purge `/alert-banners` endpoint when using CDN

2. Cache Handling:
   * Works with dynamic page cache
   * No cache clear required for alert publication
   * CDN users: Configure purging for the REST endpoint

3. View Configuration:
   * Base view: 'Alert Banners'
   * REST export path customizable
   * Default sorting respects alert priority system

4. Theme Integration:
   * Custom CSS classes for styling
   * Automatic contrast handling for text colors
   * Icon support via CSS classes
   * Australian Government Design System compatible classes available

# Alert Banner
The Alert Banner module provides the site-wide alert messages and announcements.

## Usage
  1. Install the `alert_banner` module.
  2. Configure the settings: navigate to Configuration > System > Alert Banner Settings
   (`/admin/config/system/alert_banner`)
      * Enable Alert Banners: tick to enable the site-wide alerts.
      * Show on Administration Pages: tick to display the site-wide alerts on
      backend admin pages.
      * Add support for Australian Government Design System: tick to display
      alert banners with basic styling compatible to Australian Government
      Design System.
  3. Manage Alert Type:
      * Navigate to Structure > Taxonomy > Alert Banner Type (`/admin/structure/taxonomy/manage/alert_banner_type/overview`)
      * Create/edit a term:
          + Override the default background colour with a hexa colour code in
          the Priority Colour field, eg. `#ffff00` for yellow background. By
          default, the frontend styling will determine the background colour
          and choose either white or black text colour to maintain the contrast.
          + Optionally, choose an Alert Icon.
      * If no weight value is provided when creating an Alert Type (in the
      collapsed Relations fieldset), all types will have the same default
      weighting of zero.
      * Reorder the terms to set their priority (weight).
  4. Create an Alert Banner content:
      * Navigate to Content > Add content > Alert Banner (`/node/add/alert_banner`)
      * Provide an Admin Title
      * Select an Alert Banner Type
      * Provide the message of the alert with HTML including links. It is
      recommended not to embed any media into the alert banner message.
      * Optionally, provide a call-to-action link in the Link field. This field
      will display separately from the message.
      * Optionally, provide a Date to display along with the alert message.
      * If set as Permanent, the alert will always display and cannot be
      dismissed on frontend.
      * The alert banner can be exclusively displayed on certain pages with the 
      Page Visibility field.
  5. Alert display rules:
      * Only display published alerts.
  6. Alert ordering rules:
      * Alerts are sorted by Priority (the ordering of Alert Type terms), then
      * Permanent, then
      * Node Sticky

## For developers
  1. The alerts block is programmatically injected into page_top region with an
  empty div and the module javascript will load all active alerts from a REST
  view. No block configuration is required.
  2. The module works with dynamic page cache. No cache clear is required when
  an alert is published. If CDN reverse proxy is in use, the REST endpoint of
  the REST view (default path `/alert-banners`) may need to be purged from CDN.
  3. To configure the view, navigate to Alerts view.
